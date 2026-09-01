'use client'

/**
 * Control-plane shared bits for the Super Admin surfaces (Task 7-a):
 *   - TenantStatusPill   → active = emerald · trial = amber · suspended = rose
 *   - TenantPlanChip     → starter / growth / enterprise subtle muted chips
 *   - TenantInitialsTile → school initials tile (tables + headers)
 *   - PlatformChangeValueChip → renders a change-log value (bool on/off / raw string)
 *   - formatPlatformTimestamp → compact '27 Aug · 04:11' formatter
 *
 * ONE vocabulary so the Overview strip, Schools ledger and School Control
 * Center never drift visually.
 */

import { cn } from '@/lib/utils'
import type { TenantPlan, TenantStatus } from '@/lib/tenant/types'

// ─── Status pill ────────────────────────────────────────────────────────

const STATUS_META: Record<TenantStatus, { pill: string; label: string }> = {
  active: { pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', label: 'Active' },
  trial: { pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', label: 'Trial' },
  suspended: { pill: 'bg-rose-500/10 text-rose-700 dark:text-rose-300', label: 'Suspended' },
}

export function TenantStatusPill({ status, className }: { status: TenantStatus; className?: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.active
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap',
        meta.pill,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {meta.label}
    </span>
  )
}

// ─── Plan chip (subtle muted) ───────────────────────────────────────────

const PLAN_LABELS: Record<TenantPlan, string> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

export function TenantPlanChip({ plan, className }: { plan: TenantPlan; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide bg-muted text-muted-foreground ring-1 ring-border whitespace-nowrap',
        className,
      )}
    >
      {PLAN_LABELS[plan] ?? plan}
    </span>
  )
}

// ─── Initials tile ──────────────────────────────────────────────────────

const TILE_SIZES = {
  sm: 'h-7 w-7 text-[10px] rounded-md',
  md: 'h-9 w-9 text-xs rounded-lg',
  lg: 'h-11 w-11 text-sm rounded-lg',
} as const

export function TenantInitialsTile({
  initials,
  size = 'md',
  className,
}: {
  initials: string
  size?: keyof typeof TILE_SIZES
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-bold bg-muted/70 text-muted-foreground ring-1 ring-border/70',
        TILE_SIZES[size],
        className,
      )}
    >
      {initials}
    </span>
  )
}

// ─── Change-log value chip ──────────────────────────────────────────────

export function PlatformChangeValueChip({ value, className }: { value: boolean | string; className?: string }) {
  if (typeof value === 'boolean') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ring-1 whitespace-nowrap',
          value
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20'
            : 'bg-muted text-muted-foreground ring-border',
          className,
        )}
      >
        {value ? 'on' : 'off'}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center max-w-[200px] truncate px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground ring-1 ring-border whitespace-nowrap',
        className,
      )}
      title={value}
    >
      {value}
    </span>
  )
}

// ─── Timestamp formatter ────────────────────────────────────────────────

export function formatPlatformTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} · ${time}`
}
