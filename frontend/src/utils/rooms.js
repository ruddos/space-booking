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
