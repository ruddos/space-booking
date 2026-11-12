// вкладки «Мои бронирования» — та же логика, что у бэка в /bookings/my?tab=
export function bookingTab(b, now = new Date()) {
  if (b.status === 'cancelled') return 'cancelled'
  return new Date(b.end_time) < now ? 'past' : 'upcoming'
}

// для клиента: подтвержденная бронь уже оплачена (бэк проводит оплату при создании)
export const CLIENT_STATUS = {
  confirmed: { label: 'Оплачено', cls: 'bg-success-light text-success' },
  pending: { label: 'Ждёт оплаты', cls: 'bg-warning-light text-warning' },
  cancelled: { label: 'Отменена', cls: 'bg-danger-light text-danger' },
}

// та же политика, что calculate_cancellation_refund на бэке
export function refundInfo(b, now = new Date()) {
  const hours = (new Date(b.start_time) - now) / 3600000
  if (hours >= 24) return { percent: 100, text: 'Деньги вернутся полностью.' }
  if (hours >= 6) return { percent: 50, text: 'До начала меньше суток — вернём 50% суммы.' }
  return { percent: 0, text: 'До начала меньше 6 часов — деньги не вернутся.' }
}
