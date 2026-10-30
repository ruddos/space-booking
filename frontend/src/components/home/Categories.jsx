import { plural } from '../../utils/format.js'
import { CATEGORIES } from '../../utils/rooms.js'
import { ArrowRightIcon } from '../Icons.jsx'
import SectionHead from './SectionHead.jsx'

export default function Categories({ rooms, onSelect }) {
  return (
    <section className="container-x pt-[88px]">
      <SectionHead
        title="Популярные категории"
        text="Выбери, что тебе нужно — и найди идеальное пространство"
        action={
          <button type="button" onClick={() => onSelect('')} className="text-[16px] font-bold text-accent hover:underline">
            Смотреть все →
          </button>
        }
      />

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const list = rooms.filter((r) => r.category === cat.value)
          const cover = list.find((r) => r.image_url)?.image_url
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onSelect(cat.value)}
              className="group relative h-[300px] overflow-hidden rounded-3xl bg-dark text-left"
            >
              {cover && (
                <img
                  src={cover}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <span className="absolute inset-x-0 bottom-0 h-[180px] bg-gradient-to-b from-dark/0 to-dark/95" />
              <span className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 text-white">
                <span>
                  <span className="text-[14px] font-bold text-accent-pale">
                    {list.length} {plural(list.length, ['площадка', 'площадки', 'площадок'])}
                  </span>
                  <span className="mt-1 block text-[26px] leading-tight font-extrabold">{cat.title}</span>
                  <span className="mt-1.5 block text-[15px] leading-[1.45] text-[#d8d8e2]">{cat.text}</span>
                </span>
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/30 transition-colors group-hover:bg-white group-hover:text-dark">
                  <ArrowRightIcon size={18} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
