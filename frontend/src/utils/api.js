const TOKEN_KEY = 'space_token'

// без «Запомнить меня» токен живет только до закрытия вкладки
export const getToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
export const setToken = (token, remember = true) => {
  clearToken()
  ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
}
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// обертка над fetch: подставляет токен и достает текст ошибки из detail
export async function api(path, { method = 'GET', body, params } = {}) {
  let url = '/api' + path
  if (params) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, v)
    })
    if (qs.toString()) url += '?' + qs
  }

  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Не удалось связаться с сервером. Проверь подключение и попробуй ещё раз.', 0)
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token && getToken() === token && !path.startsWith('/auth/login')) {
      clearToken()
      window.dispatchEvent(new Event('space:session-expired'))
    }
    let msg = 'Ошибка сервера'
    if (typeof data?.detail === 'string') msg = data.detail
    else if (Array.isArray(data?.detail)) msg = data.detail.map((d) => d.msg).join(', ')
    throw new ApiError(msg, res.status)
  }
  return data
}
