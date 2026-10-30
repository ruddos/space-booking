// иконки как в макете: обводка 2px, скругленные концы
function Icon({ size = 20, children, className, strokeWidth = 2, fill = 'none' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const SearchIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
)

export const PinIcon = (p) => (
  <Icon {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
)

export const CalendarIcon = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
)

export const ClockIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
)

export const FilterIcon = (p) => (
  <Icon {...p}>
    <path d="M4 7h16M7 12h10M10 17h4" />
  </Icon>
)

export const ChevronDownIcon = (p) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

export const ArrowRightIcon = (p) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

export const HeartIcon = (p) => (
  <Icon {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
  </Icon>
)

export const StarIcon = (p) => (
  <Icon {...p} fill="currentColor" strokeWidth={0}>
    <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.8Z" />
  </Icon>
)

export const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)

export const XIcon = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const GridIcon = (p) => (
  <Icon {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </Icon>
)

export const TicketIcon = (p) => (
  <Icon {...p}>
    <path d="M4 8a2 2 0 0 0 0 4v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a2 2 0 0 1 0-4V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3Z" transform="translate(0 1.5)" />
    <path d="M14 5.5v12" strokeDasharray="2 2" />
  </Icon>
)

export const BuildingIcon = (p) => (
  <Icon {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
    <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 20.5v-4h4v4" />
  </Icon>
)

export const LogoutIcon = (p) => (
  <Icon {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" />
  </Icon>
)

export const UsersIcon = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c2 .7 3.2 2.5 3.5 5.2" />
  </Icon>
)

export const RefreshIcon = (p) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 0 0-14.7-4.3L4 8.5M4 13a8 8 0 0 0 14.7 4.3L20 15.5" />
    <path d="M4 4v4.5h4.5M20 20v-4.5h-4.5" />
  </Icon>
)

export function Logo({ dark = false, className = '' }) {
  const color = dark ? '#ffffff' : '#0f0f14'
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <path d="M12 3H5a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h7" strokeWidth="2.375" stroke={color} />
        <path d="M18 3h7a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2h-7" strokeWidth="2.375" stroke={color} />
        <path d="M11 10h8v10h-8" strokeWidth="2.375" stroke={color} />
      </svg>
      <span className="text-[20px] font-extrabold tracking-tight" style={{ color }}>
        SPACE
      </span>
    </span>
  )
}
