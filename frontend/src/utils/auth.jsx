import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken, setToken } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  useEffect(() => {
    let active = true
    const expire = () => { setUser(null); setLoading(false) }
    const sync = () => {
      if (!getToken()) return expire()
      setLoading(true)
      api('/auth/me')
        .then((u) => active && setUser(u))
        .catch((e) => { if (active && e.status === 401) expire() })
        .finally(() => active && setLoading(false))
    }
    window.addEventListener('space:session-expired', expire)
    window.addEventListener('storage', sync)
    sync()
    return () => {
      active = false
      window.removeEventListener('space:session-expired', expire)
      window.removeEventListener('storage', sync)
    }
  }, [])

  async function login(email, password, remember = true) {
    const data = await api('/auth/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password, remember } })
    setToken(data.access_token, remember)
    setUser(data.user)
    return data.user
  }

  async function register(form) {
    const data = await api('/auth/register', { method: 'POST', body: form })
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
