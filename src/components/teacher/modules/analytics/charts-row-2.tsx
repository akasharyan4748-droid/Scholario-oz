'use client'

import { ChartCard, AreaTrend, Donut, RadialGauge } from '@/components/shared/charts'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { attendanceTrend, completionDonut } from './data'

interface Props {
  avgSubmission: number
}

export function ChartsRow2({ avgSubmission }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="Attendance Trend"
        subtitle="Weekly · last 6 weeks"
        action={<StatusBadge status="Above target" variant="success" dot />}
      >
        <AreaTrend data={attendanceTrend} xKey="name" yKey="v" color="oklch(0.7 0.15 200)" height={240} gradientId="teacherAtt" />
      </ChartCard>

      <ChartCard title="Assignment Completion" subtitle="Active homework submission rate">
        <Donut data={completionDonut} height={240} centerValue={`${Math.round(avgSubmission)}%`} centerLabel="submitted" />
      </ChartCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-1">Class Engagement</h3>
        <p className="text-xs text-muted-foreground mb-4">Overall participation score</p>
        <div className="flex items-center justify-center mb-4">
          <RadialGauge value={87} label="engaged" size={170} color="oklch(0.65 0.16 75)" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-emerald-500/10 py-2">
            <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">+12%</p>
            <p className="text-[10px] text-muted-foreground">vs last term</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 py-2">
            <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">3</p>
            <p className="text-[10px] text-muted-foreground">need support</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
