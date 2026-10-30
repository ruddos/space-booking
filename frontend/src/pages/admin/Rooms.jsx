import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTitle from '../../components/admin/PageTitle.jsx'
import { SearchIcon, StarIcon } from '../../components/Icons.jsx'
import { api } from '../../utils/api.js'
import { formatPrice } from '../../utils/format.js'
import { CATEGORIES } from '../../utils/rooms.js'

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    api('/rooms')
      .then(setRooms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rooms.filter(
      (r) =>
        (!category || r.category === category) &&
        (!q || [r.name, r.metro, r.address].some((v) => v?.toLowerCase().includes(q))),
    )
  }, [rooms, category, query])

  return (
    <div>
      <PageTitle title="Площадки" text={`Активных площадок: ${rooms.length}`} />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[{ value: '', title: 'Все' }, ...CATEGORIES].map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`h-11 rounded-[22px] border px-[18px] text-[15px] font-bold transition-colors ${
              category === c.value ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:bg-bg'
            }`}
          >
            {c.title}
          </button>
        ))}
        <label className="relative ml-auto w-full sm:w-[280px]">
          <SearchIcon size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Название, метро, адрес"
            className="h-11 w-full rounded-xl border border-line bg-white pr-4 pl-10 text-[15px] outline-none focus:border-accent"
          />
        </label>
      </div>

      {error && <p className="mt-4 rounded-2xl bg-danger-light px-5 py-4 font-semibold text-danger">{error}</p>}
      {loading && <p className="mt-10 text-center text-muted">Загружаем площадки…</p>}

      <div className="mt-4 space-y-4">
        {visible.map((room) => (
          <article key={room.id} className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-5 sm:flex-row">
            <img src={room.image_url} alt={room.name} className="h-40 w-full shrink-0 rounded-2xl bg-line-soft object-cover sm:h-32 sm:w-44" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[20px] font-extrabold">{room.name}</h2>
                <span className="rounded-[14px] bg-accent-light px-2.5 py-1 text-[13px] font-bold text-accent-hover">
                  {room.category}
                </span>
                <span className="flex items-center gap-1 text-[14px] font-bold">
                  <StarIcon size={14} className="text-star" />
                  {room.rating} <span className="font-medium text-muted">({room.reviews_count})</span>
                </span>
              </div>
              <p className="mt-1 text-[14px] text-muted">
                {room.metro} · {room.address}
              </p>

              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
                <div>
                  <dt className="inline text-muted">Цена: </dt>
                  <dd className="inline font-bold">{formatPrice(room.price_per_hour)}/час</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Площадь: </dt>
                  <dd className="inline font-bold">{room.area} м²</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Вместимость: </dt>
                  <dd className="inline font-bold">до {room.capacity} чел.</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Свободно сегодня: </dt>
                  <dd className="inline font-bold">
                    {room.today_available_slots.length ? room.today_available_slots.join(', ') : 'нет'}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {room.amenities.slice(0, 5).map((a) => (
                  <span key={a.id} className="rounded-lg bg-bg px-2.5 py-1 text-[13px] font-semibold">
                    {a.name}
                  </span>
                ))}
                {room.amenities.length > 5 && (
                  <span className="rounded-lg px-1 py-1 text-[13px] font-semibold text-muted">
                    +{room.amenities.length - 5}
                  </span>
                )}
              </div>
            </div>

            <Link
              to={`/rooms/${room.id}`}
              className="self-start rounded-xl border border-line px-4 py-2.5 text-[14px] font-bold whitespace-nowrap hover:bg-bg"
            >
              На сайте →
            </Link>
          </article>
        ))}
      </div>

      {!loading && !error && visible.length === 0 && <p className="mt-10 text-center text-muted">Ничего не найдено</p>}
    </div>
  )
}
