import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import Header from '../components/Header.jsx'
import { ChevronDownIcon } from '../components/Icons.jsx'
import { api } from '../utils/api.js'
import { useAuth } from '../utils/auth.jsx'

const VALUES = [
  ['Честное расписание', 'Слот на сайте — это реальное свободное время, а не «уточним у администратора».'],
  ['Отзывы после посещения', 'Оценку может оставить клиент, чья бронь уже завершилась. Рейтинг складывается из этих оценок.'],
  ['Понятные деньги', 'Итоговая цена видна до оплаты, отмена за 24 часа — бесплатно.'],
]

const FAQ = [
  [
    'Как отменить или перенести бронь?',
    'В личном кабинете, в разделе «Мои бронирования». За 24 часа и раньше — возврат 100%, за 6–24 часа — 50%, позднее — без возврата.',
  ],
  [
    'Можно ли продлить аренду на месте?',
    'Да, если следующий час свободен. Попроси администратора или оформи ещё одну бронь на сайте — свободные слоты видно на странице студии.',
  ],
  [
    'Какие способы оплаты доступны?',
    'Банковская карта и СБП. Чек доступен в личном кабинете в разделе «Чеки и оплаты».',
  ],
  [
    'Как разместить свою площадку?',
    'Напиши нам через форму ниже с темой «Разместить площадку» — менеджер свяжется, поможет с фото и настроит расписание.',
  ],
]

const TOPICS = ['Вопрос по бронированию', 'Разместить площадку', 'Оплата и возврат', 'Другое']

const inputCls =
  'h-[52px] w-full rounded-xl border border-[#dcdce6] bg-white px-4 text-[15px] font-semibold outline-none focus:border-accent'

function ContactForm() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: user?.full_name || '', email: user?.email || '', topic: TOPICS[0], message: '' })
  const [state, setState] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // профиль может подгрузиться уже после открытия страницы
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.full_name, email: f.email || user.email }))
  }, [user])

  async function submit(e) {
    e.preventDefault()
    setState({ sending: true })
    try {
      const res = await api('/contact', { method: 'POST', body: form })
      setState({ ok: true, text: res.message })
      setForm((f) => ({ ...f, message: '' }))
    } catch (err) {
      setState({ ok: false, text: err.message })
    }
  }

  return (
    <form id="write" onSubmit={submit} className="scroll-mt-6 rounded-[28px] border border-line bg-white p-8 sm:p-10">
      <h2 className="text-[24px] font-extrabold">Напиши нам</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-[13px] font-bold text-muted">Имя</span>
          <input required value={form.name} onChange={set('name')} autoComplete="name" className={inputCls} />
        </label>
        <label>
          <span className="mb-2 block text-[13px] font-bold text-muted">Email</span>
          <input required type="email" value={form.email} onChange={set('email')} autoComplete="email" className={inputCls} />
        </label>
        <label className="relative sm:col-span-2">
          <span className="mb-2 block text-[13px] font-bold text-muted">Тема</span>
          <select value={form.topic} onChange={set('topic')} className={`${inputCls} cursor-pointer appearance-none font-bold`}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <ChevronDownIcon size={14} className="pointer-events-none absolute right-4 bottom-[19px] text-muted" />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-[13px] font-bold text-muted">Сообщение</span>
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={set('message')}
            className={`${inputCls} h-auto resize-y py-3 font-medium`}
          />
        </label>
      </div>
      {state?.text && (
        <p className={`mt-4 text-[15px] font-semibold ${state.ok ? 'text-success' : 'text-danger'}`}>{state.text}</p>
      )}
      <button
        type="submit"
        disabled={state?.sending}
        className="mt-5 h-[54px] rounded-[14px] bg-accent px-7 text-[16px] font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {state?.sending ? 'Отправляем…' : 'Отправить'}
      </button>
    </form>
  )
}

export default function About() {
  const { pathname, hash } = useLocation()

  // /contacts и /contacts#write — та же страница, только сразу прокручиваем к контактам
  useEffect(() => {
    const target = hash ? hash.slice(1) : pathname === '/contacts' ? 'contacts' : null
    if (target) setTimeout(() => document.getElementById(target)?.scrollIntoView(), 50)
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <>
      <section className="bg-dark text-white">
        <Header dark />
        <div className="container-x grid items-center gap-10 pt-6 pb-20 lg:grid-cols-[1fr_616px] lg:pt-12">
          <div>
            <span className="text-[14px] font-bold tracking-wide text-accent-pale">О НАС</span>
            <h1 className="mt-3 text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[56px]">
              Соединяем людей с идеями и места, где их воплощать
            </h1>
            <p className="mt-6 max-w-[587px] text-[18px] leading-relaxed text-on-dark">
              SPACE — сервис, где можно найти и забронировать фотостудию, зал или коворкинг так же просто, как купить
              билет в кино. Владельцам площадок мы даём календарь, онлайн-оплату и поток клиентов.
            </p>
          </div>
          <img
            src="/images/rooms/violet-hall.jpg"
            alt="Зал для мероприятий"
            className="h-[300px] w-full rounded-[28px] object-cover sm:h-[420px]"
          />
        </div>
      </section>

      <main className="container-x pb-24">
        <section className="pt-20">
          <h2 className="h2">Во что мы верим</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {VALUES.map(([title, text]) => (
              <div key={title} className="rounded-[22px] border border-line bg-white p-7">
                <h3 className="text-[21px] font-extrabold">{title}</h3>
                <p className="mt-3 text-[16px] leading-normal text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-20">
          <h2 className="h2">Частые вопросы</h2>
          <div className="mt-6 space-y-2.5">
            {FAQ.map(([q, a], i) => (
              <details key={q} open={i === 0} className="group rounded-[18px] border border-line bg-white px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-bold [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDownIcon size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[16px] leading-relaxed text-[#2a2a36]">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contacts" className="grid scroll-mt-6 gap-6 pt-20 lg:grid-cols-[578px_1fr]">
          <div className="rounded-[28px] bg-dark p-8 text-white sm:p-10">
            <h2 className="text-[40px] font-extrabold tracking-[-0.02em]">Контакты</h2>
            <p className="mt-4 text-[16px] text-on-dark">Поддержка работает каждый день с 08:00 до 23:00 по времени Ростова-на-Дону.</p>
            <dl className="mt-6 space-y-5">
              {[
                ['Телефон', '+7 (863) 310-45-77', 'tel:+78633104577'],
                ['Почта', 'hello@space.ru', 'mailto:hello@space.ru'],
                ['Офис', 'Ростов-на-Дону, ул. Большая Садовая, 47'],
              ].map(([label, value, href]) => (
                <div key={label}>
                  <dt className="text-[13px] font-bold text-on-dark-muted">{label}</dt>
                  <dd className="mt-1 text-[20px] font-extrabold">
                    {href ? (
                      <a href={href} className="hover:text-accent-soft">
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <ContactForm />
        </section>
      </main>
      <Footer />
    </>
  )
}
