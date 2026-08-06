'use client'

import { CalendarDays, Clock, MapPin, MessageSquare } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { type PTMEvent } from '@/lib/mock/ptm'
import { toast } from 'sonner'

export function EventInfoCard({ event }: { event: PTMEvent }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-sm">{event.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{event.className}</p>
        </div>
        <StatusBadge status={event.status} variant={event.status === 'Ongoing' ? 'success' : event.status === 'Completed' ? 'neutral' : 'info'} dot />
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{event.venue}</span>
        </div>
      </div>

      <div className="rounded-xl bg-muted/50 p-3 mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Agenda</p>
        <p className="text-xs leading-relaxed">{event.notes}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-emerald-500/10 py-2">
          <p className="font-display text-lg font-bold text-emerald-600">{event.completedSlots}</p>
          <p className="text-[10px] text-muted-foreground">Done</p>
        </div>
        <div className="rounded-lg bg-sky-500/10 py-2">
          <p className="font-display text-lg font-bold text-sky-600">{event.bookedSlots - event.completedSlots}</p>
          <p className="text-[10px] text-muted-foreground">Upcoming</p>
        </div>
        <div className="rounded-lg bg-muted py-2">
          <p className="font-display text-lg font-bold">{event.totalSlots - event.bookedSlots}</p>
          <p className="text-[10px] text-muted-foreground">Open</p>
        </div>
      </div>

      <button
        onClick={() => toast.success('Reminder sent', { description: 'SMS + email reminder sent to all booked parents' })}
        className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 py-2 text-xs font-medium hover:bg-accent transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5" /> Send Reminders
      </button>
    </GlassCard>
  )
}
