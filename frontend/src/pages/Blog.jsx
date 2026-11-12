import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout.jsx'
import { api } from '../utils/api.js'

const CATEGORIES = ['Все', 'Гайды', 'Свет', 'Мероприятия', 'Владельцам']
const LABEL = { Гайды: 'Гайд', Мероприятия: 'Мероприятия', Свет: 'Свет', Владельцам: 'Владельцам' }

function Newsletter() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setState({ sending: true })
    try {
      const res = await api('/newsletter/subscribe', { method: 'POST', body: { email } })
      setState({ ok: true, text: res.message })
      setEmail('')
    } catch (err) {
      setState({ ok: false, text: err.message })
    }
  }

  return (
    <section className="mt-16 grid items-center gap-6 rounded-[28px] border border-line bg-white p-8 sm:p-10 lg:grid-cols-[1fr_auto]">
      <div>
        <h2 className="max-w-[485px] text-[28px] leading-[1.3] font-extrabold">Подборка свободных студий раз в неделю</h2>
        <p className="mt-2 text-[16px] text-muted">Новые площадки, скидки и полезные статьи — без спама.</p>
      </div>
      <form onSubmit={submit} className="w-full lg:w-[617px]">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@mail.ru"
            aria-label="Email для рассылки"
            className="h-[54px] min-w-0 flex-1 rounded-[14px] border border-[#dcdce6] px-4 text-[15px] outline-none placeholder:text-[#75758a] focus:border-accent"
          />
          <button
            type="submit"
            disabled={state?.sending}
            className="h-[54px] rounded-[14px] bg-accent px-6 text-[15px] font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            Подписаться
          </button>
        </div>
        {state?.text && (
          <p className={`mt-2.5 text-[14px] font-semibold ${state.ok ? 'text-success' : 'text-danger'}`}>{state.text}</p>
        )}
      </form>
    </section>
  )
}

export default function Blog() {
  const [category, setCategory] = useState('Все')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    api('/blog/posts', { params: { category: category === 'Все' ? undefined : category } })
      .then((data) => !ignore && setPosts(data))
      .catch(() => !ignore && setPosts([]))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }, [category])

  // большая карточка — только для «Все», в остальных разделах обычная сетка
  const featured = category === 'Все' ? posts.find((p) => p.is_featured) : null
  const rest = posts.filter((p) => p !== featured)

  return (
    <PageLayout>
      <div className="container-x pt-10 pb-24">
        <h1 className="text-[38px] font-extrabold tracking-[-0.02em] sm:text-[48px]">Блог SPACE</h1>
        <p className="mt-2 max-w-[545px] text-[18px] leading-relaxed text-muted">
          Гайды по свету, подбору площадок и организации съёмок — для фотографов, видеографов и организаторов.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`h-11 rounded-[22px] border px-[19px] text-[15px] font-bold transition-colors ${
                category === c ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:bg-bg'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {featured && (
          <article className="mt-8 grid overflow-hidden rounded-[28px] bg-dark text-white md:grid-cols-[700px_1fr]">
            <img src={featured.image_url} alt="" className="h-[260px] w-full object-cover md:h-[400px]" />
            <div className="flex flex-col justify-center p-8 md:p-10">
              <span className="self-start rounded-[15px] bg-accent px-3 py-1.5 text-[13px] font-bold">
                {LABEL[featured.category] || featured.category}
              </span>
              <h2 className="mt-4 text-[28px] leading-[1.2] font-extrabold md:text-[34px]">{featured.title}</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-[#c8c8d4]">{featured.description}</p>
              <p className="mt-5 text-[14px] text-on-dark-muted">{featured.read_time}</p>
            </div>
          </article>
        )}

        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !posts.length
            ? [1, 2, 3, 4].map((i) => <div key={i} className="h-[210px] animate-pulse rounded-[20px] bg-line" />)
            : rest.map((p) => (
                <article key={p.id}>
                  <img src={p.image_url} alt="" loading="lazy" className="h-[210px] w-full rounded-[20px] object-cover" />
                  <div className="mt-3.5 text-[13px] font-bold text-accent-hover">
                    {p.category} · {p.read_time}
                  </div>
                  <h3 className="mt-2 text-[21px] leading-[1.3] font-extrabold">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-normal text-muted">{p.description}</p>
                </article>
              ))}
        </div>

        {!loading && posts.length === 0 && <p className="mt-10 text-center text-muted">В этом разделе пока нет статей</p>}

        <Newsletter />
      </div>
    </PageLayout>
  )
}
