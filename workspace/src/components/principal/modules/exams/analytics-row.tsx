'use client'

// Exam analytics row: Pass Percentage radial gauge + Grade Distribution donut
// + Subject Performance bar chart.

import { Target } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ChartCard, BarTrend, Donut, RadialGauge } from '@/components/shared/charts'
import { examAnalytics } from '@/lib/mock/academics'

export function ExamsAnalyticsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Pass Percentage
        </h3>
        <p className="text-xs text-muted-foreground mb-2">Across all declared results</p>
        <div className="flex items-center justify-center">
          <RadialGauge value={examAnalytics.passPercentage} label="pass rate" size={200} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-center">
            <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {examAnalytics.distinction}
            </p>
            <p className="text-[10px] text-muted-foreground">Distinctions (≥75%)</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-2.5 text-center">
            <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">
              {examAnalytics.firstClass}
            </p>
            <p className="text-[10px] text-muted-foreground">First Class (≥60%)</p>
          </div>
        </div>
      </GlassCard>

      <ChartCard title="Grade Distribution" subtitle="All declared exams">
        <Donut
          data={examAnalytics.gradeDistribution.map((g) => ({
            name: g.grade,
            value: g.count,
            color: g.color,
          }))}
          centerValue={`${examAnalytics.averageScore}%`}
          centerLabel="Avg score"
          height={260}
        />
      </ChartCard>

      <ChartCard title="Subject Performance" subtitle="Average score by subject">
        <BarTrend
          data={examAnalytics.subjectPerformance.map((s) => ({
            name: s.subject.length > 7 ? s.subject.slice(0, 4) : s.subject,
            subject: s.subject,
            avg: s.avg,
          }))}
          xKey="name"
          yKey="avg"
          color="oklch(0.65 0.16 75)"
          height={260}
        />
      </ChartCard>
    </div>
  )
}
