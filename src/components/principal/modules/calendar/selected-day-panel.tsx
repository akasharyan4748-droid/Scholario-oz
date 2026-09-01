'use client'

/**
 * SelectedDayPanel — events for the user-clicked day.
 *
 * Used as the right-side panel when `selectedDay` is non-null. When no day
 * is selected, the shell renders UpcomingEvents instead (audit fix #5 —
 * the two panels are mutually exclusive, never shown at the same time).
 *
 * Changes vs. legacy:
 *   - Uses CalPanel (audit fix #1, drop GlassCard).
 *   - Date label is dynamic from year/month props (was hardcoded "December 2025").
 *   - Each event card now shows its source tag (Holiday / Exam / User) and
 *     optional location when present, in addition to time + campus.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { MONTH_NAMES, pad, TYPE_COLORS, type CalendarEvent } from './data'
import { CalEmptyState, CalPanel, CalSourcePill, CalTypeBadge } from './calendar-shared'

interface Props {
  year: number
  month: number
  selectedDay: number | null
  selectedEvents: CalendarEvent[]
  onClear: () => void
}

export function SelectedDayPanel({ year, month, selectedDay, selectedEvents, onClear }: Props) {
  const dateLabel = selectedDay
    ? `${selectedDay} ${MONTH_NAMES[month]} ${year}`
    : 'Select a date'

  return (
    <CalPanel
      title={<span className="text-sm">{dateLabel}</span>}
      subtitle={
        selectedDay
          ? selectedEvents.length > 0
            ? `${selectedEvents.length} event${selectedEvents.length === 1 ? '' : 's'} scheduled`
            : 'No events scheduled'
          : 'Click any day to see its events'
      }
      action={
        selectedDay ? (
          <button
            onClick={onClear}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear selection"
          >
            Clear
          </button>
        ) : undefined
      }
    >
      <AnimatePresence mode="wait">
        {selectedEvents.length > 0 ? (
          <motion.div
            key={selectedDay ?? 'empty'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1"
          >
            {selectedEvents.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border-l-4 p-3 bg-muted/20"
                style={{ borderColor: TYPE_COLORS[e.type] ?? TYPE_COLORS.General }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-tight">{e.title}</p>
                  <CalTypeBadge type={e.type} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {e.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {e.location ?? 'School Campus'}
                  </span>
                </div>
                {e.source !== 'school' && (
                  <div className="mt-1.5">
                    <CalSourcePill source={e.source} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <CalEmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title={selectedDay ? 'No events on this date' : 'No day selected'}
            description={
              selectedDay
                ? `${selectedDay} ${MONTH_NAMES[month]} ${pad(month + 1)} is clear. Add one with the "Add Event" button.`
                : 'Click a day in the calendar to see its events.'
            }
          />
        )}
      </AnimatePresence>
    </CalPanel>
  )
}
