// Procurement module: shared config maps for PO/quality status badges and the
// `Tab` union type used by the orchestrator. No JSX render components.

export type Tab = 'vendors' | 'orders' | 'receipts'

export const poStatusConfig = {
  Draft: { variant: 'neutral' as const, color: 'bg-muted text-muted-foreground' },
  'Pending Approval': { variant: 'warning' as const, color: 'bg-amber-500/15 text-amber-600' },
  Approved: { variant: 'info' as const, color: 'bg-sky-500/15 text-sky-600' },
  Delivered: { variant: 'success' as const, color: 'bg-emerald-500/15 text-emerald-600' },
  Partial: { variant: 'warning' as const, color: 'bg-orange-500/15 text-orange-600' },
  Cancelled: { variant: 'danger' as const, color: 'bg-rose-500/15 text-rose-600' },
}

export const qualityConfig = {
  Passed: { variant: 'success' as const, color: 'text-emerald-600' },
  Partial: { variant: 'warning' as const, color: 'text-amber-600' },
  Failed: { variant: 'danger' as const, color: 'text-rose-600' },
}
