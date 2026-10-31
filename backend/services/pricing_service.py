from datetime import datetime
from typing import Sequence
from models import PromoCode, Service

def calculate_pricing_breakdown(
    price_per_hour: int,
    start_time: datetime,
    end_time: datetime,
    services: Sequence[tuple[Service, int]] = (),
    promo_code: PromoCode | None = None
) -> dict:
    """
    Интеллектуальный расчет стоимости бронирования:
    1. Базовый расчет часов.
    2. Выходной день (сб/вс): коэффициент +15%.
    3. Длительная аренда (от 4 часов): скидка 10% на аренду зала.
    4. Суммирование платных дополнительных услуг.
    5. Применение промокода.
    """
    duration_hours = max(1, int((end_time - start_time).total_seconds() // 3600))
    is_weekend = start_time.weekday() in (5, 6) # Суббота или воскресенье
    
    # 1. Почасовая ставка зала
    effective_hourly_rate = int(price_per_hour * 1.15) if is_weekend else price_per_hour
    hall_base_price = effective_hourly_rate * duration_hours
    
    # 2. Скидка за длительность (от 4 часов)
    duration_discount_percent = 10 if duration_hours >= 4 else 0
    duration_discount_amount = int(hall_base_price * (duration_discount_percent / 100.0))
    hall_subtotal = hall_base_price - duration_discount_amount

    # 3. Расчет стоимости дополнительных услуг
    services_subtotal = 0
    services_details = []
    for service, qty in services:
        if service.is_per_hour:
            svc_cost = service.price * duration_hours * qty
        else:
            svc_cost = service.price * qty
        services_subtotal += svc_cost
        services_details.append({
            "service_id": service.id,
            "name": service.name,
            "quantity": qty,
            "unit_price": service.price,
            "is_per_hour": service.is_per_hour,
            "total_price": svc_cost
        })

    subtotal_before_promo = hall_subtotal + services_subtotal

    # 4. Промокод
    promo_discount_amount = 0
    if promo_code and promo_code.is_active:
        calculated_discount = int(subtotal_before_promo * (promo_code.discount_percent / 100.0))
        if promo_code.max_discount and calculated_discount > promo_code.max_discount:
            promo_discount_amount = promo_code.max_discount
        else:
            promo_discount_amount = calculated_discount

    final_total = max(0, subtotal_before_promo - promo_discount_amount)

    return {
        "duration_hours": duration_hours,
        "base_price_per_hour": price_per_hour,
        "effective_hourly_rate": effective_hourly_rate,
        "is_weekend": is_weekend,
        "weekend_surcharge_applied": is_weekend,
        "duration_discount_percent": duration_discount_percent,
        "duration_discount_amount": duration_discount_amount,
        "hall_subtotal": hall_subtotal,
        "services_subtotal": services_subtotal,
        "services_details": services_details,
        "promo_discount_amount": promo_discount_amount,
        "final_total": final_total
    }
