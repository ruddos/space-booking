import { useState } from 'react'
import { canSelectRange, clockTime, minutes, timeBoundaries } from '../../utils/timeRange.js'

// Общий выбор интервала для страницы зала и оформления брони.
export default function RangeTimePicker({ slots, loading, start, duration, onChange, compact = false }) {
  const [pickingEnd, setPickingEnd] = useState(false)
  const end = start ? clockTime(minutes(start) + duration * 60) : ''
  const boundaries = timeBoundaries(slots)

  function select(time) {
    if (pickingEnd && start && minutes(time) > minutes(start)) {
      if (!canSelectRange(slots, start, time)) return
      onChange(start, (minutes(time) - minutes(start)) / 60)
      setPickingEnd(false)
    } else {
      onChange(time, 0)
      setPickingEnd(true)
    }
  }

  return (
    <div>
      <p className="mt-2 text-[14px] text-muted">
        {pickingEnd && start ? 'Теперь выбери время окончания аренды.' : 'Первый клик — начало, второй — окончание аренды.'}
      </p>
      <div className={`mt-3 grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-8'}`}>
        {loading ? <p role="status" className="col-span-full py-3 text-muted">Загружаем расписание…</p>
          : !slots.length ? <p className="col-span-full py-3 text-muted">В этот день площадка не работает</p>
          : boundaries.map((time) => {
            const freeStart = slots.some((s) => s.time === time && s.is_available)
            const possibleEnd = pickingEnd && start && canSelectRange(slots, start, time)
            const disabled = pickingEnd && start && minutes(time) > minutes(start) ? !possibleEnd : !freeStart
            const selected = Boolean(start && (pickingEnd ? time === start : minutes(time) >= minutes(start) && minutes(time) <= minutes(end)))
            const endpoint = !pickingEnd && duration > 0 && selected && time === end
            return (
              <button key={time} type="button" disabled={loading || disabled} onClick={() => select(time)}
                aria-pressed={selected} aria-label={`${time}${endpoint ? ', окончание аренды' : ''}${disabled ? ', недоступно' : ''}`}
                title={possibleEnd && !freeStart ? `Можно закончить аренду в ${time}` : disabled ? 'Время недоступно' : endpoint ? 'Окончание аренды' : undefined}
                className={`${compact ? 'h-10 rounded-[10px] text-[14px]' : 'h-[46px] rounded-xl text-[15px]'} border font-bold transition-colors ${
                  selected ? 'border-accent bg-accent text-white' : disabled ? 'cursor-not-allowed border-line bg-[#e6e6ec] text-[#8a8a9c]' : 'border-line bg-white hover:border-accent'
                }`}>{time}</button>
            )
          })}
      </div>
      {start && !loading && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[14px]">
          <p role="status" className="font-bold text-accent-hover">{pickingEnd ? `Начало: ${start}. Выбери окончание` : `${start} – ${end} · ${duration} ч`}</p>
          <button type="button" onClick={() => { onChange('', 1); setPickingEnd(false) }} className="font-semibold text-muted hover:text-ink">Сбросить</button>
        </div>
      )}
    </div>
  )
}
