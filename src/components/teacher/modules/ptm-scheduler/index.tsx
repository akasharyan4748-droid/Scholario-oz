'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Users, Star, CalendarClock, Circle } from 'lucide-react'
import { ModuleToolbar } from '../../teacher-panel/module-toolbar'
import { KpiCard } from '@/components/shared/kpi-card'
import { ptmEvents, ptmSchedule, type PTMSlot } from '@/lib/mock/ptm'
import { usePtmStore } from '@/lib/store/ptm-store'
import { formatDate } from '@/lib/format'
import { PtmEventsGrid } from './ptm-events-grid'
import { EventInfoCard } from './event-info-card'
import { SlotSchedule } from './slot-schedule'
import { MeetingNotesDialog } from './meeting-notes-dialog'

export function PTMSchedulerModule() {
  const [selectedEventId, setSelectedEventId] = useState(ptmEvents[0].id)
  const [activeSlot, setActiveSlot] = useState<PTMSlot | null>(null)
  const [draftNote, setDraftNote] = useState('')
  const [draftRating, setDraftRating] = useState(0)
  const overrides = usePtmStore((s) => s.overrides)
  const saveMeeting = usePtmStore((s) => s.saveMeeting)

  const selectedEvent = ptmEvents.find((e) => e.id === selectedEventId) ?? ptmEvents[0]

  // Live slots = published schedule + this teacher's persisted overrides.
  const slots = useMemo(() => {
    return ptmSchedule.map((s) => {
      const o = overrides[s.id]
      return o ? { ...s, notes: o.notes ?? s.notes, rating: o.rating ?? s.rating, status: o.status ?? s.status } : s
    })
  }, [overrides])

  const bookedCount = slots.filter((s) => s.status === 'booked' || s.status === 'completed').length
  const availableCount = slots.filter((s) => s.status === 'available').length
  const completedCount = slots.filter((s) => s.status === 'completed').length
  const fillRate = slots.length > 0 ? Math.round((bookedCount / slots.length) * 100) : 0
  const rated = slots.filter((s) => s.rating != null)
  const avgRating = rated.length > 0 ? rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length : null

  const startSlot = (slot: PTMSlot) => {
    setActiveSlot(slot)
    setDraftNote(slot.notes ?? '')
    setDraftRating(slot.rating ?? 0)
  }

  const completeMeeting = () => {
    if (!activeSlot) return
    saveMeeting(activeSlot.id, draftNote, draftRating > 0 ? draftRating : undefined)
    setActiveSlot(null)
  }

  return (
    <div className="space-y-5">
      <ModuleToolbar
        context={`PTM events · ${formatDate(selectedEvent.date)} · ${selectedEvent.venue}`}
      />

      {/* KPI cards — derived from the live slot state */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Today's Meetings" value={bookedCount} icon={<Users className="h-5 w-5" />} accent="amber" trendLabel={`${completedCount} completed`} delay={0} />
        <KpiCard label="Booked Slots" value={`${bookedCount}/${slots.length}`} icon={<CalendarClock className="h-5 w-5" />} accent="cyan" trendLabel={`${fillRate}% filled`} delay={0.05} />
        <KpiCard label="Available Slots" value={availableCount} icon={<Circle className="h-5 w-5" />} accent="emerald" trendLabel="open for parents" delay={0.1} />
        <KpiCard label="Avg Rating" value={avgRating ?? '—'} decimals={avgRating != null ? 1 : undefined} icon={<Star className="h-5 w-5" />} accent="violet" trendLabel={rated.length > 0 ? `${rated.length} parent ratings` : 'no ratings yet'} delay={0.15} />
      </div>

      {/* Events */}
      <PtmEventsGrid selectedEventId={selectedEventId} onSelect={setSelectedEventId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SlotSchedule slots={slots} onStartSlot={startSlot} />
        <EventInfoCard event={selectedEvent} />
      </div>

      <AnimatePresence>
        {activeSlot && (
          <MeetingNotesDialog
            activeSlot={activeSlot}
            notes={draftNote}
            rating={draftRating}
            onNotesChange={setDraftNote}
            onRatingChange={setDraftRating}
            onClose={() => setActiveSlot(null)}
            onSave={completeMeeting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
