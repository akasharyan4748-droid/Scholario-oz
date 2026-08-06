'use client'

import { motion } from 'framer-motion'
import {
  CalendarDays, Clock, MapPin, X, CheckCircle2, Download, Users,
} from 'lucide-react'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { type SchoolEvent } from '@/lib/mock/events'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { typeIcons } from './data'

export function EventDetailModal({
  selectedEvent,
  onClose,
}: {
  selectedEvent: SchoolEvent | null
  onClose: () => void
}) {
  if (!selectedEvent) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border glass-strong shadow-premium-lg"
      >
        {/* Header */}
        <div className={cn('relative p-5 text-white bg-gradient-to-br', selectedEvent.gradient)}>
          <div className="absolute inset-0 bg-grid opacity-20" />
          <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">{typeIcons[selectedEvent.type]}</div>
            <div>
              <p className="text-[10px] text-white/80 font-medium uppercase tracking-wide">{selectedEvent.type}</p>
              <h2 className="font-display text-lg font-bold leading-tight">{selectedEvent.name}</h2>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Event info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><CalendarDays className="h-2.5 w-2.5" /> Date</p>
              <p className="text-sm font-semibold mt-0.5">{formatDate(selectedEvent.date)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Time</p>
              <p className="text-sm font-semibold mt-0.5">{selectedEvent.time}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3 col-span-2">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> Venue</p>
              <p className="text-sm font-semibold mt-0.5">{selectedEvent.venue}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">About</p>
            <p className="text-sm leading-relaxed">{selectedEvent.description}</p>
          </div>

          {/* Highlights */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Highlights</p>
            <div className="space-y-1.5">
              {selectedEvent.highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget + registrations */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-3">
              <p className="text-[10px] text-muted-foreground">Budget</p>
              <p className="font-display text-lg font-bold text-violet-600">{formatINR(selectedEvent.budget)}</p>
              <p className="text-[10px] text-muted-foreground">{formatINR(selectedEvent.spent)} spent</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-3">
              <p className="text-[10px] text-muted-foreground">Registrations</p>
              <p className="font-display text-lg font-bold text-emerald-600">{selectedEvent.registrations}</p>
              <p className="text-[10px] text-muted-foreground">of {selectedEvent.capacity} capacity</p>
            </div>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
            <GradientAvatar name={selectedEvent.organizer} size="md" />
            <div>
              <p className="text-[10px] text-muted-foreground">Organized by</p>
              <p className="text-sm font-semibold">{selectedEvent.organizer}</p>
              <p className="text-[11px] text-muted-foreground">{selectedEvent.coordinator}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { toast.success('Report downloaded', { description: `${selectedEvent.name} report saved` }); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-md"
            >
              <Download className="h-4 w-4" /> Download Report
            </button>
            <button
              onClick={() => { toast.success('Registrations opened', { description: 'Parents notified via SMS + email' }); onClose() }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Users className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
