import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTitle from '../../components/admin/PageTitle.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { RefreshIcon } from '../../components/Icons.jsx'
import { api } from '../../utils/api.js'
import { formatPrice, formatSlot } from '../../utils/format.js'

const today = () => new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD

function Stat({ label, value, hint, tone = 'accent' }) {
  const tones = {
    accent: 'bg-accent-light text-accent-hover',
    warning: 'bg-warning-light text-warning',
    success: 'bg-success-light text-success',
  }
  return (
    <div className="rounded-[22px] border border-line bg-white p-6">
      <div className="text-[14px] font-semibold text-muted">{label}</div>
      <div className="mt-2 text-[32px] leading-tight font-extrabold tracking-[-0.02em]">{value}</div>
      {hint && <span className={`mt-3 inline-block rounded-lg px-2.5 py-1 text-[13px] font-bold ${tones[tone]}`}>{hint}</span>}
    </div>
  )
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [load, setLoad] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const [list, rooms] = await Promise.all([api('/admin/bookings'), api('/rooms')])
      setBookings(list)
      // загрузка залов на сегодня — по слотам, которые считает бэкенд
      const slots = await Promise.all(rooms.map((r) => api(`/rooms/${r.id}/available-slots`, { params: { date: today() } })))
      // слоты нужны только для часов работы: прошедшие часы бэк тоже помечает занятыми,
      // поэтому занятость считаем по самим броням
      setLoad(
        rooms.map((room, i) => {
          const busy = list
            .filter((b) => b.room_id === room.id && b.status !== 'cancelled' && b.start_time.slice(0, 10) === today())
            .reduce((h, b) => h + (new Date(b.end_time) - new Date(b.start_time)) / 3600000, 0)
          return { room, busy, total: slots[i].slots.length, hours: `${slots[i].open_time}–${slots[i].close_time}` }
        }),
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const active = bookings.filter((b) => b.status !== 'cancelled')
  const pending = bookings.filter((b) => b.status === 'pending')
  const revenue = bookings.filter((b) => b.status === 'confirmed').reduce((sum, b) => sum + b.total_price, 0)
  const todayCount = active.filter((b) => b.start_time.slice(0, 10) === today()).length
  const upcoming = active
    .filter((b) => new Date(b.end_time) > new Date())
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 5)

  const dateLabel = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div>
      <PageTitle title="Сводка" text={dateLabel[0].toUpperCase() + dateLabel.slice(1)}>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-[15px] font-bold transition-colors hover:bg-bg disabled:opacity-60"
        >
          <RefreshIcon size={18} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </PageTitle>

      {error && <p className="mt-6 rounded-2xl bg-danger-light px-5 py-4 font-semibold text-danger">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Активных броней" value={active.length} hint={`всего ${bookings.length}`} />
        <Stat label="Ждут подтверждения" value={pending.length} hint={pending.length ? 'нужно проверить' : 'всё разобрано'} tone={pending.length ? 'warning' : 'success'} />
        <Stat label="Выручка" value={formatPrice(revenue)} hint="подтверждённые" tone="success" />
        <Stat label="Броней на сегодня" value={todayCount} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-[22px] border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-extrabold">Ближайшие брони</h2>
            <Link to="/admin/bookings" className="text-[15px] font-bold text-accent hover:underline">
              Все →
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line-soft">
            {upcoming.map((b) => (
              <li key={b.id} className="flex items-center gap-4 py-3.5">
                <img src={b.room?.image_url} alt="" className="size-14 shrink-0 rounded-xl bg-line-soft object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-bold">
                    {b.room?.name} <span className="font-medium text-muted">· {b.contact_name}</span>
                  </div>
                  <div className="text-[14px] text-muted">{formatSlot(b.start_time, b.end_time)}</div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-[15px] font-extrabold">{formatPrice(b.total_price)}</div>
                  <StatusBadge status={b.status} />
                </div>
              </li>
            ))}
            {!loading && upcoming.length === 0 && <li className="py-8 text-center text-muted">Предстоящих броней нет</li>}
          </ul>
        </section>

        <section className="rounded-[22px] border border-line bg-white p-6">
          <h2 className="text-[20px] font-extrabold">Загрузка сегодня</h2>
          <ul className="mt-4 space-y-4">
            {load.map(({ room, busy, total, hours }) => {
              const pct = total ? Math.round((busy / total) * 100) : 0
              return (
                <li key={room.id}>
                  <div className="flex justify-between text-[15px]">
                    <span className="font-bold">{room.name}</span>
                    <span className="text-muted">{total ? `${busy} из ${total} ч · ${hours}` : 'выходной'}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line-soft">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
