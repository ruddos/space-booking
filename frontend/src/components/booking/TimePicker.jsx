import { addDays, isoDate } from '../../utils/format.js'

const DAYS_AHEAD = 14
export const DURATIONS = [1, 2, 3, 4, 6]

const btnBase = 'rounded-xl border text-[15px] font-bold transition-colors'

export function hoursLabel(n) {
  if (n === 1) return '1 час'
  if (n < 5) return `${n} часа`
  return `${n} часов`
}

// сколько часов подряд свободно, начиная со слота index
export function freeRun(slots, index) {
  let n = 0
  for (let i = index; i < slots.length && slots[i].is_available; i++) n++
  return n
}

export function DayPicker({ value, onChange }) {
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i))
  const month = new Date(value + 'T00:00').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold">Дата</h2>
        <span className="text-[15px] font-bold capitalize">{month.replace(' г.', '')}</span>
      </div>
      <div className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {days.map((d) => {
          const iso = isoDate(d)
          const on = iso === value
          const wd = d.toLocaleDateString('ru-RU', { weekday: 'short' })
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(iso)}
              aria-pressed={on}
              className={`h-[68px] w-[calc((100%-48px)/7)] min-w-[72px] shrink-0 snap-start ${btnBase} ${
                on ? 'border-accent bg-accent text-white' : 'border-line bg-white hover:border-accent'
              }`}
            >
              <span className={`block text-[13px] font-semibold capitalize ${on ? '' : 'text-ink'}`}>{wd}</span>
              <span className="block text-[20px] font-extrabold">{d.getDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SlotPicker({ slots, loading, start, duration, onStart, onDuration }) {
  const startIndex = slots.findIndex((s) => s.time === start)
  const maxRun = startIndex >= 0 ? freeRun(slots, startIndex) : 0

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-extrabold">Время начала</h2>
        <div className="flex gap-4 text-[13px] text-muted">
          <span className="flex items-center gap-1.5">
            <i className="size-3.5 rounded border border-[#c9c9d6]" /> свободно
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-3 rounded bg-accent" /> выбрано
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-3 rounded bg-[#e6e6ec]" /> занято
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
        {loading && <span className="col-span-full py-3 text-muted">Загружаем расписание…</span>}
        {!loading && slots.length === 0 && (
          <span className="col-span-full py-3 text-muted">В этот день площадка не работает — выбери другую дату</span>
        )}
        {!loading &&
          slots.map((s, i) => {
            const selected = i === startIndex
            const inRange = startIndex >= 0 && i > startIndex && i < startIndex + duration
            return (
              <button
                key={s.time}
                type="button"
                disabled={!s.is_available}
                onClick={() => onStart(s.time)}
                className={`h-[46px] ${btnBase} ${
                  !s.is_available
                    ? 'cursor-not-allowed border-[#e6e6ec] bg-[#e6e6ec] text-[#8a8a9c]'
                    : selected
                      ? 'border-accent bg-accent text-white'
                      : inRange
                        ? 'border-accent-pale bg-accent-light text-accent-hover'
                        : 'border-line bg-white hover:border-accent'
                }`}
              >
                {s.time}
              </button>
            )
          })}
      </div>

      <h2 className="mt-8 text-[20px] font-extrabold">Длительность</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {DURATIONS.map((h) => {
          const on = h === duration
          const disabled = startIndex >= 0 && h > maxRun
          return (
            <button
              key={h}
              type="button"
              disabled={disabled}
              onClick={() => onDuration(h)}
              title={disabled ? 'Дальше время занято или площадка закрывается' : undefined}
              className={`h-[46px] px-4 ${btnBase} ${
                on
                  ? 'border-accent bg-accent-light text-accent-hover'
                  : disabled
                    ? 'cursor-not-allowed border-line bg-white text-[#b5b5c3]'
                    : 'border-line bg-white hover:border-accent'
              }`}
            >
              {hoursLabel(h)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
