import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../components/admin/StatusBadge.jsx'
import { CalendarIcon, CheckCircleIcon, DownloadIcon, RouteIcon } from '../components/Icons.jsx'
import PageLayout from '../components/PageLayout.jsx'
import { api } from '../utils/api.js'
import { downloadIcs } from '../utils/calendar.js'
import { formatPrice, formatTime } from '../utils/format.js'
import { categorySingular, routeUrl } from '../utils/rooms.js'

const NEXT = [
  'Детали бронирования и уведомления доступны в личном кабинете.',
  'Приходи за 10 минут — администратор покажет студию и свет.',
  'Отменить бесплатно можно не позднее чем за 24 часа до начала — в личном кабинете.',
]

const btn =
  'flex h-12 items-center gap-2.5 rounded-xl border border-line bg-white px-[19px] text-[15px] font-bold transition-colors hover:bg-bg'

export default function BookingDone() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/bookings/my')
      .then((list) => {
        const b = list.find((x) => x.id === Number(id))
        if (!b) throw new Error('Бронь не найдена')
        setBooking(b)
      })
      .catch((e) => setError(e.message))
    api(`/bookings/${id}/receipt`)
      .then((r) => setPaid(r.payment.is_paid))
      .catch(() => setPaid(false))
  }, [id])

  if (error) {
    return (
      <PageLayout className="container-x py-24 text-center">
        <h1 className="h2">{error}</h1>
        <Link to="/account" className="mt-6 inline-block font-bold text-accent">
          Перейти в кабинет →
        </Link>
      </PageLayout>
    )
  }

  const room = booking?.room
  const day = booking && new Date(booking.start_time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })

  return (
    <PageLayout>
      <div className="mx-auto max-w-[720px] px-4 pt-14 pb-24">
        <div className="text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-success-light text-success">
            <CheckCircleIcon size={40} />
          </span>
          <h1 className="h2 mt-4">Бронь подтверждена</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">
            Подтверждение и чек сохранены в личном кабинете. Номер брони —{' '}
            <b className="text-ink">{booking?.booking_number || '…'}</b>
          </p>
        </div>

        {booking && (
          <section className="mt-12 overflow-hidden rounded-3xl border border-line bg-white">
            <div className="flex items-center gap-5 border-b border-line-soft p-6">
              <img src={room.image_url} alt="" className="hidden h-[88px] w-[120px] rounded-[14px] object-cover sm:block" />
              <div className="min-w-0 flex-1">
                <h2 className="text-[20px] font-extrabold">
                  {categorySingular(room.category)} {room.name}
                </h2>
                <p className="mt-1 text-[15px] text-muted">
                  {room.address} · {room.metro}
                </p>
              </div>
              {paid ? (
                <span className="rounded-full bg-success-light px-3 py-2 text-[14px] font-bold text-success">Оплачено</span>
              ) : (
                <StatusBadge status={booking.status} />
              )}
            </div>

            <dl className="grid grid-cols-3 gap-4 px-6 pt-6">
              {[
                ['Дата', day],
                ['Время', `${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`],
                ['Сумма', formatPrice(booking.total_price)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[13px] font-bold text-muted">{label}</dt>
                  <dd className="mt-1 text-[17px] font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap gap-2.5 p-6">
              <button type="button" onClick={() => downloadIcs(booking)} className={btn}>
                <CalendarIcon size={18} />В календарь
              </button>
              <a href={routeUrl(room.address)} target="_blank" rel="noreferrer" className={btn}>
                <RouteIcon size={18} />
                Построить маршрут
              </a>
              <Link to={`/account/receipt/${booking.id}`} className={btn}>
                <DownloadIcon size={18} />
                Скачать чек
              </Link>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-line bg-white p-6">
          <h2 className="text-[20px] font-extrabold">Что дальше</h2>
          <ol className="mt-4 space-y-3.5">
            {NEXT.map((text, i) => (
              <li key={text} className="flex items-start gap-3.5 text-[15px] leading-relaxed">
                <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-accent-light font-extrabold text-accent-hover">
                  {i + 1}
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/account" className="rounded-[14px] bg-accent px-7 py-4 text-[16px] font-bold text-white hover:bg-accent-hover">
            Мои бронирования
          </Link>
          <Link to="/catalog" className="rounded-[14px] border border-line bg-white px-7 py-4 text-[16px] font-bold hover:bg-bg">
            Найти ещё площадку
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
