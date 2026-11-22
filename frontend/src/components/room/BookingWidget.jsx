import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { formatPrice, isoDate } from '../../utils/format.js'
import { CalendarIcon } from '../Icons.jsx'

// боковая карточка на странице студии: дата, свободные часы, кнопка брони
export default function BookingWidget({ room }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initial = params.get('date')
  const [date, setDate] = useState(initial && /^\d{4}-\d{2}-\d{2}$/.test(initial) && initial >= isoDate() ? initial : isoDate())
  const [data, setData] = useState(null)
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setTime('')
    api(`/rooms/${room.id}/available-slots`, { params: { date } })
      .then((d) => !ignore && setData(d))
      .catch(() => !ignore && setData(null))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }, [room.id, date])

  const slots = data?.slots || []
  const free = slots.filter((s) => s.is_available)

  function book() {
    const q = new URLSearchParams({ date })
    if (time) q.set('time', time)
    navigate(`/booking/${room.id}?${q}`)
  }

  return (
    <div className="rounded-3xl border border-line bg-white p-[25px]">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[30px] font-extrabold tracking-[-0.02em]">{formatPrice(room.price_per_hour)}</span>
        <span className="text-[16px] text-muted">/ час</span>
      </div>
      <p className="mt-1.5 text-[14px] leading-snug text-muted">В выходные +15% к цене, от 4 часов — скидка 10%</p>

      <label className="mt-6 block">
        <span className="text-[13px] font-bold text-muted">Дата</span>
        <span className="relative mt-2 flex h-[50px] items-center rounded-xl border border-line px-4 focus-within:border-accent">
          <CalendarIcon size={18} className="mr-2.5 text-muted" />
          <input
            type="date"
            value={date}
            min={isoDate()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="w-full bg-transparent text-[15px] font-bold outline-none"
          />
        </span>
      </label>

      <div className="mt-5 text-[13px] font-bold text-muted">
        Свободное время {!loading && slots.length > 0 && <span className="font-semibold">· {free.length} ч</span>}
      </div>
      <div className="mt-2.5 grid min-h-[40px] grid-cols-4 gap-2">
        {loading ? (
          <span className="col-span-4 py-2 text-[14px] text-muted">Загружаем…</span>
        ) : slots.length === 0 ? (
          <span className="col-span-4 py-2 text-[14px] text-muted">В этот день студия не работает</span>
        ) : (
          slots.map((s) => (
            <button
              key={s.time}
              type="button"
              disabled={!s.is_available}
              onClick={() => setTime(s.time === time ? '' : s.time)}
              className={`h-10 rounded-[10px] text-[14px] transition-colors ${
                !s.is_available
                  ? 'cursor-not-allowed bg-[#f2f2f6] font-semibold text-[#8a8a9c]'
                  : s.time === time
                    ? 'bg-accent font-bold text-white'
                    : 'border border-line font-bold hover:border-accent'
              }`}
            >
              {s.time}
            </button>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={book}
        disabled={!loading && free.length === 0}
        className="mt-5 h-[54px] w-full rounded-[14px] bg-accent text-[16px] font-bold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Забронировать
      </button>
      <p className="mt-4 text-center text-[14px] text-muted">Бесплатная отмена за 24 часа</p>

      <div className="mt-5 flex items-center gap-3 border-t border-line-soft pt-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-[16px] font-extrabold text-white">
          {room.name[0]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">Администратор студии</span>
          <span className="block text-[13px] text-muted">Вопросы о посещении</span>
        </span>
        <Link to="/contacts#write" className="text-[14px] font-bold text-accent hover:underline">
          Написать
        </Link>
      </div>
    </div>
  )
}
