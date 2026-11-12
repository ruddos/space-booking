import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout.jsx'

// 404 — любой неизвестный адрес
export default function NotFound() {
  return (
    <PageLayout className="container-x flex flex-col items-start justify-center py-24">
      <span className="rounded-full bg-accent-light px-3.5 py-2 text-[14px] font-semibold text-accent-hover">Ошибка 404</span>
      <h1 className="h2 mt-5">Такой страницы нет</h1>
      <p className="mt-3 text-[17px] text-muted">Возможно, ссылка устарела. Начни с главной или каталога площадок.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="rounded-xl bg-accent px-6 py-3.5 text-[16px] font-bold text-white hover:bg-accent-hover">
          На главную
        </Link>
        <Link to="/catalog" className="rounded-xl border border-line bg-white px-6 py-3.5 text-[16px] font-bold hover:bg-bg">
          В каталог
        </Link>
      </div>
    </PageLayout>
  )
}
