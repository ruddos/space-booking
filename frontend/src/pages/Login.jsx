import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckIcon, Logo } from '../components/Icons.jsx'
import { useAuth } from '../utils/auth.jsx'

const inputCls =
  'h-[52px] w-full rounded-xl border border-[#dcdce6] bg-white px-4 text-[15px] font-bold outline-none transition-colors placeholder:font-medium placeholder:text-[#75758a] focus:border-accent'

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold text-muted">{label}</span>
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
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  // уже вошли — нечего тут делать
  if (user) return <Navigate to={location.state?.from || (user.role === 'admin' ? '/admin' : '/')} replace />

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const u = isRegister
        ? await register({ ...form, phone: form.phone || null })
        : await login(form.email, form.password, remember)
      navigate(location.state?.from || (u.role === 'admin' ? '/admin' : '/'), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function switchTab(register) {
    setError('')
    setNote('')
    setParams(register ? { register: '1' } : {}, { replace: true, state: location.state })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[700px_1fr]">
      <div className="relative hidden overflow-hidden bg-dark lg:block">
        <img
          src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <Link to="/" className="absolute top-10 left-10">
          <Logo dark />
        </Link>
        <div className="absolute right-[124px] bottom-10 left-10 rounded-3xl bg-dark/80 p-7 backdrop-blur-sm">
          <p className="text-[30px] leading-[1.25] font-extrabold text-white">Бронируй студии без звонков и переписок</p>
          <p className="mt-3 text-[16px] text-[#d8d8e2]">Все брони, чеки и избранные площадки — в одном кабинете.</p>
        </div>
      </div>

      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Link to="/" className="lg:hidden">
          <Logo />
        </Link>

        <div className="m-auto w-full max-w-[440px] py-10">
          <div className="grid grid-cols-2 rounded-[14px] bg-[#e9e9f0] p-1">
            {[
              [false, 'Вход'],
              [true, 'Регистрация'],
            ].map(([reg, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => switchTab(reg)}
                className={`h-11 rounded-[11px] text-[15px] font-bold transition-colors ${
                  isRegister === reg ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h1 className="mt-7 text-[32px] font-extrabold tracking-[-0.02em]">
            {isRegister ? 'Создай аккаунт' : 'С возвращением'}
          </h1>
          <p className="mt-1 text-[16px] text-muted">
            {isRegister ? 'Чтобы бронировать площадки и хранить избранное' : 'Войди, чтобы управлять бронированиями'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {isRegister && (
              <>
                <Field label="Имя и фамилия" value={form.full_name} onChange={set('full_name')} required autoComplete="name" />
                <Field label="Телефон" type="tel" value={form.phone} onChange={set('phone')} placeholder="+7" autoComplete="tel" />
              </>
            )}
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@mail.ru"
              required
              autoComplete="email"
            />
            <Field
              label="Пароль"
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={isRegister ? 6 : undefined}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />

            {!isRegister && (
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold">
                  <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} className="sr-only" />
                  <span
                    className={`grid size-[18px] place-items-center rounded-[5px] border ${
                      remember ? 'border-accent bg-accent text-white' : 'border-[#9999ad]'
                    }`}
                  >
                    {remember && <CheckIcon size={14} strokeWidth={3} />}
                  </span>
                  Запомнить меня
                </label>
                <button
                  type="button"
                  onClick={() => setNote('Восстановление пароля скоро появится. Пока напиши нам через форму на странице «Контакты».')}
                  className="text-[14px] font-bold text-accent hover:underline"
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            {note && <p className="rounded-xl bg-accent-light px-4 py-3 text-[14px] font-semibold text-accent-hover">{note}</p>}
            {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-[14px] font-semibold text-danger">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="h-[54px] w-full rounded-[14px] bg-accent text-[16px] font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {sending ? 'Секунду…' : isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          <div className="my-8 flex items-center gap-3 text-[14px] text-muted">
            <span className="h-px flex-1 bg-[#dcdce6]" />
            или
            <span className="h-px flex-1 bg-[#dcdce6]" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {['VK ID', 'Яндекс ID'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setNote(`Вход через ${name} скоро появится`)}
                className="h-[50px] rounded-xl border border-[#dcdce6] bg-white text-[15px] font-bold hover:bg-bg"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
