import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../utils/auth.jsx'
import { initials } from '../../utils/format.js'
import { BuildingIcon, GridIcon, LogoutIcon, Logo, TicketIcon } from '../Icons.jsx'

const NAV = [
  { to: '/admin', label: 'Сводка', icon: GridIcon, end: true },
  { to: '/admin/bookings', label: 'Бронирования', icon: TicketIcon },
  { to: '/admin/rooms', label: 'Площадки', icon: BuildingIcon },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function exit() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="container-x flex h-[77px] items-center gap-4">
          <Link to="/admin">
            <Logo />
          </Link>
          <span className="rounded-lg bg-accent-light px-2.5 py-1 text-[13px] font-bold text-accent-hover">Админ-панель</span>
          <Link to="/" className="ml-auto text-[15px] font-semibold hover:text-accent">
            На сайт →
          </Link>
          <span
            title={user.full_name}
            className="grid size-11 place-items-center rounded-full bg-accent text-[16px] font-extrabold text-white"
          >
            {initials(user.full_name)}
          </span>
        </div>
      </header>

      <div className="container-x grid gap-6 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="flex items-center gap-3.5 rounded-[22px] border border-line bg-white p-[22px]">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent-light text-[20px] font-extrabold text-accent-hover">
              {initials(user.full_name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[17px] font-extrabold">{user.full_name}</span>
              <span className="block truncate text-[14px] text-muted">{user.email}</span>
            </span>
          </div>

          <nav className="flex gap-1 overflow-x-auto rounded-[22px] border border-line bg-white p-2 lg:flex-col">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-3 rounded-[14px] px-3.5 py-3.5 text-[15px] font-semibold transition-colors ${
                    isActive ? 'bg-accent-light text-accent-hover' : 'hover:bg-bg'
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={exit}
              className="flex shrink-0 items-center gap-3 rounded-[14px] px-3.5 py-3.5 text-[15px] font-semibold text-danger transition-colors hover:bg-danger-light"
            >
              <LogoutIcon size={20} />
              Выйти
            </button>
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
