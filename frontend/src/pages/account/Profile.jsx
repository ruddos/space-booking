import { Link } from 'react-router-dom'
import PageTitle from '../../components/admin/PageTitle.jsx'
import { useAuth } from '../../utils/auth.jsx'
import { formatDate } from '../../utils/format.js'

function Field({ label, value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold text-muted">{label}</span>
      <input
        readOnly
        value={value || '—'}
        className="h-[50px] w-full rounded-xl border border-line bg-bg px-4 text-[15px] font-semibold outline-none"
      />
    </label>
  )
}

export default function Profile() {
  const { user } = useAuth()

  return (
    <div>
      <PageTitle title="Профиль" />

      <section className="mt-6 rounded-[22px] border border-line bg-white p-6 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Имя и фамилия" value={user.full_name} />
          <Field label="Email" value={user.email} />
          <Field label="Телефон" value={user.phone} />
          <Field label="С нами с" value={formatDate(user.created_at, { day: 'numeric', month: 'long', year: 'numeric' })} />
        </div>
        <p className="mt-5 text-[14px] text-muted">
          Чтобы изменить данные или удалить аккаунт, напиши нам —{' '}
          <Link to="/contacts#write" className="font-bold text-accent hover:underline">
            форма обратной связи
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
