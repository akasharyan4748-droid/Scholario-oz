'use client'

/**
 * CalendarModule — Principal Calendar workspace orchestrator.
 *
 * The global sidebar already says "Calendar", so the header here uses a
 * contextual title ("Academic & Cultural Calendar") — NO duplicate
 * "School Calendar" title.
 *
 * Layout:
 *   - Header (shared pattern): small eyebrow → h1 → short description →
 *     primary actions (h-8 text-xs). NO summary pills.
 *   - Filter chips row (above the grid).
 *   - Grid: lg:grid-cols-3 — CalendarGrid spans 2 cols; right-side panel
 *     (SelectedDayPanel when a day is selected, UpcomingEvents otherwise)
 *     spans 1 col. The two panels are mutually exclusive (audit fix #5 —
 *     no more 3 simultaneous views of the same events).
 *   - Add Event dialog.
 *
 * State:
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
 *
 * Migration notes (audit fixes #1, #2, #3, #4, #5, #6, #7, #8, #9):
 *  - Dropped legacy SectionHeading + GlassCard from `@/components/shared/ui`.
 *  - Dropped the redundant mini-header inside the calendar grid.
 *  - Month navigation now mutates year/month state and recomputes the grid.
 *  - Add Event now calls a real Zustand mutation.
 *  - Default selectedDay is null (no day selected → UpcomingEvents shows).
 *  - Single CalendarDays icon in the header (was previously used twice).
 *  - No static legend at the bottom of the grid (filter chips cover that).
 *  - Holidays come from school-calendar.ts (Dec 23 for winter break, not
 *    the stale Dec 24 from calendarEvents).
 */

import { useMemo, useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCalendarStore, getUnifiedEvents } from '@/lib/store/calendar-store'
import { useMockExamsStore } from '@/lib/exams/mock-exams-data'
import {
  ALL_TYPES,
  MONTH_NAMES,
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

  const eyebrow = `Academic Year ${year}-${(year + 1).toString().slice(2)} · ${MONTH_NAMES[month]}`

  return (
    <div className="flex flex-col h-full calendar-shell">
      <style dangerouslySetInnerHTML={{ __html: CAL_GLOBAL_STYLES }} />

      {/* Header — shared pattern (eyebrow → title → short description → actions) */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em] flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                {eyebrow}
              </p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight mt-0.5">
                Academic &amp; Cultural Calendar
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                School events, holidays, examinations &amp; meetings in one view. Click a day to see its schedule.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {/* Filter chips — above the grid */}
        <FilterChips
          filterTypes={filterTypes}
          onToggle={toggleType}
          counts={typeCounts}
          totalVisible={totalVisibleMonth}
          onAll={() => setFilterTypes([...ALL_TYPES])}
          onNone={() => setFilterTypes([])}
        />

        {/* Grid + right-side panel — SelectedDay when a day is clicked,
            UpcomingEvents when nothing is selected (mutually exclusive). */}
        <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4')}>
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
      </div>

      <AddEventDialog open={addOpen} onOpenChange={setAddOpen} year={year} month={month} />
    </div>
  )
}
