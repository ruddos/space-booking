import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../../components/admin/PageTitle.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { SearchIcon } from '../../components/Icons.jsx'
import { api } from '../../utils/api.js'
import { formatDate, formatPrice, formatSlot } from '../../utils/format.js'

const TABS = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Ожидают' },
  { key: 'confirmed', label: 'Подтверждены' },
  { key: 'cancelled', label: 'Отменены' },
]

function ActionButton({ tone = 'default', ...props }) {
  const tones = {
    primary: 'bg-accent text-white hover:bg-accent-hover border-accent',
    danger: 'bg-white text-danger border-line hover:bg-danger-light',
    default: 'bg-white text-ink border-line hover:bg-bg',
  }
  return (
    <button
      type="button"
      className={`h-9 rounded-[10px] border px-3 text-[14px] font-bold whitespace-nowrap transition-colors disabled:opacity-50 ${tones[tone]}`}
      {...props}
    />
  )
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    api('/admin/bookings')
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const counts = useMemo(() => {
    const c = { all: bookings.length }
    bookings.forEach((b) => (c[b.status] = (c[b.status] || 0) + 1))
    return c
  }, [bookings])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookings.filter((b) => {
      if (tab !== 'all' && b.status !== tab) return false
      if (!q) return true
      return [b.booking_number, b.contact_name, b.contact_phone, b.room?.name]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    })
  }, [bookings, tab, query])

  async function changeStatus(booking, status) {
    if (status === 'cancelled' && !window.confirm(`Отменить бронь ${booking.booking_number}?`)) return
    setBusyId(booking.id)
    setError('')
    try {
      const updated = await api(`/admin/bookings/${booking.id}/status`, { method: 'PATCH', body: { status } })
      setBookings((list) => list.map((b) => (b.id === updated.id ? updated : b)))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageTitle title="Бронирования" text="Все брони площадок и их статусы" />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`h-11 rounded-[22px] border px-[18px] text-[15px] font-bold transition-colors ${
              tab === t.key ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:bg-bg'
            }`}
          >
            {t.label} <span className="opacity-70">{counts[t.key] || 0}</span>
          </button>
        ))}

        <label className="relative ml-auto w-full sm:w-[280px]">
          <SearchIcon size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Номер, клиент, телефон, зал"
            className="h-11 w-full rounded-xl border border-line bg-white pr-4 pl-10 text-[15px] outline-none focus:border-accent"
          />
        </label>
      </div>

      {error && <p className="mt-4 rounded-2xl bg-danger-light px-5 py-4 font-semibold text-danger">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-[22px] border border-line bg-white">
        <table className="w-full min-w-[900px] text-left text-[15px]">
          <thead>
            <tr className="border-b border-line text-[13px] font-bold text-muted">
              <th className="px-5 py-3.5">Бронь</th>
              <th className="px-3 py-3.5">Площадка</th>
              <th className="px-3 py-3.5">Клиент</th>
              <th className="px-3 py-3.5">Дата и время</th>
              <th className="px-3 py-3.5 text-right">Сумма</th>
              <th className="px-3 py-3.5">Статус</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {visible.map((b) => (
              <tr key={b.id} className="align-top">
                <td className="px-5 py-4">
                  <div className="font-bold">{b.booking_number || `#${b.id}`}</div>
                  <div className="text-[13px] text-muted">создана {formatDate(b.created_at)}</div>
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    <img src={b.room?.image_url} alt="" className="size-10 rounded-lg bg-line-soft object-cover" />
                    <span className="font-bold">{b.room?.name}</span>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="font-semibold">{b.contact_name || '—'}</div>
                  <div className="text-[13px] text-muted">{b.contact_phone || 'без телефона'}</div>
                  {(b.additional_services || b.comment) && (
                    <div className="mt-1 max-w-[220px] text-[13px] text-muted">
                      {b.additional_services && <div>+ {b.additional_services}</div>}
                      {b.comment && <div className="italic">«{b.comment}»</div>}
                    </div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">{formatSlot(b.start_time, b.end_time)}</td>
                <td className="px-3 py-4 text-right font-extrabold whitespace-nowrap">{formatPrice(b.total_price)}</td>
                <td className="px-3 py-4">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    {b.status === 'pending' && (
                      <ActionButton tone="primary" disabled={busyId === b.id} onClick={() => changeStatus(b, 'confirmed')}>
                        Подтвердить
                      </ActionButton>
                    )}
                    {b.status !== 'cancelled' ? (
                      <ActionButton tone="danger" disabled={busyId === b.id} onClick={() => changeStatus(b, 'cancelled')}>
                        Отменить
                      </ActionButton>
                    ) : (
                      <ActionButton disabled={busyId === b.id} onClick={() => changeStatus(b, 'pending')}>
                        Вернуть
                      </ActionButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <p className="px-5 py-10 text-center text-muted">Загружаем брони…</p>}
        {!loading && visible.length === 0 && (
          <p className="px-5 py-10 text-center text-muted">{bookings.length ? 'Ничего не найдено' : 'Броней пока нет'}</p>
        )}
      </div>
    </div>
  )
}
