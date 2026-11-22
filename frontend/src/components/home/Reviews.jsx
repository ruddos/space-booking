import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../utils/api.js'
import { initials } from '../../utils/format.js'
import { StarIcon } from '../Icons.jsx'
import SectionHead from './SectionHead.jsx'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api('/reviews/latest', { params: { limit: 3 } })
      .then((list) => active && setReviews(list))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])
  return (
    <section className="container-x pt-24 pb-24">
      <SectionHead title="Отзывы клиентов" />
      {loading && <p role="status" className="mt-6 text-muted">Загружаем отзывы…</p>}
      {error && <p role="alert" className="mt-6 text-danger">Не удалось загрузить отзывы: {error}</p>}
      {!loading && !error && !reviews.length && <p className="mt-6 rounded-[22px] border border-line bg-white p-7 text-muted">Отзывов пока нет. После посещения площадки можно оставить оценку в личном кабинете.</p>}
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {reviews.map((r) => (
          <figure key={r.id} className="flex flex-col rounded-[22px] border border-line bg-white p-7">
            <div className="flex gap-0.5 text-star">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon key={i} size={18} className={i <= r.rating ? 'text-star' : 'text-line'} />
              ))}
            </div>
            <blockquote className="mt-4 text-[17px] leading-[1.5]">{r.text}</blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-6">
              <span className="grid size-11 place-items-center rounded-full bg-accent-light text-[16px] font-extrabold text-accent-hover">
                {initials(r.author_name)}
              </span>
              <span>
                <span className="block text-[16px] font-bold">{r.author_name}</span>
                <Link to={`/rooms/${r.room_id}#reviews`} className="block text-[14px] text-accent hover:underline">{r.room_name}</Link>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
