'use client'

/**
 * MyTimetable — the teacher's OWN weekly schedule (Teacher Workspace final
 * sidebar spec: an Overview item alongside My Attendance).
 *
 * Design language: Marks Entry benchmark — white cards, border-border,
 * rounded-xl, HubStatCards recipe, quiet ModuleToolbar context line,
 * emerald accents, text-[10px] uppercase labels, tabular-nums. No
 * gradients, no glass, no giant colored blocks.
 *
 * Data: GET /api/teacher/timetable — server-scoped to the signed-in
 * teacher (teacherName match, same rule as the Dashboard) and enriched
 * with the SCHOOL period ladder (periodTimes, P1–P7 — free periods carry
 * real times), the school's teaching days and a server-side conflict
 * scan (teacher/room/class). Nothing is fabricated; no rows ⇒ honest
 * empty state.
 *
 * Structure:
 *   · 4 summary cards (HubStatCards) — periods/week, classes, subjects,
 *     today's periods;
 *   · conflict banner — only when the API reports conflicts (amber card,
 *     every conflict explained, footer pointing at the timetable admin);
 *   · TODAY card — one row per school period with real times, Free rows
 *     explicit, the current period highlighted ("Now") and the next
 *     upcoming period marked ("Next"), computed from the client clock;
 *   · weekly grid (lg+): period rows × day columns, table-fixed so the
 *     grid never overflows its card, today's column tinted;
 *   · mobile (<lg): day chips + the selected day's full period list
 *     including explicit Free rows — the teacher sees the shape of the
 *     whole day.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Clock,
  MapPin,
  RotateCw,
  School,
  Table2,
} from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '../teacher-panel/module-toolbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  HubEmptyState,
  HubModuleSkeleton,
  HubStatCards,
  HubSectionError,
  type HubStat,
} from './shared/hub-stat-cards'
import { signOut } from '@/lib/signout'

// ── payload contracts ─────────────────────────────────────────────────

interface TimetableCell {
  day: string
  period: number
  startTime: string | null
  endTime: string | null
  subjectName: string
  classLabel: string
  room: string | null
}

interface PeriodTime {
  period: number
  startTime: string | null
  endTime: string | null
}

interface ConflictEntry {
  subjectName: string
  classLabel: string
  room: string | null
}

type TimetableConflict =
  | { kind: 'teacher'; day: string; period: number; entries: ConflictEntry[] }
  | { kind: 'room'; day: string; period: number; label: string; detail: string }
  | { kind: 'class'; day: string; period: number; label: string; detail: string }

interface TimetablePayload {
  cells: TimetableCell[]
  stats: {
    periodsPerWeek: number
    classes: number
    subjects: number
    teachingDays: number
  }
  academicSession: string | null
  periodTimes: PeriodTime[]
  schoolDays: string[]
  conflicts: TimetableConflict[]
}

// ── helpers ───────────────────────────────────────────────────────────

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** "Friday, 18 September" — client-local, en-IN day-first style. */
const TODAY_DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/** "2026-2027" / "2026-27" → "2026–27" (en dash, short end). */
function sessionLabel(session: string | null): string | null {
  if (!session) return null
  const m = session.match(/^(\d{4})[-–/](\d{2,4})$/)
  if (!m) return session
  const end = m[2].length === 2 ? m[2] : m[2].slice(-2)
  return `${m[1]}–${end}`
}

/** "08:30" → "8:30 AM" (12h, no leading zero — matches the house style). */
function prettyTime(t: string | null): string | null {
  if (!t) return null
  const [hRaw, m] = t.split(':')
  const h = Number(hRaw)
  if (Number.isNaN(h)) return t
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m} ${ampm}`
}

/** "8:30 – 9:15 AM" from a period's start/end (either missing → the other). */
function prettyRange(start: string | null, end: string | null): string {
  const s = prettyTime(start)
  const e = prettyTime(end)
  if (s && e) return `${s} – ${e}`
  return s ?? e ?? ''
}

/** "08:30" → minutes since midnight (null when unparseable). */
function minutesOf(t: string | null): number | null {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

/** One line per conflict — the banner's body text. */
function conflictLine(c: TimetableConflict): string {
  const slot = `${c.day} · Period ${c.period}`
  if (c.kind === 'teacher') {
    const entries = c.entries.map((e) => `${e.subjectName} · ${e.classLabel}`).join(' / ')
    return `${slot} — ${entries} (two classes share this slot)`
  }
  return `${slot} — ${c.label} (${c.detail})`
}

// ── data hook (house fetch discipline) ────────────────────────────────

let sessionExpiredInFlight = false

function handleExpiredSession(): void {
  if (sessionExpiredInFlight) return
  sessionExpiredInFlight = true
  void signOut().finally(() => {
    window.setTimeout(() => {
      sessionExpiredInFlight = false
    }, 2000)
  })
}

async function fetchTimetable(): Promise<TimetablePayload> {
  const res = await fetch('/api/teacher/timetable', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (res.status === 401) {
    handleExpiredSession()
    throw new Error('Your session has expired. Please sign in again.')
  }
  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    /* non-JSON body — generic message below */
  }
  const envelope = json as { ok?: unknown; error?: unknown; data?: TimetablePayload } | null
  if (!res.ok || !envelope || envelope.ok !== true) {
    const message =
      envelope && typeof envelope.error === 'string' && envelope.error
        ? envelope.error
        : `Request failed (${res.status})`
    throw new Error(message)
  }
  return envelope.data as TimetablePayload
}

// ── shared row renderer (TODAY card + mobile day list) ────────────────

interface LiveSlot {
  currentPeriod: number | null
  nextPeriod: number | null
}

/**
 * One row per school period (P1–P7 ladder): time range | P-chip |
 * assignment (subject / class / room) or an explicit muted "Free".
 * `live` (today only) highlights the current period and marks the next.
 */
function DayPeriodList({
  day,
  periodTimes,
  cellsAt,
  live,
  reduce,
}: {
  day: string
  periodTimes: PeriodTime[]
  cellsAt: (day: string, period: number) => TimetableCell[]
  live: LiveSlot | null
  reduce: boolean | null
}) {
  return (
    <ol className="divide-y divide-border/40">
      {periodTimes.map((pt, i) => {
        const entries = cellsAt(day, pt.period)
        const isNow = live?.currentPeriod === pt.period
        const isNext = live?.nextPeriod === pt.period
        return (
          <motion.li
            key={pt.period}
            initial={reduce ? false : { opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.2 }}
            className={cn(
              'border-l-2 border-l-transparent px-4 py-2.5 sm:py-3',
              isNow && 'border-l-emerald-500 bg-emerald-500/[0.04]',
            )}
          >
            <div className="flex items-center gap-3">
              <p className="w-[88px] shrink-0 text-[11px] leading-tight text-muted-foreground tabular-nums sm:w-[96px]">
                {prettyRange(pt.startTime, pt.endTime) || '—'}
              </p>
              <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-muted/60 font-display text-[11px] font-bold tabular-nums text-foreground">
                P{pt.period}
              </span>
              <div className="min-w-0 flex-1">
                {entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground/70">Free</p>
                ) : (
                  <div className="space-y-1.5">
                    {entries.map((e, idx) => (
                      <div key={`${day}-${pt.period}-${idx}`} className="min-w-0">
                        <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <span className="truncate">{e.subjectName}</span>
                          {entries.length > 1 && (
                            <AlertTriangle
                              className="h-3 w-3 shrink-0 text-amber-500"
                              aria-hidden="true"
                            />
                          )}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">{e.classLabel}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {e.room ?? 'Room not assigned'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isNow && (
                <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Now
                </span>
              )}
              {!isNow && isNext && (
                <span className="shrink-0 rounded-full border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Next
                </span>
              )}
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}

// ── module ────────────────────────────────────────────────────────────

export function MyTimetableModule() {
  const reduce = useReducedMotion()
  const [data, setData] = useState<TimetablePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>('')
  // Client clock — set after mount (the module is fetch-gated, so the
  // date-derived UI never renders on the server; no hydration mismatch).
  // Refreshed every minute so "Now"/"Next" stay honest on an open tab.
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      setData(await fetchTimetable())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // ── ALL derivations before any early return (hooks discipline) ────
  const cells = useMemo(() => data?.cells ?? [], [data])
  const periodTimes = useMemo(() => data?.periodTimes ?? [], [data])
  const schoolDays = useMemo(() => data?.schoolDays ?? [], [data])
  const conflicts = useMemo(() => data?.conflicts ?? [], [data])
  const stats = data?.stats ?? { periodsPerWeek: 0, classes: 0, subjects: 0, teachingDays: 0 }
  const session = sessionLabel(data?.academicSession ?? null)

  const clock = now ?? new Date()
  const today = WEEKDAY_NAMES[clock.getDay()]
  const todayDateLabel = TODAY_DATE_FMT.format(clock)
  const isTeachingDay = schoolDays.includes(today)

  // Cells grouped per (day, period) — a slot may hold MORE than one class
  // (a conflict the API reports; the UI never hides the second entry).
  const bySlot = useMemo(() => {
    const m = new Map<string, TimetableCell[]>()
    for (const c of cells) {
      const k = `${c.day}|${c.period}`
      const arr = m.get(k) ?? []
      arr.push(c)
      m.set(k, arr)
    }
    return m
  }, [cells])
  const cellsAt = useCallback(
    (day: string, period: number): TimetableCell[] => bySlot.get(`${day}|${period}`) ?? [],
    [bySlot],
  )

  const todayCells = useMemo(
    () =>
      cells
        .filter((c) => c.day === today)
        .sort((a, b) => a.period - b.period),
    [cells, today],
  )

  // Live "Now"/"Next" — from the real client clock and the school ladder.
  const live = useMemo<LiveSlot | null>(() => {
    if (!isTeachingDay) return null
    const nowMin = clock.getHours() * 60 + clock.getMinutes()
    let currentPeriod: number | null = null
    for (const pt of periodTimes) {
      const s = minutesOf(pt.startTime)
      const e = minutesOf(pt.endTime)
      if (s != null && e != null && nowMin >= s && nowMin < e) {
        currentPeriod = pt.period
        break
      }
    }
    let nextPeriod: number | null = null
    if (currentPeriod == null) {
      const nowMinAgain = nowMin
      for (const pt of periodTimes) {
        const s = minutesOf(pt.startTime)
        if (s != null && nowMinAgain < s) {
          nextPeriod = pt.period
          break
        }
      }
    }
    return { currentPeriod, nextPeriod }
  }, [clock, isTeachingDay, periodTimes])

  if (loading && !data) return <HubModuleSkeleton />

  if (error && !data) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <HubEmptyState
          icon={AlertTriangle}
          title="Couldn't load your timetable"
          hint={error}
          action={
            <Button size="sm" variant="outline" onClick={() => void load()}>
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
            </Button>
          }
        />
      </div>
    )
  }

  const summaryStats: HubStat[] = [
    {
      key: 'periods',
      label: 'Periods / Week',
      value: stats.periodsPerWeek,
      context: `across ${stats.teachingDays} teaching day${stats.teachingDays === 1 ? '' : 's'}`,
      icon: Table2,
      tone: 'emerald',
    },
    {
      key: 'classes',
      label: 'Classes',
      value: stats.classes,
      context: 'classes you teach',
      icon: School,
      tone: 'sky',
    },
    {
      key: 'subjects',
      label: 'Subjects',
      value: stats.subjects,
      context: 'subjects assigned',
      icon: BookOpen,
      tone: 'violet',
    },
    {
      key: 'today',
      label: "Today's Periods",
      value: todayCells.length,
      context:
        todayCells.length > 0
          ? `${today} · starts ${prettyTime(todayCells[0].startTime) ?? `${todayCells.length} periods`}`
          : `${today} · no teaching duty`,
      icon: Clock,
      tone: todayCells.length > 0 ? 'amber' : 'slate',
    },
  ]

  if (cells.length === 0) {
    return (
      <PageTransition className="space-y-4">
        <ModuleToolbar
          context={session ? `Academic Session ${session}` : 'Your weekly teaching schedule'}
        />
        <div className="rounded-xl border border-border bg-card p-6">
          <HubEmptyState
            icon={CalendarDays}
            title="No timetable slots assigned yet"
            hint="Your weekly teaching schedule will appear here once the school timetable includes you."
          />
        </div>
      </PageTransition>
    )
  }

  // Mobile day chips: default to today when it is a teaching day.
  const defaultDay = isTeachingDay ? today : (schoolDays[0] ?? today)
  const activeDay = schoolDays.includes(selectedDay) ? selectedDay : defaultDay

  const periodRangeLabel =
    periodTimes.length > 0
      ? `P${periodTimes[0].period}–P${periodTimes[periodTimes.length - 1].period}`
      : ''
  const dayRangeLabel =
    schoolDays.length > 0
      ? `${schoolDays[0].slice(0, 3)}–${schoolDays[schoolDays.length - 1].slice(0, 3)}`
      : ''

  return (
    <PageTransition className="space-y-4 sm:space-y-5">
      <ModuleToolbar
        context={`Your weekly teaching schedule${session ? ` · Academic Session ${session}` : ''}`}
      />

      <HubStatCards stats={summaryStats} />

      {/* Stale-notice when a refresh failed but earlier data exists */}
      {error && <HubSectionError message={error} onRetry={() => void load()} />}

      {/* ── Conflict banner (only when the API reports conflicts) ────── */}
      {conflicts.length > 0 && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          aria-label="Timetable conflicts"
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle
                className="h-4 w-4 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Timetable conflict detected
              </h2>
              <ul className="mt-1.5 space-y-1.5">
                {conflicts.map((c, i) => (
                  <li
                    key={`${c.kind}-${c.day}-${c.period}-${i}`}
                    className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/90"
                  >
                    {conflictLine(c)}
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 border-t border-amber-500/20 pt-2 text-[10px] text-amber-700/80 dark:text-amber-300/70">
                This needs to be resolved in the timetable management layer. Contact the school
                timetable administrator.
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── TODAY card — the quick view that answers "what now?" ─────── */}
      <section
        aria-label="Today's schedule"
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border bg-muted/20 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <h2 className="min-w-0 text-sm font-semibold text-foreground">
              Today · {todayDateLabel}
              {!isTeachingDay && (
                <span className="font-normal text-muted-foreground">
                  {' '}
                  — no classes scheduled (non-teaching day)
                </span>
              )}
            </h2>
          </div>
          {isTeachingDay && (
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {todayCells.length} teaching period{todayCells.length === 1 ? '' : 's'}
            </p>
          )}
        </header>
        {isTeachingDay && (
          <>
            {todayCells.length === 0 && (
              <p className="border-b border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
                No teaching periods today
              </p>
            )}
            <DayPeriodList
              day={today}
              periodTimes={periodTimes}
              cellsAt={cellsAt}
              live={live}
              reduce={reduce}
            />
          </>
        )}
      </section>

      {/* ── Desktop weekly grid (period rows × day columns) ─────────── */}
      <section
        aria-label="Weekly timetable"
        className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block"
      >
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Table2
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              This Week
            </h2>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {[periodRangeLabel, dayRangeLabel].filter(Boolean).join(' · ')}
          </p>
        </header>
        <div className="overflow-x-auto">
          {/* table-fixed: columns share the card width equally and content
              truncates — the weekly grid NEVER forces the page (or its
              card) to overflow, even on narrow iPad widths. */}
          <table className="w-full table-fixed border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-24 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Period
                </th>
                {schoolDays.map((d) => (
                  <th
                    key={d}
                    className={cn(
                      'px-2.5 py-2 text-left text-[10px] font-bold uppercase tracking-wider',
                      d === today
                        ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    {d.slice(0, 3)}
                    {d === today && (
                      <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Today
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodTimes.map((pt) => (
                <tr key={pt.period} className="border-b border-border/40 last:border-b-0">
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-display text-[11px] font-bold tabular-nums text-foreground">
                      P{pt.period}
                    </p>
                    <p className="mt-0.5 text-[9px] leading-tight text-muted-foreground/80 tabular-nums">
                      {prettyRange(pt.startTime, pt.endTime)}
                    </p>
                  </td>
                  {schoolDays.map((d) => {
                    const entries = cellsAt(d, pt.period)
                    const isTodayCol = d === today
                    if (entries.length === 0) {
                      return (
                        <td
                          key={d}
                          className={cn('px-2.5 py-2.5 align-top', isTodayCol && 'bg-emerald-500/[0.04]')}
                        >
                          <span className="text-muted-foreground/50">Free</span>
                        </td>
                      )
                    }
                    return (
                      <td
                        key={d}
                        className={cn('px-2.5 py-2.5 align-top', isTodayCol && 'bg-emerald-500/[0.04]')}
                      >
                        <div className="min-w-0 space-y-1.5">
                          {entries.map((e, i) => (
                            <div key={`${d}-${pt.period}-${i}`} className="min-w-0">
                              <p className="flex items-center gap-1 text-xs font-medium text-foreground">
                                <span className="truncate">{e.subjectName}</span>
                                {entries.length > 1 && (
                                  <AlertTriangle
                                    className="h-3 w-3 shrink-0 text-amber-500"
                                    aria-hidden="true"
                                  />
                                )}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                {e.classLabel}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-muted-foreground/80">
                                {e.room ?? 'Room not assigned'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Mobile / tablet: day chips + that day's period list ────── */}
      <section
        aria-label="Timetable by day"
        className="overflow-hidden rounded-xl border border-border bg-card lg:hidden"
      >
        <div
          role="tablist"
          aria-label="Choose a weekday"
          className="flex gap-1.5 overflow-x-auto border-b border-border bg-muted/20 px-3 py-2.5"
        >
          {schoolDays.map((d) => {
            const isActive = d === activeDay
            return (
              <button
                key={d}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDay(d)}
                className={cn(
                  'min-h-[40px] shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
                )}
              >
                {d.slice(0, 3)}
                {d === today && <span className="sr-only"> (today)</span>}
                {d === today && (
                  <span
                    aria-hidden="true"
                    className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle"
                  />
                )}
              </button>
            )
          })}
        </div>

        {cells.filter((c) => c.day === activeDay).length === 0 && (
          <p className="border-b border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
            No teaching periods on {activeDay}
          </p>
        )}
        <DayPeriodList
          day={activeDay}
          periodTimes={periodTimes}
          cellsAt={cellsAt}
          live={activeDay === today ? live : null}
          reduce={reduce}
        />
      </section>

      <p className="text-center text-[10px] text-muted-foreground">
        Your personal schedule, read from the school timetable. Rooms and period times are set by the
        school timetable administrator.
      </p>
    </PageTransition>
  )
}
