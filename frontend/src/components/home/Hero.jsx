import { Link } from 'react-router-dom'
import { formatPrice } from '../../lib/format.js'
import { categorySingular } from '../../lib/rooms.js'
import { StarIcon } from '../Icons.jsx'
import Header from '../Header.jsx'
import SearchBar, { QUICK_FILTERS } from './SearchBar.jsx'

const STATS = [
  ['500+', 'площадок'],
  ['20 000+', 'довольных клиентов'],
  ['4.9', 'средний рейтинг'],
]

function FeaturedRoom({ room }) {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-[28px] bg-dark-2 sm:h-[540px]">
      {room?.image_url && <img src={room.image_url} alt={room.name} className="size-full object-cover" />}

      {room && (
        <>
          <div className="absolute top-5 right-5 flex items-center gap-1.5 rounded-[18px] bg-dark/70 px-3 py-2 text-[14px] font-bold text-white backdrop-blur">
            <StarIcon size={16} className="text-[#ffc53d]" />
            {room.rating} · {room.reviews_count} отзывов
          </div>

          <Link
            to={`/rooms/${room.id}`}
            className="absolute inset-x-5 bottom-5 rounded-[20px] bg-white px-5 py-[18px] transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[18px] font-extrabold">
                {categorySingular(room.category)} {room.name}
              </span>
              <span className="text-[16px] font-bold whitespace-nowrap">
                {formatPrice(room.price_per_hour)} <span className="font-medium text-muted">/час</span>
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {room.today_available_slots.length > 0 ? (
                <>
                  <span className="text-[14px] font-bold text-success">Свободно сегодня:</span>
                  {room.today_available_slots.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-lg bg-accent-light px-2.5 py-1.5 text-[14px] font-bold text-accent-hover">
                      {t}
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-[14px] font-bold text-muted">На сегодня всё занято</span>
              )}
            </div>
          </Link>
        </>
      )}
    </div>
  )
}

export default function Hero({ featured, filters, onFiltersChange, onSearch, quick, onQuickToggle }) {
  return (
    <section className="bg-dark text-white">
      <Header dark />

      <div className="container-x pt-4 pb-[76px] lg:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,602px)_minmax(0,616px)] lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-[18px] bg-accent-soft/15 px-3.5 py-2 text-[14px] font-semibold text-accent-pale">
              <span className="size-2 rounded-full bg-mint" />
              Фотостудии · залы · коворкинги
            </span>

            <h1 className="mt-3 text-[44px] leading-[1.02] font-extrabold tracking-[-0.03em] sm:text-[68px]">
              Творческие пространства для <span className="text-accent-soft">твоих идей</span>
            </h1>

            <p className="mt-10 max-w-[522px] text-[19px] leading-[1.55] text-on-dark">
              Находи студию под съёмку, мастер-класс или рабочий день — смотри свободные слоты в реальном времени и
              бронируй за минуту.
            </p>

            <dl className="mt-11 flex flex-wrap gap-y-4">
              {STATS.map(([value, label], i) => (
                <div
                  key={label}
                  className={`${i ? 'border-l border-[#2a2a36] pl-10' : ''} ${i < STATS.length - 1 ? 'pr-10' : ''}`}
                >
                  <dt className="text-[28px] leading-[1.35] font-extrabold">{value}</dt>
                  <dd className="text-[14px] text-on-dark-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <FeaturedRoom room={featured} />
        </div>

        <div className="mt-10">
          <SearchBar filters={filters} onChange={onFiltersChange} onSubmit={onSearch} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1.5 text-[14px] text-on-dark-muted">Популярно:</span>
          {QUICK_FILTERS.map((f) => {
            const active = quick.includes(f.key)
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onQuickToggle(f.key)}
                aria-pressed={active}
                className={`rounded-[18px] border px-[15px] py-[9px] text-[14px] font-semibold transition-colors ${
                  active
                    ? 'border-accent bg-accent text-white'
                    : 'border-dark-line text-line hover:border-accent-soft hover:text-white'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
