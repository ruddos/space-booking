// подписи для карточек залов, в апи таких полей нет — собираем из имеющихся

export const CATEGORIES = [
  { value: 'Фотостудия', title: 'Фотостудии', text: 'Циклорамы, дневной свет и импульсное оборудование' },
  { value: 'Залы', title: 'Залы', text: 'Для мероприятий, съёмок и мастер-классов' },
  { value: 'Коворкинги', title: 'Коворкинги', text: 'Уютные пространства для работы тебя и команды' },
]

const SINGULAR = { Фотостудия: 'Фотостудия', Залы: 'Зал', Коворкинги: 'Коворкинг' }

export const categorySingular = (category) => SINGULAR[category] || category || 'Площадка'

const has = (room, word) => room.amenities?.some((a) => a.name.toLowerCase().includes(word))

export function roomBadge(room) {
  if (room.category === 'Залы') return `Зал до ${room.capacity} гостей`
  if (room.category === 'Коворкинги') return 'Коворкинг'
  if (has(room, 'циклорам')) return 'Циклорама'
  if (has(room, 'окна') || has(room, 'дневн')) return 'Дневной свет'
  return categorySingular(room.category)
}

export function roomMeta(room) {
  const size = room.category === 'Коворкинги' ? `${room.capacity} мест` : `${room.area} м²`
  return [room.metro, size].filter(Boolean).join(' · ')
}

const text = (room) =>
  [room.description, ...(room.amenities || []).map((a) => a.name)].join(' ').toLowerCase()

// фильтры «Особенности» в каталоге — ищем по оборудованию и описанию
export const FEATURES = [
  { key: 'cyclorama', label: 'Циклорама', words: ['циклорам'] },
  { key: 'daylight', label: 'Дневной свет', words: ['дневн', 'окна'] },
  { key: 'makeup', label: 'Гримёрка', words: ['грим'] },
  { key: 'flash', label: 'Импульсный свет', words: ['импульс', 'profoto', 'godox'] },
  { key: 'parking', label: 'Парковка', words: ['парков'] },
  { key: 'pets', label: 'Можно с животными', words: ['животн'] },
]

export const hasFeature = (room, key) => {
  const f = FEATURES.find((x) => x.key === key)
  const t = text(room)
  return f.words.some((w) => t.includes(w))
}

// короткие теги на карточку каталога
const TAGS = [
  ['Циклорама', ['циклорам']],
  ['Окна', ['окна']],
  ['Гримёрка', ['грим']],
  ['Импульс', ['импульс', 'profoto', 'godox']],
  ['Дым-машина', ['дым']],
  ['Сцена', ['сцена']],
  ['Звук', ['звук']],
  ['Wi-Fi', ['wi-fi']],
  ['Кофе', ['кофе']],
]

export function roomFeatures(room) {
  const names = (room.amenities || []).map((a) => a.name.toLowerCase())
  return TAGS.filter(([, words]) => names.some((n) => words.some((w) => n.includes(w))))
    .map(([label]) => label)
    .slice(0, 3)
}

export const AREA_OPTIONS = [
  { key: 's', label: 'до 50 м²', test: (a) => a < 50 },
  { key: 'm', label: '50–100 м²', test: (a) => a >= 50 && a <= 100 },
  { key: 'l', label: '100+ м²', test: (a) => a > 100 },
]

export const SORTS = [
  { key: 'rec', label: 'Рекомендуем' },
  { key: 'cheap', label: 'Сначала дешевле' },
  { key: 'expensive', label: 'Сначала дороже' },
  { key: 'rating', label: 'По рейтингу' },
]

export function sortRooms(list, key) {
  const arr = [...list]
  if (key === 'cheap') return arr.sort((a, b) => a.price_per_hour - b.price_per_hour)
  if (key === 'expensive') return arr.sort((a, b) => b.price_per_hour - a.price_per_hour)
  if (key === 'rating') return arr.sort((a, b) => b.rating - a.rating)
  // рекомендуем: сначала со свободными окнами, потом по рейтингу и отзывам
  return arr.sort(
    (a, b) =>
      Number(b.today_available_slots.length > 0) - Number(a.today_available_slots.length > 0) ||
      b.rating * Math.log(b.reviews_count + 1) - a.rating * Math.log(a.reviews_count + 1),
  )
}

// Координаты центра Ростова-на-Дону: долгота, широта.
const ROSTOV = 'll=39.7187%2C47.2221&sspn=0.2%2C0.12&rl=1'
const withCity = (address = '') => (address.includes('Ростов-на-Дону') ? address : `Ростов-на-Дону, ${address}`)

export const mapUrl = (address) => `https://yandex.ru/map-widget/v1/?${ROSTOV}&text=${encodeURIComponent(withCity(address))}`
export const routeUrl = (address) => `https://yandex.ru/maps/?rtext=~${encodeURIComponent(withCity(address))}`
