import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../utils/auth.jsx'
import { initials } from '../utils/format.js'
import { HeartIcon, Logo, MenuIcon, SearchIcon, XIcon } from './Icons.jsx'

const NAV = [
  { to: '/catalog', label: 'Площадки' },
  { to: '/about', label: 'О нас' },
  { to: '/blog', label: 'Блог' },
  { to: '/contacts', label: 'Контакты' },
]

// dark — прозрачная шапка поверх темного hero (главная, о нас), иначе белая
export default function Header({ dark = false }) {
  const { user, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)

  const linkCls = ({ isActive }) =>
    `text-[15px] transition-opacity hover:opacity-70 ${
      dark
        ? `font-medium ${isActive ? 'text-accent-soft' : 'text-white'}`
        : `font-semibold ${isActive ? 'text-accent' : 'text-ink'}`
    }`

  const iconCls = `hidden p-2 transition-opacity hover:opacity-70 sm:block ${dark ? 'text-white' : 'text-ink'}`

  return (
    <header className={dark ? 'relative z-20' : 'relative z-20 border-b border-line bg-white'}>
      <div className={`container-x flex items-center gap-6 ${dark ? 'h-[94px]' : 'h-[77px]'}`}>
        <Link to="/" aria-label="SPACE — на главную">
          <Logo dark={dark} />
        </Link>

        <nav className="mx-auto hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkCls}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <Link to="/catalog" className={iconCls} aria-label="Поиск площадок">
            <SearchIcon size={22} />
          </Link>

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
              <Link to="/account/favorites" className={iconCls} aria-label="Избранное">
                <HeartIcon size={22} />
              </Link>
              <Link
                to="/account"
                title={`${user.full_name} — личный кабинет`}
                className={`grid size-11 place-items-center rounded-full text-[16px] font-extrabold ${
                  dark ? 'bg-accent text-white' : 'bg-accent-light text-accent-hover'
                }`}
              >
                {initials(user.full_name)}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`flex h-[46px] items-center rounded-xl border px-[22px] text-[15px] font-semibold transition-colors ${
                  dark ? 'border-white/40 text-white hover:bg-white/10' : 'border-line text-ink hover:bg-bg'
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

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`p-1 md:hidden ${dark ? 'text-white' : 'text-ink'}`}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
          >
            {open ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className={`container-x flex flex-col gap-1 pb-4 md:hidden ${dark ? '' : 'border-t border-line pt-3'}`}
          onClick={() => setOpen(false)}
        >
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={(s) => `${linkCls(s)} py-2.5`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
