'use client'

/**
 * OverviewCharts — top-of-page charts for the Attendance module.
 *
 * Brief sections 5–11:
 *   Row 1: Today's Breakdown (compact ring) + Weekly Trend (line/area)
 *   Row 2: Monthly Trend (line/area + insight) + Class-wise (ranking list)
 *
 * Replaces the giant-bar / horizontal-bar / oversized-donut layout
 * with a refined, compact, information-dense design that matches
 * the existing Scholario visual language (ChartCard wrapper).
 */

import { ChartCard } from '@/components/shared/charts'
import { StatusBadge } from '@/components/shared/ui'
import { attendanceOverview } from '@/lib/mock/attendance'
import { todayBreakdown } from './data'
import {
  TrendLine,
  CompactRing,
  RankingList,
  ATTENDANCE_PALETTE,
  deriveTrendInsight,
  InsightBadge,
} from './attendance-charts'

export function OverviewCharts({ todaysRate }: { todaysRate: number }) {
  // Derive trend insights from REAL data (no fabrication)
  const monthlyInsight = deriveTrendInsight(attendanceOverview.monthly.map((m) => m.rate))
  const weeklyInsight = deriveTrendInsight(attendanceOverview.weekTrend.map((d) => d.rate))

  // Compute the average for the monthly average reference line
  const monthlyAvg = attendanceOverview.monthly.reduce((s, m) => s + m.rate, 0) / attendanceOverview.monthly.length

  return (
    <>
      {/* Row 1: Today's Breakdown + Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard
          title="Today's Breakdown"
          subtitle="By status · live composition"
        >
          <div className="flex items-center justify-center h-full py-2">
            <CompactRing
              data={todayBreakdown}
              centerValue={`${todaysRate}%`}
              centerLabel="Present"
              size={150}
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Weekly Trend"
          subtitle="Attendance rate · last 6 working days"
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-2">
              <InsightBadge insight={weeklyInsight} />
            </div>
          }
        >
          <TrendLine
            data={attendanceOverview.weekTrend.map((d) => ({ name: d.day, value: d.rate }))}
            xKey="name"
            yKey="value"
            color={ATTENDANCE_PALETTE.trend}
            height={240}
            yDomain={[88, 100]}
          />
        </ChartCard>
      </div>

      {/* Row 2: Monthly Trend + Class-wise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard
          title="Monthly Trend"
          subtitle="6-month attendance rate"
          action={<InsightBadge insight={monthlyInsight} />}
        >
          <TrendLine
            data={attendanceOverview.monthly.map((m) => ({ name: m.month, value: m.rate }))}
            xKey="name"
            yKey="value"
            color={ATTENDANCE_PALETTE.monthly}
            height={220}
            yDomain={[88, 100]}
            averageValue={monthlyAvg}
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>6-month avg: <span className="font-semibold tabular-nums">{monthlyAvg.toFixed(1)}%</span></span>
            <span>Latest: <span className="font-semibold tabular-nums">{attendanceOverview.monthly[attendanceOverview.monthly.length - 1].rate}%</span></span>
          </div>
        </ChartCard>

        <ChartCard
          title="Class-wise Attendance"
          subtitle="Top classes by attendance rate"
          action={<StatusBadge status={`${attendanceOverview.byClass.length} classes`} variant="neutral" />}
        >
          <div className="pt-1">
            <RankingList data={attendanceOverview.byClass.map((c) => ({ name: c.class, value: c.rate }))} maxRows={7} />
          </div>
        </ChartCard>
      </div>
    </>
  )
}
