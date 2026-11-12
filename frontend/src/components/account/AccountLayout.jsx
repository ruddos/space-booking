import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { useAuth } from '../../utils/auth.jsx'
import { initials } from '../../utils/format.js'
import { BellIcon, HeartIcon, LogoutIcon, ReceiptIcon, TicketIcon, UserIcon } from '../Icons.jsx'
import PageLayout from '../PageLayout.jsx'

const NAV = [
  { to: '/account', label: 'Мои бронирования', icon: TicketIcon, end: true },
  { to: '/account/favorites', label: 'Избранное', icon: HeartIcon },
  { to: '/account/payments', label: 'Чеки и оплаты', icon: ReceiptIcon },
  { to: '/account/profile', label: 'Профиль', icon: UserIcon },
  { to: '/account/notifications', label: 'Уведомления', icon: BellIcon },
]

export default function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  // счетчик непрочитанных обновляем при переходах по кабинету
  useEffect(() => {
    api('/notifications')
      .then((list) => setUnread(list.filter((n) => !n.is_read).length))
      .catch(() => setUnread(0))
  }, [location.pathname])

  function exit() {
    logout()
    navigate('/')
  }

  return (
    <PageLayout>
      <div className="container-x grid gap-6 pt-8 pb-24 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center gap-3.5 rounded-[22px] border border-line bg-white p-[22px]">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent-light text-[20px] font-extrabold text-accent-hover">
              {initials(user.full_name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[17px] font-extrabold">{user.full_name}</span>
              <span className="block text-[14px] text-muted">
                Клиент с {new Date(user.created_at).getFullYear()} года
              </span>
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
                {to.endsWith('notifications') && unread > 0 && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[12px] font-bold text-white">
                    {unread}
                  </span>
                )}
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

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  )
}
