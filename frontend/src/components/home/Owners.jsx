import { Link } from 'react-router-dom'
import { CheckIcon } from '../Icons.jsx'

const BENEFITS = [
  'Календарь занятости синхронизируется с Google и Яндекс',
  'Предоплата онлайн — меньше неявок',
  'Комиссия только с состоявшихся броней',
]

export default function Owners() {
  return (
    <section className="container-x pt-24">
      <div className="grid items-center gap-10 rounded-[32px] bg-dark p-8 text-white md:p-14 lg:grid-cols-[1fr_564px]">
        <div>
          <span className="text-[14px] font-bold tracking-wide text-accent-pale uppercase">Для владельцев</span>
          <h2 className="mt-3 max-w-[502px] text-[34px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-[44px]">
            Сдаёшь студию? Размести её на SPACE
          </h2>
          <p className="mt-4 max-w-[526px] text-[17px] leading-[1.45] text-on-dark">
            Онлайн-календарь, оплата и напоминания клиентам — мы берём рутину на себя, а ты занимаешься площадкой.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/contacts"
              className="rounded-[14px] bg-accent px-6 py-[15px] text-[16px] font-bold transition-colors hover:bg-accent-hover"
            >
              Разместить площадку
            </Link>
            <Link
              to="/about"
              className="rounded-[14px] border border-[#3a3a48] px-6 py-[15px] text-[16px] font-bold transition-colors hover:bg-white/5"
            >
              Узнать условия
            </Link>
          </div>
        </div>

        <ul className="space-y-3">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-3.5 rounded-2xl bg-dark-2 px-5 py-[18px] text-[16px]">
              <CheckIcon size={22} className="shrink-0 text-mint" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
