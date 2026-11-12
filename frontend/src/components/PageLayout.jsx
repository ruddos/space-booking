import Footer from './Footer.jsx'
import Header from './Header.jsx'

// обычная страница: белая шапка, контент, подвал
export default function PageLayout({ children, className = '' }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={`flex-1 ${className}`}>{children}</main>
      <Footer />
    </div>
  )
}
