import pytest
from datetime import datetime, timedelta, date
from httpx import AsyncClient, ASGITransport
import jwt

from main import app, recalc_room_rating
from auth import SECRET_KEY, ALGORITHM, create_access_token, hash_password
from models import User, Room, Booking, BookingStatus, Review, Studio, UserRole
from database import async_session_maker

@pytest.mark.asyncio
async def test_auth_missing_token_returns_401():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Без токена ручка должна отдавать 401, а не 403
        response = await client.get("/api/auth/me")
        assert response.status_code == 401
        assert "Недействительный токен" in response.json().get("detail", "")

@pytest.mark.asyncio
async def test_auth_login_remember_me():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Тестовый вход без remember
        res_normal = await client.post("/api/auth/login", json={
            "email": "admin@space.ru",
            "password": "admin123",
            "remember": False
        })
        assert res_normal.status_code == 200
        token_normal = res_normal.json()["access_token"]
        payload_normal = jwt.decode(token_normal, SECRET_KEY, algorithms=[ALGORITHM])

        # Тестовый вход с remember
        res_remember = await client.post("/api/auth/login", json={
            "email": "admin@space.ru",
            "password": "admin123",
            "remember": True
        })
        assert res_remember.status_code == 200
        token_remember = res_remember.json()["access_token"]
        payload_remember = jwt.decode(token_remember, SECRET_KEY, algorithms=[ALGORITHM])

        # remember токен должен жить ~30 дней (> 25 дней), а обычный ~24 часа
        exp_normal = datetime.fromtimestamp(payload_normal["exp"])
        exp_remember = datetime.fromtimestamp(payload_remember["exp"])
        diff_days = (exp_remember - exp_normal).total_seconds() / 86400.0
        assert diff_days > 25

@pytest.mark.asyncio
async def test_catalog_slots_with_date():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        future_date = (date.today() + timedelta(days=5)).isoformat()
        response = await client.get(f"/api/rooms?date={future_date}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert "today_available_slots" in data[0]

@pytest.mark.asyncio
async def test_rostov_on_don_studios_and_rooms():
    async with async_session_maker() as session:
        # Залы в Ростове-на-Дону
        from sqlalchemy import select
        res = await session.execute(select(Room))
        rooms = res.scalars().all()
        for r in rooms:
            assert "Ростов-на-Дону" in r.address
            assert "р-н" in r.metro

        # Студии в Ростове-на-Дону
        s_res = await session.execute(select(Studio))
        studios = s_res.scalars().all()
        for s in studios:
            assert s.city == "Ростов-на-Дону"
            assert "+7 (863)" in s.phone

@pytest.mark.asyncio
async def test_reviews_workflow_and_validations():
    async with async_session_maker() as session:
        # 1. Создаем тестового пользователя
        test_email = f"tester_{datetime.now().timestamp()}@space.ru"
        user = User(
            email=test_email,
            hashed_password=hash_password("pass12345"),
            full_name="Даниэль Самохин",
            phone="+79991234567",
            role=UserRole.CLIENT
        )
        session.add(user)
        await session.flush()

        # Получаем любой зал
        from sqlalchemy import select
        room_res = await session.execute(select(Room).limit(1))
        room = room_res.scalar_one()

        # Создаем завершенную бронь (прошлое время)
        past_start = datetime.now() - timedelta(days=2, hours=3)
        past_end = datetime.now() - timedelta(days=2, hours=1)
        booking = Booking(
            user_id=user.id,
            room_id=room.id,
            booking_number=f"T-{int(datetime.now().timestamp())}",
            start_time=past_start,
            end_time=past_end,
            status=BookingStatus.CONFIRMED,
            total_price=5000
        )
        session.add(booking)
        await session.flush()

        # Создаем бронь в будущем (еще не завершена)
        future_booking = Booking(
            user_id=user.id,
            room_id=room.id,
            booking_number=f"TF-{int(datetime.now().timestamp())}",
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=2),
            status=BookingStatus.CONFIRMED,
            total_price=5000
        )
        session.add(future_booking)
        await session.commit()

        user_id = user.id
        booking_id = booking.id
        future_booking_id = future_booking.id
        room_id = room.id

    token = create_access_token(data={"sub": str(user_id), "email": test_email, "role": "client"})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Попытка оставить отзыв на незавершенную бронь -> 400
        res_future = await client.post(
            f"/api/rooms/{room_id}/reviews",
            headers=headers,
            json={"booking_id": future_booking_id, "rating": 5, "text": "Классный зал, очень понравился!"}
        )
        assert res_future.status_code == 400
        assert "после посещения" in res_future.json()["detail"]

        # Успешное оставление отзыва на завершенную бронь -> 201
        res_ok = await client.post(
            f"/api/rooms/{room_id}/reviews",
            headers=headers,
            json={"booking_id": booking_id, "rating": 5, "text": "Великолепная студия, отличный свет и чистота!"}
        )
        assert res_ok.status_code == 201
        data = res_ok.json()
        assert data["rating"] == 5
        assert data["author_name"] == "Даниэль С."  # «Имя Ф.»
        assert data["booking_id"] == booking_id

        # Повторный отзыв на ту же бронь -> 409
        res_dup = await client.post(
            f"/api/rooms/{room_id}/reviews",
            headers=headers,
            json={"booking_id": booking_id, "rating": 4, "text": "Еще один отзыв от того же лица!"}
        )
        assert res_dup.status_code == 409

        # Проверка /api/bookings/my -> has_review должно быть True
        my_res = await client.get("/api/bookings/my", headers=headers)
        assert my_res.status_code == 200
        my_bookings = my_res.json()
        target_b = next((b for b in my_bookings if b["id"] == booking_id), None)
        assert target_b is not None
        assert target_b["has_review"] is True

        # Проверка /api/reviews/latest
        latest_res = await client.get("/api/reviews/latest?limit=3")
        assert latest_res.status_code == 200
        latest = latest_res.json()
        assert len(latest) > 0
        assert latest[0]["author_name"] == "Даниэль С."
        assert "room_name" in latest[0]

@pytest.mark.asyncio
async def test_booking_receipt_weekend_surcharge():
    # Создаем бронь на субботу
    async with async_session_maker() as session:
        from sqlalchemy import select
        user_res = await session.execute(select(User).limit(1))
        user = user_res.scalar_one()

        room_res = await session.execute(select(Room).limit(1))
        room = room_res.scalar_one()

        # Ближайшая суббота
        today = datetime.now()
        days_ahead = 5 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        sat_start = (today + timedelta(days=days_ahead)).replace(hour=12, minute=0, second=0, microsecond=0)
        sat_end = sat_start + timedelta(hours=2)

        base_total = room.price_per_hour * 2
        weekend_rate = int(room.price_per_hour * 1.15)
        total_price = weekend_rate * 2

        booking = Booking(
            user_id=user.id,
            room_id=room.id,
            booking_number=f"SAT-{int(datetime.now().timestamp())}",
            start_time=sat_start,
            end_time=sat_end,
            status=BookingStatus.CONFIRMED,
            total_price=total_price
        )
        session.add(booking)
        await session.commit()
        b_id = booking.id
        u_id = user.id

    token = create_access_token(data={"sub": str(u_id), "email": user.email, "role": user.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        rec_res = await client.get(f"/api/bookings/{b_id}/receipt", headers=headers)
        assert rec_res.status_code == 200
        receipt = rec_res.json()
        item_names = [it["name"] for it in receipt["items"]]
        assert "Надбавка за выходной день (+15%)" in item_names
        # Сумма строк должна сходиться с total_amount
        sum_items = sum(it["total_price"] for it in receipt["items"])
        assert sum_items == receipt["total_amount"]
