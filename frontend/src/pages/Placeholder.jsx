import { Link } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import Header from '../components/Header.jsx'

// заглушка для разделов, которые еще не сверстаны
export default function Placeholder() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container-x flex flex-1 flex-col items-start justify-center py-24">
        <span className="rounded-full bg-accent-light px-3.5 py-2 text-[14px] font-semibold text-accent-hover">
          Скоро
        </span>
        <h1 className="h2 mt-5">Раздел в разработке</h1>
        <p className="mt-3 text-[17px] text-muted">Мы уже работаем над этой страницей.</p>
        <Link
          to="/"
          className="mt-8 rounded-xl bg-accent px-6 py-3.5 text-[16px] font-bold text-white hover:bg-accent-hover"
        >
          На главную
        </Link>
      </main>
      <Footer />
    </div>
  )
}
