import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Fragment } from 'react'
import ReviewForm from '../../components/account/ReviewForm.jsx'
import PageTitle from '../../components/admin/PageTitle.jsx'
import { api } from '../../utils/api.js'
import { CLIENT_STATUS, bookingTab, refundInfo } from '../../utils/bookings.js'
import { formatPrice, formatSlot } from '../../utils/format.js'
import { categorySingular, routeUrl } from '../../utils/rooms.js'
import { useFavorites } from '../../utils/useFavorites.js'

const TABS = [
  ['upcoming', 'Предстоящие'],
  ['past', 'Прошедшие'],
  ['cancelled', 'Отменённые'],
]

const btn = 'flex h-11 items-center rounded-xl px-4 text-[14px] font-bold whitespace-nowrap transition-colors disabled:opacity-50'
const dark = `${btn} bg-ink text-white hover:bg-[#2a2a36]`
const light = `${btn} border border-line bg-white hover:bg-bg`
const danger = `${btn} border border-line bg-white text-danger hover:bg-danger-light`

function BookingItem({ b, busy, onCancel, onPay, onReview }) {
  const tab = bookingTab(b)
  const status = CLIENT_STATUS[b.status]
  const room = b.room

  return (
    <article className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-5 sm:flex-row sm:items-center">
      <Link to={`/rooms/${room.id}`} className="shrink-0">
        <img src={room.image_url} alt="" className="h-40 w-full rounded-2xl object-cover sm:h-32 sm:w-44" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-[20px] font-extrabold">
            {categorySingular(room.category)} {room.name}
          </h3>
          <span className={`rounded-[14px] px-2.5 py-1 text-[13px] font-bold ${status.cls}`}>{status.label}</span>
        </div>
        <p className="mt-2 text-[16px] font-bold">{formatSlot(b.start_time, b.end_time)}</p>
        <p className="mt-1 text-[14px] text-muted">
          {room.address.replace('Москва, ', '')} · {formatPrice(b.total_price)} · № {b.booking_number}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tab === 'past' && b.status === 'confirmed' && !b.has_review && (
          <button type="button" onClick={() => onReview(b.id)} className={dark}>Оставить отзыв</button>
        )}
        {b.has_review && <span className="self-center text-[14px] font-bold text-success">Отзыв опубликован</span>}
        {tab === 'upcoming' && b.status === 'pending' && (
          <button type="button" disabled={busy} onClick={() => onPay(b)} className={dark}>
            Оплатить
          </button>
        )}
        {tab === 'upcoming' && b.status === 'confirmed' && (
          <a href={routeUrl(room.address)} target="_blank" rel="noreferrer" className={dark}>
            Маршрут
          </a>
        )}
        {b.status !== 'cancelled' && (
          <Link to={`/account/receipt/${b.id}`} className={light}>
            Чек
          </Link>
        )}
        {tab === 'upcoming' && (
          <button type="button" disabled={busy} onClick={() => onCancel(b)} className={danger}>
            Отменить
          </button>
        )}
        {tab !== 'upcoming' && (
          <Link to={`/rooms/${room.id}`} className={light}>
            Забронировать снова
          </Link>
        )}
      </div>
    </article>
  )
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('upcoming')
  const [busyId, setBusyId] = useState(null)
  const [reviewId, setReviewId] = useState(null)
  const [notice, setNotice] = useState('')
  const [favRooms, setFavRooms] = useState([])
  const { favorites } = useFavorites()

  function load() {
    return api('/bookings/my')
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    api('/favorites').then(setFavRooms).catch(() => setFavRooms([]))
  }, [favorites.length])

  const grouped = useMemo(() => {
    const g = { upcoming: [], past: [], cancelled: [] }
    bookings.forEach((b) => g[bookingTab(b)].push(b))
    // ближайшие сверху, прошедшие — от новых к старым
    g.upcoming.sort((a, b) => a.start_time.localeCompare(b.start_time))
    return g
  }, [bookings])

  async function cancel(b) {
    const { text } = refundInfo(b)
    if (!window.confirm(`Отменить бронь ${b.booking_number}?\n${text}`)) return
    setBusyId(b.id)
    setError('')
    try {
      const updated = await api(`/bookings/${b.id}/cancel`, { method: 'PATCH' })
      setBookings((list) => list.map((x) => (x.id === b.id ? { ...x, ...updated } : x)))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function pay(b) {
    setBusyId(b.id)
    setError('')
    try {
      await api(`/bookings/${b.id}/pay`, { method: 'POST', params: { payment_method: 'card' } })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const list = grouped[tab]

  return (
    <div>
      <PageTitle title="Мои бронирования">
        <Link
          to="/catalog"
          className="rounded-xl bg-accent px-5 py-3.5 text-[16px] font-bold text-white transition-colors hover:bg-accent-hover"
        >
          + Новая бронь
        </Link>
      </PageTitle>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`h-11 rounded-[22px] border px-[19px] text-[15px] font-bold transition-colors ${
              tab === key ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:bg-bg'
            }`}
          >
            {label} <span className="opacity-70">{grouped[key].length}</span>
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-2xl bg-danger-light px-5 py-4 font-semibold text-danger">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-2xl bg-success-light p-4 text-success">{notice}</p>}

      <div className="mt-6 space-y-4">
        {loading && <div className="h-[170px] animate-pulse rounded-[22px] border border-line bg-white" />}
        {list.map((b) => (
          <Fragment key={b.id}>
            <BookingItem b={b} busy={busyId === b.id} onCancel={cancel} onPay={pay} onReview={setReviewId} />
            {reviewId === b.id && <ReviewForm booking={b} onClose={() => setReviewId(null)} onSaved={(id) => {
              setBookings((list) => list.map((item) => item.id === id ? { ...item, has_review: true } : item))
              setReviewId(null)
              setNotice('Спасибо! Отзыв опубликован, оценка площадки обновлена.')
            }} />}
          </Fragment>
        ))}
        {!loading && list.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-line bg-white px-6 py-12 text-center">
            <p className="text-[18px] font-extrabold">
              {tab === 'upcoming' ? 'Предстоящих броней нет' : tab === 'past' ? 'Прошедших броней пока нет' : 'Отменённых броней нет'}
            </p>
            {tab === 'upcoming' && (
              <Link to="/catalog" className="mt-3 inline-block font-bold text-accent hover:underline">
                Найти площадку →
              </Link>
            )}
          </div>
        )}
      </div>

      {favRooms.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[26px] font-extrabold">Избранное</h2>
            <Link to="/account/favorites" className="text-[16px] font-bold text-accent hover:underline">
              Все →
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {favRooms.slice(0, 4).map((r) => (
              <Link
                key={r.id}
                to={`/rooms/${r.id}`}
                className="overflow-hidden rounded-[18px] border border-line bg-white transition-shadow hover:shadow-[0_12px_32px_rgba(15,15,20,0.08)]"
              >
                <img src={r.image_url} alt="" className="h-[140px] w-full object-cover" />
                <div className="p-4">
                  <div className="text-[16px] font-extrabold">{r.name}</div>
                  <div className="mt-1 text-[14px] text-muted">
                    {formatPrice(r.price_per_hour)}/час · ★ {r.rating}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
