import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './api.js'
import { useAuth } from './auth.jsx'

// id избранных залов + переключатель; гостя отправляем на вход
export function useFavorites() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ids, setIds] = useState([])

  useEffect(() => {
    if (!user) {
      setIds([])
      return
    }
    api('/favorites')
      .then((list) => setIds(list.map((r) => r.id)))
      .catch(() => setIds([]))
  }, [user])

  async function toggle(room) {
    if (!user) return navigate('/login', { state: { from: window.location.pathname } })
    const isFav = ids.includes(room.id)
    setIds((f) => (isFav ? f.filter((id) => id !== room.id) : [...f, room.id]))
    try {
      await api(`/favorites/${room.id}`, { method: isFav ? 'DELETE' : 'POST' })
    } catch {
      // сервер не принял — откатываем
      setIds((f) => (isFav ? [...f, room.id] : f.filter((id) => id !== room.id)))
    }
  }

  return { favorites: ids, toggleFavorite: toggle }
}
