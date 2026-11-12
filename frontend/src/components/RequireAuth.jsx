import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../utils/auth.jsx'

// страницы только для вошедших: гостя отправляем на вход и потом возвращаем обратно
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-accent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />

  return children
}
