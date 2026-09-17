'use client'

/**
 * AttendanceModule — Student "My Attendance" (FINALIZED).
 *
 * Every number on this page is DERIVED from the canonical
 * `student-attendance-store` — the same records the Teacher/Principal
 * attendance UI writes. Nothing is hardcoded:
 *
 *   Teacher/Principal marks a class  →  records upserted
 *                                     →  this page reflects it live
 *                                     →  a later correction overwrites the
 *                                        same (studentId, date) row — the
 *                                        student always sees the latest.
 *
 * Page structure (hierarchy over quantity):
 *   1. Attendance Rate — gauge + week-over-week delta
 *   2. Status Breakdown — present / late / absent / leave + working days
 *   3. Calendar — month navigation, per-day status, click for detail
 *   4. Trend + Recent Records — honest weekly curve from real records
 *
 * Session + policy awareness: the active academic session and the school's
 * configured attendance thresholds (Excellent / Needs Attention) come from
 * School Settings — never hardcoded.
 */
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock,
  PartyPopper, ChevronLeft, ChevronRight, User, FileText, CalendarOff, Moon, Sun, MinusCircle, CalendarClock,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { ChartCard, AreaTrend, RadialGauge, ProgressBar } from '@/components/shared/charts'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useStudentAttendanceStore,
  computeStats,
  studentRecords,
  weeklyTrend,
  type StudentAttendanceRecord,
  type AttendanceStatus,
} from '@/lib/store/student-attendance-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { useAcademicSession } from '@/lib/academic-session'
import { getHoliday } from '@/lib/mock/school-calendar'
import { DEMO_STUDENT_ID } from './applications/student'

/* ─── Small date helpers (local, timezone-safe) ───────────────────── */

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}` }
function isoOf(d: Date): string { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

/* ─── Day-cell resolution (single source: records + school calendar) ── */

type CellKind = AttendanceStatus | 'holiday' | 'weekend' | 'future' | 'norecord'

interface DayCell {
  key: string
  day: number | null
  iso: string
  kind: CellKind
  holidayName?: string
  record?: StudentAttendanceRecord
}

function resolveDay(iso: string, byDate: Map<string, StudentAttendanceRecord>, todayIso: string): Omit<DayCell, 'day' | 'key'> {
  const record = byDate.get(iso)
  if (record) return { iso, kind: record.status, record }
  const dow = new Date(`${iso}T00:00:00`).getDay()
  if (dow === 0 || dow === 6) return { iso, kind: 'weekend' }
  const holiday = getHoliday(iso)
  if (holiday) return { iso, kind: 'holiday', holidayName: holiday.name }
  if (iso > todayIso) return { iso, kind: 'future' }
  return { iso, kind: 'norecord' }
}

function buildMonthGrid(year: number, month: number, byDate: Map<string, StudentAttendanceRecord>, todayIso: string): DayCell[] {
  const cells: DayCell[] = []
  const firstDow = new Date(year, month - 1, 1).getDay()
  for (let i = 0; i < firstDow; i++) cells.push({ key: `blank-${i}`, day: null, iso: '', kind: 'norecord' })
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${pad(month)}-${pad(d)}`
    cells.push({ key: iso, day: d, ...resolveDay(iso, byDate, todayIso) })
  }
  return cells
}

/* ─── Presentation tokens (colour + icon + text — never colour alone) ── */

const CELL_STYLE: Record<CellKind, string> = {
  present: 'bg-emerald-500 text-white ring-1 ring-emerald-500/30',
  late: 'bg-amber-500 text-white ring-1 ring-amber-500/30',
  absent: 'bg-rose-500 text-white ring-1 ring-rose-500/30',
  leave: 'bg-cyan-600 text-white ring-1 ring-cyan-600/30',
  holiday: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/30',
  weekend: 'bg-muted/50 text-muted-foreground/60',
  future: 'bg-card/40 text-muted-foreground/50 border border-dashed border-border/60',
  norecord: 'bg-card/60 text-muted-foreground border border-border',
}

const CELL_ICON: Record<CellKind, typeof CheckCircle2 | null> = {
  present: CheckCircle2,
  late: Clock,
  absent: XCircle,
  leave: MinusCircle,
  holiday: PartyPopper,
  weekend: null,
  future: null,
  norecord: null,
}

const STATUS_LABEL: Record<CellKind, string> = {
  present: 'Present',
  late: 'Late arrival',
  absent: 'Absent',
  leave: 'On approved leave',
  holiday: 'School holiday',
  weekend: 'Weekend — no school',
  future: 'School day — not yet recorded',
  norecord: 'No attendance recorded',
}

/* ─── Module ────────────────────────────────────────────────────────── */

export function AttendanceModule() {
  // ── Canonical data ──
  const allRecords = useStudentAttendanceStore((s) => s.records)
  const my = useMemo(() => studentRecords(allRecords, DEMO_STUDENT_ID), [allRecords])
  const stats = computeStats(my)

  // ── Identity + session + school policy (all derived) ──
  const student = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))
  const classLabel = student ? `${student.className}-${student.section}` : 'Class 2-A'
  const { label: sessionLabel } = useAcademicSession()
  const thresholds = useSchoolSettingsStore((s) => s.academics?.attendanceThresholds)

  // ── Week-over-week delta (real records only) ──
  const weekPoints = useMemo(() => weeklyTrend(my), [my])
  const weekDelta = useMemo(() => {
    if (weekPoints.length < 2) return null
    const a = weekPoints[weekPoints.length - 2].v
    const b = weekPoints[weekPoints.length - 1].v
    return { delta: +(b - a).toFixed(1), prev: a }
  }, [weekPoints])

  // Policy status from the SCHOOL'S configured thresholds (never hardcoded).
  const policy = useMemo(() => {
    if (my.length === 0 || !thresholds) return null
    if (stats.percent >= thresholds.excellent) return { label: 'Excellent', variant: 'success' as const }
    if (stats.percent < thresholds.needsAttention) return { label: 'Needs Attention', variant: 'danger' as const }
    return { label: 'Good', variant: 'warning' as const }
  }, [my.length, thresholds, stats.percent])

  // ── Calendar state (month navigation bounded by real data) ──
  const todayIso = isoOf(new Date())
  const byDate = useMemo(() => new Map(my.map((r) => [r.date, r])), [my])
  const bounds = useMemo(() => {
    const now = new Date()
    const max = { y: now.getFullYear(), m: now.getMonth() + 1 }
    const min = my.length > 0
      ? { y: Number(my[0].date.slice(0, 4)), m: Number(my[0].date.slice(5, 7)) }
      : max
    return { min, max }
  }, [my])
  const initialCursor = useMemo(() => {
    const latestMonth = my.length > 0 ? { y: Number(my.at(-1)!.date.slice(0, 4)), m: Number(my.at(-1)!.date.slice(5, 7)) } : bounds.max
    const now = new Date()
    const nowMonth = { y: now.getFullYear(), m: now.getMonth() + 1 }
    return latestMonth.y * 12 + latestMonth.m <= nowMonth.y * 12 + nowMonth.m ? latestMonth : nowMonth
  }, [my, bounds.max])
  const [cursor, setCursor] = useState(initialCursor) // {y, m}
  const monthKey = (y: number, m: number) => y * 12 + m
  const canPrev = monthKey(cursor.y, cursor.m) > monthKey(bounds.min.y, bounds.min.m)
  const canNext = monthKey(cursor.y, cursor.m) < monthKey(bounds.max.y, bounds.max.m)
  const monthLabel = new Date(cursor.y, cursor.m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const grid = useMemo(
    () => buildMonthGrid(cursor.y, cursor.m, byDate, todayIso),
    [cursor.y, cursor.m, byDate, todayIso],
  )
  const monthStats = useMemo(() => computeStats(grid.filter((c) => c.record).map((c) => c.record!)), [grid])

  // ── Selected date detail (defaults to today, or the latest record) ──
  const defaultSelected = useMemo(() => {
    if (byDate.has(todayIso)) return todayIso
    return my.length > 0 ? my.at(-1)!.date : null
  }, [byDate, todayIso, my])
  const [selected, setSelected] = useState<string | null>(defaultSelected)
  const selectedCell = useMemo(
    () => (selected ? resolveDay(selected, byDate, todayIso) : null),
    [selected, byDate, todayIso],
  )

  // ── Window label from the records (e.g. 'November – December 2025') ──
  const windowLabel = useMemo(() => {
    if (my.length === 0) return ''
    const first = new Date(`${my[0].date}T00:00:00`)
    const last = new Date(`${my.at(-1)!.date}T00:00:00`)
    const a = first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    const b = last.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    return a === b ? a : `${first.toLocaleDateString('en-IN', { month: 'long' })} – ${b}`
  }, [my])

  /* ── EMPTY STATE — no records yet, no fake data ── */
  if (my.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading
          title="My Attendance"
          subtitle={`${classLabel} · ${sessionLabel}`}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <GlassCard className="px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarOff className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-sm font-semibold">No attendance recorded yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Your daily attendance appears here as your teachers mark it — your
            percentage, calendar and trend will build up automatically.
          </p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Attendance"
        subtitle={`${classLabel} · ${sessionLabel}`}
        icon={<CalendarCheck className="h-5 w-5" />}
        action={policy ? <StatusBadge status={policy.label} variant={policy.variant} dot /> : undefined}
      />

      {/* ── 1. Attendance rate + breakdown ── */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-1">Attendance Rate</h3>
          <p className="text-xs text-muted-foreground mb-3">{windowLabel}</p>
          <div className="flex items-center justify-center">
            <RadialGauge value={stats.percent} label="attended" size={180} color="oklch(0.55 0.14 162)" />
          </div>
          {weekDelta ? (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs">
              {weekDelta.delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" aria-hidden />
              )}
              <span className={cn('font-semibold', weekDelta.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {weekDelta.delta >= 0 ? `+${weekDelta.delta}%` : `${weekDelta.delta}%`}
              </span>
              <span className="text-muted-foreground">vs last week ({weekDelta.prev}%)</span>
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-muted-foreground">Attended {stats.attended} of {stats.total} recorded school days</p>
          )}
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4">Status Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { key: 'present', label: 'Present Days', icon: CheckCircle2, value: stats.present, tile: 'bg-emerald-500/10', chip: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', num: 'text-emerald-600 dark:text-emerald-400' },
              { key: 'late', label: 'Late Arrivals', icon: Clock, value: stats.late, tile: 'bg-amber-500/10', chip: 'bg-amber-500/20 text-amber-600 dark:text-amber-400', num: 'text-amber-600 dark:text-amber-400' },
              { key: 'absent', label: 'Absent Days', icon: XCircle, value: stats.absent, tile: 'bg-rose-500/10', chip: 'bg-rose-500/20 text-rose-600 dark:text-rose-400', num: 'text-rose-600 dark:text-rose-400' },
              { key: 'leave', label: 'Approved Leave', icon: MinusCircle, value: stats.leave, tile: 'bg-cyan-500/10', chip: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400', num: 'text-cyan-600 dark:text-cyan-400' },
            ] as const).map((t, i) => (
              <motion.div
                key={t.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn('rounded-2xl p-4 text-center', t.tile)}
              >
                <div className={cn('mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl', t.chip)}>
                  <t.icon className="h-5 w-5" aria-hidden />
                </div>
                <p className={cn('font-display text-2xl font-bold', t.num)}>
                  <AnimatedCounter value={t.value} />
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">School days recorded</span>
              <span className="font-semibold">{stats.total} days</span>
            </div>
            <ProgressBar value={stats.percent} color="oklch(0.55 0.14 162)" height={8} />
            {thresholds && (
              <p className="text-[10px] text-muted-foreground">
                School policy: {thresholds.needsAttention}%+ to stay healthy · {thresholds.excellent}%+ for excellence
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── 2. Attendance calendar (month navigation + date detail) ── */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm">Attendance Calendar</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {monthStats.total > 0
                ? `${monthStats.total} school days · ${monthStats.percent}% attended`
                : 'No records in this month'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!canPrev}
              onClick={() => {
                const m = cursor.m - 1
                setCursor(m < 1 ? { y: cursor.y - 1, m: 12 } : { y: cursor.y, m })
              }}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center text-sm font-semibold" aria-live="polite">{monthLabel}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!canNext}
              onClick={() => {
                const m = cursor.m + 1
                setCursor(m > 12 ? { y: cursor.y + 1, m: 1 } : { y: cursor.y, m })
              }}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend — icon + text (status never colour alone) */}
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Present</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-amber-500" /> Late</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-rose-500" /> Absent</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-cyan-600" /> Leave</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-violet-500/40" /> Holiday</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-dashed border-border bg-card/60" /> No record</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="pb-1 text-center text-[10px] font-semibold text-muted-foreground">{d}</div>
          ))}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${cursor.y}-${cursor.m}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="col-span-7 grid grid-cols-7 gap-1.5 sm:gap-2"
            >
              {grid.map((cell) => {
                const Icon = cell.day !== null ? CELL_ICON[cell.kind] : null
                const isToday = cell.iso === todayIso
                const isSelected = cell.iso !== '' && cell.iso === selected
                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={cell.day === null}
                    onClick={() => cell.day !== null && setSelected(cell.iso)}
                    aria-label={
                      cell.day === null ? undefined
                        : `${new Date(`${cell.iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} — ${cell.holidayName ? `${cell.holidayName} (holiday)` : STATUS_LABEL[cell.kind]}`
                    }
                    aria-pressed={isSelected || undefined}
                    className={cn(
                      'relative aspect-square rounded-lg text-xs font-medium transition-all',
                      CELL_STYLE[cell.kind],
                      cell.day === null && 'cursor-default bg-transparent',
                      cell.day !== null && 'flex flex-col items-center justify-center hover:scale-[1.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                      isToday && !isSelected && 'ring-2 ring-primary/50',
                    )}
                  >
                    {cell.day !== null && (
                      <>
                        <span className="leading-none">{cell.day}</span>
                        {Icon && <Icon className="mt-0.5 h-2.5 w-2.5 opacity-90" aria-hidden />}
                        {isToday && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" aria-hidden title="Today" />
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Date detail (click any day) ── */}
        <AnimatePresence mode="wait">
          {selected && selectedCell && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-4 rounded-xl border border-border bg-card/50 p-3 sm:p-4"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {selectedCell.kind === 'weekend' ? (
                      <Moon className="h-4.5 w-4.5" aria-hidden />
                    ) : selectedCell.kind === 'future' ? (
                      <CalendarClock className="h-4.5 w-4.5" aria-hidden />
                    ) : (
                      <CalendarCheck className="h-4.5 w-4.5" aria-hidden />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {new Date(`${selected}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      {selected === todayIso && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Today</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {selectedCell.holidayName ? `${selectedCell.holidayName} — school holiday` : STATUS_LABEL[selectedCell.kind]}
                    </p>
                  </div>
                </div>
                {selectedCell.record && (
                  <StatusBadge
                    status={STATUS_LABEL[selectedCell.kind]}
                    variant={
                      selectedCell.kind === 'present' ? 'success'
                        : selectedCell.kind === 'late' ? 'warning'
                          : selectedCell.kind === 'absent' ? 'danger'
                            : 'neutral'
                    }
                    dot
                  />
                )}
              </div>
              {selectedCell.record && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                  {selectedCell.record.markedBy && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" aria-hidden />
                      Marked by {selectedCell.record.markedBy}
                    </span>
                  )}
                  {selectedCell.record.note && (
                    <span className="flex min-w-0 items-center gap-1">
                      <FileText className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">{selectedCell.record.note}</span>
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* ── 3. Trend + recent records ── */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChartCard
          title="Attendance Trend"
          subtitle={`${weekPoints.length} week${weekPoints.length === 1 ? '' : 's'} of records — improving or declining?`}
          className="lg:col-span-2"
          action={<StatusBadge status={`${stats.percent}% overall`} variant="success" dot />}
        >
          {weekPoints.length >= 2 ? (
            <AreaTrend data={weekPoints} xKey="name" yKey="v" color="oklch(0.55 0.14 162)" height={260} gradientId="attWeekly" />
          ) : (
            <div className="flex h-[260px] flex-col items-center justify-center text-center">
              <Sun className="mb-2 h-6 w-6 text-muted-foreground/40" aria-hidden />
              <p className="text-xs text-muted-foreground">A week-by-week trend appears once at least two weeks are recorded.</p>
            </div>
          )}
        </ChartCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="mb-4 font-semibold text-sm">Recent Records</h3>
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
            {[...my].reverse().slice(0, 7).map((d, i) => (
              <motion.div
                key={d.date}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', CELL_STYLE[d.status])}>
                    {d.status === 'present' && <CheckCircle2 className="h-4 w-4" aria-hidden />}
                    {d.status === 'late' && <Clock className="h-4 w-4" aria-hidden />}
                    {d.status === 'absent' && <XCircle className="h-4 w-4" aria-hidden />}
                    {d.status === 'leave' && <MinusCircle className="h-4 w-4" aria-hidden />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' })}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={STATUS_LABEL[d.status]}
                  variant={d.status === 'present' ? 'success' : d.status === 'late' ? 'warning' : d.status === 'absent' ? 'danger' : 'neutral'}
                  dot
                />
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
