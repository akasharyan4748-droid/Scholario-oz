'use client'

/**
 * PersonalAttendance — "My Attendance" (Teacher Workspace, correction pass ATTEND-1).
 *
 * Honest-data rules (the reason this module was rebuilt):
 *   1. The school calendar is FETCHED from the authoritative DB
 *      (`GET /api/events?type=HOLIDAY`, schoolId-scoped SchoolEvent rows).
 *      If the fetch fails the module degrades honestly — it keeps rendering
 *      records using the bundled mirror calendar + shows an error note.
 *   2. Working days are counted from the school's real academic calendar
 *      (session 2026-27, Apr 1 → Mar 31), NOT from marked records.
 *      Weekend = Sunday ONLY (the timetable runs Monday–Saturday).
 *   3. A working day with no stored record shows "Not Marked" — NEVER a
 *      fabricated fallback status.
 *   4. Session history is seeded once (deterministically) into the shared
 *      staff-attendance store via `ensureSessionData` — the same store the
 *      Principal's staff attendance tab uses (one source of truth).
 *
 * Two scopes: THIS MONTH (metric cards + calendar grid + daily records) and
 * ACADEMIC SESSION (session cards + month-by-month breakdown) — so "how many
 * days did I actually work this year?" is answered instantly.
 *
 * Design language: the Marks Entry benchmark — white bg-card, border-border,
 * rounded-xl, compact padding, HubStatCards recipe, semantic status colors,
 * no gradients, no fabricated data.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  CalendarDays,
  CalendarOff,
  CalendarRange,
  Check,
  CheckCheck,
  CircleDashed,
  Clock,
  Coffee,
  Percent,
  X,
} from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '../teacher-panel/module-toolbar'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  HubStatCards,
  HubEmptyState,
  HubModuleSkeleton,
  HubSectionError,
  type HubStat,
} from './shared/hub-stat-cards'
import { StatusBadge } from '@/components/principal/modules/attendance/attendance-status'
import { STAFF_DEFS, type StaffAttendanceRecord, type AttendanceStatus } from '@/lib/mock/attendance'
import { useStaffAttendanceStore } from '@/lib/store/staff-attendance-store'
import { isStaffWeekend, getHoliday as getBundledHoliday } from '@/lib/mock/school-calendar'
import { cn } from '@/lib/utils'

/** The logged-in teacher's staff ID. In production, this comes from auth context. */
const LOGGED_IN_STAFF_ID = 'T-014'

/** The school's academic session (matches the DB School / seeded data). */
const SESSION_START = '2026-04-01'
const SESSION_LABEL = 'Academic Session 2026–27'
/** First month key of the session — months before this are out of session. */
const SESSION_START_MONTH = '2026-04'

type Scope = 'month' | 'session'

/** How a calendar day is classified. */
type DayKind = 'holiday' | 'pre-session' | 'sunday' | 'future' | 'working'

interface DayInfo {
  dateStr: string
  day: number
  weekday: number // 0 = Sunday … 6 = Saturday
  kind: DayKind
  holidayName: string | null
  /** Only set for kind === 'working'. */
  status: AttendanceStatus | 'not-marked' | null
  checkIn: string | null
  checkOut: string | null
}

interface PeriodStats {
  working: number
  present: number
  late: number
  absent: number
  leave: number
  attended: number
  marked: number
  unmarked: number
  /** (present + late) ÷ marked — null when nothing is marked. */
  rate: number | null
}

/** Real clock helper — the module must always open on the live date. */
function todayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Build month options (last 12 months, newest first, anchored to the real clock). */
function buildMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    })
  }
  return options
}
const MONTH_OPTIONS = buildMonthOptions()

/** Default selection = the current real month. */
function currentMonthValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Short display date ("18 Sep") from YYYY-MM-DD. */
function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Long display date ("Friday, 18 September 2026") from YYYY-MM-DD. */
function formatLongDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/** Short weekday ("Fri") from YYYY-MM-DD. */
function weekdayShortOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short' })
}

/** Short month ("Sep") from YYYY-MM-DD. */
function monthShortOf(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' })
}

/** Summarize a set of day infos into period stats (honest zeros, no fabrication). */
function summarize(days: DayInfo[]): PeriodStats {
  let working = 0, present = 0, late = 0, absent = 0, leave = 0
  for (const d of days) {
    if (d.kind !== 'working') continue
    working++
    if (d.status === 'present') present++
    else if (d.status === 'late') late++
    else if (d.status === 'absent') absent++
    else if (d.status === 'leave') leave++
  }
  const attended = present + late
  const marked = present + late + absent + leave
  return {
    working, present, late, absent, leave, attended, marked,
    unmarked: working - marked,
    rate: marked > 0 ? (attended / marked) * 100 : null,
  }
}

/** Dot class for a day cell (semantic status colors). */
function dotClassFor(info: DayInfo): string | null {
  if (info.kind === 'holiday') return 'bg-violet-500'
  if (info.kind === 'sunday') return 'bg-muted-foreground/30'
  if (info.kind === 'working') {
    switch (info.status) {
      case 'present': return 'bg-emerald-500'
      case 'late': return 'bg-amber-500'
      case 'absent': return 'bg-rose-500'
      case 'leave': return 'bg-sky-500'
      default: return 'border border-muted-foreground/50' // not marked — hollow
    }
  }
  return null // future / pre-session — no dot
}

/** Human label for a day (aria-labels, detail card). */
function dayLabel(info: DayInfo): string {
  switch (info.kind) {
    case 'holiday': return `Holiday · ${info.holidayName}`
    case 'sunday': return 'Sunday (weekend)'
    case 'pre-session': return 'Outside academic session'
    case 'future': return 'Upcoming'
    default:
      if (info.status === 'not-marked') return 'Not marked'
      return info.status === null ? '' : info.status.charAt(0).toUpperCase() + info.status.slice(1)
  }
}

/* ──────────────────────────────────────────────────────────
   Small presentational pieces (the Marks Entry card language)
   ────────────────────────────────────────────────────────── */

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-0.5 truncate text-xs font-medium text-foreground">{children}</div>
    </div>
  )
}

function StatusCell({ info }: { info: DayInfo }) {
  if (info.kind === 'holiday') {
    return (
      <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
        <CalendarOff className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate">Holiday · {info.holidayName}</span>
      </span>
    )
  }
  if (info.kind === 'sunday') return <span className="text-[11px] text-muted-foreground">Weekend</span>
  if (info.kind === 'pre-session') return <span className="text-[11px] text-muted-foreground/70">Outside session</span>
  if (info.kind === 'future') return <span className="text-[11px] text-muted-foreground/70">Upcoming</span>
  if (info.status === 'not-marked' || info.status === null) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
        Not Marked
      </span>
    )
  }
  return <StatusBadge status={info.status} size="xs" />
}

/* ──────────────────────────────────────────────────────────
   Module
   ────────────────────────────────────────────────────────── */

export function PersonalAttendance() {
  const reduce = useReducedMotion()
  const [scope, setScope] = useState<Scope>('month')
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [calendar, setCalendar] = useState<{
    status: 'loading' | 'ok' | 'error'
    holidays: Record<string, string>
  }>({ status: 'loading', holidays: {} })

  const byDate = useStaffAttendanceStore((s) => s.byDate)
  const ensureSessionData = useStaffAttendanceStore((s) => s.ensureSessionData)

  /** Stable "today" for this mount (real clock). */
  const TODAY = useMemo(() => todayStr(), [])

  const staffMember = useMemo(
    () => STAFF_DEFS.find((s) => s.id === LOGGED_IN_STAFF_ID),
    []
  )

  /* ── 1. Real school calendar (DB SchoolEvent HOLIDAY rows) ── */

  const loadCalendar = useCallback(async () => {
    setCalendar((c) => ({ ...c, status: 'loading' }))
    try {
      const res = await fetch('/api/events?type=HOLIDAY', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // The API wraps payloads as { ok, data } — unwrap (a bare array is
      // accepted too, so a future envelope change can't break this module).
      const json: unknown = await res.json()
      const envelope = json as { ok?: unknown; error?: unknown; data?: unknown }
      if (envelope && typeof envelope === 'object' && 'ok' in envelope) {
        if (envelope.ok !== true) {
          const msg = typeof envelope.error === 'string' && envelope.error ? envelope.error : 'API error'
          throw new Error(msg)
        }
      }
      const events = (Array.isArray(json) ? json : Array.isArray(envelope?.data) ? envelope.data : []) as {
        title?: string
        startDate?: string
        endDate?: string | null
      }[]
      const map: Record<string, string> = {}
      for (const ev of events) {
        const title = String(ev.title || '').trim()
        const start = String(ev.startDate || '').slice(0, 10)
        if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(start)) continue
        const end = String(ev.endDate || start).slice(0, 10)
        // Expand the range (inclusive) — a date inside a multi-day break is a
        // holiday. Guard against malformed ranges (max one year).
        const [sy, sm, sd] = start.split('-').map(Number)
        const [ey, em, ed] = end.split('-').map(Number)
        const cursor = new Date(sy, sm - 1, sd)
        const stop = new Date(ey, em - 1, ed)
        let guard = 0
        while (cursor <= stop && guard < 370) {
          const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
          map[key] = title
          cursor.setDate(cursor.getDate() + 1)
          guard++
        }
      }
      setCalendar({ status: 'ok', holidays: map })
    } catch {
      // Degrade honestly — the bundled mirror calendar keeps working-day
      // counts correct; an error banner offers a retry.
      setCalendar((c) => ({ ...c, status: 'error' }))
    }
  }, [])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  /** Holiday name for a date — fetched calendar when available, bundled mirror on error. */
  const getHolidayName = useCallback(
    (dateStr: string): string | null => {
      if (calendar.status === 'ok') return calendar.holidays[dateStr] ?? null
      if (calendar.status === 'error') return getBundledHoliday(dateStr)?.name ?? null
      return null
    },
    [calendar]
  )

  /** This school's staff working day: not Sunday, not a declared holiday. */
  const isWorkingDay = useCallback(
    (dateStr: string) => !isStaffWeekend(dateStr) && !getHolidayName(dateStr),
    [getHolidayName]
  )

  /* ── 2. Seed the deterministic session history (idempotent) ── */

  useEffect(() => {
    if (calendar.status === 'loading') return
    ensureSessionData({ sessionStart: SESSION_START, today: TODAY, isWorkingDay })
  }, [calendar.status, ensureSessionData, isWorkingDay, TODAY])

  /* ── 3. The teacher's own record per date (NO fabricated fallback) ── */

  const myRecord = useCallback(
    (dateStr: string): StaffAttendanceRecord | null => {
      const state = byDate[dateStr]
      if (!state) return null
      const records = state.submitted ? state.submittedRecords : state.draft
      return records?.find((r) => r.id === LOGGED_IN_STAFF_ID) ?? null
    },
    [byDate]
  )

  /** Classify + populate every day of a month. */
  const buildDays = useCallback(
    (year: number, month: number): DayInfo[] => {
      const daysInMonth = new Date(year, month, 0).getDate()
      const out: DayInfo[] = []
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const weekday = new Date(year, month - 1, d).getDay()
        const holidayName = getHolidayName(dateStr)
        let kind: DayKind
        if (holidayName) kind = 'holiday'
        else if (dateStr < SESSION_START) kind = 'pre-session'
        else if (weekday === 0) kind = 'sunday'
        else if (dateStr > TODAY) kind = 'future'
        else kind = 'working'
        const record = kind === 'working' ? myRecord(dateStr) : null
        out.push({
          dateStr,
          day: d,
          weekday,
          kind,
          holidayName,
          status: kind === 'working' ? record?.status ?? 'not-marked' : null,
          checkIn: record?.checkIn ?? null,
          checkOut: record?.checkOut ?? null,
        })
      }
      return out
    },
    [getHolidayName, myRecord, TODAY]
  )

  /* ── This-month data ── */

  const monthDays = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    return buildDays(y, m)
  }, [selectedMonth, buildDays])

  const monthStats = useMemo(() => summarize(monthDays), [monthDays])

  const monthLabel = useMemo(
    () => MONTH_OPTIONS.find((o) => o.value === selectedMonth)?.label ?? selectedMonth,
    [selectedMonth]
  )

  const isCurrentMonth = selectedMonth === currentMonthValue()
  const isPreSessionMonth = selectedMonth < SESSION_START_MONTH

  /** Detail card for the clicked calendar day (auto-clears on month change). */
  const selectedDayInfo = useMemo(
    () => monthDays.find((d) => d.dateStr === selectedDay) ?? null,
    [monthDays, selectedDay]
  )

  /* ── Academic-session data ── */

  const sessionMonths = useMemo(() => {
    const rows: { key: string; label: string; stats: PeriodStats }[] = []
    const [ty, tm] = TODAY.split('-').map(Number)
    let y = Number(SESSION_START.slice(0, 4))
    let m = Number(SESSION_START.slice(5, 7))
    while (y < ty || (y === ty && m <= tm)) {
      const key = `${y}-${String(m).padStart(2, '0')}`
      rows.push({
        key,
        label: new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        stats: summarize(buildDays(y, m)),
      })
      if (m === 12) { y += 1; m = 1 } else { m += 1 }
    }
    return rows
  }, [TODAY, buildDays])

  const sessionStats = useMemo<PeriodStats>(() => {
    const totals = { working: 0, present: 0, late: 0, absent: 0, leave: 0, attended: 0, marked: 0 }
    for (const row of sessionMonths) {
      totals.working += row.stats.working
      totals.present += row.stats.present
      totals.late += row.stats.late
      totals.absent += row.stats.absent
      totals.leave += row.stats.leave
      totals.attended += row.stats.attended
      totals.marked += row.stats.marked
    }
    return {
      ...totals,
      unmarked: totals.working - totals.marked,
      rate: totals.marked > 0 ? (totals.attended / totals.marked) * 100 : null,
    }
  }, [sessionMonths])

  /* ── Stat cards (Marks Entry recipe) ── */

  const statsFor = useCallback((s: PeriodStats, workingContext: string): HubStat[] => [
    { key: 'working', label: 'Working Days', value: s.working, icon: CalendarDays, tone: 'slate', context: workingContext },
    { key: 'attended', label: 'Days Attended', value: s.attended, icon: CheckCheck, tone: 'emerald', context: 'present + late' },
    { key: 'present', label: 'Present', value: s.present, icon: Check, tone: 'emerald' },
    { key: 'late', label: 'Late', value: s.late, icon: Clock, tone: 'amber' },
    { key: 'absent', label: 'Absent', value: s.absent, icon: X, tone: 'rose' },
    { key: 'leave', label: 'Leave', value: s.leave, icon: Coffee, tone: 'sky' },
    { key: 'unmarked', label: 'Not Marked', value: s.unmarked, icon: CircleDashed, tone: 'slate' },
    { key: 'rate', label: 'Attendance Rate', value: s.rate === null ? null : `${s.rate.toFixed(1)}%`, icon: Percent, tone: 'slate', context: 'late counts as attended' },
  ], [])

  const monthCards = useMemo(
    () => statsFor(monthStats, isCurrentMonth ? `elapsed to ${formatShortDate(TODAY)}` : 'full month'),
    [statsFor, monthStats, isCurrentMonth, TODAY]
  )
  const sessionCards = useMemo(
    () => statsFor(sessionStats, `1 Apr → ${formatShortDate(TODAY)}`),
    [statsFor, sessionStats, TODAY]
  )

  /* ── Loading ── */

  if (calendar.status === 'loading') {
    return (
      <PageTransition className="space-y-4 sm:space-y-5">
        <HubModuleSkeleton />
      </PageTransition>
    )
  }

  const scopes: { id: Scope; label: string; icon: React.ReactNode }[] = [
    { id: 'month', label: 'This Month', icon: <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> },
    { id: 'session', label: 'Academic Session', icon: <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" /> },
  ]

  return (
    <PageTransition className="space-y-4 sm:space-y-5">
      <ModuleToolbar
        context={`${staffMember?.name ?? ''} · ${staffMember?.role ?? ''} · ${staffMember?.department ?? ''} · ${SESSION_LABEL}`}
        action={
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger size="sm" className="w-[170px] text-xs rounded-lg" aria-label="Attendance month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {calendar.status === 'error' && (
        <HubSectionError
          message="School calendar could not be loaded — holidays shown from the bundled session calendar."
          onRetry={() => void loadCalendar()}
        />
      )}

      {/* Scope pills — the same treatment as the other Teacher Hub modules */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Attendance scope">
        {scopes.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={scope === s.id}
            onClick={() => setScope(s.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              scope === s.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {scope === 'month' ? (
        isPreSessionMonth ? (
          /* Month before the academic session — honest empty state. */
          <div className="rounded-xl border border-border bg-card">
            <HubEmptyState
              icon={CalendarOff}
              title="No attendance records for this month"
              hint={`${monthLabel} falls before the ${SESSION_LABEL} (1 April 2026 – 31 March 2027). Pick a later month to see your attendance.`}
            />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <HubStatCards stats={monthCards} />

            {/* Attendance-rate banner */}
            <div className="space-y-1.5 rounded-lg border border-border/60 bg-card/30 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-xs font-semibold text-foreground">{monthLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Attendance Rate</span>
                  <span className="font-display text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {monthStats.rate === null ? '—' : `${monthStats.rate.toFixed(1)}%`}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <p className="text-[11px] text-muted-foreground">
                  {monthStats.attended} of {monthStats.working} working days attended
                  <span className="text-muted-foreground/70"> · late counts as attended</span>
                </p>
                {monthStats.unmarked > 0 && (
                  <p className="text-[11px] text-muted-foreground/80">
                    {monthStats.unmarked} working day{monthStats.unmarked === 1 ? '' : 's'} not marked yet
                  </p>
                )}
              </div>
            </div>

            {/* Calendar view — compact month grid, Sunday first */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2.5 sm:px-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Calendar · {monthLabel}
                </h3>
                <span className="text-[10px] text-muted-foreground">tap a day for details</span>
              </div>
              <div className="p-3 sm:p-4">
                <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-1.5" aria-hidden="true">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {Array.from({ length: monthDays[0]?.weekday ?? 0 }).map((_, i) => (
                    <div key={`blank-${i}`} aria-hidden="true" />
                  ))}
                  {monthDays.map((info) => {
                    const dot = dotClassFor(info)
                    const selected = selectedDay === info.dateStr
                    return (
                      <motion.button
                        key={info.dateStr}
                        type="button"
                        title={info.holidayName ?? undefined}
                        aria-label={`${formatLongDate(info.dateStr)} — ${dayLabel(info)}`}
                        aria-pressed={selected}
                        onClick={() => setSelectedDay((prev) => (prev === info.dateStr ? null : info.dateStr))}
                        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(info.day * 0.012, 0.25), duration: 0.2 }}
                        className={cn(
                          'flex h-9 flex-col items-center justify-center gap-[3px] rounded-lg border transition-colors sm:h-10',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent hover:border-border hover:bg-muted/40',
                          info.kind === 'sunday' && !selected && 'bg-muted/30',
                          info.kind === 'holiday' && !selected && 'bg-violet-500/[0.04]',
                          (info.kind === 'future' || info.kind === 'pre-session') && 'opacity-40',
                        )}
                      >
                        <span
                          className={cn(
                            'text-xs tabular-nums',
                            info.dateStr === TODAY
                              ? 'font-bold text-primary'
                              : info.kind === 'working'
                              ? 'font-medium text-foreground'
                              : 'font-medium text-muted-foreground',
                          )}
                        >
                          {info.day}
                        </span>
                        {dot ? (
                          <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden="true" />
                        ) : (
                          <span className="h-1.5" aria-hidden="true" />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
                {/* Legend */}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {[
                    { label: 'Present', cls: 'bg-emerald-500' },
                    { label: 'Late', cls: 'bg-amber-500' },
                    { label: 'Absent', cls: 'bg-rose-500' },
                    { label: 'Leave', cls: 'bg-sky-500' },
                    { label: 'Holiday', cls: 'bg-violet-500' },
                    { label: 'Not Marked', cls: 'border border-muted-foreground/50' },
                  ].map((l) => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className={cn('h-1.5 w-1.5 rounded-full', l.cls)} aria-hidden="true" />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Clicked-day detail */}
              <AnimatePresence initial={false}>
                {selectedDayInfo && (
                  <motion.div
                    key="day-detail"
                    initial={reduce ? false : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="border-t border-border px-3 py-3 sm:px-4"
                  >
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <DetailField label="Date">{formatLongDate(selectedDayInfo.dateStr)}</DetailField>
                      <DetailField label="Status"><StatusCell info={selectedDayInfo} /></DetailField>
                      <DetailField label="Check-in">
                        <span className="tabular-nums">{selectedDayInfo.checkIn ?? '—'}</span>
                      </DetailField>
                      <DetailField label="Check-out">
                        <span className="tabular-nums">{selectedDayInfo.checkOut ?? '—'}</span>
                      </DetailField>
                    </div>
                    {selectedDayInfo.holidayName && (
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400">
                        <CalendarOff className="h-3 w-3 shrink-0" aria-hidden="true" />
                        Holiday · {selectedDayInfo.holidayName}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Daily records */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Records</h3>
                <span className="text-[10px] text-muted-foreground">{monthLabel}</span>
              </div>
              <div className="max-h-96 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:transparent">
                <div className="sticky top-0 z-[1] grid grid-cols-[4.2rem_2.2rem_minmax(6rem,1fr)_4.4rem] items-center gap-2 border-b border-border bg-muted px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid-cols-[5rem_2.6rem_minmax(7rem,1fr)_4.8rem_4.8rem_4.6rem] sm:px-4">
                  <span>Date</span>
                  <span>Day</span>
                  <span>Status</span>
                  <span className="text-right">In</span>
                  <span className="hidden text-right sm:block">Out</span>
                  <span className="hidden text-right sm:block">Working</span>
                </div>
                <div className="divide-y divide-border/40">
                  {monthDays.map((info, i) => {
                    const mutedRow = info.kind !== 'working'
                    return (
                      <motion.div
                        key={info.dateStr}
                        initial={reduce ? false : { opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.008, 0.25), duration: 0.18 }}
                        className={cn(
                          'grid grid-cols-[4.2rem_2.2rem_minmax(6rem,1fr)_4.4rem] items-center gap-2 px-3 py-2 text-xs sm:grid-cols-[5rem_2.6rem_minmax(7rem,1fr)_4.8rem_4.8rem_4.6rem] sm:px-4',
                          mutedRow && 'opacity-60',
                          selectedDay === info.dateStr && 'bg-muted/30',
                        )}
                      >
                        <span className="tabular-nums text-muted-foreground">
                          {String(info.day).padStart(2, '0')} {monthShortOf(info.dateStr)}
                        </span>
                        <span className="text-muted-foreground">
                          {weekdayShortOf(info.dateStr)}
                        </span>
                        <span className="min-w-0"><StatusCell info={info} /></span>
                        <span className="text-right tabular-nums text-muted-foreground">
                          {info.kind === 'working' ? info.checkIn ?? '—' : '—'}
                        </span>
                        <span className="hidden text-right tabular-nums text-muted-foreground sm:block">
                          {info.kind === 'working' ? info.checkOut ?? '—' : '—'}
                        </span>
                        <span className="hidden text-right text-muted-foreground sm:block">
                          {info.kind === 'working' ? 'Yes' : 'No'}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ── ACADEMIC SESSION scope ── */
        <div className="space-y-4 sm:space-y-5">
          <HubStatCards stats={sessionCards} />

          {/* Session banner */}
          <div className="space-y-1.5 rounded-lg border border-border/60 bg-card/30 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">{SESSION_LABEL}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Attendance Rate</span>
                <span className="font-display text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {sessionStats.rate === null ? '—' : `${sessionStats.rate.toFixed(1)}%`}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <p className="text-[11px] text-muted-foreground">
                {sessionStats.attended} of {sessionStats.working} working days attended
                <span className="text-muted-foreground/70"> · 1 Apr 2026 → {formatShortDate(TODAY)} · late counts as attended</span>
              </p>
              {sessionStats.unmarked > 0 && (
                <p className="text-[11px] text-muted-foreground/80">
                  {sessionStats.unmarked} working day{sessionStats.unmarked === 1 ? '' : 's'} not marked yet
                </p>
              )}
            </div>
          </div>

          {/* Month-by-month breakdown */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Month by Month</h3>
              <span className="text-[10px] text-muted-foreground">Apr 2026 → {monthLabel}</span>
            </div>
            <div className="overflow-x-auto [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:transparent">
              <table className="w-full min-w-[540px] text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    <th scope="col" className="px-4 py-2 text-left font-bold">Month</th>
                    <th scope="col" className="px-2 py-2 text-right font-bold">Working</th>
                    <th scope="col" className="px-2 py-2 text-right font-bold">Attended</th>
                    <th scope="col" className="px-2 py-2 text-right font-bold">Present</th>
                    <th scope="col" className="px-2 py-2 text-right font-bold">Late</th>
                    <th scope="col" className="px-2 py-2 text-right font-bold">Absent</th>
                    <th scope="col" className="px-2 py-2 text-right font-bold">Leave</th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sessionMonths.map((row) => (
                    <tr key={row.key} className="transition-colors hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-2 font-medium text-foreground">{row.label}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-foreground">{row.stats.working}</td>
                      <td className="px-2 py-2 text-right font-semibold tabular-nums text-foreground">{row.stats.attended}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{row.stats.present}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-amber-600 dark:text-amber-400">{row.stats.late}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-rose-600 dark:text-rose-400">{row.stats.absent}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-sky-600 dark:text-sky-400">{row.stats.leave}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        {row.stats.rate === null ? '—' : `${row.stats.rate.toFixed(1)}%`}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border bg-muted/20 font-semibold">
                    <td className="whitespace-nowrap px-4 py-2 text-foreground">Session total</td>
                    <td className="px-2 py-2 text-right tabular-nums text-foreground">{sessionStats.working}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-foreground">{sessionStats.attended}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-foreground">{sessionStats.present}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-foreground">{sessionStats.late}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-foreground">{sessionStats.absent}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-foreground">{sessionStats.leave}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-foreground">
                      {sessionStats.rate === null ? '—' : `${sessionStats.rate.toFixed(1)}%`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        Attendance derives from the authoritative staff attendance system · holidays and Sundays are never counted as absent.
      </p>
    </PageTransition>
  )
}
