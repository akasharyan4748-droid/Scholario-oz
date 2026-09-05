'use client'

/**
 * CalendarWorkspace — the shared premium calendar used by BOTH the
 * Principal panel (full management) and the Student panel (read-only).
 *
 * Layout / UX (redesign spec):
 *   - Calendar stays the primary focus; Add Event (when allowed) is the
 *     single primary action; month nav + Today are compact and obvious.
 *   - Progressive disclosure: the grid stays light (chips/dots). Clicking
 *     a date reveals its events (desktop rail / mobile bottom sheet);
 *     clicking an event opens a focused detail dialog; Add Event opens a
 *     focused form. Nothing is permanently expanded on screen.
 *   - Filters are compact pills that double as the legend; they filter
 *     the grid AND the upcoming list consistently.
 *   - Responsive: single column with an Upcoming card below the grid +
 *     a bottom sheet for day details on phones/tablets (below lg);
 *     two-column calendar + rail from lg up. Comfortable touch targets
 *     everywhere; no horizontal overflow.
 *
 * Data: the SAME unified sources as before — `getUnifiedEvents`
 * (school events + canonical holidays + exam schedule) and
 * `useCalendarStore` user events. To make "Upcoming" meaningful across
 * month boundaries, the helper is evaluated for the visible month PLUS
 * today + the two following months (deduped by id) — no new data
 * sources, no duplicate systems.
 *
 * "Today" anchors to the app's canonical academic timeline
 * (Dec 10 2025) so the calendar opens on the same month the rest of
 * Scholario-OS is showing.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, EyeOff, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { PageTransition, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { getUnifiedEvents, useCalendarStore, type CalendarEvent } from '@/lib/store/calendar-store'
import { useMockExamsStore } from '@/lib/exams/mock-exams-data'
import { cn } from '@/lib/utils'
import {
  ALL_TYPES,
  CANONICAL_TODAY,
  MONTH_NAMES,
  buildMonthMatrix,
  pad,
  todayParts,
  type MonthCell,
} from './data'
import { MonthGrid } from './month-grid'
import { TypeFilters } from './type-filters'
import { UpcomingContent, DayContent } from './side-panels'
import { EventDetailDialog } from './event-detail-dialog'
import { AddEventDialog } from './add-event-dialog'

const REDUCED_MOTION_STYLES = `
@media (prefers-reduced-motion: reduce) {
  .calendar-shell * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`

export interface CalendarWorkspaceProps {
  /** Principal/teacher can create + remove events; students cannot. */
  canCreate: boolean
  /** Student panels keep their module heading pattern. */
  showHeading?: boolean
}

export function CalendarWorkspace({ canCreate, showHeading = false }: CalendarWorkspaceProps) {
  const t = todayParts()

  // ─── State ──────────────────────────────────────────────────────
  const [year, setYear] = useState<number>(t.year)
  const [month, setMonth] = useState<number>(t.month)
  const [navDirection, setNavDirection] = useState<number>(1)
  const [selectedDateISO, setSelectedDateISO] = useState<string | null>(null)
  const [mobileDayOpen, setMobileDayOpen] = useState(false)
  const [filterTypes, setFilterTypes] = useState<string[]>([...ALL_TYPES])
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addDefaultDate, setAddDefaultDate] = useState<string>(CANONICAL_TODAY)

  // ─── Data (single unified source) ───────────────────────────────
  const exams = useMockExamsStore((s) => s.exams)
  const userEvents = useCalendarStore((s) => s.userEvents)

  /**
   * Rolling window: visible month + today's month + the next two.
   * Deduped by id (school + user events are month-independent and are
   * returned by every call).
   */
  const rollingEvents = useMemo(() => {
    const keys = new Set<string>([`${year}-${month}`])
    for (let i = 0; i <= 2; i++) {
      const d = new Date(t.year, t.month + i, 1)
      keys.add(`${d.getFullYear()}-${d.getMonth()}`)
    }
    const byId = new Map<string, CalendarEvent>()
    for (const key of keys) {
      const [y, m] = key.split('-').map(Number)
      for (const e of getUnifiedEvents(y, m, exams, userEvents)) {
        byId.set(e.id, e)
      }
    }
    return [...byId.values()]
  }, [year, month, exams, userEvents])

  // Type-filtered view of everything.
  const visibleEvents = useMemo(
    () => rollingEvents.filter((e) => filterTypes.includes(e.type)),
    [rollingEvents, filterTypes],
  )

  // Events per date — visible month only (drives the grid + day views).
  const eventsByDate = useMemo(() => {
    const prefix = `${year}-${pad(month + 1)}-`
    const map: Record<string, CalendarEvent[]> = {}
    for (const e of visibleEvents) {
      if (!e.date.startsWith(prefix)) continue
      ;(map[e.date] ??= []).push(e)
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => (a.time === '—' ? 1 : 0) - (b.time === '—' ? 1 : 0) || a.time.localeCompare(b.time))
    }
    return map
  }, [visibleEvents, year, month])

  // Per-type counts in the visible month (unfiltered — shows availability).
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const prefix = `${year}-${pad(month + 1)}-`
    for (const e of rollingEvents) {
      if (!e.date.startsWith(prefix)) continue
      counts[e.type] = (counts[e.type] ?? 0) + 1
    }
    return counts
  }, [rollingEvents, year, month])

  const monthTotal = useMemo(
    () => Object.values(typeCounts).reduce((a, b) => a + b, 0),
    [typeCounts],
  )

  // Upcoming: from canonical today onward, filtered, nearest first.
  const upcomingEvents = useMemo(
    () =>
      visibleEvents
        .filter((e) => e.date >= CANONICAL_TODAY)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [visibleEvents],
  )

  // Is the upcoming list empty only because of the type filters?
  const upcomingEmptyDueToFilter = useMemo(
    () => rollingEvents.some((e) => e.date >= CANONICAL_TODAY) && upcomingEvents.length === 0,
    [rollingEvents, upcomingEvents],
  )

  // Grid inputs.
  const cells = useMemo(() => buildMonthMatrix(year, month), [year, month])
  const todayDate = useMemo(
    () => (t.year === year && t.month === month ? `${year}-${pad(month + 1)}-${pad(t.day)}` : null),
    [year, month],
  )

  const isTodayMonth = t.year === year && t.month === month
  const monthLabel = `${MONTH_NAMES[month]} ${year}`

  // ─── Navigation ─────────────────────────────────────────────────

  const shiftMonth = (delta: number) => {
    setNavDirection(delta)
    setSelectedDateISO(null)
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const goToToday = () => {
    setNavDirection(t.year * 12 + t.month > year * 12 + month ? 1 : -1)
    setYear(t.year)
    setMonth(t.month)
    setSelectedDateISO(null)
  }

  const showAllTypes = () => setFilterTypes([...ALL_TYPES])
  const toggleType = (type: string) =>
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type],
    )

  /** Open the mobile day sheet when the viewport is below lg. */
  const openSheetIfMobile = () => {
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches) {
      setMobileDayOpen(true)
    }
  }

  const handleSelectDay = (cell: MonthCell) => {
    if (!cell.inMonth) {
      // Adjacent-month day → navigate there and keep it selected.
      shiftMonth(cell.monthOffset)
      setSelectedDateISO(cell.dateISO)
      openSheetIfMobile()
      return
    }
    if (selectedDateISO === cell.dateISO) {
      setSelectedDateISO(null) // tap again to clear
      return
    }
    setSelectedDateISO(cell.dateISO)
    openSheetIfMobile()
  }

  const openAdd = (dateISO?: string) => {
    setAddDefaultDate(dateISO ?? selectedDateISO ?? todayDate ?? `${year}-${pad(month + 1)}-01`)
    setAddOpen(true)
  }

  const handleEventAdded = (event: CalendarEvent) => {
    // Navigate to the event's month, select its day and make sure its
    // type is visible in the current filter.
    const [y, m] = event.date.split('-').map(Number)
    if (y !== year || m - 1 !== month) {
      setNavDirection(y * 12 + (m - 1) > year * 12 + month ? 1 : -1)
      setYear(y)
      setMonth(m - 1)
    }
    setSelectedDateISO(event.date)
    setFilterTypes((prev) => (prev.includes(event.type) ? prev : [...prev, event.type]))
  }

  const selectedDayEvents = selectedDateISO ? (eventsByDate[selectedDateISO] ?? []) : []

  // ─── Shared rail contents ────────────────────────────────────────

  const upcomingNode = (
    <UpcomingContent
      events={upcomingEvents}
      emptyDueToFilter={upcomingEmptyDueToFilter}
      onShowAll={showAllTypes}
      onOpen={setDetailEvent}
    />
  )

  const dayNode = selectedDateISO ? (
    <DayContent
      dateISO={selectedDateISO}
      events={selectedDayEvents}
      canCreate={canCreate}
      onAdd={(d) => openAdd(d)}
      onOpen={setDetailEvent}
      onClear={() => setSelectedDateISO(null)}
    />
  ) : null

  return (
    <PageTransition className="calendar-shell space-y-4 sm:space-y-5">
      <style dangerouslySetInnerHTML={{ __html: REDUCED_MOTION_STYLES }} />

      {/* Module heading — student panels keep their heading pattern. */}
      {showHeading && (
        <SectionHeading
          title="School Calendar"
          subtitle="Events, exams & school holidays"
          icon={<CalendarDays className="h-5 w-5" />}
          action={
            <StatusBadge
              status={`${monthTotal} event${monthTotal === 1 ? '' : 's'} this month`}
              variant="primary"
              dot
            />
          }
        />
      )}

      {/* Header row — month nav + Today (left), Add Event (right). */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <div
            className="min-w-[7.5rem] sm:min-w-[9.5rem] text-center"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-sm sm:text-[15px] font-semibold tracking-tight text-foreground tabular-nums">
              {monthLabel}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'ml-1 h-8 rounded-lg px-2.5 text-xs font-medium transition-colors',
              !isTodayMonth && 'border-primary/30 bg-primary/[0.06] text-primary hover:bg-primary/10 hover:text-primary',
            )}
            onClick={goToToday}
            aria-label="Jump to today"
          >
            Today
          </Button>
        </div>

        {canCreate && (
          <Button
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => openAdd()}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Event
          </Button>
        )}
      </div>

      {/* Filters — double as the type legend. */}
      <TypeFilters
        filterTypes={filterTypes}
        onToggle={toggleType}
        counts={typeCounts}
        onShowAll={showAllTypes}
      />

      {/* All types hidden → slim inline notice instead of a dead grid. */}
      {filterTypes.length === 0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 py-2.5 text-xs text-muted-foreground">
          <EyeOff className="h-3.5 w-3.5" aria-hidden />
          All event types are hidden.
          <button
            type="button"
            onClick={showAllTypes}
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Show all
          </button>
        </div>
      )}

      {/* Calendar (primary) + rail. Below lg: single column, upcoming
          card under the grid, day details via bottom sheet. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-5 lg:items-stretch">
        <MonthGrid
          year={year}
          month={month}
          cells={cells}
          eventsByDate={eventsByDate}
          selectedDate={selectedDateISO}
          todayDate={todayDate}
          navDirection={navDirection}
          onSelectDay={handleSelectDay}
          onOpenEvent={setDetailEvent}
        />

        {/* Desktop rail — day details when a day is selected, else upcoming. */}
        <div className="hidden h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:flex">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedDateISO ?? 'upcoming'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="flex h-full min-h-0 flex-col"
            >
              {dayNode ?? upcomingNode}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile/tablet rail — upcoming below the calendar. */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:hidden">
          {upcomingNode}
        </div>
      </div>

      {/* Mobile day sheet (below lg) — same Day content as the rail. */}
      <Sheet open={mobileDayOpen} onOpenChange={setMobileDayOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[85dvh] flex-col gap-0 rounded-t-2xl px-0 pb-0"
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden />
          <SheetTitle className="sr-only">
            {selectedDateISO ? `Events on ${selectedDateISO}` : 'Events'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Events scheduled for the selected day
          </SheetDescription>
          <div className="min-h-0 flex-1 overflow-hidden pt-1">
            {selectedDateISO && (
              <DayContent
                dateISO={selectedDateISO}
                events={selectedDayEvents}
                canCreate={canCreate}
                onAdd={(d) => {
                  setMobileDayOpen(false)
                  openAdd(d)
                }}
                onOpen={setDetailEvent}
              />
            )}
          </div>
          {canCreate && selectedDateISO && (
            <div className="border-t border-border/70 p-3">
              <Button
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => {
                  setMobileDayOpen(false)
                  openAdd(selectedDateISO)
                }}
              >
                <Plus className="h-4 w-4" aria-hidden /> Add event on this day
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Event detail — progressive disclosure for full event context. */}
      <EventDetailDialog
        event={detailEvent}
        onOpenChange={(o) => !o && setDetailEvent(null)}
        canManage={canCreate}
      />

      {/* Add event — focused creation form. */}
      {canCreate && (
        <AddEventDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          defaultDate={addDefaultDate}
          onAdded={handleEventAdded}
        />
      )}
    </PageTransition>
  )
}
