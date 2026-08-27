'use client'

/**
 * OpenChartSection — an "open" section for trend charts.
 *
 * The chart sits directly on the page surface — NOT trapped inside a card.
 * Only a clean heading + optional subtitle + optional action + a subtle
 * top divider provide structure. The chart itself is the visual.
 *
 * This is the OPPOSITE of wrapping a chart in a Panel/ChartCard. Use this
 * for TREND charts (line/area). Composition/ranking charts (donut, bars)
 * can stay in a compact Panel.
 *
 * Pattern (validated by Attendance overview-charts.tsx):
 *   <section className="py-2">
 *     <div className="flex items-center justify-between">
 *       <div>
 *         <h3 className="text-sm font-semibold">Collection Trend</h3>
 *         <p className="text-xs text-muted-foreground">Monthly collection...</p>
 *       </div>
 *       {action}
 *     </div>
 *     <div className="border-t border-border/40 my-3" />
 *     {children}  ← the chart, directly on the page
 *   </section>
 *
 * Usage:
 *   <OpenChartSection title="Collection Trend" subtitle="monthly collection this academic year" className="lg:col-span-2">
 *     <MiniAreaChart data={analytics.monthly} height={180} />
 *   </OpenChartSection>
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface OpenChartSectionProps {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Show a subtle top divider (default true) */
  divider?: boolean
}

export function OpenChartSection({
  title, subtitle, action, children, className, divider = true,
}: OpenChartSectionProps) {
  return (
    <section className={cn('py-2', className)}>
      {/* Heading row */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-foreground truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {/* Subtle divider — gives structure without a box */}
      {divider && <div className="border-t border-border/40 my-3" />}
      {/* The chart — directly on the page, no card */}
      {children}
    </section>
  )
}
