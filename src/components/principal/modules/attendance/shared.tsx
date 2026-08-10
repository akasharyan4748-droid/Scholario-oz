'use client'

/**
 * Attendance shared presentational pieces.
 *
 * CalendarLegend — compact color legend strip.
 * SelectedDayPanel — Brief §10: connected to heatmap (renders inside).
 *   Brief §19: includes "View full attendance →" CTA.
 *
 * Brief §29 + §34: derived counts use day's `rate` × school total.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { attendanceOverview } from '@/lib/mock/attendance'
import { decemberCalendar } from './data'
import { formatNumber } from '@/lib/format'
import { ATTENDANCE_PALETTE } from './attendance-charts'

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-muted-foreground pt-2.5 mt-2.5 border-t border-border">
      <span className="font-medium">Legend:</span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/85 border border-emerald-600" /> ≥95%
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400/60 border border-emerald-500" /> 90–94%
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-amber-400/70 border border-amber-500" /> 85–89%
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-rose-400/70 border border-rose-500" /> &lt;85%
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-muted/40 border border-border" /> Weekend/Holiday
      </span>
    </div>
  )
}

/**
 * SelectedDayPanel — Brief §10 (connected to heatmap) + §19 (View full CTA).
 */
export function SelectedDayPanel({
  selectedDay,
  onViewFullAttendance,
}: {
  selectedDay: number
  onViewFullAttendance?: () => void
}) {
  const reduce = useReducedMotion()
  const cell = decemberCalendar.find((c) => c.day === selectedDay)
  const rate = cell?.rate ?? 0
  const dateLabel = new Date(2025, 11, selectedDay).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // Derived counts — same proportional computation as the original.
  const total = attendanceOverview.today.total
  const presentCount = Math.round(total * rate / 100)
  const lateCount = Math.round(total * 0.012)
  const absentCount = Math.max(0, total - presentCount - lateCount - Math.round(total * 0.005))
  const leaveCount = Math.round(total * 0.005)

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mt-3 rounded-lg border border-primary/30 bg-primary/5 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-primary/20 bg-primary/5">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-primary">Selected Day</p>
          <p className="text-xs font-semibold text-foreground truncate">{dateLabel}</p>
        </div>
        <div className="flex items-baseline gap-1 shrink-0">
          <span className="font-display text-2xl font-bold tabular-nums text-primary">{rate}%</span>
          <span className="text-[10px] text-muted-foreground">attendance</span>
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-border">
        <StatTile label="Present" value={presentCount} color={ATTENDANCE_PALETTE.present} />
        <StatTile label="Late" value={lateCount} color={ATTENDANCE_PALETTE.late} />
        <StatTile label="Absent" value={absentCount} color={ATTENDANCE_PALETTE.absent} />
        <StatTile label="Leave" value={leaveCount} color={ATTENDANCE_PALETTE.leave} />
      </div>

      {/* Brief §19: View full attendance → CTA */}
      {onViewFullAttendance && (
        <div className="px-3 py-2 border-t border-primary/20 bg-primary/5">
          <button
            onClick={onViewFullAttendance}
            className="text-[11px] font-semibold text-primary hover:underline underline-offset-2 flex items-center gap-1 transition-colors"
          >
            View full attendance
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-2 py-2 text-center">
      <p className="font-display text-sm sm:text-base font-bold tabular-nums" style={{ color }}>
        {formatNumber(value)}
      </p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
