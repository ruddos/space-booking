import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageTitle from '../../components/admin/PageTitle.jsx'
import { api } from '../../utils/api.js'
import { CLIENT_STATUS } from '../../utils/bookings.js'
import { formatDate, formatPrice } from '../../utils/format.js'

export default function Payments() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/bookings/my')
      .then((list) => setBookings(list.sort((a, b) => b.created_at.localeCompare(a.created_at))))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [])

  const paid = bookings.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.total_price, 0)
  const saved = bookings.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + (b.discount_amount || 0), 0)

  return (
    <div>
      <PageTitle title="Чеки и оплаты" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[22px] border border-line bg-white p-6">
          <div className="text-[14px] font-semibold text-muted">Оплачено всего</div>
          <div className="mt-2 text-[30px] font-extrabold">{formatPrice(paid)}</div>
        </div>
        <div className="rounded-[22px] border border-line bg-white p-6">
          <div className="text-[14px] font-semibold text-muted">Сэкономлено на скидках</div>
          <div className="mt-2 text-[30px] font-extrabold text-success">{formatPrice(saved)}</div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[22px] border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-[15px]">
          <thead>
            <tr className="border-b border-line text-[13px] font-bold text-muted">
              <th className="px-5 py-3.5">Бронь</th>
              <th className="px-3 py-3.5">Дата</th>
              <th className="px-3 py-3.5 text-right">Сумма</th>
              <th className="px-3 py-3.5">Статус</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {bookings.map((b) => {
              const st = CLIENT_STATUS[b.status]
              return (
                <tr key={b.id}>
                  <td className="px-5 py-4">
                    <div className="font-bold">{b.room?.name}</div>
                    <div className="text-[13px] text-muted">№ {b.booking_number}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {formatDate(b.start_time, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-3 py-4 text-right font-extrabold whitespace-nowrap">{formatPrice(b.total_price)}</td>
                  <td className="px-3 py-4">
                    <span className={`rounded-[14px] px-2.5 py-1 text-[13px] font-bold whitespace-nowrap ${st.cls}`}>
                      {b.status === 'cancelled' ? 'Возврат' : st.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/account/receipt/${b.id}`} className="font-bold whitespace-nowrap text-accent hover:underline">
                      Открыть чек
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && bookings.length === 0 && <p className="px-5 py-10 text-center text-muted">Оплат пока не было</p>}
      </div>
    </div>
  )
}
