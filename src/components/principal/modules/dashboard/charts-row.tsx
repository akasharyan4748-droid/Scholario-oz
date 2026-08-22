'use client'

/**
 * ChartsRow1 — the dashboard's primary visualization row.
 *
 * Redesigned (DASH-1):
 *   - Charts wrapped in the shared `Panel` (flat `rounded-xl border border-border
 *     bg-card`) — NOT the legacy boxed `ChartCard` wrapper.
 *   - Revenue vs Expenses uses `AreaTrendChart` from premium-charts (smooth
 *     Catmull-Rom bezier, thin line, subtle gradient, minimal grid). Height
 *     ~200px. The fake "+72M surplus" StatusBadge action chip is removed —
 *     replaced with a "View Finance →" link that navigates to the Finance
 *     Dashboard via `onNavigate('finance')`.
 *   - Fee Collection uses `DonutChart` from premium-charts. Size ~180. The
 *     legend is kept (it's part of the DonutChart component).
 *
 * Removed: `ChartsRow2` (was dead code at lines 76-123 — Attendance Trend bar
 * chart + Today's Attendance radial gauge, both duplicated the Attendance
 * module's analytics).
 */

import { ArrowRight } from 'lucide-react'
import {
  AreaTrendChart,
  DonutChart,
} from '@/components/shared/premium-charts'
import { Panel } from '../shared/panel'
import { revenueAnalytics, feeAnalytics } from '@/lib/mock/finance'

export interface ChartsRowProps {
  onNavigate?: (module: string) => void
}

const formatINRCr = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

export function ChartsRow1({ onNavigate }: ChartsRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Revenue vs Expenses — 2/3 width, smooth AreaTrendChart */}
      <Panel
        title="Revenue vs Expenses"
        subtitle="Last 8 months"
        className="lg:col-span-2"
        action={
          <button
            onClick={() => onNavigate?.('finance')}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            title="Open Finance Dashboard"
          >
            View Finance
            <ArrowRight className="h-3 w-3" />
          </button>
        }
      >
        <AreaTrendChart
          data={revenueAnalytics.monthly}
          height={200}
          formatValue={formatINRCr}
          labelKey="month"
          primaryKey="revenue"
          secondaryKey="expense"
          primaryLabel="Revenue"
          secondaryLabel="Expenses"
          primaryColor="oklch(0.55 0.14 162)"
          secondaryColor="oklch(0.62 0.2 25)"
        />
      </Panel>

      {/* Fee Collection — 1/3 width, DonutChart */}
      <Panel
        title="Fee Collection"
        subtitle="By category"
        action={
          <button
            onClick={() => onNavigate?.('fees')}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            title="Open Fee Management"
          >
            View Fees
            <ArrowRight className="h-3 w-3" />
          </button>
        }
      >
        <div className="flex items-center justify-center h-full">
          <DonutChart
            data={feeAnalytics.byCategory.map((c) => ({ name: c.name, value: c.value, color: c.color }))}
            centerValue={`${feeAnalytics.collectionRate}%`}
            centerLabel="Collected"
            centerSub={`${feeAnalytics.pendingCount} pending`}
            formatValue={formatINRCr}
            size={180}
            thickness={20}
          />
        </div>
      </Panel>
    </div>
  )
}
