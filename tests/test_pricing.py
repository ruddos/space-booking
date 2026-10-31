from datetime import datetime
import pytest
from services.pricing_service import calculate_pricing_breakdown
from models import PromoCode, Service, ServiceCategory

def test_weekday_base_pricing():
    # Среда, 28 октября 2026, 2 часа
    start = datetime(2026, 10, 28, 12, 0)
    end = datetime(2026, 10, 28, 14, 0)
    result = calculate_pricing_breakdown(price_per_hour=2000, start_time=start, end_time=end)

    assert result["duration_hours"] == 2
    assert result["is_weekend"] is False
    assert result["effective_hourly_rate"] == 2000
    assert result["hall_subtotal"] == 4000
    assert result["final_total"] == 4000

def test_weekend_surcharge():
    # Суббота, 31 октября 2026, 2 часа (+15% к ставке)
    start = datetime(2026, 10, 31, 12, 0)
    end = datetime(2026, 10, 31, 14, 0)
    result = calculate_pricing_breakdown(price_per_hour=2000, start_time=start, end_time=end)

    assert result["is_weekend"] is True
    assert result["effective_hourly_rate"] == 2300 # 2000 * 1.15
    assert result["hall_subtotal"] == 4600
    assert result["final_total"] == 4600

def test_duration_discount():
    # Среда, 5 часов подряд -> скидка 10% на аренду
    start = datetime(2026, 10, 28, 10, 0)
    end = datetime(2026, 10, 28, 15, 0)
    result = calculate_pricing_breakdown(price_per_hour=2000, start_time=start, end_time=end)

    assert result["duration_hours"] == 5
    assert result["duration_discount_percent"] == 10
    # 5 * 2000 = 10000, 10% = 1000 -> 9000
    assert result["duration_discount_amount"] == 1000
    assert result["hall_subtotal"] == 9000
    assert result["final_total"] == 9000

def test_services_and_promo_code():
    # 2 часа + услуга + промокод 15%
    start = datetime(2026, 10, 28, 14, 0)
    end = datetime(2026, 10, 28, 16, 0)
    
    svc_light = Service(id=1, name="Свет", category=ServiceCategory.EQUIPMENT, price=800, is_per_hour=False)
    promo = PromoCode(id=1, code="SALE15", discount_percent=15, max_discount=1000, is_active=True)

    result = calculate_pricing_breakdown(
        price_per_hour=2000,
        start_time=start,
        end_time=end,
        services=[(svc_light, 1)],
        promo_code=promo
    )

    # Зал: 2 * 2000 = 4000
    # Услуга: 800
    # Сумма до промокода: 4800
    # Скидка 15%: 4800 * 0.15 = 720
    # Итог: 4800 - 720 = 4080
    assert result["hall_subtotal"] == 4000
    assert result["services_subtotal"] == 800
    assert result["promo_discount_amount"] == 720
    assert result["final_total"] == 4080
