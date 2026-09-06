'use client'

/**
 * CalendarWorkspace — the shared premium calendar used by BOTH the
 * Principal panel (full management) and the Student panel (read-only).
 *
 * iOS "liquid glass" visual language:
 *   - An ambient aurora (four soft drifting color fields) sits behind
 *     the whole workspace; every surface above it is translucent glass
 *     (backdrop blur + saturation + specular top edge + hairline
 *     border). The look degrades gracefully to solid cards where
 *     backdrop-filter is unsupported.
 *   - iOS-style header: a large display month title with the year,
 *     a glass segmented control (‹ · Today · ›) and one tinted
 *     primary "Add Event" pill.
 *   - Month navigation animates with spring physics (iOS easing) and
 *     the title cross-fades in the navigation direction.
 *
 * UX (redesign spec — unchanged):
 *   - Calendar is the primary focus; Add Event is the single primary
 *     action. Progressive disclosure: chips/dots in the grid, day
 *     details in the rail (desktop) / bottom sheet (below lg), full
 *     context in the event detail dialog, creation in a focused form.
 *   - Filters are compact glass pills that double as the legend and
 *     filter the grid AND the upcoming list consistently.
 *
 * Data: the SAME unified sources as before — `getUnifiedEvents`
 * (school events + canonical holidays + exam schedule) and
 * `useCalendarStore` user events, evaluated over a rolling window
 * (visible month + today + two following months, deduped by id).
 *
 * "Today" anchors to the app's canonical academic timeline
 * (Dec 10 2025) so the calendar opens on the month the rest of
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

/**
 * Runtime-injected glass blur. The dev CSS pipeline strips literal
 * `backdrop-filter` declarations from stylesheets (legacy targets),
 * while inline DOM <style> rules bypass that pipeline entirely — so
 * every frosted surface gets its blur here, side by side with the
 * `.cal-glass*` surface styles in globals.css (background, hairline
 * border, specular top edge, deep shadows, aurora, fallbacks).
 */
const GLASS_FILTER_STYLES = `
.cal-glass { backdrop-filter: blur(22px) saturate(1.7); -webkit-backdrop-filter: blur(22px) saturate(1.7); }
.cal-glass-strong { backdrop-filter: blur(30px) saturate(1.8); -webkit-backdrop-filter: blur(30px) saturate(1.8); }
.cal-glass-chip { backdrop-filter: blur(12px) saturate(1.6); -webkit-backdrop-filter: blur(12px) saturate(1.6); }
body:has(> [data-slot="dialog-content"].cal-glass-dialog) > [data-slot="dialog-overlay"],
body:has(> [data-slot="sheet-content"].cal-glass-sheet) > [data-slot="sheet-overlay"] {
  backdrop-filter: blur(10px) saturate(1.15);
  -webkit-backdrop-filter: blur(10px) saturate(1.15);
  background: oklch(0.16 0.012 165 / 0.28) !important;
}
@media (prefers-reduced-motion: reduce) {
  .cal-aurora span { animation: none !important; }
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
  const monthKey = `${year}-${month}`

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
    <PageTransition className="calendar-shell relative isolate space-y-4 overflow-hidden sm:space-y-5">
      <style dangerouslySetInnerHTML={{ __html: REDUCED_MOTION_STYLES + GLASS_FILTER_STYLES }} />

      {/* Ambient aurora — the drifting color field the glass refracts. */}
      <div className="cal-aurora" aria-hidden>
        <span className="a1" />
        <span className="a2" />
        <span className="a3" />
        <span className="a4" />
      </div>

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

      {/* iOS-style hero header — large display month title (left),
          glass segmented navigation + primary action (right). */}
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          {/* Title cross-fades with month navigation */}
          <AnimatePresence mode="wait" initial={false} custom={navDirection}>
            <motion.div
              key={monthKey}
              initial={{ opacity: 0, y: 6 * navDirection }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 * navDirection }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-wrap items-baseline gap-x-2.5"
            >
              <h2
                className="font-display text-[27px] font-bold leading-none tracking-tight text-foreground sm:text-[32px]"
                aria-live="polite"
                aria-atomic="true"
              >
                {MONTH_NAMES[month]}
              </h2>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground sm:text-[15px]">
                {year}
              </span>
            </motion.div>
          </AnimatePresence>

          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            {monthTotal === 0
              ? 'No events this month'
              : `${monthTotal} event${monthTotal === 1 ? '' : 's'} this month`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Glass segmented control — ‹ · Today · › */}
          <nav
            className="cal-glass-chip flex h-9 items-center gap-0.5 rounded-full p-0.5"
            aria-label="Month navigation"
          >
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="flex h-8 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goToToday}
              aria-label="Jump to today"
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                isTodayMonth
                  ? 'text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground'
                  : 'bg-primary/[0.12] text-primary hover:bg-primary/[0.18]',
              )}
            >
              {!isTodayMonth && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  aria-hidden
                />
              )}
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="flex h-8 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </nav>

          {canCreate && (
            <Button
              size="sm"
              className="h-9 shrink-0 gap-1.5 rounded-full border border-white/25 bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-[0_8px_20px_-6px] shadow-primary/40 hover:bg-primary/95 active:scale-[0.97]"
              onClick={() => openAdd()}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add Event
            </Button>
          )}
        </div>
      </header>

      {/* Filters — glass pills that double as the type legend. */}
      <TypeFilters
        filterTypes={filterTypes}
        onToggle={toggleType}
        counts={typeCounts}
        onShowAll={showAllTypes}
      />

      {/* All types hidden → slim inline notice instead of a dead grid. */}
      {filterTypes.length === 0 && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/[0.14] bg-foreground/[0.03] py-2.5 text-xs text-muted-foreground backdrop-blur-sm">
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_312px] lg:gap-5 lg:items-stretch">
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
        <div className="cal-glass hidden h-full min-h-0 flex-col overflow-hidden rounded-2xl lg:flex">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedDateISO ?? 'upcoming'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: 'spring', stiffness: 500, damping: 45 }}
              className="flex h-full min-h-0 flex-col"
            >
              {dayNode ?? upcomingNode}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile/tablet rail — upcoming below the calendar. */}
        <div className="cal-glass overflow-hidden rounded-2xl lg:hidden">
          {upcomingNode}
        </div>
      </div>

      {/* Mobile day sheet (below lg) — glass bottom sheet with the same
          Day content as the rail. */}
      <Sheet open={mobileDayOpen} onOpenChange={setMobileDayOpen}>
        <SheetContent
          side="bottom"
          className="cal-glass-sheet cal-glass-strong flex max-h-[85dvh] flex-col gap-0 rounded-t-3xl bg-transparent px-0 pb-0 shadow-none"
        >
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-foreground/25" aria-hidden />
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
            <div className="border-t border-foreground/[0.08] p-3">
              <Button
                variant="outline"
                className="w-full gap-1.5 rounded-xl border-foreground/[0.1] bg-foreground/[0.03]"
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
