'use client'

/**
 * AttendanceHeatmap — compact analytics calendar.
 *
 * Brief section 9: Reduce cell height, restrained color scale,
 * feel like a premium analytics calendar (not a wall of large cards).
 *
 * Brief section 10: When a day is selected, the Selected Day card is
 * visually connected (renders INSIDE the heatmap card, not as a
 * separate unrelated card below).
 */

import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { decemberCalendar, rateColor } from './data'
import { CalendarLegend, SelectedDayPanel } from './shared'

type HeatmapProps = {
  selectedDay: number | null
  setSelectedDay: (d: number | null) => void
}

export function AttendanceHeatmap({ selectedDay, setSelectedDay }: HeatmapProps) {
  const reduce = useReducedMotion()

  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
            December 2025 — Attendance Heatmap
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            Tap a day to view details · Color intensity reflects attendance rate
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Previous month" disabled>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-semibold font-mono tabular-nums">DEC 2025</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Next month" disabled>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Compact calendar grid — non-square cells to save vertical space */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="text-center text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
        {decemberCalendar.map((cell, idx) => {
          if (cell.day === null) {
            return <div key={`empty-${idx}`} className="h-8 sm:h-9" />
          }
          const isSelected = selectedDay === cell.day
          const isInteractive = !cell.isWeekend && !cell.isHoliday && cell.rate !== null
          return (
            <motion.button
              key={cell.day}
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(idx * 0.008, 0.3), duration: 0.3 }}
              whileHover={isInteractive && !reduce ? { scale: 1.06, zIndex: 2 } : undefined}
              whileTap={isInteractive && !reduce ? { scale: 0.96 } : undefined}
              onClick={() => isInteractive && setSelectedDay(cell.day)}
              aria-label={isInteractive ? `December ${cell.day}, ${cell.rate}% attendance` : `December ${cell.day}, weekend or holiday`}
              aria-pressed={isSelected}
              className={`h-8 sm:h-9 rounded-md border flex items-center justify-center text-[10px] sm:text-[11px] font-semibold tabular-nums transition-all ${
                rateColor(cell.rate)
              } ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''} ${
                isInteractive ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'
              }`}
            >
              <span>{cell.day}</span>
            </motion.button>
          )
        })}
      </div>

      <CalendarLegend />

      {/* Selected day details — visually connected to the heatmap (Brief 10) */}
      {selectedDay !== null && (
        <SelectedDayPanel selectedDay={selectedDay} />
      )}
    </GlassCard>
  )
}
