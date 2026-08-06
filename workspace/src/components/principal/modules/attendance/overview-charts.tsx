'use client'

// Top-of-page charts for the Attendance module:
// Row 1 → Today's Breakdown (donut) + Weekly Trend (bars)
// Row 2 → Monthly Trend (area) + Class-wise Attendance (horizontal bars)

import { ChartCard, BarTrend, AreaTrend, Donut } from '@/components/shared/charts'
import { StatusBadge } from '@/components/shared/ui'
import { attendanceOverview } from '@/lib/mock/attendance'
import { classList } from '@/lib/mock/school'
import { formatNumber } from '@/lib/format'
import { todayBreakdown } from './data'

export function OverviewCharts({ todaysRate }: { todaysRate: number }) {
  return (
    <>
      {/* Charts Row 1: Today's breakdown + Weekly trend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Today's Breakdown" subtitle="By status" className="lg:col-span-1">
          <Donut
            data={todayBreakdown}
            centerValue={`${todaysRate}%`}
            centerLabel="present"
            height={280}
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            {todayBreakdown.map((b) => (
              <div key={b.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                <span className="text-muted-foreground">{b.name}</span>
                <span className="font-semibold ml-auto">{formatNumber(b.value)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Weekly Trend" subtitle="Attendance rate · last 6 working days" className="lg:col-span-2" action={<StatusBadge status="+0.8% WoW" variant="success" dot />}>
          <BarTrend
            data={attendanceOverview.weekTrend.map((d) => ({ name: d.day, value: d.rate }))}
            xKey="name"
            yKey="value"
            color="oklch(0.6 0.14 200)"
            height={280}
          />
        </ChartCard>
      </div>

      {/* Charts Row 2: Monthly trend + Class-wise */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title="Monthly Trend" subtitle="Attendance rate · last 6 months" action={<StatusBadge status="Stable" variant="info" dot />}>
          <AreaTrend
            data={attendanceOverview.monthly.map((m) => ({ name: m.month, value: m.rate }))}
            xKey="name"
            yKey="value"
            color="oklch(0.55 0.14 162)"
            height={260}
            gradientId="monthlyGrad"
          />
        </ChartCard>

        <ChartCard title="Class-wise Attendance" subtitle="Horizontal bar · sorted" action={<StatusBadge status={`${classList.length} classes`} variant="neutral" />}>
          <BarTrend
            data={attendanceOverview.byClass.map((c) => ({ name: c.class, value: c.rate }))}
            xKey="name"
            yKey="value"
            color="oklch(0.65 0.16 75)"
            horizontal
            height={260}
          />
        </ChartCard>
      </div>
    </>
  )
}
