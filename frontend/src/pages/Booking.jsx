import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Summary from '../components/booking/Summary.jsx'
import ServicePicker from '../components/booking/ServicePicker.jsx'
import { DayPicker, SlotPicker, freeRun } from '../components/booking/TimePicker.jsx'
import { PinIcon } from '../components/Icons.jsx'
import PageLayout from '../components/PageLayout.jsx'
import { api } from '../utils/api.js'
import { useAuth } from '../utils/auth.jsx'
import { formatPrice, isoDate } from '../utils/format.js'
import { categorySingular } from '../utils/rooms.js'

const inputCls =
  'h-[50px] w-full rounded-xl border border-line bg-white px-4 text-[15px] font-semibold outline-none placeholder:font-medium placeholder:text-[#75758a] focus:border-accent'

function Section({ title, children }) {
  return (
    <section className="rounded-[22px] border border-line bg-white p-6 sm:p-[25px]">
      {title && <h2 className="mb-4 text-[20px] font-extrabold">{title}</h2>}
      {children}
    </section>
  )
}

// "12:00" + 2 часа -> "14:00"
const plusHours = (time, h) => `${String(parseInt(time, 10) + h).padStart(2, '0')}:00`

export default function Booking() {
  const { roomId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [room, setRoom] = useState(null)
  const [services, setServices] = useState([])
  const [date, setDate] = useState(params.get('date') || isoDate())
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [start, setStart] = useState(params.get('time') || '')
  const [duration, setDuration] = useState(2)
  const [serviceIds, setServiceIds] = useState([])
  const [promo, setPromo] = useState('')
  const [method, setMethod] = useState('card')
  const [contact, setContact] = useState({ name: user?.full_name || '', phone: user?.phone || '', comment: '' })
  const [price, setPrice] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    api(`/rooms/${roomId}`).then(setRoom).catch((e) => setError(e.message))
    api('/services').then(setServices).catch(() => setServices([]))
  }, [roomId])

  // свободные часы на выбранный день считает бэкенд
  useEffect(() => {
    let ignore = false
    setSlotsLoading(true)
    api(`/rooms/${roomId}/available-slots`, { params: { date } })
      .then((d) => {
        if (ignore) return
        setSlots(d.slots)
        // сбрасываем время, если на новую дату оно занято
        setStart((t) => (d.slots.some((s) => s.time === t && s.is_available) ? t : ''))
      })
      .catch(() => !ignore && setSlots([]))
      .finally(() => !ignore && setSlotsLoading(false))
    return () => {
      ignore = true
    }
  }, [roomId, date, reload])

  // длительность не может залезать на занятые часы
  const maxRun = useMemo(() => {
    const i = slots.findIndex((s) => s.time === start)
    return i >= 0 ? freeRun(slots, i) : 0
  }, [slots, start])

  useEffect(() => {
    // пока слоты грузятся, maxRun = 0 — не трогаем выбранную длительность
    if (start && maxRun > 0 && duration > maxRun) setDuration(maxRun)
  }, [start, maxRun, duration])

  const end = start ? plusHours(start, duration) : ''

  // итоговую цену (выходные, скидка за длительность, услуги, промокод) считает бэкенд
  useEffect(() => {
    setPrice(null)
    if (!start) {
      return
    }
    let ignore = false
    const t = setTimeout(() => {
      api('/pricing/calculate', {
        method: 'POST',
        body: {
          room_id: Number(roomId),
          start_time: `${date}T${start}:00`,
          end_time: `${date}T${end}:00`,
          service_ids: serviceIds,
          promo_code: promo || null,
        },
      })
        .then((p) => !ignore && setPrice(p))
        .catch(() => !ignore && setPrice(null))
    }, 150)
    return () => {
      ignore = true
      clearTimeout(t)
    }
  }, [roomId, date, start, end, serviceIds, promo])

  async function submit() {
    if (sending) return
    setError('')
    if (slotsLoading || !price || !start) {
      setError('Дождись загрузки расписания и выбери свободное время')
      return
    }
    if (!contact.name.trim() || !contact.phone.trim()) {
      setError('Укажи имя и телефон — по ним студия свяжется с тобой')
      return
    }
    setSending(true)
    try {
      const booking = await api('/bookings', {
        method: 'POST',
        body: {
          room_id: Number(roomId),
          start_time: `${date}T${start}:00`,
          end_time: `${date}T${end}:00`,
          service_ids: serviceIds,
          promo_code: promo || null,
          contact_name: contact.name.trim(),
          contact_phone: contact.phone.trim(),
          comment: contact.comment.trim() || null,
        },
      })
      await api(`/bookings/${booking.id}/pay`, { method: 'POST', params: { payment_method: method } })
      navigate(`/booking/done/${booking.id}`, { replace: true })
    } catch (e) {
      setError(e.status === 409 ? 'Это время только что заняли — выбери другое' : e.message)
      // кто-то успел раньше — обновляем свободные часы
      if (e.status === 409) setReload((n) => n + 1)
    } finally {
      setSending(false)
    }
  }

  const step = !start ? 1 : !price ? 2 : 3
  const chosen = services.filter((s) => serviceIds.includes(s.id))

  return (
    <PageLayout>
      <div className="container-x pt-7 pb-24">
        <Link to={`/rooms/${roomId}`} className="text-[15px] font-bold text-accent hover:underline">
          ← К студии
        </Link>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="h2">Бронирование</h1>
          <ol className="flex gap-2">
            {['Время', 'Услуги', 'Оплата'].map((label, i) => (
              <li
                key={label}
                className={`rounded-full border px-3.5 py-2 text-[14px] font-bold ${
                  step === i + 1 ? 'border-ink bg-ink text-white' : step > i + 1 ? 'border-line bg-white text-muted' : 'border-line bg-white'
                }`}
              >
                {i + 1} · {label}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-5">
            {room && (
              <section className="flex items-center gap-5 rounded-[22px] border border-line bg-white p-[25px]">
                <img src={room.image_url} alt="" className="hidden h-28 w-40 rounded-[14px] object-cover sm:block" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-[22px] font-extrabold">
                    {categorySingular(room.category)} {room.name}
                  </h2>
                  <div className="mt-1 text-[17px] font-bold">
                    {formatPrice(room.price_per_hour)} <span className="font-medium text-muted">/час</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[14px] text-muted">
                    <PinIcon size={16} />
                    {room.address}
                  </div>
                </div>
                <Link to="/catalog" className="self-center text-[14px] font-bold text-accent hover:underline">
                  Сменить
                </Link>
              </section>
            )}

            <Section>
              <DayPicker value={date} onChange={setDate} />
              <SlotPicker
                slots={slots}
                loading={slotsLoading}
                start={start}
                duration={duration}
                onStart={setStart}
                onDuration={setDuration}
              />
            </Section>

            {services.length > 0 && (
              <Section title="Дополнительно">
                <ServicePicker services={services} value={serviceIds} onChange={setServiceIds} />
              </Section>
            )}

            <Section title="Контакты">
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[13px] font-bold text-muted">Имя</span>
                  <input
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    autoComplete="name"
                    className={inputCls}
                  />
                </label>
                <label>
                  <span className="mb-2 block text-[13px] font-bold text-muted">Телефон</span>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="+7 (900) 000-00-00"
                    autoComplete="tel"
                    className={inputCls}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-[13px] font-bold text-muted">Комментарий для студии</span>
                  <textarea
                    rows={3}
                    value={contact.comment}
                    onChange={(e) => setContact({ ...contact, comment: e.target.value })}
                    placeholder="Например: будет 4 человека, нужна вешалка для одежды"
                    className={`${inputCls} h-auto resize-y py-3`}
                  />
                </label>
              </div>
            </Section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <Summary
              date={date}
              start={start}
              end={end}
              duration={duration}
              price={price}
              services={chosen}
              promo={promo}
              onPromo={setPromo}
              method={method}
              onMethod={setMethod}
              sending={sending}
              error={error}
              onSubmit={submit}
            />
          </aside>
        </div>
      </div>
    </PageLayout>
  )
}
