import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../utils/format.js'
import { mapUrl } from '../../utils/rooms.js'
import { StarIcon } from '../Icons.jsx'

// вид «На карте»: список слева, карта Яндекса по адресу выбранной площадки
export default function MapView({ rooms }) {
  const [activeId, setActiveId] = useState(null)
  const active = rooms.find((r) => r.id === activeId) || rooms[0]

  if (!rooms.length) return null

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <ul className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
        {rooms.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setActiveId(r.id)}
              className={`flex w-full gap-3 rounded-2xl border bg-white p-2.5 text-left transition-colors ${
                r.id === active.id ? 'border-accent ring-2 ring-accent/15' : 'border-line hover:border-[#c9c9d6]'
              }`}
            >
              <img src={r.image_url} alt="" className="size-[72px] shrink-0 rounded-xl bg-line-soft object-cover" />
              <span className="min-w-0 py-0.5">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[16px] font-extrabold">{r.name}</span>
                  <span className="flex items-center gap-0.5 text-[13px] font-bold">
                    <StarIcon size={12} className="text-star" />
                    {r.rating}
                  </span>
                </span>
                <span className="block truncate text-[13px] text-muted">{r.address}</span>
                <span className="mt-1 block text-[14px] font-extrabold">
                  {formatPrice(r.price_per_hour)} <span className="font-medium text-muted">/ час</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="relative min-h-[420px] overflow-hidden rounded-[22px] border border-line bg-[#e9e9f0]">
        <iframe
          key={active.id}
          title={`Карта: ${active.name}`}
          src={mapUrl(active.address)}
          className="absolute inset-0 size-full"
          loading="lazy"
        />
        <Link
          to={`/rooms/${active.id}`}
          className="absolute right-4 bottom-4 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-bold text-white shadow-lg hover:bg-accent-hover"
        >
          {active.name} — подробнее →
        </Link>
      </div>
    </div>
  )
}
