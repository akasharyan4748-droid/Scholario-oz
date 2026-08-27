'use client'

/**
 * ChartsRow1 — the dashboard's primary visualization row.
 *
 * Redesigned (DASH-1 + FC-1):
 *   - Revenue vs Expenses uses `AreaTrendChart` from premium-charts (smooth
 *     Catmull-Rom bezier, thin 1.5px line, NO area fill via `showArea={false}`).
 *     Wrapped in `OpenChartSection` — the chart sits DIRECTLY on the page
 *     with just a heading + subtle divider. No card border, no boxed Panel.
 *     Height 200px. The "View Finance →" link still navigates to Finance.
 *   - Fee Collection uses `DonutChart` from premium-charts (composition chart,
 *     size 180). Stays in a compact `Panel` — donuts benefit from the card.
 *
 * Removed: `ChartsRow2` (was dead code — Attendance Trend bar chart + Today's
 * Attendance radial gauge, both duplicated the Attendance module's analytics).
 */

import { ArrowRight } from 'lucide-react'
import {
  AreaTrendChart,
  DonutChart,
} from '@/components/shared/premium-charts'
import { Panel } from '../shared/panel'
import { OpenChartSection } from '../shared/open-chart-section'
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
      {/* Revenue vs Expenses — 2/3 width, OPEN smooth line chart (no card border) */}
      <OpenChartSection
        className="lg:col-span-2"
        title="Revenue vs Expenses"
        subtitle="Last 8 months"
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
          showArea={false}
        />
      </OpenChartSection>

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
        <div className="flex items-center justify-center py-2">
          <DonutChart
            data={feeAnalytics.byCategory.map((c) => ({ name: c.name, value: c.value, color: c.color }))}
            centerValue={`${feeAnalytics.collectionRate}%`}
            centerLabel="Collected"
            centerSub={`${feeAnalytics.pendingCount} pending`}
            formatValue={formatINRCr}
            size={160}
            thickness={18}
          />
        </div>
      </Panel>
    </div>
  )
}
