import { Link } from 'react-router-dom'
import { Logo } from './Icons.jsx'

const COLUMNS = [
  {
    title: 'Сервис',
    links: [
      ['Площадки', '/catalog'],
      ['Блог', '/blog'],
      ['О нас', '/about'],
    ],
  },
  {
    title: 'Партнёрам',
    links: [
      ['Разместить площадку', '/contacts'],
      ['Условия', '/about'],
    ],
  },
  {
    title: 'Помощь',
    links: [
      ['Контакты', '/contacts'],
      ['Правила отмены', '/about'],
      ['Вопросы и ответы', '/about'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="container-x pt-16 pb-10">
        <div className="grid gap-10 md:grid-cols-[1fr_auto_auto_auto] md:gap-24">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-[252px] text-[15px] leading-[1.45] text-on-dark-muted">
              Сервис онлайн-бронирования фотостудий, залов и коворкингов.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[15px] font-bold">{col.title}</div>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-[15px] text-on-dark transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-[#22222c] pt-6 text-[14px] text-on-dark-muted sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} SPACE</span>
          <span>Политика конфиденциальности · Оферта</span>
        </div>
      </div>
    </footer>
  )
}
