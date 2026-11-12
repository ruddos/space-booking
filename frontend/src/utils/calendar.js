// файл .ics, чтобы добавить бронь в календарь телефона или google
const stamp = (iso) => iso.replace(/[-:]/g, '').slice(0, 15)

export function downloadIcs(booking) {
  const room = booking.room
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SPACE//Booking//RU',
    'BEGIN:VEVENT',
    `UID:${booking.booking_number}@space`,
    `DTSTART:${stamp(booking.start_time)}`,
    `DTEND:${stamp(booking.end_time)}`,
    `SUMMARY:${room?.name || 'Бронь'} — SPACE`,
    `LOCATION:${room?.address || ''}`,
    `DESCRIPTION:Бронь ${booking.booking_number}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${booking.booking_number}.ics`
  a.click()
  URL.revokeObjectURL(a.href)
}
