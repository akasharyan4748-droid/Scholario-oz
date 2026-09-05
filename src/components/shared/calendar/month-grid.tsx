'use client'

/**
 * MonthGrid — the premium month view.
 *
 * Design notes (Calendar redesign spec):
 *   - Hairline cell separators inside one flat card (no per-cell cards,
 *     no chunky borders) — lighter and more enterprise than the old
 *     aspect-square tiles.
 *   - Adjacent-month days render muted and clickable (navigate to that
 *     month) instead of blank spacers.
 *   - Today: solid primary dot behind the day number + faint primary
 *     wash on the cell. Selected: inset primary ring + tint. Restrained.
 *   - Event chips: on sm+ each cell shows up to 2 one-line chips (type
 *     dot + truncated title) + a "+N" overflow line. On phones the same
 *     cell shows type dots only — comfortable touch targets, no
 *     horizontal overflow.
 *   - Month changes animate with a subtle direction-aware slide.
 *
 * a11y: each cell is a focusable div[role=button] (keyboard: Enter/Space)
 * containing real <button> chips for its events — valid nesting, full
 * keyboard access.
 */

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  MONTH_NAMES,
  TYPE_TOKENS,
  WEEK_DAYS,
  typeColor,
  type CalendarEvent,
  type MonthCell,
} from './data'

export interface MonthGridProps {
  year: number
  month: number
  cells: MonthCell[]
  /** eventsByDay keyed by ISO date (only visible-month events). */
  eventsByDate: Record<string, CalendarEvent[]>
  /** ISO date of the selected day (null when nothing selected). */
  selectedDate: string | null
  /** ISO date of canonical today when it falls in the visible month. */
  todayDate: string | null
  /** +1 when navigating forward, -1 backward (slide direction). */
  navDirection: number
  onSelectDay: (cell: MonthCell) => void
  /** Open the event detail view (chips are clickable). */
  onOpenEvent: (event: CalendarEvent) => void
}

function isSelectableKey(e: React.KeyboardEvent): boolean {
  return e.key === 'Enter' || e.key === ' '
}

export const MonthGrid = memo(function MonthGrid({
  year,
  month,
  cells,
  eventsByDate,
  selectedDate,
  todayDate,
  navDirection,
  onSelectDay,
  onOpenEvent,
}: MonthGridProps) {
  const monthTotal = cells.filter((c) => c.inMonth).reduce(
    (n, c) => n + (eventsByDate[c.dateISO]?.length ?? 0),
    0,
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      {/* Week-day header */}
      <div className="grid grid-cols-7 border-b border-border/70 bg-muted/[0.15]">
        {WEEK_DAYS.map((w) => (
          <div
            key={w}
            className="py-2 sm:py-2.5 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <span className="hidden sm:inline">{w}</span>
            <span className="sm:hidden">{w.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      {/* Day cells — keyed by month so navigation animates */}
      <AnimatePresence initial={false} custom={navDirection} mode="popLayout">
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: 24 * navDirection }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 * navDirection }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="grid grid-cols-7"
          aria-label={`${MONTH_NAMES[month]} ${year} calendar, ${monthTotal} events`}
        >
          {cells.map((cell, i) => {
            const dayEvents = cell.inMonth ? (eventsByDate[cell.dateISO] ?? []) : []
            const isToday = cell.dateISO === todayDate
            const isSelected = cell.dateISO === selectedDate
            const isWeekendCol = i % 7 === 0 || i % 7 === 6
            const cellLabel = `${cell.day} ${MONTH_NAMES[Number(cell.dateISO.slice(5, 7)) - 1]} ${cell.dateISO.slice(0, 4)}${cell.inMonth ? '' : ' (adjacent month)'}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ''}`

            return (
              <div
                key={cell.dateISO}
                role="button"
                tabIndex={0}
                aria-label={cellLabel}
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={isSelected}
                onClick={() => onSelectDay(cell)}
                onKeyDown={(e) => {
                  if (isSelectableKey(e)) {
                    e.preventDefault()
                    onSelectDay(cell)
                  }
                }}
                className={cn(
                  // Base cell — hairline separators, comfortable heights
                  'group relative flex min-h-[52px] sm:min-h-[84px] lg:min-h-[92px] flex-col p-1 sm:p-1.5 text-left transition-colors duration-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                  // Hairline grid lines (skip first row / first column)
                  i >= 7 && 'border-t border-border/60',
                  i % 7 !== 0 && 'border-l border-border/60',
                  // Weekend shading
                  isWeekendCol && 'bg-muted/[0.12]',
                  // States
                  isSelected
                    ? 'bg-primary/[0.07] shadow-[inset_0_0_0_1.5px] shadow-primary/50'
                    : isToday
                      ? 'bg-primary/[0.04] shadow-[inset_0_0_0_1.5px] shadow-primary/25'
                      : 'hover:bg-accent/50',
                  !cell.inMonth && 'opacity-55 hover:opacity-80',
                )}
              >
                {/* Day number */}
                <span
                  className={cn(
                    'flex h-5 w-5 sm:h-[22px] sm:w-[22px] items-center justify-center text-xs sm:text-[13px] font-medium tabular-nums leading-none sm:-mt-0.5 sm:ml-[-3px]',
                    isToday
                      ? 'rounded-full bg-primary text-primary-foreground font-semibold'
                      : cell.inMonth
                        ? 'text-foreground/80 group-hover:text-foreground'
                        : 'text-muted-foreground/60',
                  )}
                >
                  {cell.day}
                </span>

                {/* Event chips — sm and up */}
                {dayEvents.length > 0 && (
                  <div className="mt-auto hidden sm:flex w-full flex-col gap-[3px]">
                    {dayEvents.slice(0, 2).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          onOpenEvent(e)
                        }}
                        className={cn(
                          'flex h-5 items-center gap-1 rounded-[4px] px-1 text-[10px] font-medium leading-none truncate text-left',
                          TYPE_TOKENS[e.type]?.chipBg ?? TYPE_TOKENS.General.chipBg,
                          TYPE_TOKENS[e.type]?.text ?? TYPE_TOKENS.General.text,
                        )}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: typeColor(e.type) }}
                          aria-hidden
                        />
                        <span className="truncate">{e.title}</span>
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="pl-1 text-[10px] leading-tight text-muted-foreground/80 tabular-nums">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Event dots — phones only */}
                {dayEvents.length > 0 && (
                  <div className="mt-auto sm:hidden flex flex-wrap items-center gap-[3px] px-0.5 pb-0.5">
                    {dayEvents.slice(0, 4).map((e) => (
                      <span
                        key={e.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: typeColor(e.type) }}
                        aria-hidden
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] leading-none text-muted-foreground/80 tabular-nums">
                        +{dayEvents.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
})
