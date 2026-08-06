'use client'

export type Tab = 'postings' | 'candidates' | 'interviews'

export const candidateStatusConfig = {
  New: { variant: 'neutral' as const, color: 'bg-muted text-muted-foreground' },
  Screening: { variant: 'info' as const, color: 'bg-cyan-500/15 text-cyan-600' },
  Interview: { variant: 'warning' as const, color: 'bg-amber-500/15 text-amber-600' },
  Offered: { variant: 'primary' as const, color: 'bg-violet-500/15 text-violet-600' },
  Hired: { variant: 'success' as const, color: 'bg-emerald-500/15 text-emerald-600' },
  Rejected: { variant: 'danger' as const, color: 'bg-rose-500/15 text-rose-600' },
}

export const priorityConfig = {
  high: 'bg-rose-500/15 text-rose-600',
  medium: 'bg-amber-500/15 text-amber-600',
  low: 'bg-muted text-muted-foreground',
}
