import { createContext, useContext, useEffect, useState } from 'react'
import { api, clearToken, getToken, setToken } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return
    api('/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(data.access_token)
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
