'use client'

/**
 * AttendanceModule — Student "My Attendance" (PRODUCTION REBUILD).
 *
 * READ-ONLY personal attendance record (§1): every number derives from the
 * canonical `student-attendance-store` — the same records the Teacher /
 * Principal attendance UI writes through `markClassAttendance`. When staff
 * correct a record, the student sees the updated status here live. The
 * student role performs no writes anywhere in this module.
 *
 * Resolution chain (§3): authenticated demo student → enrollment (class +
 * section, never chosen) → active academic session (school settings) →
 * this student's records only. No other student's data is ever read
 * (§27) — the store filter is by student id.
 *
 * Percentage policy (§6) — the school's existing convention, unchanged:
 *   attended = Present + Late (late counts as attended)
 *   applicable days = RECORDED school days only
 *   → holidays, weekends and unrecorded days never reduce attendance,
 *     and "No Record" never silently becomes Absent (§31).
 *
 * Structure (§45): context header → snapshot → calendar + month records
 * → trend. The app header already says "Attendance", so the page opens
 * with its own context — never a repeated giant title (§4).
 */

import { useMemo, useState } from 'react'
import { CalendarOff } from 'lucide-react'
import { GlassCard, PageTransition } from '@/components/shared/ui'
import {
  useStudentAttendanceStore,
  computeStats,
  studentRecords,
  weeklyTrend,
  type StudentAttendanceRecord,
} from '@/lib/store/student-attendance-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { ACTIVE_SESSION_ID, normalizeSessionId, formatSessionLabel } from '@/lib/academic-session'
import { Snapshot, type TodayStatus } from './snapshot'
import { CalendarView } from './calendar-view'
import { MonthRecords } from './month-records'
import { Trend } from './trend'
import {
  buildMonthGrid,
  defaultSelection,
  formatWindow,
  isoOf,
  monthIndex,
  pad,
  resolveDay,
  shiftMonth,
  workingDaysInMonth,
  type MonthCursor,
} from './date-utils'

/** The canonical demo student (single roster backs every role). */
const STUDENT_ID = 'STU-58'

export function AttendanceModule() {
  // ── Canonical data — the same rows Teacher/Principal write ──
  const allRecords = useStudentAttendanceStore((s) => s.records)
  const my = useMemo(() => studentRecords(allRecords, STUDENT_ID), [allRecords])
  const stats = computeStats(my)

  // ── Identity — enrollment decides the class, settings decide the session ──
  const student = useStudentsStore((s) => s.students.find((x) => x.id === STUDENT_ID))
  const classLabel = student ? `${student.className}-${student.section}` : 'Class 2-A'
  const section = student?.section ?? 'A'
  const rawSession = useSchoolSettingsStore((s) => s.academics?.currentSession)
  const sessionLabel = formatSessionLabel(normalizeSessionId(rawSession) ?? ACTIVE_SESSION_ID)
  const thresholds = useSchoolSettingsStore((s) => s.academics?.attendanceThresholds)

  // ── Time + month navigation (local-timezone safe) ──
  const todayIso = isoOf(new Date())
  const currentMonth = useMemo<MonthCursor>(
    () => ({ y: Number(todayIso.slice(0, 4)), m: Number(todayIso.slice(5, 7)) }),
    [todayIso],
  )
  const minMonth = useMemo(
    () =>
      my.length > 0
        ? { y: Number(my[0].date.slice(0, 4)), m: Number(my[0].date.slice(5, 7)) }
        : currentMonth,
    [my, currentMonth],
  )
  const [cursor, setCursor] = useState<MonthCursor>(currentMonth)
  const [selected, setSelected] = useState<string | null>(() => defaultSelection(currentMonth, byDateOf(my), todayIso))
  const byDate = useMemo(() => byDateOf(my), [my])
  const canPrev = monthIndex(cursor) > monthIndex(minMonth)
  const canNext = monthIndex(cursor) < monthIndex(currentMonth)

  const handleShift = (delta: number) => {
    const next = shiftMonth(cursor, delta)
    setCursor(next)
    setSelected(defaultSelection(next, byDate, todayIso))
  }

  // ── Month-scoped data (memoized — month nav never refetches, §29) ──
  const grid = useMemo(() => buildMonthGrid(cursor, byDate, todayIso), [cursor, byDate, todayIso])
  const monthPrefix = `${cursor.y}-${pad(cursor.m)}`
  const monthRecords = useMemo(
    () => my.filter((r) => r.date.startsWith(monthPrefix)).reverse(), // newest first
    [my, monthPrefix],
  )
  const monthStats = useMemo(() => computeStats(monthRecords), [monthRecords])
  const workingDays = useMemo(() => workingDaysInMonth(cursor), [cursor])

  // ── Today's status + trend (real records only) ──
  const todayStatus: TodayStatus = useMemo(() => {
    const d = resolveDay(todayIso, byDate, todayIso)
    return { kind: d.kind, holidayName: d.holidayName, record: d.record }
  }, [todayIso, byDate])
  const weekPoints = useMemo(() => weeklyTrend(my), [my])
  const windowLabel = useMemo(
    () => (my.length > 0 ? formatWindow(my[0].date, my[my.length - 1].date) : ''),
    [my],
  )

  /* ── EMPTY STATE — no records, no fabricated numbers (§32) ── */
  if (my.length === 0) {
    return (
      <PageTransition>
        <ContextHeader classLabel={classLabel} section={section} sessionLabel={sessionLabel} recordedDays={0} />
        <GlassCard hover={false} className="on-card px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarOff className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-sm font-semibold">No attendance recorded yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Attendance will appear here once the school records your first school day — your percentage,
            calendar and trend build up automatically.
          </p>
        </GlassCard>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-5">
        <ContextHeader classLabel={classLabel} section={section} sessionLabel={sessionLabel} recordedDays={my.length} />

        {/* 1 — "How am I doing?" (§5–§7) */}
        <Snapshot stats={stats} windowLabel={windowLabel} thresholds={thresholds ?? null} today={todayStatus} />

        {/* 2 — the primary experience: calendar + month records (§8–§13) */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CalendarView
              cursor={cursor}
              isCurrentMonth={monthIndex(cursor) === monthIndex(currentMonth)}
              canPrev={canPrev}
              canNext={canNext}
              onShift={handleShift}
              grid={grid}
              todayIso={todayIso}
              selected={selected}
              onSelect={setSelected}
              classLabel={classLabel}
              monthStats={monthStats}
              workingDays={workingDays}
            />
          </div>
          <MonthRecords
            key={`${cursor.y}-${cursor.m}`}
            cursor={cursor}
            records={monthRecords}
            workingDays={workingDays}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {/* 3 — "Is it improving?" (§14–§15) */}
        <Trend points={weekPoints} />
      </div>
    </PageTransition>
  )
}

/* ── Context header — establishes scope, never repeats the page title (§4) ── */

function ContextHeader({
  classLabel,
  section,
  sessionLabel,
  recordedDays,
}: {
  classLabel: string
  section: string
  sessionLabel: string
  recordedDays: number
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">My Attendance</p>
      <h2 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
        {classLabel} <span className="font-medium text-muted-foreground">· Section {section}</span>
      </h2>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span>{sessionLabel}</span>
        <span aria-hidden className="text-border">•</span>
        <span>
          {recordedDays} recorded school day{recordedDays === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  )
}

/** Small helper so the initial selection can read the map before the memo. */
function byDateOf(records: StudentAttendanceRecord[]): Map<string, StudentAttendanceRecord> {
  return new Map(records.map((r) => [r.date, r]))
}
