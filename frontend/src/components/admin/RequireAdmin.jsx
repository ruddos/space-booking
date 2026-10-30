import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../utils/auth.jsx'

export default function RequireAdmin({ children }) {
  const { user, isAdmin, loading, logout } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-accent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <h1 className="h2">Нет доступа</h1>
          <p className="mt-2 text-[17px] text-muted">Админ-панель доступна только администраторам.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/" className="rounded-xl bg-accent px-5 py-3 font-bold text-white">
              На главную
            </Link>
            <button onClick={logout} className="rounded-xl border border-line bg-white px-5 py-3 font-bold">
              Сменить аккаунт
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
