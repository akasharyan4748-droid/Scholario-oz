'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Plus, Users, Clock, IndianRupee, ListChecks,
  Image as ImageIcon,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { events, eventTasks, eventGallery, eventStats, type SchoolEvent } from '@/lib/mock/events'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import { type Tab } from './data'
import { EventsTab } from './events-tab'
import { TasksTab } from './tasks-tab'
import { GalleryTab } from './gallery-tab'
import { EventDetailModal } from './event-detail-modal'

import { SegmentedTabs } from '../shared/segmented-tabs'

export function EventManagementModule() {
  const [tab, setTab] = useState<Tab>('events')
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Event Management"
        subtitle="Plan, organize and track school events, ceremonies & trips"
        icon={<CalendarDays className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('New event', { description: 'Event builder would open here' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> New Event
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Events" value={eventStats.totalEvents} icon={<CalendarDays className="h-5 w-5" />} accent="emerald" trendLabel={`${eventStats.completed} completed`} delay={0} />
        <KpiCard label="Upcoming" value={eventStats.upcoming} icon={<Clock className="h-5 w-5" />} accent="amber" trendLabel={`${eventStats.ongoing} ongoing`} delay={0.05} />
        <KpiCard label="Total Budget" value={eventStats.totalBudget} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} accent="violet" trendLabel={`${formatINR(eventStats.totalSpent, true)} spent`} delay={0.1} />
        <KpiCard label="Participants" value={eventStats.totalParticipants} icon={<Users className="h-5 w-5" />} accent="cyan" trendLabel={`${eventStats.satisfactionRate}% satisfaction`} delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Events per Month" subtitle="This academic year" className="lg:col-span-2">
          <AreaTrend data={eventStats.monthlyEvents} xKey="month" yKey="count" color="oklch(0.55 0.14 162)" height={240} gradientId="evtGrad" />
        </ChartCard>
        <ChartCard title="Events by Type" subtitle="Distribution">
          <Donut data={eventStats.byType} centerValue={`${eventStats.totalEvents}`} centerLabel="events" height={240} />
        </ChartCard>
      </div>

      {/* Tabs */}
      <SegmentedTabs
      tabs={[
        { value: 'events', label: 'Events', icon: <CalendarDays className="h-3.5 w-3.5" />, badge: events.length },
        { value: 'tasks', label: 'Tasks', icon: <ListChecks className="h-3.5 w-3.5" />, badge: eventTasks.length },
        { value: 'gallery', label: 'Gallery', icon: <ImageIcon className="h-3.5 w-3.5" />, badge: eventGallery.length }
      ]}
      value={tab}
      onValueChange={setTab}
    />

      <AnimatePresence mode="wait">
        {tab === 'events' && <EventsTab onSelect={setSelectedEvent} />}
        {tab === 'tasks' && <TasksTab />}
        {tab === 'gallery' && <GalleryTab />}
      </AnimatePresence>

      {/* Event detail modal */}
      <AnimatePresence>
        {selectedEvent && <EventDetailModal selectedEvent={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </AnimatePresence>
    </div>
  )
}
