'use client'

/**
 * CalendarGrid — month view with day cells + colored event dots.
 *
 * Major changes vs. the legacy grid (audit fixes #3 + #6 + #9):
 *   - Real month navigation: ChevronLeft / ChevronRight call onPrevMonth /
 *     onNextMonth which mutate the shell's year/month state and trigger a
 *     full grid recompute. No more toast-only "Viewing November 2025" stubs.
 *   - Dynamic month name: the header reads the live year/month props
 *     instead of a hardcoded "December 2025" string.
 *   - Dropped the static legend at the bottom — the FilterChips above the
 *     grid already show the same colors (audit fix #6).
 *   - Dropped the legacy GlassCard + StatusBadge "Academic Year 2025–26"
 *     mini-header (audit fix #1 — the shell's shared header carries that
 *     context now). The panel uses CalPanel with the month name + nav as
 *     the panel's own header action.
 *   - "Today" is computed from the real current date if it falls in this
 *     month, otherwise no day is highlighted as today.
 */

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MONTH_NAMES, TYPE_COLORS, WEEK_DAYS, type CalendarEvent } from './data'
import { CalPanel } from './calendar-shared'

interface Props {
  year: number
  month: number // 0-indexed
  cells: (number | null)[]
  eventsByDay: Record<number, CalendarEvent[]>
  selectedDay: number | null
  onSelectDay: (day: number) => void
  today: number | null
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export function CalendarGrid({
  year,
  month,
  cells,
  eventsByDay,
  selectedDay,
  onSelectDay,
  today,
  onPrevMonth,
  onNextMonth,
  onToday,
}: Props) {
  const monthLabel = `${MONTH_NAMES[month]} ${year}`

  return (
    <CalPanel
      className="lg:col-span-2"
      bodyClassName="p-2 sm:p-3"
      title={
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">{monthLabel}</span>
        </div>
      }
      subtitle={`${countEventsThisMonth(eventsByDay)} event${countEventsThisMonth(eventsByDay) === 1 ? '' : 's'} this month`}
      action={
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1 px-2"
            onClick={onToday}
            aria-label="Jump to today"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={onPrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={onNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      }
    >
      <div>
        {/* Week-day header row */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEK_DAYS.map((w) => (
            <div
              key={w}
              className="text-center text-[10px] font-semibold text-muted-foreground py-1 uppercase tracking-wider"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square rounded-xl bg-muted/20" />
            }
            const dayEvents = eventsByDay[day] ?? []
            const isToday = day === today
            const isSelected = day === selectedDay

            return (
              <motion.button
                key={day}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.005, 0.1), duration: 0.25 }}
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectDay(day)}
                aria-pressed={isSelected}
                aria-label={`${day} ${MONTH_NAMES[month]} ${year}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ''}`}
                className={`relative aspect-square rounded-xl border p-1.5 flex flex-col items-start transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : isToday
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-accent/40'
                }`}
              >
                <span
                  className={`text-xs font-semibold ${isToday || isSelected ? 'text-primary' : 'text-foreground'}`}
                >
                  {day}
                </span>

                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-0.5 w-full">
                    {dayEvents.slice(0, 4).map((e) => (
                      <span
                        key={e.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: TYPE_COLORS[e.type] ?? TYPE_COLORS.General }}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[9px] text-muted-foreground leading-none">
                        +{dayEvents.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </CalPanel>
  )
}

function countEventsThisMonth(eventsByDay: Record<number, CalendarEvent[]>): number {
  let total = 0
  for (const k of Object.keys(eventsByDay)) {
    total += eventsByDay[Number(k)]?.length ?? 0
  }
  return total
}
