// Hand-rolled outline icons -- consistent 1.75 stroke, 24 viewBox, no
// external icon package (none is in package.json, and adding one means
// an extra install step in the Colab push workflow). Matches the
// mockup's line-art register/passbook visual language rather than a
// generic icon-font look.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function DashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="14.5" width="7" height="6" rx="1.5" />
    </svg>
  )
}

export function RegisterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11Z" />
      <path d="M3.5 20c.6-3.6 2.9-5.5 5.5-5.5s4.9 1.9 5.5 5.5" />
      <path d="M17.5 8v6M14.5 11h6" />
    </svg>
  )
}

export function TriageIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3 12h3.5l1.6-4.5L11 17l2.4-9 1.6 4.5H21" />
    </svg>
  )
}

export function LoansIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="2.75" y="6.5" width="18.5" height="12" rx="2" />
      <circle cx="12" cy="12.5" r="2.6" />
      <path d="M6 10v0M18 15v0" />
    </svg>
  )
}

export function EarningsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 19V9M9.5 19V5M15 19v-8M20.5 19V3" />
    </svg>
  )
}

export function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function AlertIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 9.5v4.2M12 16.7v0" />
    </svg>
  )
}

export function LedgerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M5 3.5h9.5L19 8v12.5H5V3.5Z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M8 12h8M8 15.5h8M8 18.5h5" />
    </svg>
  )
}

export function PulseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h2l1.5-3 2 6L15 12h1" />
    </svg>
  )
}

export function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" />
      <path d="M14 16l4-4-4-4M18 12H9" />
    </svg>
  )
}

export function MicIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M8.5 21h7" />
    </svg>
  )
}

export function StopIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

export function KeyboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 10h0M9.5 10h0M13 10h0M16.5 10h0M6 14h12" />
    </svg>
  )
}

export function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  )
}

export function BankIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M4.5 9.5v9M9 9.5v9M15 9.5v9M19.5 9.5v9" />
      <path d="M3 20.5h18" />
    </svg>
  )
}

export function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6 3.5h3.2l1.3 4.2-2.1 1.7a11 11 0 0 0 5.2 5.2l1.7-2.1 4.2 1.3V17a2 2 0 0 1-2.2 2C10.9 18.5 5.5 13.1 4 6.7A2 2 0 0 1 6 3.5Z" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3L16 10" />
    </svg>
  )
}

export function ClipboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="6" y="4.5" width="12" height="16" rx="2" />
      <path d="M9 4.5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5" />
      <path d="M9 11h6M9 14.5h6M9 18h3.5" />
    </svg>
  )
}

export function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M4.8 20c.8-4.3 3.4-6.5 7.2-6.5s6.4 2.2 7.2 6.5" />
    </svg>
  )
}

export function BackArrowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="m11 5-6 7 6 7M5 12h14" />
    </svg>
  )
}

export function PillIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3.5" y="9.5" width="17" height="7.5" rx="3.75" transform="rotate(-30 12 13.25)" />
      <path d="m11 9 2.5 6.5" />
    </svg>
  )
}
