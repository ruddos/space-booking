import { useState } from 'react'
import { api } from '../../utils/api.js'
import { StarIcon } from '../Icons.jsx'

export default function ReviewForm({ booking, onSaved, onClose }) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (!rating) return setError('Выбери оценку от 1 до 5 звёзд')
    if (text.trim().length < 10) return setError('Напиши хотя бы 10 символов')
    setError('')
    setSending(true)
    try {
      await api(`/rooms/${booking.room_id}/reviews`, { method: 'POST', body: { booking_id: booking.id, rating, text: text.trim() } })
      onSaved(booking.id)
    } catch (e) { setError(e.message) }
    finally { setSending(false) }
  }
  return (
    <form onSubmit={submit} className="mt-3 rounded-[22px] border border-accent-pale bg-white p-6">
      <h3 className="text-[20px] font-extrabold">Как прошёл визит в {booking.room.name}?</h3>
      <fieldset className="mt-4" disabled={sending}>
        <legend className="text-[15px] font-bold">Оценка</legend>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-lg p-1 focus-within:ring-2 focus-within:ring-accent">
              <input type="radio" required name={`rating-${booking.id}`} value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" aria-label={`${n} из 5`} />
              <StarIcon size={32} className={n <= rating ? 'text-star' : 'text-line'} />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block text-[15px] font-bold">Твой отзыв
        <textarea required minLength={10} maxLength={2000} value={text} disabled={sending} onChange={(e) => setText(e.target.value)}
          placeholder="Расскажи о площадке, оборудовании и впечатлениях от посещения"
          className="mt-2 block min-h-28 w-full rounded-xl border border-line p-3 font-normal outline-none focus:border-accent" />
      </label>
      <p className="mt-1 text-right text-[13px] text-muted">{text.length} / 2000</p>
      {error && <p role="alert" className="mt-3 text-danger">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button disabled={sending} className="rounded-xl bg-accent px-5 py-3 font-bold text-white hover:bg-accent-hover disabled:opacity-50">{sending ? 'Отправляем…' : 'Опубликовать отзыв'}</button>
        <button type="button" disabled={sending} onClick={onClose} className="rounded-xl border border-line px-5 py-3 font-bold">Отмена</button>
      </div>
    </form>
  )
}
