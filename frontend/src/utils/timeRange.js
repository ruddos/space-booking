export const minutes = (time) => {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export const clockTime = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`

// Конец интервала не занимает следующий час: 17–20 — это три часа.
export function canSelectRange(slots, start, end) {
  const from = minutes(start)
  const to = minutes(end)
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || (to - from) % 60) return false
  for (let t = from; t < to; t += 60) {
    if (!slots.some((s) => minutes(s.time) === t && s.is_available)) return false
  }
  return true
}

export function timeBoundaries(slots) {
  if (!slots.length) return []
  return [...new Set(slots.flatMap((s) => [s.time, clockTime(minutes(s.time) + 60)]))]
    .sort((a, b) => minutes(a) - minutes(b))
}
