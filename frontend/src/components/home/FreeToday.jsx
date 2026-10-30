import { Link } from 'react-router-dom'
import RoomCard from '../RoomCard.jsx'
import SectionHead from './SectionHead.jsx'

function Skeleton() {
  return <div className="h-[365px] animate-pulse rounded-[22px] border border-line bg-white" />
}

export default function FreeToday({ rooms, loading, error, filtered, onReset, favorites, onFavorite }) {
  return (
    <section id="free-today" className="container-x scroll-mt-6 pt-[88px]">
      <SectionHead
        title={filtered ? 'Результаты поиска' : 'Свободно сегодня'}
        text={
          filtered
            ? `Нашли площадок: ${rooms.length}`
            : 'Ближайшие окна в студиях Москвы — бронь без звонков и переписок'
        }
        action={
          filtered ? (
            <button type="button" onClick={onReset} className="text-[16px] font-bold text-accent hover:underline">
              Сбросить фильтры
            </button>
          ) : (
            <Link to="/catalog" className="text-[16px] font-bold text-accent hover:underline">
              Все площадки →
            </Link>
          )
        }
      />

      {error && (
        <p className="mt-6 rounded-2xl bg-danger-light px-5 py-4 text-[15px] font-semibold text-danger">
          Не удалось загрузить площадки: {error}
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} />)
          : rooms.map((room) => (
              <RoomCard key={room.id} room={room} favorite={favorites.includes(room.id)} onFavorite={onFavorite} />
            ))}
      </div>

      {!loading && !error && rooms.length === 0 && (
        <div className="mt-6 rounded-[22px] border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="text-[18px] font-extrabold">Ничего не нашлось</p>
          <p className="mt-1 text-[15px] text-muted">Попробуй убрать часть фильтров</p>
        </div>
      )}
    </section>
  )
}
