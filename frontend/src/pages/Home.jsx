import { useEffect, useMemo, useState } from 'react'
import Footer from '../components/Footer.jsx'
import Categories from '../components/home/Categories.jsx'
import FreeToday from '../components/home/FreeToday.jsx'
import Hero from '../components/home/Hero.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import Owners from '../components/home/Owners.jsx'
import Reviews from '../components/home/Reviews.jsx'
import { QUICK_FILTERS } from '../components/home/SearchBar.jsx'
import { api } from '../utils/api.js'
import { useFavorites } from '../utils/useFavorites.js'
import { isoDate } from '../utils/format.js'
import { hasFeature } from '../utils/rooms.js'

const emptyFilters = () => ({ category: '', time: '', date: isoDate() })

// границы для фильтра "Время" (часы начала слота)
const TIME_RANGES = {
  morning: [0, 12],
  day: [12, 17],
  evening: [17, 24],
}

function inTimeRange(room, time) {
  if (!time) return true
  const [from, to] = TIME_RANGES[time]
  return room.today_available_slots.some((t) => {
    const h = parseInt(t, 10)
    return h >= from && h < to
  })
}

export default function Home() {

  const [allRooms, setAllRooms] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const [quick, setQuick] = useState([])
  const { favorites, toggleFavorite } = useFavorites()

  const filtered = Boolean(applied.category || applied.time || quick.length || applied.date !== isoDate())

  useEffect(() => {
    api('/rooms').then(setAllRooms).catch(() => setAllRooms([]))
  }, [])

  // параметры запроса: категория + быстрые фильтры-чипсы
  const params = useMemo(() => {
    const p = { category: applied.category, date: applied.date }
    QUICK_FILTERS.filter((f) => quick.includes(f.key)).forEach((f) => {
      if (!f.params.search) Object.assign(p, f.params)
    })
    return p
  }, [applied.category, applied.date, quick])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    api('/rooms', { params })
      .then(async (data) => {
        // Каталог отдаёт только четыре первых окна. Для фильтра по времени
        // берём полный день, иначе вечер скрывается за утренними слотами.
        if (applied.time) data = await Promise.all(data.map(async (room) => {
          const day = await api(`/rooms/${room.id}/available-slots`, { params: { date: applied.date } })
          return { ...room, today_available_slots: day.slots.filter((s) => s.is_available).map((s) => s.time) }
        }))
        if (!ignore) setRooms(data)
      })
      .catch((e) => {
        if (!ignore) setError(e.message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [params, applied.time, applied.date])

  const visibleRooms = useMemo(() => {
    const features = quick.filter((key) => ['cyclorama', 'daylight', 'makeup'].includes(key))
    const list = rooms.filter((r) => inTimeRange(r, applied.time) && features.every((key) => hasFeature(r, key))).map((r) => ({
      ...r,
      today_available_slots: applied.time ? r.today_available_slots.filter((t) => {
        const [from, to] = TIME_RANGES[applied.time]
        return parseInt(t, 10) >= from && parseInt(t, 10) < to
      }) : r.today_available_slots,
    }))
    if (filtered) return list
    // без фильтров — 4 зала, сначала те, где есть свободные окна
    return [...list].sort((a, b) => b.today_available_slots.length - a.today_available_slots.length).slice(0, 4)
  }, [rooms, applied.time, filtered, quick])

  // в hero показываем зал, у которого есть свободные окна сегодня
  const featured = allRooms.find((r) => r.today_available_slots.length) || allRooms[0]

  function scrollToResults() {
    document.getElementById('free-today')?.scrollIntoView()
  }

  function search() {
    setApplied(filters)
    scrollToResults()
  }

  function selectCategory(category) {
    const next = { ...filters, category }
    setFilters(next)
    setApplied(next)
    scrollToResults()
  }

  function toggleQuick(key) {
    setQuick((q) => (q.includes(key) ? q.filter((k) => k !== key) : [...q, key]))
  }

  function reset() {
    setFilters(emptyFilters())
    setApplied(emptyFilters())
    setQuick([])
  }

  return (
    <>
      <Hero
        rooms={allRooms}
        featured={featured}
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={search}
        quick={quick}
        onQuickToggle={toggleQuick}
      />
      <main>
        <Categories rooms={allRooms} onSelect={selectCategory} />
        <FreeToday
          date={applied.date}
          rooms={visibleRooms}
          loading={loading}
          error={error}
          filtered={filtered}
          onReset={reset}
          favorites={favorites}
          onFavorite={toggleFavorite}
        />
        <HowItWorks />
        <Owners />
        <Reviews />
      </main>
      <Footer />
    </>
  )
}
