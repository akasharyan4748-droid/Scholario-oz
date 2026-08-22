'use client'

/**
 * charts-row — Dashboard's primary visualization rows.
 *
 * Migrated from the legacy Recharts-based system to SCHOLARIO's unified
 * premium-charts system so every chart across the app shares the same
 * animation, hover behaviour, colour system and tooltip style.
 *
 * Data sources are unchanged — still @/lib/mock/finance + @/lib/mock/attendance.
 * Only the visualization layer was upgraded.
 */

import { GlassCard, StatusBadge } from '@/components/shared/ui'
import {
  AreaTrendChart,
  BarTrend,
  DonutChart,
  RadialProgress,
} from '@/components/shared/premium-charts'
import { ChartCard } from '@/components/shared/charts'
import { revenueAnalytics, feeAnalytics } from '@/lib/mock/finance'
import { attendanceOverview } from '@/lib/mock/attendance'
import { formatNumber } from '@/lib/format'

const formatINRCr = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN')}`
}

// ChartsRow1 — Revenue vs Expenses (dual area, lg:col-span-2) + Fee Collection
// donut. This is the primary financial visualisation row of the dashboard.
export function ChartsRow1() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="Revenue vs Expenses"
        subtitle="Last 8 months"
        className="lg:col-span-2"
        action={<StatusBadge status="+72M surplus" variant="success" dot />}
      >
        <AreaTrendChart
          data={revenueAnalytics.monthly}
          height={240}
          formatValue={formatINRCr}
          labelKey="month"
          primaryKey="revenue"
          secondaryKey="expense"
          primaryLabel="Revenue"
          secondaryLabel="Expenses"
          primaryColor="oklch(0.55 0.14 162)"
          secondaryColor="oklch(0.62 0.2 25)"
        />
      </ChartCard>

      <ChartCard title="Fee Collection" subtitle="By category">
        <div className="flex items-center justify-center h-full">
          <DonutChart
            data={feeAnalytics.byCategory.map((c) => ({ name: c.name, value: c.value, color: c.color }))}
            centerValue={`${feeAnalytics.collectionRate}%`}
            centerLabel="Collected"
            centerSub={`${feeAnalytics.pendingCount} pending`}
            formatValue={formatINRCr}
            size={220}
            thickness={22}
          />
        </div>
      </ChartCard>
    </div>
  )
}

// ChartsRow2 — Attendance Trend bar chart (lg:col-span-2) + the Today's
// Attendance radial gauge card with present/absent/late breakdown.
export function ChartsRow2() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard title="Attendance Trend" subtitle="This week" className="lg:col-span-2">
        <BarTrend
          data={attendanceOverview.weekTrend.map((d) => ({ name: d.day, value: d.rate }))}
          height={220}
          formatValue={(n) => `${n.toFixed(1)}%`}
          color="oklch(0.6 0.14 200)"
          labelKey="name"
          valueKey="value"
        />
      </ChartCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-1">Today's Attendance</h3>
        <p className="text-xs text-muted-foreground mb-4">Class 1–12 · {formatNumber(attendanceOverview.today.total)} students</p>
        <div className="flex items-center justify-center mb-4">
          <RadialProgress
            value={attendanceOverview.today.rate}
            max={100}
            size={170}
            thickness={14}
            color="oklch(0.55 0.14 162)"
            label="Present"
            showTicks
            glow
            formatValue={(n) => `${n.toFixed(1)}%`}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-500/10 py-2">
            <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">{attendanceOverview.today.present}</p>
            <p className="text-[10px] text-muted-foreground">Present</p>
          </div>
          <div className="rounded-xl bg-rose-500/10 py-2">
            <p className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">{attendanceOverview.today.absent}</p>
            <p className="text-[10px] text-muted-foreground">Absent</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 py-2">
            <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">{attendanceOverview.today.late}</p>
            <p className="text-[10px] text-muted-foreground">Late</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
