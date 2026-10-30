import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/format.js'
import { roomBadge, roomMeta } from '../utils/rooms.js'
import { HeartIcon, StarIcon } from './Icons.jsx'

export default function RoomCard({ room, favorite = false, onFavorite }) {
  const slots = room.today_available_slots || []

  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border border-line bg-white transition-shadow hover:shadow-[0_12px_32px_rgba(15,15,20,0.08)]">
      <div className="relative h-[190px] bg-line-soft">
        {room.image_url && (
          <img src={room.image_url} alt={room.name} loading="lazy" className="size-full object-cover" />
        )}
        <span className="absolute top-3 left-3 rounded-[15px] bg-white px-2.5 py-1.5 text-[13px] font-bold">
          {roomBadge(room)}
        </span>
        <button
          type="button"
          onClick={() => onFavorite?.(room)}
          aria-label={favorite ? 'Убрать из избранного' : 'В избранное'}
          aria-pressed={favorite}
          className={`absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 transition-colors ${
            favorite ? 'text-danger' : 'text-ink hover:text-danger'
          }`}
        >
          <HeartIcon size={18} className={favorite ? 'fill-current' : ''} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-[18px]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-[18px] font-extrabold">{room.name}</h3>
          <span className="flex items-center gap-1 text-[14px] font-bold">
            <StarIcon size={14} className="text-star" />
            {room.rating}
          </span>
        </div>
        <p className="mt-1 text-[14px] text-muted">{roomMeta(room)}</p>

        <div className="mt-3 flex min-h-[30px] flex-wrap gap-1.5">
          {slots.length ? (
            slots.slice(0, 3).map((t) => (
              <span key={t} className="rounded-lg bg-accent-light px-2.5 py-1.5 text-[13px] font-bold text-accent-hover">
                {t}
              </span>
            ))
          ) : (
            <span className="py-1.5 text-[13px] font-semibold text-muted">Сегодня свободных окон нет</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line-soft pt-3.5">
          <span className="text-[17px] font-extrabold">
            {formatPrice(room.price_per_hour)} <span className="text-[14px] font-medium text-muted">/ час</span>
          </span>
          <Link to={`/rooms/${room.id}`} className="text-[14px] font-bold text-accent-hover hover:underline">
            Выбрать →
          </Link>
        </div>
      </div>
    </article>
  )
}
