import test from 'node:test'
import assert from 'node:assert/strict'
import { api, clearToken, getToken, setToken } from '../src/utils/api.js'
import { loginTarget } from '../src/utils/loginTarget.js'

class Storage {
  values = new Map()
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, value) }
  removeItem(key) { this.values.delete(key) }
}
globalThis.localStorage = new Storage()
globalThis.sessionStorage = new Storage()
globalThis.window = new EventTarget()

test('смена аккаунта не оставляет старый токен в другом хранилище', () => {
  setToken('admin-token', true)
  setToken('client-token', false)
  assert.equal(getToken(), 'client-token')
  assert.equal(localStorage.getItem('space_token'), null)
  setToken('another-token', true)
  assert.equal(sessionStorage.getItem('space_token'), null)
  clearToken()
  assert.equal(getToken(), null)
})

test('клиент и администратор попадают в свои разделы', () => {
  const client = { role: 'client' }
  const admin = { role: 'admin' }
  assert.equal(loginTarget(client), '/account')
  assert.equal(loginTarget(admin), '/admin')
  assert.equal(loginTarget(client, '/admin/bookings'), '/account')
  assert.equal(loginTarget(admin, '/admin/bookings'), '/admin/bookings')
  assert.equal(loginTarget(client, '/booking/1?date=2026-12-01'), '/booking/1?date=2026-12-01')
  for (const from of ['//other.example', '/\\other.example', 'https://other.example', '/login']) {
    assert.equal(loginTarget(client, from), '/account')
  }
})

test('API передаёт дату, тело запроса и токен', async () => {
  setToken('client-token')
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/rooms?date=2026-12-01')
    assert.equal(options.headers.Authorization, 'Bearer client-token')
    return new Response('[]', { status: 200 })
  }
  assert.deepEqual(await api('/rooms', { params: { date: '2026-12-01', category: '' } }), [])
  clearToken()
})

test('истёкшая сессия очищается и сообщает интерфейсу о выходе', async () => {
  setToken('expired')
  let expired = false
  window.addEventListener('space:session-expired', () => { expired = true }, { once: true })
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'Сессия истекла' }), { status: 401 })
  await assert.rejects(api('/bookings/my'), { message: 'Сессия истекла', status: 401 })
  assert.equal(getToken(), null)
  assert.equal(expired, true)
})

test('ответ старого запроса не сбрасывает новую сессию', async () => {
  setToken('old')
  globalThis.fetch = async () => {
    setToken('new')
    return new Response(JSON.stringify({ detail: 'Старый токен истёк' }), { status: 401 })
  }
  await assert.rejects(api('/bookings/my'))
  assert.equal(getToken(), 'new')
  clearToken()
})

test('ошибка сети объясняется пользователю без удаления сессии', async () => {
  setToken('valid')
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  await assert.rejects(api('/bookings/my'), { status: 0 })
  assert.equal(getToken(), 'valid')
  clearToken()
})
