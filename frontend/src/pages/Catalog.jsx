import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import Filters, { PRICE_MAX, PRICE_MIN } from '../components/catalog/Filters.jsx'
import MapView from '../components/catalog/MapView.jsx'
import { ChevronDownIcon, FilterIcon } from '../components/Icons.jsx'
import PageLayout from '../components/PageLayout.jsx'
import RoomCard from '../components/RoomCard.jsx'
import { api } from '../utils/api.js'
import { isoDate, plural } from '../utils/format.js'
import { AREA_OPTIONS, CATEGORIES, FEATURES, SORTS, hasFeature, sortRooms } from '../utils/rooms.js'
import { useFavorites } from '../utils/useFavorites.js'

const PAGE = 6

const EMPTY = {
  priceFrom: PRICE_MIN,
  priceTo: PRICE_MAX,
  areas: [],
  features: [],
  metro: '',
  freeToday: false,
}

// фильтры, которые можно передать ссылкой: /catalog?category=Залы&feature=makeup&free=1
function fromParams(params) {
  return {
    ...EMPTY,
    features: params.getAll('feature').filter((f) => FEATURES.some((x) => x.key === f)),
    metro: params.get('q') || '',
    freeToday: params.get('free') === '1',
    priceTo: Number(params.get('max')) || PRICE_MAX,
  }
}

function useDebounced(value, delay = 400) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || ''
  const date = params.get('date') || isoDate()

  const [filters, setFilters] = useState(() => fromParams(params))
  const [sort, setSort] = useState('rec')
  const [view, setView] = useState('list')
  const [shown, setShown] = useState(PAGE)
  const [showFilters, setShowFilters] = useState(false)

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { favorites, toggleFavorite } = useFavorites()

  const priceFrom = useDebounced(filters.priceFrom)
  const priceTo = useDebounced(filters.priceTo)

  // цену, категорию и «свободно сегодня» фильтрует бэкенд, остальное — на клиенте
  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    api('/rooms', {
      params: {
        category,
        date,
        min_price: priceFrom > PRICE_MIN ? priceFrom : undefined,
        max_price: priceTo < PRICE_MAX ? priceTo : undefined,
        only_available_today: filters.freeToday || undefined,
      },
    })
      .then((data) => !ignore && setRooms(data))
      .catch((e) => !ignore && setError(e.message))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }, [category, date, priceFrom, priceTo, filters.freeToday])

  const result = useMemo(() => {
    const metro = filters.metro.trim().toLowerCase()
    const list = rooms.filter(
      (r) =>
        (!filters.areas.length || AREA_OPTIONS.some((o) => filters.areas.includes(o.key) && o.test(r.area))) &&
        filters.features.every((f) => hasFeature(r, f)) &&
        (!metro || [r.metro, r.address, r.name].some((v) => v?.toLowerCase().includes(metro))),
    )
    return sortRooms(list, sort)
  }, [rooms, filters, sort])

  useEffect(() => setShown(PAGE), [category, filters, sort])

  function changeCategory(value) {
    const next = new URLSearchParams(params)
    if (value) next.set('category', value)
    else next.delete('category')
    setParams(next, { replace: true })
  }

  function reset() {
    setFilters(EMPTY)
    setParams({}, { replace: true })
  }

  // активные фильтры чипсами над списком
  const chips = [
    ...filters.features.map((key) => ({
      label: FEATURES.find((f) => f.key === key).label,
      remove: () => setFilters({ ...filters, features: filters.features.filter((f) => f !== key) }),
    })),
    ...filters.areas.map((key) => ({
      label: AREA_OPTIONS.find((o) => o.key === key).label,
      remove: () => setFilters({ ...filters, areas: filters.areas.filter((a) => a !== key) }),
    })),
    ...(filters.priceFrom > PRICE_MIN || filters.priceTo < PRICE_MAX
      ? [
          {
            label: `${filters.priceFrom.toLocaleString('ru-RU')}–${filters.priceTo.toLocaleString('ru-RU')} ₽`,
            remove: () => setFilters({ ...filters, priceFrom: PRICE_MIN, priceTo: PRICE_MAX }),
          },
        ]
      : []),
    ...(filters.metro ? [{ label: filters.metro, remove: () => setFilters({ ...filters, metro: '' }) }] : []),
    ...(filters.freeToday
      ? [{ label: 'Есть свободное время', remove: () => setFilters({ ...filters, freeToday: false }) }]
      : []),
  ]

  const today = new Date(date + 'T00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  return (
    <PageLayout>
      <div className="container-x pt-8 pb-24">
        <Breadcrumbs items={[['Главная', '/'], ['Площадки в Ростове-на-Дону']]} />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="h2">Площадки в Ростове-на-Дону</h1>
            <p className="mt-1.5 text-[16px] text-muted">
              Найдено {result.length} {plural(result.length, ['площадка', 'площадки', 'площадок'])} · {today}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <label className="flex h-[46px] items-center gap-2 rounded-xl border border-line bg-white px-3 text-[15px]">
              Дата
              <input type="date" aria-label="Дата в каталоге" min={isoDate()} value={date}
                onChange={(e) => { if (e.target.value) { const next = new URLSearchParams(params); next.set('date', e.target.value); setParams(next, { replace: true }) } }} />
            </label>
            <label className="relative flex h-[46px] items-center rounded-xl border border-line bg-white pr-9 pl-4 text-[15px]">
              <span className="text-muted">Сортировка:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent pl-2 font-bold outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={14} className="pointer-events-none absolute right-4 text-muted" />
            </label>

            <div className="flex h-[46px] rounded-xl border border-line bg-white p-[5px]">
              {[
                ['list', 'Список'],
                ['map', 'На карте'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  aria-pressed={view === key}
                  className={`rounded-[9px] px-4 text-[14px] font-bold transition-colors ${
                    view === key ? 'bg-ink text-white' : 'hover:bg-bg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[{ value: '', title: 'Все' }, ...CATEGORIES].map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => changeCategory(c.value)}
              className={`h-11 rounded-[22px] border px-[19px] text-[15px] font-bold transition-colors ${
                category === c.value ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:bg-bg'
              }`}
            >
              {c.title}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="flex h-11 items-center gap-2 rounded-[22px] border border-line bg-white px-[19px] text-[15px] font-bold lg:hidden"
          >
            <FilterIcon size={18} />
            Фильтры {chips.length > 0 && <span className="text-accent">{chips.length}</span>}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <Filters
              value={filters}
              onChange={setFilters}
              onReset={reset}
              found={result.length}
              onShow={() => {
                setShowFilters(false)
                document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
              }}
            />
          </aside>

          <section id="results" className="min-w-0 scroll-mt-4">
            {chips.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <span
                    key={c.label}
                    className="flex h-[47px] items-center gap-2 rounded-[23px] border border-line bg-white pr-2.5 pl-4 text-[14px] font-semibold"
                  >
                    {c.label}
                    <button
                      type="button"
                      onClick={c.remove}
                      aria-label={`Убрать фильтр ${c.label}`}
                      className="grid size-[27px] place-items-center rounded-full bg-[#f0f0f4] hover:bg-line"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {error && <p className="rounded-2xl bg-danger-light px-5 py-4 font-semibold text-danger">{error}</p>}

            {loading && !rooms.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[411px] animate-pulse rounded-[22px] border border-line bg-white" />
                ))}
              </div>
            ) : view === 'map' ? (
              <MapView rooms={result} date={date} />
            ) : (
              <>
                <div className={`grid gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
                  {result.slice(0, shown).map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      date={date}
                      catalog
                      favorite={favorites.includes(room.id)}
                      onFavorite={toggleFavorite}
                    />
                  ))}
                </div>

                {result.length > shown && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShown((n) => n + PAGE)}
                      className="h-[46px] rounded-xl border border-line bg-white px-5 text-[16px] font-bold hover:bg-bg"
                    >
                      Показать ещё
                    </button>
                  </div>
                )}
              </>
            )}

            {!loading && !error && result.length === 0 && (
              <div className="rounded-[22px] border border-dashed border-line bg-white px-6 py-14 text-center">
                <p className="text-[18px] font-extrabold">Под такие фильтры ничего нет</p>
                <p className="mt-1 text-[15px] text-muted">Попробуй убрать часть условий</p>
                <button type="button" onClick={reset} className="mt-4 font-bold text-accent hover:underline">
                  Сбросить фильтры
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  )
}
