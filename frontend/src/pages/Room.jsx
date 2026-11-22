import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import { CheckIcon, HeartIcon, PinIcon, ShareIcon, StarIcon } from '../components/Icons.jsx'
import PageLayout from '../components/PageLayout.jsx'
import BookingWidget from '../components/room/BookingWidget.jsx'
import { api } from '../utils/api.js'
import { formatDate, hhmm, initials, plural, weekdayIndex } from '../utils/format.js'
import { CATEGORIES, categorySingular, mapUrl } from '../utils/rooms.js'
import { useFavorites } from '../utils/useFavorites.js'

function Card({ title, children, id, action }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-[22px] border border-line bg-white p-6 sm:p-[29px]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[24px] font-extrabold">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-bg p-4">
      <div className="text-[13px] font-semibold text-muted">{label}</div>
      <div className="mt-1 text-[20px] font-extrabold">{value}</div>
    </div>
  )
}

const REVIEWS_SHOWN = 3

export default function Room() {
  const { id } = useParams()
  const [room, setRoom] = useState(null)
  const [error, setError] = useState('')
  const [allReviews, setAllReviews] = useState(false)
  const [copied, setCopied] = useState(false)
  const { favorites, toggleFavorite } = useFavorites()

  useEffect(() => {
    setRoom(null)
    setError('')
    api(`/rooms/${id}`)
      .then(setRoom)
      .catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    if (room) document.title = `${categorySingular(room.category)} ${room.name} — SPACE`
  }, [room])

  if (error) {
    return (
      <PageLayout className="container-x py-24">
        <h1 className="h2">Площадка не найдена</h1>
        <p className="mt-2 text-muted">{error}</p>
        <Link to="/catalog" className="mt-6 inline-block font-bold text-accent">
          ← Ко всем площадкам
        </Link>
      </PageLayout>
    )
  }

  if (!room) {
    return (
      <PageLayout className="container-x py-10">
        <div className="h-10 w-80 animate-pulse rounded-xl bg-line" />
        <div className="mt-8 h-[460px] animate-pulse rounded-3xl bg-line" />
      </PageLayout>
    )
  }

  const category = CATEGORIES.find((c) => c.value === room.category)
  const today = room.schedules.find((s) => s.day_of_week === weekdayIndex(new Date()))
  const hours = room.schedules[0]
  const reviews = [...room.reviews].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const isFav = favorites.includes(room.id)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: room.name, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // пользователь закрыл окно «поделиться» — ничего не делаем
    }
  }

  const btn = 'flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-[14px] font-bold transition-colors hover:bg-bg'

  return (
    <PageLayout>
      <div className="container-x pt-7 pb-24">
        <Breadcrumbs
          items={[
            ['Главная', '/'],
            [category?.title || 'Площадки', `/catalog${category ? `?category=${encodeURIComponent(category.value)}` : ''}`],
            [room.name],
          ]}
        />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[34px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[44px]">
              {categorySingular(room.category)} {room.name}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
              <span className="flex items-center gap-1.5">
                <StarIcon size={16} className="text-star" />
                <b>{room.reviews_count ? Number(room.rating).toLocaleString('ru-RU') : 'Нет оценок'}</b>
                <a href="#reviews" className="font-semibold text-accent hover:underline">
                  {room.reviews_count} {plural(room.reviews_count, ['отзыв', 'отзыва', 'отзывов'])}
                </a>
              </span>
              <span className="flex items-center gap-1.5 text-muted">
                <PinIcon size={16} />
                {room.address} · {room.metro}
              </span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={share} className={btn}>
              <ShareIcon size={18} />
              {copied ? 'Ссылка скопирована' : 'Поделиться'}
            </button>
            <button type="button" onClick={() => toggleFavorite(room)} className={btn} aria-pressed={isFav}>
              <HeartIcon size={18} className={isFav ? 'fill-danger text-danger' : ''} />
              {isFav ? 'В избранном' : 'В избранное'}
            </button>
          </div>
        </div>

        <div className="mt-6 h-[280px] overflow-hidden rounded-3xl bg-dark sm:h-[460px]">
          {room.image_url && <img src={room.image_url} alt={room.name} className="size-full object-cover" />}
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            <Card title={category ? `О ${room.category === 'Залы' ? 'зале' : room.category === 'Коворкинги' ? 'коворкинге' : 'студии'}` : 'О площадке'}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Площадь" value={`${room.area} м²`} />
                <Stat label="Вместимость" value={`до ${room.capacity} чел.`} />
                <Stat label="Тип" value={categorySingular(room.category)} />
                <Stat label="Сегодня" value={today ? `${hhmm(today.open_time)}–${hhmm(today.close_time)}` : 'выходной'} />
              </div>
              {room.description && <p className="mt-5 text-[16px] leading-[1.6] text-[#2a2a36]">{room.description}</p>}
            </Card>

            {room.amenities.length > 0 && (
              <Card title="Оборудование и удобства">
                <ul className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {room.amenities.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 text-[15px]">
                      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent-light text-accent-hover">
                        <CheckIcon size={18} />
                      </span>
                      {a.name}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card title="Правила">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  [
                    'Минимум 1 час',
                    hours
                      ? `Шаг бронирования — 1 час, работаем ${hhmm(hours.open_time)}–${hhmm(hours.close_time)}`
                      : 'Шаг бронирования — 1 час',
                  ],
                  ['Бесплатная отмена', 'Не позднее чем за 24 часа до начала, за 6–24 часа вернём 50%'],
                  ['Сменная обувь', 'На циклораму — только в бахилах или носках'],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-[14px] border border-line p-[17px]">
                    <div className="text-[15px] font-bold">{title}</div>
                    <p className="mt-1.5 text-[15px] leading-snug text-muted">{text}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Как добраться">
              <div className="relative h-[280px] overflow-hidden rounded-2xl bg-[#e9e9f0]">
                <iframe title="Карта" src={mapUrl(room.address)} loading="lazy" className="absolute inset-0 size-full" />
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-[#2a2a36]">
                {room.address}, {room.metro}. Уточнить вход и условия посещения можно через форму на странице «Контакты».
              </p>
            </Card>

            <Card
              id="reviews"
              title="Отзывы"
              action={
                <span className="flex items-center gap-2">
                  <StarIcon size={24} className="text-star" />
                  <span className="text-[28px] font-extrabold">{room.reviews_count ? Number(room.rating).toLocaleString('ru-RU') : '—'}</span>
                  <span className="text-[15px] font-semibold text-muted">
                    · {room.reviews_count} {plural(room.reviews_count, ['отзыв', 'отзыва', 'отзывов'])}
                  </span>
                </span>
              }
            >
              {reviews.length === 0 && <p className="text-muted">Отзывов пока нет — будь первым после брони.</p>}
              <p className="mb-4 text-[14px] text-muted">Оставить отзыв можно в разделе «Прошедшие» личного кабинета после посещения. <Link to="/account" className="font-bold text-accent">Мои бронирования</Link></p>
              <ul className="divide-y divide-line-soft">
                {(allReviews ? reviews : reviews.slice(0, REVIEWS_SHOWN)).map((r) => (
                  <li key={r.id} className="py-5 first:pt-0">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-full bg-accent-light text-[16px] font-extrabold text-accent-hover">
                        {initials(r.author_name)}
                      </span>
                      <span>
                        <span className="block text-[16px] font-bold">{r.author_name}</span>
                        <span className="block text-[13px] text-muted">{r.booking_id ? 'После посещения' : 'Демонстрационный отзыв'}</span>
                        <span className="block text-[13px] text-muted">
                          {formatDate(r.created_at, { day: 'numeric', month: 'long', year: 'numeric' })} · ★ {r.rating}
                        </span>
                      </span>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-[#2a2a36]">{r.text}</p>
                  </li>
                ))}
              </ul>
              {reviews.length > REVIEWS_SHOWN && (
                <button
                  type="button"
                  onClick={() => setAllReviews((v) => !v)}
                  className="mt-2 h-11 rounded-xl border border-line px-5 text-[16px] font-bold hover:bg-bg"
                >
                  {allReviews ? 'Свернуть' : 'Показать все отзывы'}
                </button>
              )}
            </Card>
          </div>

          <aside className="lg:sticky lg:top-6">
            <BookingWidget room={room} />
          </aside>
        </div>
      </div>
    </PageLayout>
  )
}
