'use client'

/**
 * AttendanceModule — Student "My Attendance" (SECOND-GENERATION redesign).
 *
 * READ-ONLY personal attendance record: every number derives from the
 * canonical `student-attendance-store` — the same records the Teacher /
 * Principal attendance UI writes. When staff correct a record, the
 * student sees the updated status here live.
 *
 * Resolution chain: authenticated demo student → enrollment (class +
 * section, never chosen) → active academic session (school settings) →
 * this student's records only (§41 privacy — the store filter is by
 * student id).
 *
 * Percentage policy (the school's existing convention, unchanged):
 *   attended = Present + Late (late counts as attended)
 *   applicable days = RECORDED school days only
 *   → holidays, weekends and unrecorded days never reduce attendance,
 *     and "No Record" never silently becomes Absent.
 *
 * Reading rhythm (§35): context once → hero summary → calendar +
 * records → trend. The page header establishes scope through one quiet
 * window chip — class/section/session never repeat below (§5/§32).
 */

import { useMemo, useState } from 'react'
import { CalendarOff, CalendarRange } from 'lucide-react'
import { GlassCard, PageTransition } from '@/components/shared/ui'
import {
  useStudentAttendanceStore,
  computeStats,
  studentRecords,
  weeklyTrend,
  type StudentAttendanceRecord,
} from '@/lib/store/student-attendance-store'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { StudentPageHeader } from '../../shell/page-header'
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

  // ── School policy — thresholds drive labels and chips only (§27) ──
  const thresholds = useSchoolSettingsStore((s) => s.academics?.attendanceThresholds)

  // ── Identity — enrollment decides the class (never hardcoded, §38) ──
  const student = useStudentsStore((s) => s.students.find((x) => x.id === STUDENT_ID))
  const classLabel = student ? `${student.className}-${student.section}` : 'Class 2-A'

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

  // ── Month-scoped data (memoized — month nav never refetches, §23) ──
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

  /* ── EMPTY STATE — no records, no fabricated numbers (§44) ── */
  if (my.length === 0) {
    return (
      <PageTransition>
        <div className="space-y-6 sm:space-y-7">
          <StudentPageHeader title="My Attendance" subtitle="Your attendance overview" />
          <GlassCard hover={false} className="on-card px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarOff className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm font-semibold">No attendance records for this period</p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Attendance will appear here once the school records your first school day — your percentage,
              calendar and trend build up automatically.
            </p>
          </GlassCard>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-7">
        {/* Scope, once — the record window as a quiet chip (§32) */}
        <StudentPageHeader
          title="My Attendance"
          subtitle="Your attendance overview"
          chips={[{ label: windowLabel, icon: CalendarRange, tone: 'primary', title: 'Your recorded attendance window' }]}
        />

        {/* 1 — "How am I doing?" (§20) */}
        <Snapshot stats={stats} windowLabel={windowLabel} thresholds={thresholds} today={todayStatus} />

        {/* 2 — the primary experience: calendar + records (§21–§28) */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
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

        {/* 3 — "Is it improving?" (§25) */}
        <Trend points={weekPoints} />
      </div>
    </PageTransition>
  )
}

/** Small helper so the initial selection can read the map before the memo. */
function byDateOf(records: StudentAttendanceRecord[]): Map<string, StudentAttendanceRecord> {
  return new Map(records.map((r) => [r.date, r]))
}
