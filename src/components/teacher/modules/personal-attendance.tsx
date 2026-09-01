'use client'

/**
 * PersonalAttendance — Brief PART 21-27 + PART 39 (Phase 6).
 *
 * Brief PART 21: Every teacher/employee automatically has their own personal
 *   attendance view. It's DERIVED from the same staff attendance store —
 *   ONE source of truth (Brief PART 23).
 * Brief PART 22: When Principal marks attendance, the personal view reflects
 *   it automatically — no manual re-entry.
 * Brief PART 24: Security — a teacher can only see their OWN attendance.
 * Brief PART 25: Shows current month summary + daily calendar/list.
 * Brief PART 26: Holidays shown as "Holiday" (not absent, not counted in rate).
 * Brief PART 27: Reflects finalized (submitted) records as authoritative.
 *
 * This component is used in the Teacher panel's "Attendance" view.
 * The logged-in teacher's ID is derived from auth context (here: T-014 = Rohan Mehta).
 */

import { useState, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Clock, X, Coffee, CalendarOff, Calendar as CalendarIcon } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { STAFF_DEFS } from '@/lib/mock/attendance'
import {
  useStaffAttendanceStore,
  STAFF_TODAY_DATE,
} from '@/lib/store/staff-attendance-store'
import {
  isHoliday as isSchoolHoliday,
  getHoliday as getSchoolHoliday,
  isWeekend,
  isFutureDate,
} from '@/lib/mock/school-calendar'
import { STATUS_META, STATUS_ORDER, StatusBadge } from '@/components/principal/modules/attendance/attendance-status'
import type { AttendanceStatus } from '@/lib/mock/attendance'

/** The logged-in teacher's staff ID. In production, this comes from auth context. */
const LOGGED_IN_STAFF_ID = 'T-014'

/** Build month options (last 12 months from Dec 2025). */
function buildMonthOptions() {
  const options: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    let y = 2025, m = 12 - i
    while (m < 1) { m += 12; y -= 1 }
    const date = new Date(y, m - 1, 1)
    options.push({
      value: `${y}-${String(m).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    })
  }
  return options
}
const MONTH_OPTIONS = buildMonthOptions()

export function PersonalAttendance() {
  const reduce = useReducedMotion()
  const [selectedMonth, setSelectedMonth] = useState('2025-12')
  const byDate = useStaffAttendanceStore((s) => s.byDate)

  const staffMember = useMemo(
    () => STAFF_DEFS.find((s) => s.id === LOGGED_IN_STAFF_ID),
    []
  )

  // Brief PART 23: derive personal attendance from the SAME store.
  // For each day in the selected month, look up the staff member's status
  // from the date-keyed store (draft or submitted record).
  const dailyRecords = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const records: {
      dateStr: string
      day: number
      status: AttendanceStatus | 'holiday' | 'weekend' | 'upcoming'
      label: string
      holidayName?: string
    }[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const weekend = isWeekend(dateStr)
      const holiday = isSchoolHoliday(dateStr)
      const holidayInfo = getSchoolHoliday(dateStr)
      const future = isFutureDate(dateStr, STAFF_TODAY_DATE)

      if (weekend) {
        records.push({ dateStr, day: d, status: 'weekend', label: 'Weekend' })
      } else if (holiday) {
        records.push({ dateStr, day: d, status: 'holiday', label: 'Holiday', holidayName: holidayInfo?.name })
      } else if (future) {
        records.push({ dateStr, day: d, status: 'upcoming', label: 'Upcoming' })
      } else {
        // Brief PART 22: look up from the store (draft or submitted)
        const dateState = byDate[dateStr]
        if (dateState) {
          // Find this staff member's status in the draft or submitted records
          const sourceRecords = dateState.submitted ? dateState.submittedRecords : dateState.draft
          const staffRecord = sourceRecords?.find((r) => r.id === LOGGED_IN_STAFF_ID)
          if (staffRecord) {
            records.push({ dateStr, day: d, status: staffRecord.status, label: staffRecord.status })
          } else {
            // Staff member not in the record — use default (deterministic per date)
            records.push({ dateStr, day: d, status: 'present', label: 'present' })
          }
        } else {
          // No stored state for this date — derive deterministic default
          let seed = 0
          const key = `${dateStr}-${LOGGED_IN_STAFF_ID}`
          for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0
          const r = seed / 0x7fffffff
          if (r < 0.88) records.push({ dateStr, day: d, status: 'present', label: 'present' })
          else if (r < 0.93) records.push({ dateStr, day: d, status: 'late', label: 'late' })
          else if (r < 0.97) records.push({ dateStr, day: d, status: 'leave', label: 'leave' })
          else records.push({ dateStr, day: d, status: 'absent', label: 'absent' })
        }
      }
    }
    return records
  }, [byDate, selectedMonth])

  // Brief PART 25: Summary stats
  const summary = useMemo(() => {
    let present = 0, late = 0, absent = 0, leave = 0
    let workingDays = 0
    for (const r of dailyRecords) {
      if (r.status === 'present') { present++; workingDays++ }
      else if (r.status === 'late') { late++; workingDays++ }
      else if (r.status === 'absent') { absent++; workingDays++ }
      else if (r.status === 'leave') { leave++; workingDays++ }
    }
    const totalMarked = present + late + absent + leave
    const rate = totalMarked > 0 ? ((present + late) / totalMarked * 100) : 0
    return { present, late, absent, leave, workingDays, rate }
  }, [dailyRecords])

  const monthLabel = useMemo(() => {
    const opt = MONTH_OPTIONS.find((o) => o.value === selectedMonth)
    return opt ? opt.label : selectedMonth
  }, [selectedMonth])

  return (
    <PageTransition className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">My Attendance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {staffMember?.name} · {staffMember?.role} · {staffMember?.department}
          </p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger size="sm" className="w-[170px] text-xs rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brief PART 25: Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_ORDER.map((status, i) => {
          const meta = STATUS_META[status]
          const Icon = meta.icon
          const value = summary[status]
          const tone = {
            present: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-border hover:border-emerald-500/40' },
            late:    { text: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-500/5',    border: 'border-border hover:border-amber-500/40' },
            absent:  { text: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-500/5',     border: 'border-border hover:border-rose-500/40' },
            leave:   { text: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-500/5',      border: 'border-border hover:border-sky-500/40' },
          }[status]
          return (
            <motion.div
              key={status}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`rounded-xl border p-3 sm:p-4 ${tone.bg} ${tone.border}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{meta.label}</span>
                <Icon className={`h-3.5 w-3.5 ${tone.text}`} />
              </div>
              <p className={`font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${tone.text}`}>
                {value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {summary.workingDays > 0 ? ((value / summary.workingDays) * 100).toFixed(1) : 0}% of {summary.workingDays} working days
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Attendance rate banner */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">{monthLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">Attendance Rate</span>
          <span className="font-display text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {summary.rate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Brief PART 25: Daily calendar/list */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="px-4 py-2.5 border-b border-border bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Records</h3>
        </div>
        <div className="divide-y divide-border/40">
          {dailyRecords.map((r, i) => {
            const isWorking = !['weekend', 'holiday', 'upcoming'].includes(r.status as string)
            const meta = isWorking ? STATUS_META[r.status as AttendanceStatus] : null
            const [y, m, d] = r.dateStr.split('-').map(Number)
            const dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
              weekday: 'short', day: 'numeric', month: 'short',
            })

            return (
              <motion.div
                key={r.dateStr}
                initial={reduce ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.01, 0.3), duration: 0.2 }}
                className={`flex items-center justify-between gap-3 px-4 py-2 text-xs ${
                  r.status === 'weekend' ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono tabular-nums text-muted-foreground w-12 shrink-0">
                    {String(r.day).padStart(2, '0')} {new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3)}
                  </span>
                  <span className="text-muted-foreground truncate">{dateLabel}</span>
                </div>
                <div className="shrink-0">
                  {r.status === 'holiday' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-600 dark:text-violet-400">
                      <CalendarOff className="h-3 w-3" /> Holiday{r.holidayName ? ` · ${r.holidayName}` : ''}
                    </span>
                  ) : r.status === 'weekend' ? (
                    <span className="text-[10px] text-muted-foreground">Weekend</span>
                  ) : r.status === 'upcoming' ? (
                    <span className="text-[10px] text-muted-foreground/60">Upcoming</span>
                  ) : (
                    <StatusBadge status={r.status as AttendanceStatus} size="xs" />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Attendance records are derived from the authoritative staff attendance system. Holidays are not counted as absent.
      </p>
    </PageTransition>
  )
}
