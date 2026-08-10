'use client'

/**
 * OverviewCharts — Phase 2 redesign.
 *
 * Brief section 4 (Phase 2): "remove the heavy card feel"
 * Brief section 8: shorter top overview (no duplicate class chart)
 * Brief section 10: class filter must control EVERYTHING
 *
 * Layout:
 *   Row 1: Today's Breakdown (1 col) + Weekly Trend (1 col)
 *   Row 2: Monthly Trend (full width, open section)
 *
 * No Class-wise chart at the top — the Class-wise Attendance Report lower
 * on the page remains the authoritative source (Brief §7).
 */

import { ChartCard } from '@/components/shared/charts'
import {
  TrendLine,
  TodayBreakdownStack,
  InsightBadge,
  deriveTrendInsight,
  ATTENDANCE_PALETTE,
} from './attendance-charts'

interface OverviewChartsProps {
  todaysRate: number
  present: number
  absent: number
  late: number
  leave: number
  total: number
  weeklyTrend: { day: string; present: number; rate: number }[]
  monthlyTrend: { month: string; rate: number }[]
}

export function OverviewCharts({
  todaysRate, present, absent, late, leave, total,
  weeklyTrend, monthlyTrend,
}: OverviewChartsProps) {
  // Derive insights from REAL data (no fabrication — Brief §29 + §34)
  const weeklyInsight = deriveTrendInsight(weeklyTrend.map((d) => d.rate))
  const monthlyInsight = deriveTrendInsight(monthlyTrend.map((m) => m.rate))

  const monthlyAvg = monthlyTrend.reduce((s, m) => s + m.rate, 0) / Math.max(monthlyTrend.length, 1)
  const latestMonthly = monthlyTrend[monthlyTrend.length - 1]?.rate ?? 0

  // Today's breakdown — uses the filter-aware numbers passed in
  const breakdownData = [
    { name: 'Present', value: present, color: ATTENDANCE_PALETTE.present },
    { name: 'Late',    value: late,    color: ATTENDANCE_PALETTE.late },
    { name: 'Absent',  value: absent,  color: ATTENDANCE_PALETTE.absent },
    { name: 'Leave',   value: leave,   color: ATTENDANCE_PALETTE.leave },
  ]

  return (
    <>
      {/* Row 1: Today's Breakdown + Weekly Trend — side-by-side on sm+, stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard
          title="Today's Breakdown"
          subtitle="Attendance composition"
        >
          <TodayBreakdownStack
            data={breakdownData}
            centerValue={`${todaysRate}%`}
            centerLabel="Present"
          />
        </ChartCard>

        <ChartCard
          title="Weekly Trend"
          subtitle="Attendance rate · last 6 working days"
          action={<InsightBadge insight={weeklyInsight} />}
        >
          <TrendLine
            data={weeklyTrend.map((d) => ({ name: d.day, value: d.rate }))}
            xKey="name"
            yKey="value"
            color={ATTENDANCE_PALETTE.trend}
            height={240}
            yDomain={[80, 100]}
          />
        </ChartCard>
      </div>

      {/* Row 2: Monthly Trend — full width, open section (Brief §6) */}
      <div className="rounded-xl border border-border/60 bg-card/30 p-4 sm:p-5">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-3 flex-col sm:flex-row">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm tracking-tight">Monthly Trend</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              6-month attendance rate · long-term direction
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="font-mono">6-mo avg</span>
              <span className="font-display font-bold tabular-nums text-foreground">{monthlyAvg.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="font-mono">Latest</span>
              <span className="font-display font-bold tabular-nums text-foreground">{latestMonthly}%</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <InsightBadge insight={monthlyInsight} />
          </div>
        </div>
        <TrendLine
          data={monthlyTrend.map((m) => ({ name: m.month, value: m.rate }))}
          xKey="name"
          yKey="value"
          color={ATTENDANCE_PALETTE.monthly}
          height={200}
          yDomain={[88, 100]}
          averageValue={monthlyAvg}
        />
      </div>
    </>
  )
}
