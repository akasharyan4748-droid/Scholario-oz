'use client'

// Reusable presentational pieces shared across the Attendance module.

import { motion } from 'framer-motion'
import { RadialGauge } from '@/components/shared/charts'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { attendanceOverview } from '@/lib/mock/attendance'
import { decemberCalendar } from './data'

// Color-coded legend strip rendered beneath the December heatmap.
export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-3 border-t border-border">
      <span className="font-medium">Legend:</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500/85 border border-emerald-600" /> ≥95%</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-400/60 border border-emerald-500" /> 90–94%</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400/70 border border-amber-500" /> 85–89%</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-400/70 border border-rose-500" /> &lt;85%</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-muted/40 border border-border" /> Weekend/Holiday</span>
    </div>
  )
}

// Detail panel shown beneath the heatmap when a day is selected.
export function DayDetailCard({ selectedDay }: { selectedDay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-xl border border-border bg-card/40 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Selected Day</p>
          <p className="font-display text-lg font-bold">
            {new Date(2025, 11, selectedDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <RadialGauge value={decemberCalendar.find((c) => c.day === selectedDay)?.rate ?? 0} label="present" size={90} />
      </div>
      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter value={Math.round(attendanceOverview.today.total * 0.94)} />
          </p>
          <p className="text-[10px] text-muted-foreground">Present</p>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">
            <AnimatedCounter value={Math.round(attendanceOverview.today.total * 0.012)} />
          </p>
          <p className="text-[10px] text-muted-foreground">Late</p>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">
            <AnimatedCounter value={Math.round(attendanceOverview.today.total * 0.045)} />
          </p>
          <p className="text-[10px] text-muted-foreground">Absent</p>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-cyan-600 dark:text-cyan-400">
            <AnimatedCounter value={Math.round(attendanceOverview.today.total * 0.005)} />
          </p>
          <p className="text-[10px] text-muted-foreground">Leave</p>
        </div>
      </div>
    </motion.div>
  )
}
