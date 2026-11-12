import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Logo } from '../../components/Icons.jsx'
import { api } from '../../utils/api.js'
import { formatPrice } from '../../utils/format.js'

const METHOD = { card: 'Банковская карта', sbp: 'СБП', invoice: 'Счёт', cash: 'Наличные' }

// электронный чек: открывается отдельной страницей, сохраняется в pdf через печать
export default function Receipt() {
  const { id } = useParams()
  const [r, setR] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/bookings/${id}/receipt`).then(setR).catch((e) => setError(e.message))
  }, [id])

  if (error) return <p className="p-10 text-center font-semibold text-danger">{error}</p>
  if (!r) return <p className="p-10 text-center text-muted">Загружаем чек…</p>

  const paidAt = r.payment.paid_at && new Date(r.payment.paid_at + 'Z').toLocaleString('ru-RU')

  return (
    <div className="min-h-screen bg-bg px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-[560px] justify-between print:hidden">
        <Link to="/account/payments" className="font-bold text-accent hover:underline">
          ← К оплатам
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-accent px-4 py-2.5 text-[14px] font-bold text-white hover:bg-accent-hover"
        >
          Скачать PDF / печать
        </button>
      </div>

      <article className="mx-auto max-w-[560px] rounded-3xl border border-line bg-white p-8 print:border-0">
        <div className="flex items-start justify-between">
          <Logo />
          <div className="text-right text-[13px] text-muted">
            <div className="font-bold text-ink">{r.receipt_number}</div>
            <div>{r.issued_at}</div>
          </div>
        </div>

        <h1 className="mt-8 text-[26px] font-extrabold">Чек об оплате</h1>
        <p className="mt-1 text-[15px] text-muted">Бронь № {r.booking_number}</p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-[15px]">
          <div>
            <dt className="text-[13px] font-bold text-muted">Площадка</dt>
            <dd className="font-bold">
              {r.studio_name} · {r.hall_name}
            </dd>
          </div>
          <div>
            <dt className="text-[13px] font-bold text-muted">Адрес</dt>
            <dd>{r.address}</dd>
          </div>
          <div>
            <dt className="text-[13px] font-bold text-muted">Дата и время</dt>
            <dd className="font-bold">
              {r.date}, {r.time_interval}
            </dd>
          </div>
          <div>
            <dt className="text-[13px] font-bold text-muted">Клиент</dt>
            <dd>
              {r.customer.name}
              {r.customer.phone && <>, {r.customer.phone}</>}
            </dd>
          </div>
        </dl>

        <table className="mt-8 w-full text-[15px]">
          <thead>
            <tr className="border-b border-line text-left text-[13px] font-bold text-muted">
              <th className="pb-2">Позиция</th>
              <th className="pb-2 text-right">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {r.items.map((it) => (
              <tr key={it.name} className="border-b border-line-soft">
                <td className="py-3">
                  {it.name}
                  {it.quantity > 1 && (
                    <span className="block text-[13px] text-muted">
                      {it.quantity} × {formatPrice(it.unit_price)}
                    </span>
                  )}
                </td>
                <td className="py-3 text-right font-bold whitespace-nowrap">{formatPrice(it.total_price)}</td>
              </tr>
            ))}
            {r.discount_amount > 0 && (
              <tr className="border-b border-line-soft text-success">
                <td className="py-3">Скидки</td>
                <td className="py-3 text-right font-bold whitespace-nowrap">−{formatPrice(r.discount_amount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-[17px] font-bold">Итого</span>
          <span className="text-[28px] font-extrabold">{formatPrice(r.total_amount)}</span>
        </div>

        <div className="mt-6 rounded-2xl bg-bg p-4 text-[14px]">
          {r.payment.is_paid ? (
            <>
              <div className="font-bold text-success">Оплачено · {METHOD[r.payment.payment_method] || r.payment.payment_method}</div>
              <div className="mt-1 text-muted">
                Платёж {r.payment.payment_number} · транзакция {r.payment.transaction_id}
                {paidAt && <> · {paidAt}</>}
              </div>
            </>
          ) : (
            <div className="font-bold text-warning">Не оплачено</div>
          )}
        </div>
      </article>
    </div>
  )
}
