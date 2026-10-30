import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { initials } from '../lib/format.js'
import { Logo, SearchIcon } from './Icons.jsx'

const NAV = [
  { to: '/catalog', label: 'Площадки' },
  { to: '/about', label: 'О нас' },
  { to: '/blog', label: 'Блог' },
  { to: '/contacts', label: 'Контакты' },
]

// dark — прозрачная шапка поверх темного hero на главной, иначе белая
export default function Header({ dark = false }) {
  const { user, isAdmin } = useAuth()

  return (
    <header className={dark ? 'relative z-10' : 'border-b border-line bg-white'}>
      <div className={`container-x flex items-center gap-6 ${dark ? 'h-[94px]' : 'h-[77px]'}`}>
        <Link to="/" aria-label="SPACE — на главную">
          <Logo dark={dark} />
        </Link>

        <nav className="mx-auto hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`text-[15px] transition-opacity hover:opacity-70 ${
                dark ? 'font-medium text-white' : 'font-semibold text-ink'
              }`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <a
            href="/#free-today"
            className={`hidden p-2 sm:block ${dark ? 'text-white' : 'text-ink'}`}
            aria-label="Поиск"
          >
            <SearchIcon />
          </a>

          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`hidden h-11 items-center rounded-xl border px-4 text-[15px] font-semibold sm:flex ${
                    dark ? 'border-white/40 text-white' : 'border-line text-ink'
                  }`}
                >
                  Админка
                </Link>
              )}
              <span
                title={user.full_name}
                className="grid size-11 place-items-center rounded-full bg-accent text-[16px] font-extrabold text-white"
              >
                {initials(user.full_name)}
              </span>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`flex h-[46px] items-center rounded-xl border px-[22px] text-[15px] font-semibold transition-colors ${
                  dark
                    ? 'border-white/40 text-white hover:bg-white/10'
                    : 'border-line text-ink hover:bg-bg'
                }`}
              >
                Войти
              </Link>
              <Link
                to="/login?register=1"
                className="hidden h-11 items-center rounded-xl bg-accent px-[22px] text-[15px] font-bold text-white transition-colors hover:bg-accent-hover sm:flex"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
