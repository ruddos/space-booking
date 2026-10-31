from datetime import datetime, timedelta
import pytest
from services.booking_service import calculate_cancellation_refund

def test_full_refund_more_than_24h():
    # Отмена более чем за 24 часа -> 100% возврат
    start = datetime.utcnow() + timedelta(days=2)
    pct, amt, desc = calculate_cancellation_refund(start_time=start, total_price=5000)

    assert pct == 100
    assert amt == 5000
    assert "Полный возврат" in desc

def test_half_refund_between_6_and_24h():
    # Отмена за 10 часов -> 50% возврат
    start = datetime.utcnow() + timedelta(hours=10)
    pct, amt, desc = calculate_cancellation_refund(start_time=start, total_price=5000)

    assert pct == 50
    assert amt == 2500
    assert "50%" in desc

def test_no_refund_less_than_6h():
    # Отмена за 2 часа -> 0% возврат
    start = datetime.utcnow() + timedelta(hours=2)
    pct, amt, desc = calculate_cancellation_refund(start_time=start, total_price=5000)

    assert pct == 0
    assert amt == 0
    assert "Без возврата" in desc
