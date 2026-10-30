import SectionHead from './SectionHead.jsx'

const STEPS = [
  ['Найди площадку', 'Фильтры по метро, цене, площади, свету и оборудованию. Смотри фото, планировку и отзывы.'],
  ['Выбери время', 'Календарь показывает только реально свободные слоты. Добавь оборудование и оплати онлайн.'],
  ['Приходи и твори', 'Подтверждение придёт на почту, бронь появится в кабинете. Бесплатная отмена за 24 часа.'],
]

export default function HowItWorks() {
  return (
    <section className="container-x pt-24">
      <SectionHead title="Как это работает" />
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {STEPS.map(([title, text], i) => (
          <div key={title} className="rounded-[22px] border border-line bg-white p-7">
            <span className="grid size-12 place-items-center rounded-[14px] bg-accent-light text-[20px] font-extrabold text-accent-hover">
              {i + 1}
            </span>
            <h3 className="mt-5 text-[21px] font-extrabold">{title}</h3>
            <p className="mt-2 text-[16px] leading-normal text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
