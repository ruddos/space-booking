import { initials } from '../../utils/format.js'
import { StarIcon } from '../Icons.jsx'
import SectionHead from './SectionHead.jsx'

const REVIEWS = [
  {
    name: 'Анна К.',
    role: 'Фотограф',
    text: 'Нашла студию на вечер за пять минут, а не за два дня переписок. Слоты на сайте совпали с реальностью — это главное.',
  },
  {
    name: 'Дмитрий С.',
    role: 'Организатор мероприятий',
    text: 'Бронируем залы под мастер-классы каждый месяц. Удобно, что все брони и чеки лежат в одном кабинете.',
  },
  {
    name: 'Мария Л.',
    role: 'Видеограф',
    text: 'Фильтр по свету и оборудованию экономит кучу времени: сразу видно, где есть циклорама и гримёрка.',
  },
]

export default function Reviews() {
  return (
    <section className="container-x pt-24 pb-24">
      <SectionHead title="Отзывы клиентов" />
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {REVIEWS.map((r) => (
          <figure key={r.name} className="flex flex-col rounded-[22px] border border-line bg-white p-7">
            <div className="flex gap-0.5 text-star">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon key={i} size={18} />
              ))}
            </div>
            <blockquote className="mt-4 text-[17px] leading-[1.5]">{r.text}</blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-6">
              <span className="grid size-11 place-items-center rounded-full bg-accent-light text-[16px] font-extrabold text-accent-hover">
                {initials(r.name)}
              </span>
              <span>
                <span className="block text-[16px] font-bold">{r.name}</span>
                <span className="block text-[14px] text-muted">{r.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
