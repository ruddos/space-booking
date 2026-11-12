import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTitle from '../../components/admin/PageTitle.jsx'
import RoomCard from '../../components/RoomCard.jsx'
import { api } from '../../utils/api.js'

export default function Favorites() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // в /favorites нет свободных слотов, поэтому берем залы из общего списка
    Promise.all([api('/favorites'), api('/rooms')])
      .then(([fav, all]) => setRooms(all.filter((r) => fav.some((f) => f.id === r.id))))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [])

  async function remove(room) {
    setRooms((list) => list.filter((r) => r.id !== room.id))
    await api(`/favorites/${room.id}`, { method: 'DELETE' }).catch(() => setRooms((list) => [...list, room]))
  }

  return (
    <div>
      <PageTitle title="Избранное" text={rooms.length ? `Сохранённых площадок: ${rooms.length}` : undefined} />

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((r) => (
          <RoomCard key={r.id} room={r} catalog favorite onFavorite={remove} />
        ))}
      </div>

      {!loading && rooms.length === 0 && (
        <div className="mt-6 rounded-[22px] border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="text-[18px] font-extrabold">Здесь пока пусто</p>
          <p className="mt-1 text-[15px] text-muted">Нажимай на сердечко на карточке площадки, чтобы сохранить её</p>
          <Link to="/catalog" className="mt-4 inline-block font-bold text-accent hover:underline">
            Перейти в каталог →
          </Link>
        </div>
      )}
    </div>
  )
}
