'use client'

import { motion } from 'framer-motion'
import { ChartCard, AreaTrend, BarTrend, RadialGauge } from '@/components/shared/charts'
import { GlassCard } from '@/components/shared/ui'
import { attendanceOverview } from '@/lib/mock/attendance'
import { attendanceMonthlyTrend, heatmapData } from './data'

export function AttendanceAnalytics() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Monthly Attendance Trend" subtitle="Recent 6 months · School-wide" className="lg:col-span-2">
          <AreaTrend data={attendanceMonthlyTrend} xKey="name" yKey="value" color="oklch(0.55 0.14 162)" height={280} gradientId="attArea" />
        </ChartCard>
        <GlassCard className="p-3 sm:p-4 lg:p-5 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-sm mb-1 self-start">Overall Rate</h3>
          <p className="text-xs text-muted-foreground mb-3 self-start">Current term average</p>
          <RadialGauge value={93.3} label="present" size={180} />
          <div className="grid grid-cols-3 gap-2 w-full mt-4 text-center text-xs">
            <div className="rounded-xl bg-emerald-500/10 py-2">
              <p className="font-display text-base font-bold text-emerald-600">93.3%</p>
              <p className="text-[10px] text-muted-foreground">Present</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 py-2">
              <p className="font-display text-base font-bold text-amber-600">5.2%</p>
              <p className="text-[10px] text-muted-foreground">Late</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 py-2">
              <p className="font-display text-base font-bold text-rose-600">1.5%</p>
              <p className="text-[10px] text-muted-foreground">Absent</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title="Class-wise Attendance" subtitle="Average % by class" height={300}>
          <BarTrend data={attendanceOverview.byClass.map((c) => ({ name: c.class.replace('Class ', 'C'), value: c.rate }))} xKey="name" yKey="value" color="oklch(0.6 0.14 200)" height={300} />
        </ChartCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-1">Attendance Heatmap</h3>
          <p className="text-xs text-muted-foreground mb-4">Weekly × Daily · 15 weeks</p>
          <div className="space-y-1.5 overflow-x-auto">
            <div className="flex gap-1.5 pl-9">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-5 text-[9px] text-muted-foreground/60 text-center">{i + 1}</div>
              ))}
            </div>
            {heatmapData.map((row, ri) => (
              <div key={row.day} className="flex items-center gap-1.5">
                <span className="w-8 text-[10px] text-muted-foreground font-medium">{row.day}</span>
                <div className="flex gap-1.5">
                  {row.cells.map((c, ci) => {
                    const opacity = Math.min(1, Math.max(0.15, (c - 88) / 12))
                    return (
                      <motion.div
                        key={ci}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity, scale: 1 }}
                        transition={{ delay: ri * 0.04 + ci * 0.005 }}
                        whileHover={{ scale: 1.18 }}
                        title={`${row.day} W${ci + 1}: ${c}%`}
                        className="h-5 w-5 rounded-md"
                        style={{ background: `oklch(0.55 0.14 162 / ${opacity})` }}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-muted-foreground">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[0.15, 0.35, 0.55, 0.75, 1].map((o) => (
                <div key={o} className="h-3 w-3 rounded-sm" style={{ background: `oklch(0.55 0.14 162 / ${o})` }} />
              ))}
            </div>
            <span>High</span>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
