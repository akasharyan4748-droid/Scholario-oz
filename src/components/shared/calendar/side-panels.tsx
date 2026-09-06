'use client'

/**
 * calendar/side-panels — the two rail contents: the Upcoming list and
 * the selected-Day list. Both are container-agnostic: the desktop rail
 * renders them inside a flat card; the mobile day sheet renders the
 * same Day content inside a bottom sheet. One implementation, no
 * duplication.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, CalendarDays, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CalendarEvent } from '@/lib/store/calendar-store'
import { weekdayOf, formatFullDate } from './data'
import { CalendarEmptyState, EventRow } from './primitives'

// ─── UpcomingContent ──────────────────────────────────────────────────

export interface UpcomingContentProps {
  events: CalendarEvent[]
  /** True when the only reason the list is empty is the type filters. */
  emptyDueToFilter: boolean
  onShowAll: () => void
  onOpen: (e: CalendarEvent) => void
}

export function UpcomingContent({ events, emptyDueToFilter, onShowAll, onOpen }: UpcomingContentProps) {
  const shown = events.slice(0, 8)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-foreground/[0.07] bg-foreground/[0.04] text-primary shadow-[inset_0_1px_0_oklch(1_0_0/0.4)] dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.07)]">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          </span>
          <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">Upcoming</h3>
        </div>
        {shown.length > 0 && (
          <span className="shrink-0 rounded-full border border-foreground/[0.07] bg-foreground/[0.04] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {shown.length}
          </span>
        )}
      </div>
      <p className="px-4 pt-0.5 pl-12 text-[11px] text-muted-foreground">From today onward</p>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {shown.length === 0 ? (
          emptyDueToFilter ? (
            <CalendarEmptyState
              icon={CalendarClock}
              title="No matching events"
              hint="No upcoming events match the selected types."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onShowAll}
                >
                  Show all types
                </Button>
              }
            />
          ) : (
            <CalendarEmptyState
              icon={CalendarDays}
              title="No upcoming events"
              hint="School events, exams and holidays will appear here."
            />
          )
        ) : (
          <div className="flex flex-col gap-0.5">
            {shown.map((e, i) => (
              <EventRow key={e.id} event={e} index={i} variant="upcoming" onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DayContent ───────────────────────────────────────────────────────

export interface DayContentProps {
  /** ISO date of the selected day. */
  dateISO: string
  events: CalendarEvent[]
  /** Principal/teacher can create events; students cannot. */
  canCreate: boolean
  onAdd: (dateISO: string) => void
  onOpen: (e: CalendarEvent) => void
  /** Desktop rail shows a small "clear selection" X. */
  onClear?: () => void
}

export function DayContent({ dateISO, events, canCreate, onAdd, onOpen, onClear }: DayContentProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {weekdayOf(dateISO)}
          </p>
          <h3 className="mt-0.5 truncate text-sm font-semibold tracking-tight text-foreground">
            {formatFullDate(dateISO)}
          </h3>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear day selection"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <AnimatePresence mode="wait" initial={false}>
          {events.length > 0 ? (
            <motion.div
              key={dateISO}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-0.5"
            >
              {events.map((e, i) => (
                <EventRow key={e.id} event={e} index={i} variant="day" onOpen={onOpen} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`${dateISO}-empty`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CalendarEmptyState
                icon={CalendarDays}
                title="No events on this day"
                hint={canCreate ? 'Schedule something for this date.' : 'This date is clear.'}
                action={
                  canCreate ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => onAdd(dateISO)}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden /> Add event
                    </Button>
                  ) : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
