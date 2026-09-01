'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Clock } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { ptmEvents } from '@/lib/mock/ptm'
import { cn } from '@/lib/utils'

export function PtmEventsGrid({
  selectedEventId,
  onSelect,
}: {
  selectedEventId: string
  onSelect: (id: string) => void
}) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-primary" /> Upcoming PTM Events
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ptmEvents.map((ev, i) => {
          const isActive = selectedEventId === ev.id
          return (
            <motion.button
              key={ev.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() => onSelect(ev.id)}
              className={cn(
                'text-left rounded-2xl border-2 p-4 transition-all',
                isActive ? 'border-primary bg-primary/5 shadow-premium' : 'border-border bg-card/40 hover:border-primary/40'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                  ev.status === 'Ongoing' ? 'bg-emerald-500/15 text-emerald-600' :
                  ev.status === 'Completed' ? 'bg-muted text-muted-foreground' :
                  'bg-sky-500/15 text-sky-600'
                )}>{ev.status}</span>
                {ev.status === 'Ongoing' && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
              </div>
              <p className="font-semibold text-xs leading-tight mb-1">{ev.title}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-2">
                <CalendarDays className="h-2.5 w-2.5" /> {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-3">
                <Clock className="h-2.5 w-2.5" /> {ev.time}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Booked</span>
                  <span className="font-semibold">{ev.bookedSlots}/{ev.totalSlots}</span>
                </div>
                <ProgressBar value={ev.bookedSlots} max={ev.totalSlots} color={ev.status === 'Completed' ? 'oklch(0.5 0.01 160)' : 'oklch(0.55 0.14 162)'} height={4} />
              </div>
            </motion.button>
          )
        })}
      </div>
    </GlassCard>
  )
}
