import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import Categories from '../components/home/Categories.jsx'
import FreeToday from '../components/home/FreeToday.jsx'
import Hero from '../components/home/Hero.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import Owners from '../components/home/Owners.jsx'
import Reviews from '../components/home/Reviews.jsx'
import { QUICK_FILTERS } from '../components/home/SearchBar.jsx'
import { api } from '../utils/api.js'
import { useAuth } from '../utils/auth.jsx'

const EMPTY_FILTERS = { category: '', time: '' }

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
  const { user } = useAuth()
  const navigate = useNavigate()

  const [allRooms, setAllRooms] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [quick, setQuick] = useState([])
  const [favorites, setFavorites] = useState([])

  const filtered = Boolean(applied.category || applied.time || quick.length)

  useEffect(() => {
    api('/rooms').then(setAllRooms).catch(() => setAllRooms([]))
  }, [])

  useEffect(() => {
    if (!user) return setFavorites([])
    api('/favorites')
      .then((list) => setFavorites(list.map((r) => r.id)))
      .catch(() => setFavorites([]))
  }, [user])

  // параметры запроса: категория + быстрые фильтры-чипсы
  const params = useMemo(() => {
    const p = { category: applied.category }
    QUICK_FILTERS.filter((f) => quick.includes(f.key)).forEach((f) => Object.assign(p, f.params))
    return p
  }, [applied.category, quick])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    api('/rooms', { params })
      .then((data) => {
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
  }, [params])

  const visibleRooms = useMemo(() => {
    const list = rooms.filter((r) => inTimeRange(r, applied.time))
    if (filtered) return list
    // без фильтров — 4 зала, сначала те, где есть свободные окна
    return [...list].sort((a, b) => b.today_available_slots.length - a.today_available_slots.length).slice(0, 4)
  }, [rooms, applied.time, filtered])

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
    setFilters(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setQuick([])
  }

  async function toggleFavorite(room) {
    if (!user) return navigate('/login')
    const isFav = favorites.includes(room.id)
    setFavorites((f) => (isFav ? f.filter((id) => id !== room.id) : [...f, room.id]))
    try {
      await api(`/favorites/${room.id}`, { method: isFav ? 'DELETE' : 'POST' })
    } catch {
      // откатываем, если сервер не принял
      setFavorites((f) => (isFav ? [...f, room.id] : f.filter((id) => id !== room.id)))
    }
  }

  return (
    <>
      <Hero
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
