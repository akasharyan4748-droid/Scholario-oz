// Hostel module: room-status badge config + tab union.

export type Tab = 'blocks' | 'rooms' | 'mess'

export const roomStatusConfig = {
  Occupied: { variant: 'success' as const, color: 'border-emerald-500/30 bg-emerald-500/5' },
  Partial: { variant: 'warning' as const, color: 'border-amber-500/30 bg-amber-500/5' },
  Vacant: { variant: 'info' as const, color: 'border-sky-500/30 bg-sky-500/5' },
  Maintenance: { variant: 'danger' as const, color: 'border-rose-500/30 bg-rose-500/5' },
}
