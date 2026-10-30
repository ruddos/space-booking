import { CATEGORIES } from '../../utils/rooms.js'
import { CalendarIcon, ChevronDownIcon, ClockIcon, FilterIcon, PinIcon, SearchIcon } from '../Icons.jsx'

export const TIME_OPTIONS = [
  { value: '', label: 'Любое' },
  { value: 'morning', label: 'Утро, до 12:00' },
  { value: 'day', label: 'День, 12:00–17:00' },
  { value: 'evening', label: 'Вечер, после 17:00' },
]

export const QUICK_FILTERS = [
  { key: 'cyclorama', label: 'Циклорама', params: { search: 'циклорам' } },
  { key: 'daylight', label: 'Дневной свет', params: { search: 'дневн' } },
  { key: 'makeup', label: 'Гримёрка', params: { search: 'гримёр' } },
  { key: 'cheap', label: 'До 3 000 ₽/час', params: { max_price: 3000 } },
  { key: 'free', label: 'Свободно сегодня', params: { only_available_today: true } },
]

function Field({ icon, label, children, divider = true }) {
  return (
    <label
      className={`relative flex h-[62px] items-center gap-3 px-4 lg:px-5 ${
        divider ? 'border-line lg:border-l' : ''
      }`}
    >
      <span className="shrink-0 text-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-muted">{label}</span>
        {children}
      </span>
    </label>
  )
}

function Select({ value, onChange, options }) {
  return (
    <span className="relative block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-[15px] font-bold text-ink outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={14} className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-muted" />
    </span>
  )
}

export default function SearchBar({ filters, onChange, onSubmit }) {
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')

  function submit(e) {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-1 gap-1 rounded-[22px] bg-white p-[10px] text-ink sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_246px] lg:gap-0"
    >
      <Field icon={<PinIcon size={22} />} label="Город" divider={false}>
        <Select value="msk" onChange={() => {}} options={[{ value: 'msk', label: 'Москва' }]} />
      </Field>
      <Field icon={<CalendarIcon size={22} />} label="Дата">
        <span className="block text-[15px] font-bold">Сегодня, {today}</span>
      </Field>
      <Field icon={<ClockIcon size={22} />} label="Время">
        <Select value={filters.time} onChange={(time) => onChange({ ...filters, time })} options={TIME_OPTIONS} />
      </Field>
      <Field icon={<FilterIcon size={22} />} label="Тип пространства">
        <Select
          value={filters.category}
          onChange={(category) => onChange({ ...filters, category })}
          options={[{ value: '', label: 'Любой' }, ...CATEGORIES.map((c) => ({ value: c.value, label: c.title }))]}
        />
      </Field>
      <button
        type="submit"
        className="flex h-[62px] items-center justify-center gap-2 rounded-[14px] bg-accent text-[16px] font-bold text-white transition-colors hover:bg-accent-hover sm:col-span-2 lg:col-span-1"
      >
        <SearchIcon size={20} />
        Найти
      </button>
    </form>
  )
}
