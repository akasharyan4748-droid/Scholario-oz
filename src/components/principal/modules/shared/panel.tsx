'use client'

/**
 * Panel — the shared flat section container for SCHOLARIO modules.
 *
 * Matches the Academics (Examinations + Attendance) visual pattern:
 *   - flat rounded card, NO separate colored header strip with border-b
 *   - title + optional subtitle + optional action on one row
 *   - body content below with consistent padding
 *
 * This is the SINGLE source of truth for section containers across all
 * Principal modules. Replaces the 10+ module-specific Panel components
 * (FeePanel, SalaryPanel, FinancePanel, LibPanel, TptPanel, InvPanel,
 * CertPanel, CommPanel, CalPanel, DownloadsPanel) that had drifted from
 * the Academics pattern.
 *
 * Design (from exams/overview-tab.tsx + attendance sections):
 *   Container: rounded-xl border border-border bg-card overflow-hidden p-4
 *   Title: text-sm font-semibold
 *   Subtitle: text-xs text-muted-foreground mt-0.5
 *   Action: rendered on the right (shrink-0)
 *
 * NOTE: `overflow-hidden` is included so that tables rendered with
 * `bodyClassName="p-0"` (flush to the panel edges) get their corners
 * clipped to the rounded-xl border — matching the legacy module-specific
 * Panel components (FeePanel / LibPanel / TptPanel / InvPanel / ...) which
 * all carried `overflow-hidden` for the same reason. For bodies with the
 * default `p-4` padding the overflow-hidden has no visible effect.
 *
 * Usage:
 *   <Panel title="Collection Trend" subtitle="Last 8 months" action={<Button/>}>
 *     <Chart ... />
 *   </Panel>
 *
 *   <Panel title="Fee Head Distribution">
 *     <DonutChart ... />
 *   </Panel>
 *
 *   // No title — just a flat container
 *   <Panel>
 *     <Table ... />
 *   </Panel>
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PanelProps {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Use h3 instead of div for the title (semantic heading). Default true. */
  heading?: boolean
}

export function Panel({
  title, subtitle, action, children, className, bodyClassName, heading = true,
}: PanelProps) {
  const hasHeader = title || subtitle || action
  const TitleTag = heading ? 'h3' : 'div'

  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      {hasHeader && (
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
          <div className="min-w-0">
            {title && (
              <TitleTag className="text-sm font-semibold tracking-tight text-foreground truncate">
                {title}
              </TitleTag>
            )}
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</div>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-4', !hasHeader && 'p-4', bodyClassName)}>
        {children}
      </div>
    </div>
  )
}

/**
 * PanelGrid — convenience wrapper for a grid of Panels.
 * Matches the Academics 2-column chart row pattern:
 *   grid grid-cols-1 lg:grid-cols-2 gap-4
 */
export function PanelGrid({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[columns]
  return <div className={cn('grid gap-4', colClass, className)}>{children}</div>
}
