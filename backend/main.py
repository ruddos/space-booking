import random
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, date, time, timedelta
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_, or_
from sqlalchemy.orm import selectinload

from database import init_db, get_db, engine
from models import (
    Room, RoomAmenity, Schedule, Booking, BookingStatus,
    User, UserRole, Review, Favorite, BlogPost, ContactMessage,
    Studio, Service, BookingService, PromoCode, Payment, PaymentStatus,
    PaymentMethod, BookingStatusLog, Notification
)
from schemas import (
    RoomCreate, RoomResponse, RoomDetailResponse,
    SlotResponse, AvailableSlotsResponse,
    BookingCreate, BookingResponse, BookingStatusUpdate,
    UserCreate, UserLogin, UserResponse, TokenResponse,
    BlogPostResponse, ContactMessageCreate, NewsletterSubscribe,
    ServiceResponse, PromoValidateRequest, PromoValidateResponse,
    PriceCalculationRequest, PriceCalculationResponse,
    PaymentResponse, BookingStatusLogResponse, NotificationResponse
)
from services.pricing_service import calculate_pricing_breakdown
from services.booking_service import (
    calculate_cancellation_refund, check_overbooking, 
    generate_booking_number, generate_payment_number
)
from auth import (
    hash_password, verify_password,
    create_access_token, get_current_user, get_current_admin
)

# Стоимость дополнительных услуг из макета Figma (Экран 04 Бронирование)
ADDITIONAL_SERVICES_PRICING = {
    "Доп. комплект света": 800,
    "Цветной бумажный фон": 500,
    "Визажист": 3500,
    "Ассистент на площадке": 1500
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="SPACE Booking API", lifespan=lifespan)

# 1. CORS Middleware для React-фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Проверка соединения с базой данных
@app.get("/api/check-db", tags=["System"])
async def check_db():
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        )
        tables = [row[0] for row in result.fetchall()]
        return {"status": "connected", "tables": tables}

# --- Вспомогательная функция расчета слотов ---

def calculate_slots(
    schedule: Schedule,
    bookings: List[Booking],
    target_date: date
) -> List[SlotResponse]:
    slots = []
    current_time = schedule.open_time
    now = datetime.now()

    while current_time < schedule.close_time:
        slot_start = datetime.combine(target_date, current_time)
        slot_end = slot_start + timedelta(hours=1)

        is_booked = any(
            b.status != BookingStatus.CANCELLED and
            b.start_time < slot_end and
            b.end_time > slot_start
            for b in bookings
        )
        is_past = slot_start < now
        is_available = (not is_booked) and (not is_past)

        slots.append(SlotResponse(
            time=current_time.strftime("%H:%M"),
            is_available=is_available
        ))

        next_dt = slot_start + timedelta(hours=1)
        current_time = next_dt.time()
        if next_dt.date() != target_date:
            break

    return slots

# --- 2. Аутентификация и пользователи (Auth) ---

@app.post(
    "/api/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Auth"]
)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже зарегистрирован"
        )

    new_user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=UserRole.CLIENT
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(
        data={"sub": str(new_user.id), "email": new_user.email, "role": new_user.role.value}
    )
    return TokenResponse(access_token=token, token_type="bearer", user=new_user)

@app.post(
    "/api/auth/login",
    response_model=TokenResponse,
    tags=["Auth"]
)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    query = select(User).where(User.email == login_data.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user)

@app.get(
    "/api/auth/me",
    response_model=UserResponse,
    tags=["Auth"]
)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# --- 3. Каталог залов и расписание (Rooms & Slots) ---

@app.get("/api/rooms", response_model=List[RoomResponse], tags=["Rooms"])
async def get_rooms(
    category: Optional[str] = Query(None, description="Категория: Фотостудия, Залы, Коворкинги"),
    search: Optional[str] = Query(None, description="Поиск по названию, описанию или метро"),
    min_price: Optional[int] = Query(None, description="Минимальная цена за час"),
    max_price: Optional[int] = Query(None, description="Максимальная цена за час"),
    capacity: Optional[int] = Query(None, description="Вместимость от N человек"),
    only_available_today: bool = Query(False, description="Только залы со свободными слотами сегодня"),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Room)
        .options(selectinload(Room.amenities), selectinload(Room.schedules))
        .where(Room.is_active == True)
    )

    if category and category != "Все":
        query = query.where(Room.category.ilike(f"%{category}%"))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Room.name.ilike(search_term),
                Room.description.ilike(search_term),
                Room.metro.ilike(search_term)
            )
        )

    if min_price is not None:
        query = query.where(Room.price_per_hour >= min_price)

    if max_price is not None:
        query = query.where(Room.price_per_hour <= max_price)

    if capacity is not None:
        query = query.where(Room.capacity >= capacity)

    result = await db.execute(query)
    rooms = result.scalars().all()

    today = date.today()
    today_dow = today.weekday()
    day_start = datetime.combine(today, time.min)
    day_end = datetime.combine(today, time.max)

    response_rooms = []
    for room in rooms:
        sched = next((s for s in room.schedules if s.day_of_week == today_dow), None)
        today_free_slots = []

        if sched:
            b_query = select(Booking).where(
                Booking.room_id == room.id,
                Booking.status != BookingStatus.CANCELLED,
                Booking.start_time < day_end,
                Booking.end_time > day_start
            )
            b_res = await db.execute(b_query)
            bookings_today = b_res.scalars().all()

            calculated = calculate_slots(sched, bookings_today, today)
            today_free_slots = [s.time for s in calculated if s.is_available][:4]

        if only_available_today and not today_free_slots:
            continue

        room_dict = RoomResponse.model_validate(room).model_dump()
        room_dict["today_available_slots"] = today_free_slots
        response_rooms.append(RoomResponse(**room_dict))

    return response_rooms

@app.get("/api/rooms/{room_id}", response_model=RoomDetailResponse, tags=["Rooms"])
async def get_room_detail(room_id: int, db: AsyncSession = Depends(get_db)):
    query = (
        select(Room)
        .options(
            selectinload(Room.amenities),
            selectinload(Room.schedules),
            selectinload(Room.reviews)
        )
        .where(Room.id == room_id, Room.is_active == True)
    )
    result = await db.execute(query)
    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Зал не найден"
        )
    return room

@app.get(
    "/api/rooms/{room_id}/available-slots",
    response_model=AvailableSlotsResponse,
    tags=["Rooms"]
)
async def get_available_slots(
    room_id: int,
    target_date_str: Optional[str] = Query(None, alias="date", description="Дата YYYY-MM-DD (по умолчанию сегодня)"),
    db: AsyncSession = Depends(get_db)
):
    if target_date_str:
        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверный формат даты. Используйте YYYY-MM-DD"
            )
    else:
        target_date = date.today()

    room_res = await db.execute(select(Room).where(Room.id == room_id, Room.is_active == True))
    room = room_res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Зал не найден")

    day_of_week = target_date.weekday()
    sched_res = await db.execute(
        select(Schedule).where(Schedule.room_id == room_id, Schedule.day_of_week == day_of_week)
    )
    sched = sched_res.scalar_one_or_none()

    if not sched:
        return AvailableSlotsResponse(
            room_id=room_id,
            date=str(target_date),
            open_time="00:00",
            close_time="00:00",
            slots=[]
        )

    day_start = datetime.combine(target_date, time.min)
    day_end = datetime.combine(target_date, time.max)
    bookings_res = await db.execute(
        select(Booking).where(
            Booking.room_id == room_id,
            Booking.status != BookingStatus.CANCELLED,
            Booking.start_time < day_end,
            Booking.end_time > day_start
        )
    )
    bookings = bookings_res.scalars().all()

    slots = calculate_slots(sched, bookings, target_date)

    return AvailableSlotsResponse(
        room_id=room_id,
        date=str(target_date),
        open_time=sched.open_time.strftime("%H:%M"),
        close_time=sched.close_time.strftime("%H:%M"),
        slots=slots
    )

# --- Услуги, Промокоды и Калькулятор цен (Enterprise) ---

@app.get("/api/services", response_model=List[ServiceResponse], tags=["Services"])
async def get_services(db: AsyncSession = Depends(get_db)):
    """Получение каталога платных дополнительных услуг и оборудования"""
    res = await db.execute(select(Service).where(Service.is_active == True))
    return res.scalars().all()

@app.post("/api/promo/validate", response_model=PromoValidateResponse, tags=["Promo"])
async def validate_promo_code(
    promo_req: PromoValidateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Проверка промокода и расчет скидки"""
    query = select(PromoCode).where(
        PromoCode.code == promo_req.code.strip().upper(),
        PromoCode.is_active == True
    )
    res = await db.execute(query)
    promo = res.scalar_one_or_none()

    if not promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Промокод не найден или срок его действия истек"
        )

    if promo.current_uses >= promo.max_uses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Лимит использований данного промокода исчерпан"
        )

    calculated_discount = int(promo_req.total_amount * (promo.discount_percent / 100.0))
    if promo.max_discount and calculated_discount > promo.max_discount:
        discount_amount = promo.max_discount
    else:
        discount_amount = calculated_discount

    final_total = max(0, promo_req.total_amount - discount_amount)
    return PromoValidateResponse(
        valid=True,
        code=promo.code,
        discount_percent=promo.discount_percent,
        discount_amount=discount_amount,
        final_total=final_total,
        message=f"Промокод применен! Скидка {promo.discount_percent}% (-{discount_amount} ₽)"
    )

@app.post("/api/pricing/calculate", response_model=PriceCalculationResponse, tags=["Bookings"])
async def calculate_price(
    req: PriceCalculationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Калькулятор стоимости бронирования: выходные, скидка от 4 часов, услуги и промокод"""
    room_res = await db.execute(select(Room).where(Room.id == req.room_id, Room.is_active == True))
    room = room_res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Зал не найден")

    services_with_qty = []
    if req.service_ids:
        svc_res = await db.execute(select(Service).where(Service.id.in_(req.service_ids)))
        for svc in svc_res.scalars().all():
            services_with_qty.append((svc, 1))

    promo = None
    if req.promo_code:
        promo_res = await db.execute(select(PromoCode).where(PromoCode.code == req.promo_code.strip().upper(), PromoCode.is_active == True))
        promo = promo_res.scalar_one_or_none()

    breakdown = calculate_pricing_breakdown(
        price_per_hour=room.price_per_hour,
        start_time=req.start_time,
        end_time=req.end_time,
        services=services_with_qty,
        promo_code=promo
    )
    return PriceCalculationResponse(
        duration_hours=breakdown["duration_hours"],
        base_price_per_hour=breakdown["base_price_per_hour"],
        effective_hourly_rate=breakdown["effective_hourly_rate"],
        is_weekend=breakdown["is_weekend"],
        duration_discount_percent=breakdown["duration_discount_percent"],
        duration_discount_amount=breakdown["duration_discount_amount"],
        hall_subtotal=breakdown["hall_subtotal"],
        services_subtotal=breakdown["services_subtotal"],
        promo_discount_amount=breakdown["promo_discount_amount"],
        final_total=breakdown["final_total"]
    )

# --- 4. Бронирования (Bookings) ---

@app.post(
    "/api/bookings",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Bookings"]
)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    start_time = booking_data.start_time.replace(tzinfo=None) if booking_data.start_time.tzinfo else booking_data.start_time
    end_time = booking_data.end_time.replace(tzinfo=None) if booking_data.end_time.tzinfo else booking_data.end_time

    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Время окончания брони должно быть позже времени начала"
        )

    if (end_time - start_time).total_seconds() < 3600:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Минимальная продолжительность бронирования — 1 час"
        )

    if start_time < datetime.now() - timedelta(minutes=5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя забронировать зал на прошедшее время"
        )

    room_res = await db.execute(select(Room).where(Room.id == booking_data.room_id, Room.is_active == True))
    room = room_res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Зал не найден")

    day_of_week = start_time.weekday()
    sched_res = await db.execute(
        select(Schedule).where(Schedule.room_id == room.id, Schedule.day_of_week == day_of_week)
    )
    sched = sched_res.scalar_one_or_none()
    if not sched:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="В выбранный день зал не работает")

    if start_time.time() < sched.open_time or end_time.time() > sched.close_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Зал работает с {sched.open_time.strftime('%H:%M')} до {sched.close_time.strftime('%H:%M')}"
        )

    # Защита от овербукинга
    is_busy = await check_overbooking(db, room.id, start_time, end_time)
    if is_busy:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Выбранное время уже занято другой бронью"
        )

    # Проверка промокода
    promo_obj = None
    if booking_data.promo_code:
        promo_res = await db.execute(
            select(PromoCode).where(PromoCode.code == booking_data.promo_code.strip().upper(), PromoCode.is_active == True)
        )
        promo_obj = promo_res.scalar_one_or_none()
        if promo_obj and promo_obj.current_uses < promo_obj.max_uses:
            promo_obj.current_uses += 1

    # Загрузка выбранных услуг
    selected_services = []
    if booking_data.service_ids:
        s_res = await db.execute(select(Service).where(Service.id.in_(booking_data.service_ids)))
        for s in s_res.scalars().all():
            selected_services.append((s, 1))

    # Расчет цены
    pricing = calculate_pricing_breakdown(
        price_per_hour=room.price_per_hour,
        start_time=start_time,
        end_time=end_time,
        services=selected_services,
        promo_code=promo_obj
    )

    # Обратная совместимость с текстовыми услугами из фронтенда Даниэля
    extra_text_price = sum(ADDITIONAL_SERVICES_PRICING.get(s, 0) for s in booking_data.additional_services)
    total_price = pricing["final_total"] + extra_text_price

    booking_code = generate_booking_number()

    new_booking = Booking(
        booking_number=booking_code,
        user_id=current_user.id,
        room_id=room.id,
        promo_code_id=promo_obj.id if promo_obj else None,
        start_time=start_time,
        end_time=end_time,
        status=BookingStatus.CONFIRMED,
        total_price=total_price,
        discount_amount=pricing["promo_discount_amount"] + pricing["duration_discount_amount"],
        additional_services=", ".join(booking_data.additional_services) if booking_data.additional_services else None,
        comment=booking_data.comment,
        contact_name=booking_data.contact_name or current_user.full_name,
        contact_phone=booking_data.contact_phone or current_user.phone
    )
    db.add(new_booking)
    await db.flush()

    # Сохранение услуг в связующую таблицу (3НФ)
    for svc, qty in selected_services:
        db.add(BookingService(
            booking_id=new_booking.id,
            service_id=svc.id,
            quantity=qty,
            price_at_booking=svc.price
        ))

    # Создание записи в таблице платежей (PENDING)
    db.add(Payment(
        payment_number=generate_payment_number(),
        booking_id=new_booking.id,
        amount=total_price,
        status=PaymentStatus.PAID,  # по умолчанию при создании отмечаем оплаченным
        payment_method=PaymentMethod.CARD,
        transaction_id=f"TX-{uuid.uuid4().hex[:10].upper()}",
        paid_at=datetime.utcnow()
    ))

    # Запись в журнал аудита (BookingStatusLog)
    db.add(BookingStatusLog(
        booking_id=new_booking.id,
        old_status=None,
        new_status=BookingStatus.CONFIRMED.value,
        changed_by_user_id=current_user.id,
        comment="Бронирование успешно создано клиентом"
    ))

    # Создание уведомления для клиента
    db.add(Notification(
        user_id=current_user.id,
        title="Бронирование создано",
        message=f"Зал «{room.name}» забронирован на {start_time.strftime('%d.%m.%Y %H:%M')}. Номер: {booking_code}",
        type="success"
    ))

    await db.commit()

    query = (
        select(Booking)
        .options(selectinload(Booking.room).selectinload(Room.amenities))
        .where(Booking.id == new_booking.id)
    )
    res = await db.execute(query)
    return res.scalar_one()

@app.get("/api/bookings/my", response_model=List[BookingResponse], tags=["Bookings"])
async def get_my_bookings(
    tab: Optional[str] = Query(None, description="Фильтр для личного кабинета: upcoming, past, cancelled"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Booking)
        .options(selectinload(Booking.room).selectinload(Room.amenities))
        .where(Booking.user_id == current_user.id)
    )

    now = datetime.now()
    if tab == "upcoming":
        query = query.where(Booking.status != BookingStatus.CANCELLED, Booking.start_time >= now)
    elif tab == "past":
        query = query.where(Booking.status != BookingStatus.CANCELLED, Booking.end_time < now)
    elif tab == "cancelled":
        query = query.where(Booking.status == BookingStatus.CANCELLED)

    query = query.order_by(Booking.start_time.desc())
    res = await db.execute(query)
    return res.scalars().all()

@app.patch("/api/bookings/{booking_id}/cancel", response_model=BookingResponse, tags=["Bookings"])
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Booking)
        .options(selectinload(Booking.room).selectinload(Room.amenities))
        .where(Booking.id == booking_id)
    )
    res = await db.execute(query)
    booking = res.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бронирование не найдено")

    if booking.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет прав на отмену этой брони")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Бронирование уже отменено")

    booking.status = BookingStatus.CANCELLED
    await db.commit()
    await db.refresh(booking)
    return booking

# --- 5. Избранное (Favorites, Экран 07) ---

@app.get("/api/favorites", response_model=List[RoomResponse], tags=["Favorites"])
async def get_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Room)
        .join(Favorite, Favorite.room_id == Room.id)
        .options(selectinload(Room.amenities))
        .where(Favorite.user_id == current_user.id, Room.is_active == True)
    )
    res = await db.execute(query)
    return res.scalars().all()

@app.post("/api/favorites/{room_id}", status_code=status.HTTP_201_CREATED, tags=["Favorites"])
async def add_to_favorites(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    fav_check = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.room_id == room_id)
    )
    if fav_check.scalar_one_or_none():
        return {"status": "already_in_favorites"}

    new_fav = Favorite(user_id=current_user.id, room_id=room_id)
    db.add(new_fav)
    await db.commit()
    return {"status": "added"}

@app.delete("/api/favorites/{room_id}", tags=["Favorites"])
async def remove_from_favorites(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    fav_res = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.room_id == room_id)
    )
    fav = fav_res.scalar_one_or_none()
    if fav:
        await db.delete(fav)
        await db.commit()
    return {"status": "removed"}

# --- 6. Блог SPACE (Экран 08) ---

@app.get("/api/blog/posts", response_model=List[BlogPostResponse], tags=["Blog"])
async def get_blog_posts(
    category: Optional[str] = Query(None, description="Категория: Гайды, Свет, Мероприятия, Владельцам"),
    db: AsyncSession = Depends(get_db)
):
    query = select(BlogPost).order_by(BlogPost.is_featured.desc(), BlogPost.created_at.desc())
    if category and category != "Все":
        query = query.where(BlogPost.category.ilike(f"%{category}%"))
    res = await db.execute(query)
    return res.scalars().all()

# --- 7. Контакты и подписка (Экран 08 & 09) ---

@app.post("/api/contact", status_code=status.HTTP_201_CREATED, tags=["Feedback"])
async def submit_contact_form(
    contact_data: ContactMessageCreate,
    db: AsyncSession = Depends(get_db)
):
    new_msg = ContactMessage(
        name=contact_data.name,
        email=contact_data.email,
        topic=contact_data.topic,
        message=contact_data.message
    )
    db.add(new_msg)
    await db.commit()
    return {"status": "sent", "message": "Спасибо за ваше сообщение! Мы ответим в ближайшее время."}

@app.post("/api/newsletter/subscribe", status_code=status.HTTP_200_OK, tags=["Feedback"])
async def subscribe_newsletter(
    data: NewsletterSubscribe
):
    return {"status": "subscribed", "message": f"Email {data.email} успешно подписан на рассылку новых площадок!"}

# --- 8. Административная панель (Admin) ---

@app.get("/api/admin/bookings", response_model=List[BookingResponse], tags=["Admin"])
async def get_all_bookings(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Booking)
        .options(selectinload(Booking.room).selectinload(Room.amenities))
        .order_by(Booking.created_at.desc())
    )
    res = await db.execute(query)
    return res.scalars().all()

@app.patch("/api/admin/bookings/{booking_id}/status", response_model=BookingResponse, tags=["Admin"])
async def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Booking)
        .options(selectinload(Booking.room).selectinload(Room.amenities))
        .where(Booking.id == booking_id)
    )
    res = await db.execute(query)
    booking = res.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бронирование не найдено")

    booking.status = status_update.status
    await db.commit()
    await db.refresh(booking)
    return booking
