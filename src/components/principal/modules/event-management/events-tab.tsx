'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Clock, MapPin, ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { events, type SchoolEvent } from '@/lib/mock/events'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { typeIcons } from './data'

export function EventsTab({ onSelect }: { onSelect: (ev: SchoolEvent) => void }) {
  return (
    <motion.div key="ev" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {events.map((ev, i) => (
        <motion.div
          key={ev.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -4 }}
          className="cursor-pointer"
          onClick={() => onSelect(ev)}
        >
          <GlassCard className="p-0 overflow-hidden h-full hover:shadow-premium-lg transition-shadow">
            {/* Header banner */}
            <div className={cn('relative h-24 bg-gradient-to-br p-4 text-white', ev.gradient)}>
              <div className="absolute inset-0 bg-grid opacity-20" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                    {typeIcons[ev.type]}
                  </div>
                  <div>
                    <p className="text-[10px] text-white/80 font-medium uppercase tracking-wide">{ev.type}</p>
                    <p className="font-semibold text-sm leading-tight">{ev.name}</p>
                  </div>
                </div>
                <StatusBadge status={ev.status} variant={ev.status === 'Completed' ? 'success' : ev.status === 'Registration Open' ? 'info' : ev.status === 'Ongoing' ? 'warning' : 'neutral'} />
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-3 w-3" /> {formatDate(ev.date)}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3 w-3" /> {ev.time}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                  <MapPin className="h-3 w-3" /> {ev.venue}
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{ev.description}</p>

              {/* Budget + registrations */}
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-semibold">{formatINR(ev.spent, true)} / {formatINR(ev.budget, true)}</span>
                  </div>
                  <ProgressBar value={ev.spent} max={ev.budget} color="oklch(0.6 0.18 300)" height={4} />
                </div>
                {ev.registrations > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Registrations</span>
                      <span className="font-semibold">{ev.registrations} / {ev.capacity}</span>
                    </div>
                    <ProgressBar value={ev.registrations} max={ev.capacity} color="oklch(0.55 0.14 162)" height={4} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[10px] text-muted-foreground">by {ev.organizer}</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-primary">Details <ChevronRight className="h-3 w-3" /></span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
