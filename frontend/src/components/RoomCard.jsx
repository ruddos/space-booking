import { Link } from 'react-router-dom'
import { formatPrice, isoDate } from '../utils/format.js'
import { roomBadge, roomFeatures, roomMeta } from '../utils/rooms.js'
import { HeartIcon, StarIcon } from './Icons.jsx'

function Slot({ time }) {
  return <span className="rounded-lg bg-accent-light px-2.5 py-1.5 text-[13px] font-bold text-accent-hover">{time}</span>
}

// catalog — карточка для каталога: с оборудованием и числом отзывов
export default function RoomCard({ room, favorite = false, onFavorite, catalog = false, date = isoDate() }) {
  const slots = room.today_available_slots || []
  const day = date === isoDate() ? 'Сегодня' : new Date(date + 'T00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const roomUrl = `/rooms/${room.id}?date=${date}`

  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border border-line bg-white transition-shadow hover:shadow-[0_12px_32px_rgba(15,15,20,0.08)]">
      <div className={`relative bg-line-soft ${catalog ? 'h-[200px]' : 'h-[190px]'}`}>
        <Link to={roomUrl} className="block size-full" tabIndex={-1}>
          {room.image_url && <img src={room.image_url} alt={room.name} loading="lazy" className="size-full object-cover" />}
        </Link>
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
          <h3 className="truncate text-[18px] font-extrabold">
            <Link to={roomUrl} className="hover:text-accent">
              {room.name}
            </Link>
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-[14px] font-bold">
            <StarIcon size={14} className="text-star" />
            {room.reviews_count > 0 ? Number(room.rating).toLocaleString('ru-RU') : 'Нет оценок'}
            {catalog && <span className="font-medium text-muted">({room.reviews_count})</span>}
          </span>
        </div>
        <p className="mt-1 text-[14px] text-muted">{roomMeta(room)}</p>

        {catalog && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {roomFeatures(room).map((f) => (
              <span key={f} className="rounded-lg bg-[#f2f2f6] px-2 py-1 text-[13px] font-semibold">
                {f}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex min-h-[30px] flex-wrap items-center gap-1.5">
          {slots.length ? (
            <>
              <span className="mr-0.5 text-[13px] font-bold text-success">{day}:</span>
              {slots.slice(0, 3).map((t) => (
                <Slot key={t} time={t} />
              ))}
            </>
          ) : (
            <span className="py-1.5 text-[13px] font-semibold text-muted">На эту дату свободных окон нет</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line-soft pt-3.5">
          <span className="text-[17px] font-extrabold">
            {formatPrice(room.price_per_hour)} <span className="text-[14px] font-medium text-muted">/ час</span>
          </span>
          <Link to={roomUrl} className="text-[14px] font-bold text-accent-hover hover:underline">
            {catalog ? 'Подробнее →' : 'Выбрать →'}
          </Link>
        </div>
      </div>
    </article>
  )
}
