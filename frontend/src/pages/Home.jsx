import { useEffect, useState } from 'react'
import Footer from '../components/Footer.jsx'
import Hero from '../components/home/Hero.jsx'
import { QUICK_FILTERS } from '../components/home/SearchBar.jsx'
import { api } from '../lib/api.js'

const EMPTY_FILTERS = { category: '', time: '' }

export default function Home() {
  const [allRooms, setAllRooms] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [quick, setQuick] = useState([])

  useEffect(() => {
    api('/rooms').then(setAllRooms).catch(() => setAllRooms([]))
  }, [])

  // в hero показываем зал, у которого есть свободные окна сегодня
  const featured = allRooms.find((r) => r.today_available_slots.length) || allRooms[0]

  function toggleQuick(key) {
    setQuick((q) => (q.includes(key) ? q.filter((k) => k !== key) : [...q, key]))
  }

  function search() {
    document.getElementById('free-today')?.scrollIntoView()
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
      <main id="free-today" data-quick={QUICK_FILTERS.length} />
      <Footer />
    </>
  )
}
