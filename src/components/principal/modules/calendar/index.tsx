'use client'

/**
 * CalendarModule — Principal Calendar workspace orchestrator.
 *
 * Converged to the Academics (Exams + Attendance) shell pattern:
 *   <PageTransition className="space-y-4 calendar-shell">
 *     <div className="flex items-center justify-between gap-3 flex-wrap">
 *       <FilterChips />           // left: event-type filters with live counts
 *       <AddEventButton />        // right: primary action (emerald)
 *     </div>
 *     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 *       <CalendarGrid />          // spans 2 cols — month name + nav in its panel header
 *       {selectedDay ? <SelectedDayPanel /> : <UpcomingEvents />}
 *     </div>
 *   </PageTransition>
 *
 * NO sticky header, NO eyebrow, NO h1 (sidebar already says "Calendar"),
 * NO description. The AppShell already provides the scroll container +
 * padding.
 *
 * State preserved from the previous pass:
 *   - year/month: visible month (defaults to today's month).
 *   - selectedDay: clicked day in the visible month, or null.
 *   - filterTypes: active event-type chips (defaults to all).
 *   - addOpen: add-event dialog visibility.
 *
 * Events come from `getUnifiedEvents(year, month, exams, userEvents)`:
 *   - school events (calendarEvents, minus Holiday type — those come from
 *     the canonical school-calendar.ts)
 *   - holidays (FIXED_HOLIDAYS + WINTER_BREAK + SUMMER_BREAK)
 *   - exam events (per-exam Begins/Ends markers + per-schedule-item events
 *     from useMockExamsStore)
 *   - user events (useCalendarStore.addEvent mutations)
 */

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/ui'
import { useCalendarStore, getUnifiedEvents } from '@/lib/store/calendar-store'
import { useMockExamsStore } from '@/lib/exams/mock-exams-data'
import {
  ALL_TYPES,
  buildMonthCells,
  getTodayInMonth,
  pad,
  type CalendarEvent,
} from './data'
import { CAL_GLOBAL_STYLES } from './calendar-shared'
import { FilterChips } from './filter-chips'
import { CalendarGrid } from './calendar-grid'
import { SelectedDayPanel } from './selected-day-panel'
import { UpcomingEvents } from './upcoming-events'
import { AddEventDialog } from './add-event-dialog'

export function CalendarModule() {
  // Default the visible month to today's month.
  const today = new Date()
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [filterTypes, setFilterTypes] = useState<string[]>([...ALL_TYPES])
  const [addOpen, setAddOpen] = useState(false)

  // Real event sources.
  const exams = useMockExamsStore((s) => s.exams)
  const userEvents = useCalendarStore((s) => s.userEvents)

  // Unified events list for the visible month.
  const unifiedEvents = useMemo(
    () => getUnifiedEvents(year, month, exams, userEvents),
    [year, month, exams, userEvents],
  )

  // Filter by active type chips.
  const visibleEvents = useMemo(
    () => unifiedEvents.filter((e) => filterTypes.includes(e.type)),
    [unifiedEvents, filterTypes],
  )

  // Group visible events by day-of-month (only for events in the visible month).
  const eventsByDay = useMemo(() => {
    const prefix = `${year}-${pad(month + 1)}-`
    const map: Record<number, CalendarEvent[]> = {}
    for (const e of visibleEvents) {
      if (!e.date.startsWith(prefix)) continue
      const day = parseInt(e.date.slice(8, 10), 10)
      if (Number.isNaN(day)) continue
      if (!map[day]) map[day] = []
      map[day].push(e)
    }
    // Sort each day's events by time.
    for (const k of Object.keys(map)) {
      map[Number(k)].sort((a, b) => a.time.localeCompare(b.time))
    }
    return map
  }, [visibleEvents, year, month])

  // Cells for the visible month.
  const cells = useMemo(() => buildMonthCells(year, month), [year, month])

  // Real "today" only highlights if today falls in this month.
  const todayDay = useMemo(() => getTodayInMonth(year, month), [year, month])

  // Per-type counts for the filter chips (live in the visible month).
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const prefix = `${year}-${pad(month + 1)}-`
    for (const e of unifiedEvents) {
      if (!e.date.startsWith(prefix)) continue
      counts[e.type] = (counts[e.type] ?? 0) + 1
    }
    return counts
  }, [unifiedEvents, year, month])

  const totalVisibleMonth = useMemo(
    () => Object.values(typeCounts).reduce((a, b) => a + b, 0),
    [typeCounts],
  )

  // Selected day's events (or empty).
  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : []

  // Upcoming events (visible month onward, filtered, sorted) for the
  // right-side panel when no day is selected.
  const upcomingEvents = useMemo(() => {
    const monthStart = `${year}-${pad(month + 1)}-01`
    return visibleEvents
      .filter((e) => e.date >= monthStart)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }, [visibleEvents, year, month])

  // ─── Handlers ────────────────────────────────────────────────────

  const toggleType = (t: string) => {
    setFilterTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  const prevMonth = () => {
    setSelectedDay(null)
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    setSelectedDay(null)
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const goToToday = () => {
    const t = new Date()
    setYear(t.getFullYear())
    setMonth(t.getMonth())
    setSelectedDay(null)
  }

  const clearSelection = () => setSelectedDay(null)

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <PageTransition className="space-y-4 calendar-shell">
      <style dangerouslySetInnerHTML={{ __html: CAL_GLOBAL_STYLES }} />

      {/* Action row — filter chips on the left, Add Event primary on the right. */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FilterChips
          filterTypes={filterTypes}
          onToggle={toggleType}
          counts={typeCounts}
          totalVisible={totalVisibleMonth}
          onAll={() => setFilterTypes([...ALL_TYPES])}
          onNone={() => setFilterTypes([])}
        />
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add Event
        </Button>
      </div>

      {/* Grid + right-side panel — SelectedDay when a day is clicked,
          UpcomingEvents when nothing is selected (mutually exclusive). */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <CalendarGrid
          year={year}
          month={month}
          cells={cells}
          eventsByDay={eventsByDay}
          selectedDay={selectedDay}
          onSelectDay={(d) => setSelectedDay(d)}
          today={todayDay}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onToday={goToToday}
        />

        {selectedDay !== null ? (
          <SelectedDayPanel
            year={year}
            month={month}
            selectedDay={selectedDay}
            selectedEvents={selectedEvents}
            onClear={clearSelection}
          />
        ) : (
          <UpcomingEvents events={upcomingEvents} />
        )}
      </div>

      <AddEventDialog open={addOpen} onOpenChange={setAddOpen} year={year} month={month} />
    </PageTransition>
  )
}
