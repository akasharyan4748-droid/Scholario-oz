'use client'

/**
 * attendance/calendar-view — the primary attendance experience (§8–§11, §31).
 *
 * A premium month calendar in the Timetable's visual language: soft status
 * tints (never solid blocks), Monday-first school week, month navigation
 * bounded by the real record history, and a compact day-detail panel that
 * opens inline (never a modal) showing ONLY fields the record actually has.
 *
 * Day resolution honours the school calendar (§31): holidays render as
 * HOLIDAY, unrecorded school days as NO RECORD — never silently Absent.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { AttendanceStats } from '@/lib/store/student-attendance-store'
import { statusToken, type DayCell } from './status-tokens'
import { formatLongDate, formatRecordedAt, monthLabel, type MonthCursor } from './date-utils'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Days that carry a status dot in the grid (quiet for neutral days). */
const DOTTED = new Set(['present', 'late', 'absent', 'leave', 'holiday'])

interface CalendarViewProps {
  cursor: MonthCursor
  isCurrentMonth: boolean
  canPrev: boolean
  canNext: boolean
  onShift: (delta: number) => void
  grid: DayCell[]
  todayIso: string
  selected: string | null
  onSelect: (iso: string) => void
  classLabel: string
  monthStats: AttendanceStats
  workingDays: number
}

export function CalendarView({
  cursor, isCurrentMonth, canPrev, canNext, onShift, grid, todayIso, selected, onSelect, classLabel, monthStats, workingDays,
}: CalendarViewProps) {
  const selectedCell = selected ? grid.find((c) => c.iso === selected) ?? null : null

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      {/* ── Month navigation — subtle, bounded by real history (§9) ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight text-foreground">{monthLabel(cursor)}</h3>
            {isCurrentMonth && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Current
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {monthStats.total > 0
              ? `${workingDays} school days · ${monthStats.total} recorded · ${monthStats.percent}% attended`
              : `${workingDays} school days · no records yet`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canPrev}
            onClick={() => onShift(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!canNext}
            onClick={() => onShift(1)}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Grid: Monday-first school week ── */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label={`Attendance calendar — ${monthLabel(cursor)}`}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            {d}
          </div>
        ))}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${cursor.y}-${cursor.m}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="col-span-7 grid grid-cols-7 gap-1 sm:gap-1.5"
          >
            {grid.map((cell) => {
              if (cell.day === null) return <span key={cell.key} aria-hidden className="aspect-square" />
              const token = statusToken(cell.kind)
              const isToday = cell.iso === todayIso
              const isSelected = cell.iso === selected
              const dotted = DOTTED.has(cell.kind)
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => onSelect(cell.iso)}
                  aria-label={`${formatLongDate(cell.iso)} — ${cell.holidayName ? `${cell.holidayName} (holiday)` : token.aria}`}
                  aria-pressed={isSelected || undefined}
                  title={cell.holidayName ?? undefined}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center gap-[3px] rounded-lg text-xs font-semibold transition-shadow',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    token.cell,
                    isToday && !isSelected && 'ring-1 ring-primary/50',
                    isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                  )}
                >
                  <span className="tabular-nums leading-none">{cell.day}</span>
                  {dotted && <span className={cn('h-1.5 w-1.5 rounded-full', token.dot)} aria-hidden />}
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Legend — status is never colour alone (§36) ── */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/70 pt-3.5 text-[10px] font-medium text-muted-foreground">
        {(['present', 'late', 'absent', 'leave', 'holiday', 'norecord'] as const).map((kind) => (
          <span key={kind} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', statusToken(kind).dot)} aria-hidden />
            {statusToken(kind).label}
          </span>
        ))}
      </div>

      {/* ── Day detail — inline, only actual fields (§11, §23) ── */}
      <AnimatePresence mode="wait">
        {selectedCell && (
          <DayDetail key={selectedCell.iso} cell={selectedCell} todayIso={todayIso} classLabel={classLabel} />
        )}
      </AnimatePresence>
    </GlassCard>
  )
}

/* ── Inline day detail panel ─────────────────────────────────────── */

function DayDetail({ cell, todayIso, classLabel }: { cell: DayCell; todayIso: string; classLabel: string }) {
  const token = statusToken(cell.kind)
  const Icon = token.icon
  const r = cell.record
  const recordedAt = r ? formatRecordedAt(r.markedAt) : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="mt-3.5 rounded-xl border border-border bg-muted/20 p-3.5 sm:p-4"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', token.chip)}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-foreground">
              {formatLongDate(cell.iso)}
              {cell.iso === todayIso && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  Today
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {r
                ? `${classLabel} · Full-day attendance`
                : cell.kind === 'holiday'
                  ? `${cell.holidayName} — school holiday`
                  : cell.kind === 'weekend'
                    ? 'Weekend — no school'
                    : cell.kind === 'future'
                      ? 'School day — attendance not yet recorded'
                      : 'School day — no attendance record'}
            </p>
          </div>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', token.chip)}>
          {token.label}
        </span>
      </div>

      {/* Only fields the record actually carries (§11) */}
      {r && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          {r.markedBy && <span>Marked by <span className="font-medium text-foreground/80">{r.markedBy}</span></span>}
          {recordedAt && <span>Recorded {recordedAt}</span>}
          {r.note && <span className="min-w-0 basis-full truncate sm:basis-auto">Note: {r.note}</span>}
        </div>
      )}
    </motion.div>
  )
}
