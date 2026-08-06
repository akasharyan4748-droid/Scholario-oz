'use client'

import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { TYPE_COLORS, type CalendarEvent } from './data'

interface Props {
  visibleEvents: CalendarEvent[]
}

export function UpcomingEvents({ visibleEvents }: Props) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" /> Upcoming Events
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleEvents.slice(0, 6).map((e, i) => {
          const d = new Date(e.date)
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -2 }}
              className="rounded-xl border border-border bg-card/40 p-3 flex gap-3 hover:shadow-premium transition-shadow"
            >
              <div className="flex flex-col items-center justify-center h-14 w-14 shrink-0 rounded-xl text-white font-display"
                style={{ background: TYPE_COLORS[e.type] }}
              >
                <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                <span className="text-[10px] uppercase">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{e.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{e.time} · School Campus</p>
                <StatusBadge status={e.type} variant="neutral" className="mt-1" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
