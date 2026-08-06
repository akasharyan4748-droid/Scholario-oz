// Small shared presentational helpers used across the communication module.

export function SignalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
      <rect x="2" y="14" width="3" height="6" rx="0.5" />
      <rect x="7" y="10" width="3" height="10" rx="0.5" />
      <rect x="12" y="6" width="3" height="14" rx="0.5" />
      <rect x="17" y="2" width="3" height="18" rx="0.5" />
    </svg>
  )
}

export function formatDateShort(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateMonthDay(date: string | Date) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
