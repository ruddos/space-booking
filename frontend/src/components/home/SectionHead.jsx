export default function SectionHead({ title, text, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="h2">{title}</h2>
        {text && <p className="mt-2 text-[17px] text-muted">{text}</p>}
      </div>
      {action}
    </div>
  )
}
