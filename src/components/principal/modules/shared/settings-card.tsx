'use client'

/**
 * SettingsCard — the canonical settings card anatomy for Principal Panel
 * modules (Fee Management, Finance Settings, and any future settings
 * surface). Mirrors the Salary & Payroll Settings benchmark: one flat card
 * per settings group — small muted icon + uppercase micro-label (+ optional
 * live summary) on one row, optional right-aligned action, then content.
 *
 * No colored icon chips, no nested panels, no duplicated headings.
 */

import { cn } from '@/lib/utils'

export function SettingsCard({ label, icon, summary, action, children, className }: {
  label: string
  icon?: React.ReactNode
  summary?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-muted-foreground shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
          <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground truncate">{label}</p>
          {summary != null && (
            <span className="text-[10px] text-muted-foreground/70 tabular-nums truncate">· {summary}</span>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children != null && <div className="mt-3">{children}</div>}
    </div>
  )
}

/**
 * SettingsGroupLabel — subtle group micro-header used by longer settings
 * stacks (e.g. the central Finance Settings) to cluster related cards
 * without introducing boxes or nested navigation.
 */
export function SettingsGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1" role="presentation">
      <p className="text-[9px] uppercase font-bold tracking-[0.14em] text-muted-foreground/80 whitespace-nowrap">
        {children}
      </p>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  )
}
