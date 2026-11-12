import { useState } from 'react'
import { api } from '../../utils/api.js'
import { formatLongDate, formatPrice } from '../../utils/format.js'
import { hoursLabel } from './TimePicker.jsx'

const METHODS = [
  ['card', 'Банковская карта'],
  ['sbp', 'СБП'],
]

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between gap-3 text-[15px]">
      <span>{label}</span>
      <span className={`font-bold whitespace-nowrap ${accent ? 'text-success' : ''}`}>{value}</span>
    </div>
  )
}

export default function Summary({
  date,
  start,
  end,
  duration,
  price,
  services,
  promo,
  onPromo,
  method,
  onMethod,
  sending,
  error,
  onSubmit,
}) {
  const [code, setCode] = useState('')
  const [promoMsg, setPromoMsg] = useState(null)
  const [checking, setChecking] = useState(false)

  async function applyPromo() {
    if (!code.trim() || !price) return
    setChecking(true)
    try {
      const res = await api('/promo/validate', {
        method: 'POST',
        body: { code: code.trim(), total_amount: price.hall_subtotal + price.services_subtotal },
      })
      onPromo(res.code)
      setPromoMsg({ ok: true, text: res.message })
    } catch (e) {
      onPromo('')
      setPromoMsg({ ok: false, text: e.message })
    } finally {
      setChecking(false)
    }
  }

  function removePromo() {
    onPromo('')
    setCode('')
    setPromoMsg(null)
  }

  const hallBase = price ? price.effective_hourly_rate * price.duration_hours : 0

  return (
    <div className="rounded-3xl border border-line bg-white p-[25px]">
      <h2 className="text-[20px] font-extrabold">Итого</h2>

      <div className="mt-4 rounded-[14px] bg-bg px-4 py-3.5">
        <div className="text-[15px] font-extrabold first-letter:uppercase">{formatLongDate(date)}</div>
        <div className="mt-1 text-[15px] text-muted">{start ? `${start} – ${end}` : 'Выбери время начала'}</div>
      </div>

      {price && (
        <div className="mt-4 space-y-2.5">
          <Row label={`Аренда · ${hoursLabel(duration)}`} value={formatPrice(hallBase)} />
          {price.is_weekend && <p className="-mt-1 text-[13px] text-muted">Выходной день: ставка +15%</p>}
          {price.duration_discount_amount > 0 && (
            <Row
              label={`Скидка от 4 часов −${price.duration_discount_percent}%`}
              value={`−${formatPrice(price.duration_discount_amount)}`}
              accent
            />
          )}
          {services.map((s) => (
            <Row
              key={s.id}
              label={s.name}
              value={formatPrice(s.is_per_hour ? s.price * price.duration_hours : s.price)}
            />
          ))}
          {price.promo_discount_amount > 0 && (
            <Row label={`Промокод ${promo}`} value={`−${formatPrice(price.promo_discount_amount)}`} accent />
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {promo ? (
          <div className="flex h-11 flex-1 items-center justify-between rounded-xl bg-success-light px-4 text-[15px] font-bold text-success">
            {promo}
            <button type="button" onClick={removePromo} className="text-[13px] underline">
              убрать
            </button>
          </div>
        ) : (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
              placeholder="Промокод"
              className="h-11 min-w-0 flex-1 rounded-xl border border-line px-4 text-[15px] outline-none placeholder:text-[#75758a] focus:border-accent"
            />
            <button
              type="button"
              onClick={applyPromo}
              disabled={checking || !price}
              className="h-11 rounded-xl border border-ink px-4 text-[14px] font-bold hover:bg-ink hover:text-white disabled:opacity-50"
            >
              Применить
            </button>
          </>
        )}
      </div>
      {promoMsg && !promo && <p className="mt-2 text-[13px] font-semibold text-danger">{promoMsg.text}</p>}
      {promoMsg && promo && <p className="mt-2 text-[13px] font-semibold text-success">{promoMsg.text}</p>}

      <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-4">
        <span className="text-[17px] font-bold">К оплате</span>
        <span className="text-[30px] font-extrabold tracking-[-0.02em]">{formatPrice(price?.final_total || 0)}</span>
      </div>

      <div className="mt-4 text-[13px] font-bold text-muted">Способ оплаты</div>
      <div className="mt-2.5 space-y-2">
        {METHODS.map(([key, label]) => (
          <label
            key={key}
            className={`flex h-[47px] cursor-pointer items-center gap-3 rounded-xl border px-5 text-[15px] font-semibold ${
              method === key ? 'border-accent bg-[#f7f6ff]' : 'border-line'
            }`}
          >
            <input type="radio" name="method" checked={method === key} onChange={() => onMethod(key)} className="sr-only" />
            <span
              className={`grid size-[18px] place-items-center rounded-full border ${
                method === key ? 'border-accent bg-accent' : 'border-[#9999ad]'
              }`}
            >
              {method === key && <span className="size-[7px] rounded-full bg-white" />}
            </span>
            {label}
          </label>
        ))}
      </div>

      {error && <p className="mt-4 rounded-xl bg-danger-light px-4 py-3 text-[14px] font-semibold text-danger">{error}</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={sending || !start || !price}
        className="mt-4 h-14 w-full rounded-[14px] bg-accent text-[16px] font-bold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? 'Оформляем…' : 'Забронировать и оплатить'}
      </button>
      <p className="mt-4 text-[14px] leading-snug text-muted">
        Бесплатная отмена за 24 часа. Нажимая кнопку, ты соглашаешься с правилами сервиса.
      </p>
    </div>
  )
}
