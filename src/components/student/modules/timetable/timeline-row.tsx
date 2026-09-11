'use client'

/**
 * Student Timetable — MY CLASS vertical timeline row.
 *
 * One period = one row, in strict chronological order:
 *
 *   08:30  ●  PERIOD 1
 *          │  Hindi                      ← big, subject-coloured
 *          │  Meera Krishnan · Room 102
 *   09:15  ●  PERIOD 2
 *          │  Mathematics   …
 *
 * Visual language (deliberately quiet):
 *   - thin connector line + small period nodes on a left rail
 *   - time label on the rail, period eyebrow on the card
 *   - LARGE subject title (typography hierarchy: Day > Time > Subject)
 *   - teacher + room as quiet metadata
 *   - subject colour = identity (node + title + soft surface tint)
 *   - NOW / NEXT: STATIC emphasis only — no pulsing, no blinking,
 *     no persistent animation (accessibility discipline)
 *   - breaks/lunch: neutral slim structural rows (never subject styling)
 */
import { motion } from 'framer-motion'
import { Coffee, UtensilsCrossed, User, MapPin, Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DayEntry, LiveSlotState } from './time-utils'
import { startTimeLabel } from './time-utils'
import { subjectColor } from './subject-colors'
import type { TimetableChange } from '@/lib/store/timetable-store'

export function TimelineRow({
  entry,
  isFirst,
  isLast,
  live,
  badge,
  change,
}: {
  entry: DayEntry
  /** Caps the connector line above the first node / below the last. */
  isFirst: boolean
  isLast: boolean
  /** Live state — only passed when the selected day IS today. */
  live?: LiveSlotState | null
  /** 'next' only on the FIRST upcoming period of today. */
  badge?: 'next' | null
  /** Recent published change affecting this slot (subtle emerald chip). */
  change?: TimetableChange | null
}) {
  if (entry.isBreak) {
    return <BreakRow entry={entry} isFirst={isFirst} isLast={isLast} />
  }

  const slot = entry.slot
  if (!slot) return null

  const sc = subjectColor(slot.subject)
  const isCurrent = live === 'current'
  const isCompleted = live === 'completed'
  const start = startTimeLabel(entry.time)
  const [startClock, startMer] = start.split(' ')

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex gap-3 sm:gap-4"
      aria-label={`${entry.name}, ${entry.time}, ${slot.subject}, ${slot.teacherName}, ${slot.room}`}
    >
      {/* ── Time rail ── */}
      <div className="w-14 shrink-0 pt-[15px] text-right sm:w-16">
        <p className="text-xs font-semibold tabular-nums leading-none text-foreground/80">{startClock}</p>
        <p className="mt-1 text-[9px] font-medium uppercase leading-none tracking-wider text-muted-foreground/70">
          {startMer}
        </p>
      </div>

      {/* ── Connector line + period node ── */}
      <div className="relative w-px shrink-0 self-stretch" aria-hidden>
        <span
          className={cn(
            'absolute left-0 w-px bg-border',
            isFirst ? 'top-[21px]' : 'top-0',
            isLast ? 'bottom-[calc(100%-21px)]' : 'bottom-0'
          )}
        />
        <span
          className={cn(
            'absolute -left-[4.5px] top-4 h-2.5 w-2.5 rounded-full ring-4 ring-card',
            isCurrent ? 'bg-primary' : isCompleted ? 'bg-muted-foreground/40' : sc.dot
          )}
        />
      </div>

      {/* ── Period card ── */}
      <div className="min-w-0 flex-1 pb-3">
        <article
          className={cn(
            'rounded-xl border p-3 transition-colors sm:p-3.5',
            isCurrent
              ? 'border-primary/40 bg-primary/[0.05] ring-1 ring-primary/25'
              : isCompleted
                ? cn('border-transparent opacity-60', sc.bg)
                : cn('border-transparent', sc.bg, 'ring-1', sc.ring)
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {entry.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <p className={cn('truncate text-base font-bold leading-snug', isCurrent ? 'text-primary' : sc.text)}>
                  {slot.subject}
                </p>
                {isCompleted && <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Class completed" />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1">
                  <User className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{slot.teacherName}</span>
                </span>
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{slot.room}</span>
                </span>
              </div>
              {change?.changeLabel && (
                <p
                  className="mt-1.5 flex items-center gap-1 truncate text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                  title={change.summary}
                >
                  <ArrowRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
                  <span className="truncate">{change.changeLabel}</span>
                </p>
              )}
            </div>

            {/* Live badges — at most one per row, only when viewing TODAY */}
            {isCurrent && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                Now
              </span>
            )}
            {badge === 'next' && !isCurrent && !isCompleted && (
              <span className="inline-flex shrink-0 items-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Next
              </span>
            )}
          </div>
        </article>
      </div>
    </motion.li>
  )
}

/* ─── Neutral structural break / lunch row ─────────────────────────── */

function BreakRow({ entry, isFirst, isLast }: { entry: DayEntry; isFirst: boolean; isLast: boolean }) {
  const isLunch = entry.breakType === 'lunch'
  const [startClock, startMer] = startTimeLabel(entry.time).split(' ')
  return (
    <li
      className="flex gap-3 sm:gap-4"
      aria-label={`${entry.name}, ${entry.time}`}
    >
      {/* Time rail */}
      <div className="w-14 shrink-0 pt-[15px] text-right sm:w-16">
        <p className="text-[11px] font-medium tabular-nums leading-none text-muted-foreground/70">{startClock}</p>
        <p className="mt-1 text-[9px] font-medium uppercase leading-none tracking-wider text-muted-foreground/50">
          {startMer}
        </p>
      </div>

      {/* Connector + hollow node */}
      <div className="relative w-px shrink-0 self-stretch" aria-hidden>
        <span
          className={cn(
            'absolute left-0 w-px bg-border/70',
            isFirst ? 'top-[21px]' : 'top-0',
            isLast ? 'bottom-[calc(100%-21px)]' : 'bottom-0'
          )}
        />
        <span className="absolute -left-[3.5px] top-[17px] h-2 w-2 rounded-full border border-muted-foreground/40 bg-card" />
      </div>

      {/* Slim neutral row — clearly not a subject */}
      <div className="min-w-0 flex-1 pb-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-1.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {isLunch ? <UtensilsCrossed className="h-3 w-3" aria-hidden /> : <Coffee className="h-3 w-3" aria-hidden />}
          </span>
          <p className="text-xs font-medium text-muted-foreground">{entry.name}</p>
          <p className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground/70">{entry.time}</p>
        </div>
      </div>
    </li>
  )
}
