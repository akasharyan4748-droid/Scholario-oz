'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  CalendarClock, Users, Star, Circle, Plus,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ptmSchedule, ptmEvents, ptmStats, type PTMSlot } from '@/lib/mock/ptm'
import { toast } from 'sonner'
import { PtmEventsGrid } from './ptm-events-grid'
import { EventInfoCard } from './event-info-card'
import { SlotSchedule } from './slot-schedule'
import { MeetingNotesDialog } from './meeting-notes-dialog'

export function PTMSchedulerModule() {
  const [selectedEventId, setSelectedEventId] = useState(ptmEvents[0].id)
  const [activeSlot, setActiveSlot] = useState<PTMSlot | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(ptmSchedule.filter((s) => s.notes).map((s) => [s.id, s.notes!]))
  )

  const selectedEvent = ptmEvents.find((e) => e.id === selectedEventId) ?? ptmEvents[0]

  const bookedCount = ptmSchedule.filter((s) => s.status === 'booked' || s.status === 'completed').length
  const availableCount = ptmSchedule.filter((s) => s.status === 'available').length
  const fillRate = Math.round((bookedCount / ptmSchedule.length) * 100)

  const saveNotes = () => {
    toast.success('Notes saved', { description: 'PTM notes recorded for this meeting' })
    setActiveSlot(null)
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="PTM Scheduler"
        subtitle="Manage parent-teacher meetings, slots & meeting notes"
        icon={<CalendarClock className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('PTM scheduled', { description: 'New PTM event created & parents notified' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Schedule PTM
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Today's Meetings" value={ptmStats.todayMeetings} icon={<Users className="h-5 w-5" />} accent="amber" trendLabel={`${ptmStats.completedToday} completed`} delay={0} />
        <KpiCard label="Booked Slots" value={bookedCount} suffix={`/${ptmSchedule.length}`} icon={<CalendarClock className="h-5 w-5" />} accent="emerald" trend={fillRate} trendLabel={`${fillRate}% filled`} delay={0.05} />
        <KpiCard label="Available Slots" value={availableCount} icon={<Circle className="h-5 w-5" />} accent="cyan" trendLabel="open for booking" delay={0.1} />
        <KpiCard label="Avg Rating" value={ptmStats.avgRating} decimals={1} icon={<Star className="h-5 w-5" />} accent="violet" trendLabel="parent feedback" delay={0.15} />
      </div>

      {/* PTM Events */}
      <PtmEventsGrid selectedEventId={selectedEventId} onSelect={setSelectedEventId} />

      {/* Selected event detail + slot schedule */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Event info */}
        <EventInfoCard event={selectedEvent} />

        {/* Slot schedule */}
        <SlotSchedule onStartSlot={setActiveSlot} />
      </div>

      {/* Meeting notes dialog */}
      <AnimatePresence>
        {activeSlot && (
          <MeetingNotesDialog
            activeSlot={activeSlot}
            notes={notes[activeSlot.id] ?? ''}
            onNotesChange={(value) => setNotes((prev) => ({ ...prev, [activeSlot.id]: value }))}
            onClose={() => setActiveSlot(null)}
            onSave={saveNotes}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
