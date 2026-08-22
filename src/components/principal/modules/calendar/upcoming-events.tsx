'use client'

/**
 * UpcomingEvents — list of the next N events from the visible month onward.
 *
 * Rendered as the right-side panel when the user has NOT clicked a day
 * (audit fix #5 — SelectedDayPanel and UpcomingEvents are mutually
 * exclusive; only one shows at a time to stop the 3-simultaneous-views
 * duplication).
 *
 * Changes vs. legacy:
 *   - Uses CalPanel (audit fix #1, drop GlassCard).
 *   - Dropped the duplicate CalendarDays icon (audit fix #9 — the shell
 *     header already shows it once).
 *   - Reads from the unified events list, so holidays and exam events now
 *     appear alongside the original school events.
 *   - Sorted by date; shows up to 6 events, each with its type dot, time,
 *     and source tag.
 */

import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import { MONTH_NAMES, TYPE_COLORS, type CalendarEvent } from './data'
import { CalEmptyState, CalPanel, CalSourcePill, CalTypeBadge } from './calendar-shared'

interface Props {
  /** Events already filtered by the active type chips + visible-month range. */
  events: CalendarEvent[]
}

export function UpcomingEvents({ events }: Props) {
  // Sort by date ascending; show up to 6.
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  const shown = sorted.slice(0, 6)

  return (
    <CalPanel
      title="Upcoming Events"
      subtitle={
        shown.length > 0
          ? `Next ${shown.length} event${shown.length === 1 ? '' : 's'}`
          : 'No events match the current filter'
      }
    >
      {shown.length === 0 ? (
        <CalEmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="Nothing matches"
          description="Try enabling more event types in the filter chips above."
        />
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
          {shown.map((e, i) => {
            const d = new Date(e.date)
            const day = d.getDate()
            const monthIdx = d.getMonth()
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="flex gap-3 rounded-xl border border-border bg-card/40 p-2.5 hover:bg-accent/30 transition-colors"
              >
                {/* Date tile */}
                <div
                  className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-lg text-white font-display"
                  style={{ background: TYPE_COLORS[e.type] ?? TYPE_COLORS.General }}
                >
                  <span className="text-base font-bold leading-none">{day}</span>
                  <span className="text-[9px] uppercase tracking-wide leading-none mt-0.5">
                    {MONTH_NAMES[monthIdx].slice(0, 3)}
                  </span>
                </div>

                {/* Title + meta */}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate leading-tight">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {e.time} · {e.location ?? 'School Campus'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <CalTypeBadge type={e.type} />
                    <CalSourcePill source={e.source} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </CalPanel>
  )
}
