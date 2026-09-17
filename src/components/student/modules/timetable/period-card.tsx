'use client'

/**
 * Student Timetable — PeriodCard.
 *
 * Principal-grade card language with Student personality:
 *   - subject card: soft subject-tinted surface + hairline ring, gradient
 *     time tile, strong subject typography, teacher/room with Lucide icons
 *   - break / lunch: NEUTRAL structural row (dashed border, muted icons) —
 *     never the colourful subject treatment
 *   - live states (today only): NOW = refined emphasis (stronger ring +
 *     tinted surface + tiny NOW badge + whisper-quiet edge animation),
 *     NEXT = outlined badge, completed = dimmed + check — hierarchy
 *     Past < Current < Upcoming stays obvious at a glance
 *   - recent change: one subtle emerald "old → new" chip (72h TTL, driven
 *     by the Principal's publication history — see timetable-store)
 */
import { motion } from 'framer-motion'
import { Coffee, UtensilsCrossed, User, MapPin, Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DayEntry, LiveSlotState } from './time-utils'
import { startTimeLabel } from './time-utils'
import { subjectColor } from './subject-colors'
import type { TimetableChange } from '@/lib/store/timetable-store'

export function PeriodCard({
  entry,
  index,
  live,
  badge,
  change,
}: {
  entry: DayEntry
  index: number
  /** Live state — only passed for TODAY's schedule (null otherwise). */
  live?: LiveSlotState | null
  /** 'next' only on the FIRST upcoming slot of today. */
  badge?: 'now' | 'next' | null
  /** Recent published change affecting this slot (subtle chip). */
  change?: TimetableChange | null
}) {
  // ── Structural break row — calm, neutral, clearly not a subject ──
  // (11-unit tile mirrors the subject time tile so every row's text
  // starts on the same vertical rhythm — no ragged left edge.)
  if (entry.isBreak) {
    const isLunch = entry.breakType === 'lunch'
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        aria-label={`${entry.name}, ${entry.time}`}
        className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {isLunch ? <UtensilsCrossed className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{entry.name}</p>
          <p className="text-[11px] text-muted-foreground/70">{entry.time}</p>
        </div>
      </motion.div>
    )
  }

  const slot = entry.slot
  if (!slot) return null
  const sc = subjectColor(slot.subject)
  const isCurrent = live === 'current'
  const isCompleted = live === 'completed'
  const start = startTimeLabel(entry.time)

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -2 }}
      aria-label={`${slot.subject}, ${entry.time}, ${slot.teacherName}, ${slot.room}`}
      className={cn(
        'group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 transition-shadow hover:shadow-premium',
        isCurrent
          ? 'border-primary/40 bg-primary/[0.06] ring-1 ring-primary/25 shadow-sm'
          : isCompleted
            ? cn('border-transparent opacity-55', sc.bg)
            : cn('border-transparent', sc.bg, 'ring-1', sc.ring)
      )}
    >
      {/* NOW edge marker — whisper-quiet breathing, never a pulsing card */}
      {isCurrent && (
        <motion.span
          aria-hidden
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary"
        />
      )}

      {/* Gradient time tile — the strongest colour anchor */}
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md',
          sc.gradient
        )}
      >
        <span className="text-[11px] font-bold leading-none">{start.replace(/ (AM|PM)/, '')}</span>
        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide opacity-90">
          {start.match(/(AM|PM)/)?.[0] ?? ''}
        </span>
      </div>

      {/* Subject + teacher + room */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn('truncate text-sm font-semibold', sc.text)}>{slot.subject}</p>
          {isCompleted && (
            <span title="Completed" className="inline-flex shrink-0">
              <Check className="h-3 w-3 text-muted-foreground" aria-label="Class completed" />
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="flex min-w-0 items-center gap-0.5">
            <User className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{slot.teacherName}</span>
          </span>
          <span className="flex min-w-0 items-center gap-0.5">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{slot.room}</span>
          </span>
        </div>
        {/* Recent published change — compact old → new */}
        {change?.changeLabel && (
          <p className="mt-1 flex items-center gap-1 truncate text-[10px] font-medium text-emerald-600 dark:text-emerald-400" title={change.summary}>
            <ArrowRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
            <span className="truncate">{change.changeLabel}</span>
          </p>
        )}
      </div>

      {/* Live state badges — at most one per card, only on TODAY */}
      {isCurrent && (
        <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
          Now
        </span>
      )}
      {badge === 'next' && !isCurrent && !isCompleted && (
        <span className="inline-flex shrink-0 items-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Next
        </span>
      )}
    </motion.article>
  )
}
