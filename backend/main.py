from contextlib import asynccontextmanager
from datetime import datetime, date, time, timedelta
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_, or_
from sqlalchemy.orm import selectinload

from database import init_db, get_db, engine
from models import Room, RoomAmenity, Schedule, Booking, BookingStatus, User, UserRole
from schemas import (
    RoomCreate, RoomResponse, RoomDetailResponse,
    SlotResponse, AvailableSlotsResponse,
    UserCreate, UserLogin, UserResponse, TokenResponse
)
from auth import (
    hash_password, verify_password,
    create_access_token, get_current_user
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="SPACE Booking API", lifespan=lifespan)

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

@app.get("/api/check-db", tags=["System"])
async def check_db():
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        )
        tables = [row[0] for row in result.fetchall()]
        return {"status": "connected", "tables": tables}

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

@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
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

@app.post("/api/auth/login", response_model=TokenResponse, tags=["Auth"])
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

@app.get("/api/auth/me", response_model=UserResponse, tags=["Auth"])
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

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
        .options(selectinload(Room.amenities), selectinload(Room.schedules))
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
