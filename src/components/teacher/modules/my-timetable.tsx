'use client'

/**
 * MyTimetable — the teacher's OWN weekly schedule (Teacher Workspace final
 * sidebar spec: an Overview item alongside My Attendance).
 *
 * Design language: Marks Entry / My Attendance benchmark — quiet toolbar
 * context line, four honest summary cards (HubStatCards recipe), one main
 * weekly card. Purely informational: no primary action (spec Phase 14).
 *
 * Data: GET /api/teacher/timetable — server-scoped to the signed-in
 * teacher (teacherName match, same rule as the Dashboard). Nothing is
 * fabricated; no rows ⇒ honest empty state.
 *
 * Layout: desktop renders the classic period × day grid; small screens
 * get day chips + that day's period list (touch-friendly, no horizontal
 * scroll). Today is highlighted in both views.
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

interface TimetablePayload {
  cells: TimetableCell[]
  stats: {
    periodsPerWeek: number
    classes: number
    subjects: number
    teachingDays: number
  }
  academicSession: string | null
}

// ── helpers ───────────────────────────────────────────────────────────

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function todayWeekday(): string {
  return WEEKDAY_NAMES[new Date().getDay()]
}

function sessionLabel(session: string | null): string | null {
  if (!session) return null
  const m = session.match(/^(\d{4})[-–/](\d{2,4})$/)
  if (!m) return session
  const end = m[2].length === 2 ? `${m[1].slice(0, 2)}${m[2]}` : m[2]
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

function cellTime(c: TimetableCell): string | null {
  const s = prettyTime(c.startTime)
  const e = prettyTime(c.endTime)
  if (s && e) return `${s} – ${e}`
  return s ?? e
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

// ── module ────────────────────────────────────────────────────────────

export function MyTimetableModule() {
  const reduce = useReducedMotion()
  const [data, setData] = useState<TimetablePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const today = todayWeekday()

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
  const stats = data?.stats ?? { periodsPerWeek: 0, classes: 0, subjects: 0, teachingDays: 0 }
  const session = sessionLabel(data?.academicSession ?? null)

  // Day chips: canonical order, only days that actually have cells.
  const activeDays = useMemo(
    () => DAY_ORDER.filter((d) => cells.some((c) => c.day === d)),
    [cells],
  )

  const [selectedDay, setSelectedDay] = useState<string>(today)
  useEffect(() => {
    // Keep the mobile selection valid whenever the payload changes.
    setSelectedDay((cur) => (activeDays.includes(cur) ? cur : (activeDays[0] ?? today)))
  }, [activeDays, today])

  const todayCells = useMemo(() => cells.filter((c) => c.day === today), [cells, today])
  const maxPeriod = useMemo(
    () => cells.reduce((m, c) => Math.max(m, c.period), 0),
    [cells],
  )
  const periodNumbers = useMemo(
    () => Array.from({ length: maxPeriod }, (_, i) => i + 1),
    [maxPeriod],
  )
  // Cells grouped per (day, period) — a slot may hold MORE than one class
  // (the timetable manager can double-book a period; the teacher must see
  // every entry, never a silently-hidden first match).
  const cellsAt = useCallback(
    (day: string, period: number): TimetableCell[] =>
      cells.filter((c) => c.day === day && c.period === period),
    [cells],
  )

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
      context: todayCells.length > 0 ? `${today} · ${cellTime(todayCells[0]) ?? ''}`.trim() : `${today} · no teaching duty`,
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

  const selectedCells = cells
    .filter((c) => c.day === selectedDay)
    .sort((a, b) => a.period - b.period)

  return (
    <PageTransition className="space-y-4 sm:space-y-5">
      <ModuleToolbar
        context={`Your weekly teaching schedule${session ? ` · Academic Session ${session}` : ''}`}
      />

      <HubStatCards stats={summaryStats} />

      {/* Stale-notice when a refresh failed but earlier data exists */}
      {error && <HubSectionError message={error} onRetry={() => void load()} />}

      {/* ── Desktop weekly grid (period rows × day columns) ─────────── */}
      <section
        aria-label="Weekly timetable"
        className="hidden lg:block rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          {/* table-fixed: columns share the card width equally and content
              truncates — the weekly grid NEVER forces its card to scroll,
              even on narrow iPad widths (spec Phase 19). */}
          <table className="w-full table-fixed border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-20 px-3 py-2.5 text-left text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Period
                </th>
                {activeDays.map((d) => (
                  <th
                    key={d}
                    className={cn(
                      'px-3 py-2.5 text-left text-[10px] uppercase font-bold tracking-wider',
                      d === today
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/5'
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
              {periodNumbers.map((p) => (
                <tr key={p} className="border-b border-border/40 last:border-b-0">
                  <td className="px-3 py-2.5 align-top">
                    <span className="font-display font-bold tabular-nums text-foreground">{p}</span>
                  </td>
                  {activeDays.map((d) => {
                    const slot = cellsAt(d, p)
                    if (slot.length === 0) {
                      return (
                        <td key={d} className="px-3 py-2.5">
                          <span className="text-muted-foreground/40">—</span>
                        </td>
                      )
                    }
                    const [first] = slot
                    const time = cellTime(first)
                    return (
                      <td
                        key={d}
                        className={cn(
                          'px-2.5 py-2.5 align-top',
                          d === today && 'bg-emerald-500/[0.04]',
                        )}
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium text-foreground truncate">{first.subjectName}</p>
                          {slot.map((c, i) => (
                            <p
                              key={`${d}-${p}-${i}`}
                              className="text-[10px] text-muted-foreground truncate"
                            >
                              {c.classLabel}
                              {c.room ? ` · ${c.room}` : ''}
                              {slot.length > 1 && (
                                <span className="ml-1 text-amber-600 dark:text-amber-400" title="Two classes share this period — check with the timetable manager">
                                  ⚠
                                </span>
                              )}
                            </p>
                          ))}
                          {/* Time shows only on wide screens — the period row
                              header + mobile list carry it otherwise; keeps the
                              weekly grid inside its card on iPad widths. */}
                          {time && (
                            <p className="hidden xl:block text-[10px] text-muted-foreground/70 truncate">
                              {time}
                            </p>
                          )}
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

      {/* ── Mobile / tablet: day chips + that day's list ────────────── */}
      <section
        aria-label="Timetable by day"
        className="lg:hidden rounded-xl border border-border bg-card overflow-hidden"
      >
        <div
          role="tablist"
          aria-label="Choose a weekday"
          className="flex gap-1.5 overflow-x-auto px-3 py-2.5 border-b border-border bg-muted/20"
        >
          {activeDays.map((d) => {
            const isActive = d === selectedDay
            return (
              <button
                key={d}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDay(d)}
                className={cn(
                  'shrink-0 min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
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

        {selectedCells.length === 0 ? (
          <HubEmptyState
            icon={CalendarDays}
            title={`No periods on ${selectedDay}`}
            hint="Your next teaching day may differ — pick another day above."
            className="py-8"
          />
        ) : (
          <ol className="divide-y divide-border/40">
            {selectedCells.map((c, i) => (
              <motion.li
                /* index in the key: a period can legitimately hold two
                   classes (double-booked slot) — entries must stay unique. */
                key={`${c.day}-${c.period}-${i}`}
                initial={reduce ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.2 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 font-display text-sm font-bold tabular-nums text-foreground">
                  {c.period}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{c.subjectName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {c.classLabel}
                    {c.room ? ` · ${c.room}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {cellTime(c) ? (
                    <p className="text-[11px] text-muted-foreground tabular-nums">{cellTime(c)}</p>
                  ) : null}
                  {c.room && (
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground/70">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {c.room}
                    </p>
                  )}
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </section>

      <p className="text-[10px] text-muted-foreground text-center">
        Your personal schedule, read from the school timetable. Room and period details are set by
        the school timetable manager.
      </p>
    </PageTransition>
  )
}
