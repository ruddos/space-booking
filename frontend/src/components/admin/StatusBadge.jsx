export const STATUSES = {
  pending: { label: 'Ожидает', cls: 'bg-warning-light text-warning' },
  confirmed: { label: 'Подтверждена', cls: 'bg-success-light text-success' },
  cancelled: { label: 'Отменена', cls: 'bg-danger-light text-danger' },
}

export default function StatusBadge({ status }) {
  const s = STATUSES[status] || { label: status, cls: 'bg-line-soft text-muted' }
  return (
    <span className={`inline-block rounded-[14px] px-2.5 py-[5px] text-[13px] font-bold whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  )
}
