import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../components/Icons.jsx'
import { useAuth } from '../utils/auth.jsx'

const inputCls =
  'h-12 w-full rounded-xl border border-line bg-white px-4 text-[15px] outline-none transition-colors placeholder:text-muted/70 focus:border-accent'

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold">{label}</span>
      <input className={inputCls} {...props} />
    </label>
  )
}

export default function Login() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const isRegister = params.has('register')

  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  // уже вошли — нечего тут делать
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const u = isRegister
        ? await register({ ...form, phone: form.phone || null })
        : await login(form.email, form.password)
      const back = location.state?.from
      navigate(back || (u.role === 'admin' ? '/admin' : '/'), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function switchTab(register) {
    setError('')
    setParams(register ? { register: '1' } : {})
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-dark lg:block">
        <img
          src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/30 to-dark/10" />
        <Link to="/" className="absolute top-8 left-10">
          <Logo dark />
        </Link>
        <p className="absolute right-10 bottom-12 left-10 max-w-[460px] text-[34px] leading-[1.15] font-extrabold tracking-[-0.02em] text-white">
          Бронируй студии без звонков и переписок
        </p>
      </div>

      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Link to="/" className="lg:hidden">
          <Logo />
        </Link>

        <div className="m-auto w-full max-w-[400px] py-10">
          <div className="grid grid-cols-2 rounded-xl bg-white p-1 ring-1 ring-line">
            {[
              [false, 'Вход'],
              [true, 'Регистрация'],
            ].map(([reg, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => switchTab(reg)}
                className={`h-10 rounded-[10px] text-[15px] font-bold transition-colors ${
                  isRegister === reg ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h1 className="mt-8 text-[28px] font-extrabold tracking-[-0.02em]">
            {isRegister ? 'Создай аккаунт' : 'С возвращением'}
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            {isRegister ? 'Чтобы бронировать площадки и хранить избранное' : 'Войди, чтобы управлять бронированиями'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {isRegister && (
              <>
                <Field label="Имя и фамилия" value={form.full_name} onChange={set('full_name')} required autoComplete="name" />
                <Field label="Телефон" type="tel" value={form.phone} onChange={set('phone')} placeholder="+7" autoComplete="tel" />
              </>
            )}
            <Field label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
            <Field
              label="Пароль"
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={isRegister ? 6 : undefined}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />

            {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-[14px] font-semibold text-danger">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="h-12 w-full rounded-xl bg-accent text-[16px] font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {sending ? 'Секунду…' : isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
