import { formatPrice } from '../../utils/format.js'
import { CheckIcon } from '../Icons.jsx'

export default function ServicePicker({ services, value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => {
        const on = value.includes(s.id)
        return (
          <label
            key={s.id}
            className={`flex cursor-pointer items-start gap-3.5 rounded-[14px] border p-4 transition-colors ${
              on ? 'border-accent bg-[#f7f6ff]' : 'border-line bg-white hover:border-[#c9c9d6]'
            }`}
          >
            <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="sr-only" />
            <span
              className={`mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-[7px] border ${
                on ? 'border-accent bg-accent text-white' : 'border-[#c9c9d6] bg-white'
              }`}
            >
              {on && <CheckIcon size={14} strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] leading-snug font-bold">{s.name}</span>
              {s.description && <span className="mt-1 block text-[13px] text-muted">{s.description}</span>}
            </span>
            <span className="shrink-0 text-[15px] font-extrabold whitespace-nowrap">
              +{formatPrice(s.price)}
              {s.is_per_hour && <span className="text-[13px] font-semibold text-muted">/ч</span>}
            </span>
          </label>
        )
      })}
    </div>
  )
}
