import { useEffect, useState } from 'react'
import PageTitle from '../../components/admin/PageTitle.jsx'
import { api } from '../../utils/api.js'
import { formatPrice } from '../../utils/format.js'

const GROUPS = {
  equipment: 'Оборудование',
  assistant: 'Ассистенты',
  makeup: 'Гримёрка и визаж',
  extra: 'Другое',
}

export default function Services() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/services')
      .then(setServices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const groups = Object.entries(GROUPS)
    .map(([key, title]) => [title, services.filter((s) => s.category === key)])
    .filter(([, list]) => list.length)

  return (
    <div>
      <PageTitle title="Услуги" text="Платные дополнения, которые клиент выбирает при бронировании" />

      {error && <p className="mt-6 rounded-2xl bg-danger-light px-5 py-4 font-semibold text-danger">{error}</p>}
      {loading && <p className="mt-10 text-center text-muted">Загружаем услуги…</p>}

      <div className="mt-6 space-y-6">
        {groups.map(([title, list]) => (
          <section key={title} className="overflow-hidden rounded-[22px] border border-line bg-white">
            <h2 className="border-b border-line px-6 py-4 text-[18px] font-extrabold">
              {title} <span className="font-semibold text-muted">· {list.length}</span>
            </h2>
            <ul className="divide-y divide-line-soft">
              {list.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-bold">{s.name}</div>
                    {s.description && <div className="mt-0.5 text-[14px] text-muted">{s.description}</div>}
                  </div>
                  <span className="rounded-lg bg-bg px-2.5 py-1 text-[13px] font-semibold">
                    {s.is_per_hour ? 'за час' : 'за бронь'}
                  </span>
                  <span className="w-24 text-right text-[16px] font-extrabold">{formatPrice(s.price)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
