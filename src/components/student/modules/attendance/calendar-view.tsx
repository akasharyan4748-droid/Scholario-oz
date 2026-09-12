'use client'

/**
 * attendance/calendar-view — the primary attendance experience (§21–§24, gen 2).
 *
 * The calendar IS the attendance page's visual object: each school day
 * carries its meaning as a confident soft tint (present green, late
 * amber, absent pink, leave blue, holiday violet — §21), the month
 * opens with a compact colour-coded summary strip (§24) instead of
 * repeated sentences, and month navigation stays bounded by the real
 * record history with a smooth transition (§23). Tapping a day opens a
 * compact inline detail panel (never a modal) showing ONLY the fields
 * the record actually carries (§22).
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
      {/* ── Month navigation — smooth, bounded by real history (§23) ── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight text-foreground">{monthLabel(cursor)}</h3>
            {isCurrentMonth && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Current
              </span>
            )}
          </div>
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

      {/* ── Month summary — compact colour-coded facts, not sentences (§24) ── */}
      <div className="mb-3.5 flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/30 px-2.5 py-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground/80">
          {monthStats.total} / {workingDays} recorded
        </span>
        {monthStats.total > 0 ? (
          <>
            <span aria-hidden className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              {monthStats.percent}%
            </span>
            <span aria-hidden className="text-border">·</span>
            <span className="inline-flex items-center gap-2 text-[11px] font-medium tabular-nums text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                {monthStats.present}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                {monthStats.late}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
                {monthStats.absent}
              </span>
            </span>
          </>
        ) : (
          <>
            <span aria-hidden className="text-border">·</span>
            <span className="px-2 py-0.5 text-[11px] font-medium text-muted-foreground">No records yet</span>
          </>
        )}
      </div>

      {/* ── Grid: Monday-first school week — the visual object (§21) ── */}
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
                    'relative flex aspect-square flex-col items-center justify-center gap-[3px] rounded-lg text-xs font-semibold transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    token.cell,
                    !isSelected && 'hover:brightness-[0.97]',
                    isToday && !isSelected && 'ring-1 ring-primary/60',
                    isSelected && 'z-[1] scale-[1.06] ring-2 ring-primary ring-offset-1 ring-offset-background shadow-sm',
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

      {/* ── Legend — status is never colour alone (§46) ── */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/70 pt-3.5 text-[10px] font-medium text-muted-foreground">
        {(['present', 'late', 'absent', 'leave', 'holiday', 'norecord'] as const).map((kind) => (
          <span key={kind} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', statusToken(kind).dot)} aria-hidden />
            {statusToken(kind).label}
          </span>
        ))}
      </div>

      {/* ── Day detail — compact, inline, only actual fields (§22) ── */}
      <AnimatePresence mode="wait">
        {selectedCell && (
          <DayDetail key={selectedCell.iso} cell={selectedCell} todayIso={todayIso} classLabel={classLabel} />
        )}
      </AnimatePresence>
    </GlassCard>
  )
}

/* ── Inline day detail panel — the record's own facts ─────────────── */

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

      {/* Only fields the record actually carries (§22) */}
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
