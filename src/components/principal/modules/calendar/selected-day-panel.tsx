'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Clock, MapPin, X } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { TYPE_COLORS, type CalendarEvent } from './data'

interface Props {
  selectedDay: number | null
  selectedEvents: CalendarEvent[]
  onClear: () => void
}

export function SelectedDayPanel({ selectedDay, selectedEvents, onClear }: Props) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm">
          {selectedDay ? `${selectedDay} December 2025` : 'Select a date'}
        </h3>
        {selectedDay && (
          <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {selectedEvents.length > 0 ? `${selectedEvents.length} event(s) scheduled` : 'No events scheduled'}
      </p>

      <AnimatePresence mode="wait">
        {selectedEvents.length > 0 ? (
          <motion.div
            key={selectedDay ?? 'empty'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {selectedEvents.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border-l-4 p-3"
                style={{ borderColor: TYPE_COLORS[e.type], background: `color-mix(in oklch, ${TYPE_COLORS[e.type]} 8%, var(--card))` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{e.title}</p>
                  <StatusBadge status={e.type} variant="neutral" />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.time}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> School Campus</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No events on this date</p>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
