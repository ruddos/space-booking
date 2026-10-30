export default function PageTitle({ title, text, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="h2">{title}</h1>
        {text && <p className="mt-1 text-[16px] text-muted">{text}</p>}
      </div>
      {children}
    </div>
  )
}
