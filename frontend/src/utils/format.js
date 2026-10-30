export const formatPrice = (n) => `${Number(n || 0).toLocaleString('ru-RU')} ₽`

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

export function formatDate(iso, opts = { day: 'numeric', month: 'short' }) {
  return new Date(iso).toLocaleDateString('ru-RU', opts)
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

// "Сб, 24 окт · 12:00 – 14:00"
export function formatSlot(start, end) {
  const d = new Date(start).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${d[0].toUpperCase() + d.slice(1)} · ${formatTime(start)} – ${formatTime(end)}`
}

// склонение: plural(5, ['площадка', 'площадки', 'площадок'])
export function plural(n, forms) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}
