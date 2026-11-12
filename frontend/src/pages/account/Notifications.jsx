import { useEffect, useState } from 'react'
import PageTitle from '../../components/admin/PageTitle.jsx'
import { api } from '../../utils/api.js'

const TYPES = {
  success: 'bg-success',
  warning: 'bg-[#f59e0b]',
  info: 'bg-accent',
}

export default function Notifications() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/notifications')
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  async function read(n) {
    if (n.is_read) return
    setList((l) => l.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    await api(`/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {})
  }

  async function readAll() {
    setList((l) => l.map((x) => ({ ...x, is_read: true })))
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {})
  }

  const unread = list.filter((n) => !n.is_read).length

  return (
    <div>
      <PageTitle title="Уведомления" text={unread ? `Непрочитанных: ${unread}` : 'Всё прочитано'}>
        {unread > 0 && (
          <button
            type="button"
            onClick={readAll}
            className="h-11 rounded-xl border border-line bg-white px-4 text-[15px] font-bold hover:bg-bg"
          >
            Прочитать все
          </button>
        )}
      </PageTitle>

      <ul className="mt-6 space-y-3">
        {list.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => read(n)}
              className={`flex w-full gap-4 rounded-[18px] border p-5 text-left transition-colors ${
                n.is_read ? 'border-line bg-white' : 'border-accent-pale bg-[#f7f6ff]'
              }`}
            >
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.is_read ? 'bg-line' : TYPES[n.type] || TYPES.info}`} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[16px] font-bold">{n.title}</span>
                  <span className="text-[13px] text-muted">
                    {new Date(n.created_at + 'Z').toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
                <span className="mt-1 block text-[15px] text-[#2a2a36]">{n.message}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {!loading && list.length === 0 && (
        <p className="mt-6 rounded-[22px] border border-dashed border-line bg-white px-6 py-12 text-center text-muted">
          Уведомлений пока нет
        </p>
      )}
    </div>
  )
}
