import { useState } from 'react'
import { addDays, isoDate } from '../../utils/format.js'
import RangeTimePicker from './RangeTimePicker.jsx'

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
        <label className="text-[15px] font-bold">
          <span className="sr-only">Дата бронирования</span>
          <input type="date" aria-label="Дата бронирования" value={value} min={isoDate()}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="rounded-lg border border-line bg-white p-2" />
        </label>
      </div>
      <p className="mt-2 text-[14px] capitalize text-muted">{month.replace(' г.', '')}</p>
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

export function SlotPicker({ slots, loading, start, duration, onStart, onDuration, onRange }) {
  const [selection, setSelection] = useState(0)
  const startIndex = slots.findIndex((s) => s.time === start)
  const maxRun = startIndex >= 0 ? freeRun(slots, startIndex) : 0

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-extrabold">Время аренды</h2>
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

      <RangeTimePicker key={selection} slots={slots} loading={loading} start={start} duration={duration}
        onChange={(time, hours) => { if (onRange) onRange(time, hours); else { onStart(time); onDuration(hours) } }} />

      <h2 className="mt-8 text-[20px] font-extrabold">Длительность</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {[...new Set([...DURATIONS, duration])].filter((h) => h > 0).sort((a, b) => a - b).map((h) => {
          const on = h === duration
          const disabled = startIndex >= 0 && h > maxRun
          return (
            <button
              key={h}
              type="button"
              disabled={disabled}
              onClick={() => { onDuration(h); setSelection((n) => n + 1) }}
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
