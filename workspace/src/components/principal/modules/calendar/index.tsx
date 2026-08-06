'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { calendarEvents } from '@/lib/mock/operations'
import { ALL_TYPES, DAYS_IN_MONTH, FIRST_DAY, MONTH, pad, YEAR, type CalendarEvent } from './data'
import { FilterChips } from './filter-chips'
import { CalendarGrid } from './calendar-grid'
import { SelectedDayPanel } from './selected-day-panel'
import { UpcomingEvents } from './upcoming-events'
import { AddEventDialog } from './add-event-dialog'

export function CalendarModule() {
  const [selectedDay, setSelectedDay] = useState<number | null>(8)
  const [filterTypes, setFilterTypes] = useState<string[]>(ALL_TYPES)
  const [addOpen, setAddOpen] = useState(false)

  const visibleEvents = useMemo(
    () => calendarEvents.filter((e) => filterTypes.includes(e.type)),
    [filterTypes]
  )

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {}
    visibleEvents.forEach((e) => {
      if (e.date.startsWith(`${YEAR}-${pad(MONTH + 1)}`)) {
        const day = parseInt(e.date.split('-')[2], 10)
        if (!map[day]) map[day] = []
        map[day].push(e)
      }
    })
    return map
  }, [visibleEvents])

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : []

  const toggleType = (t: string) => {
    setFilterTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
  }

  // Build calendar grid — 7 cols × 6 rows = 42 cells
  const cells: (number | null)[] = []
  for (let i = 0; i < FIRST_DAY; i++) cells.push(null)
  for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push(d)
  while (cells.length < 42) cells.push(null)

  const today = 28 // mock "today" within December

  return (
    <div className="space-y-5">
      <SectionHeading
        title="School Calendar"
        subtitle="December 2025 · Academic & cultural events"
        icon={<CalendarDays className="h-5 w-5" />}
        action={
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        }
      />

      {/* Filter chips */}
      <FilterChips filterTypes={filterTypes} onToggle={toggleType} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Calendar Grid */}
        <CalendarGrid
          cells={cells}
          eventsByDay={eventsByDay}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          today={today}
        />

        {/* Side panel — selected day events */}
        <SelectedDayPanel
          selectedDay={selectedDay}
          selectedEvents={selectedEvents}
          onClear={() => setSelectedDay(null)}
        />
      </div>

      {/* Upcoming events */}
      <UpcomingEvents visibleEvents={visibleEvents} />

      {/* Add event dialog */}
      <AddEventDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
