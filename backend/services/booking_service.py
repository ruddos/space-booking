from datetime import datetime
import uuid
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from models import (
    Booking, BookingStatus, BookingService, 
    Payment, PaymentStatus, PaymentMethod, 
    BookingStatusLog, Notification, Service, PromoCode
)

class BookingServiceError(Exception):
    pass

def generate_booking_number() -> str:
    return f"SP-{uuid.uuid4().hex[:6].upper()}"

def generate_payment_number() -> str:
    return f"PAY-{uuid.uuid4().hex[:8].upper()}"

def calculate_cancellation_refund(start_time: datetime, total_price: int) -> tuple[int, int, str]:
    """
    Политика отмены:
    - Более 24 часов до начала: возврат 100%
    - От 6 до 24 часов: возврат 50% (50% удержание)
    - Менее 6 часов: возврат 0% (штраф 100%)
    Возвращает: (refund_percent, refund_amount, description)
    """
    now = datetime.utcnow()
    hours_left = (start_time - now).total_seconds() / 3600.0

    if hours_left >= 24:
        return 100, total_price, "Полный возврат (отмена более чем за 24ч)"
    elif hours_left >= 6:
        refund_amount = int(total_price * 0.5)
        return 50, refund_amount, "Возврат 50% (отмена от 6 до 24ч до начала)"
    else:
        return 0, 0, "Без возврата (отмена менее чем за 6ч до начала)"

async def check_overbooking(session: AsyncSession, room_id: int, start_time: datetime, end_time: datetime) -> bool:
    """Проверка пересечения интервалов времени бронирований"""
    query = select(Booking).where(
        and_(
            Booking.room_id == room_id,
            Booking.status != BookingStatus.CANCELLED,
            Booking.start_time < end_time,
            Booking.end_time > start_time
        )
    )
    result = await session.execute(query)
    conflicts = result.scalars().all()
    return len(conflicts) > 0
