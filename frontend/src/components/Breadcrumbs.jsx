import { Fragment } from 'react'
import { Link } from 'react-router-dom'

// items: [['Главная', '/'], ['Площадки', '/catalog'], ['Moody']]
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Навигация" className="text-[14px] text-muted">
      {items.map(([label, to], i) => (
        <Fragment key={label}>
          {i > 0 && <span className="mx-1.5">/</span>}
          {to ? (
            <Link to={to} className="hover:text-ink">
              {label}
            </Link>
          ) : (
            <span>{label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
