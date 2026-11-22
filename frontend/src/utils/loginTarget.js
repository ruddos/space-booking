// Возвращаем клиента к начатой брони, админа — в панель управления.
export function loginTarget(user, from) {
  const internal = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.includes('\\')
  if (user.role === 'admin') return internal && /^\/admin(?:\/|$)/.test(from) ? from : '/admin'
  return internal && !/^\/(admin|login)(?:\/|\?|$)/.test(from) ? from : '/account'
}
