'use client'

/**
 * Dashboard attendance snapshot — DERIVED LIVE from the canonical
 * `student-attendance-store` (the same records Teacher/Principal write).
 *
 * Previously this file derived every number from the static mock calendar
 * (`lib/mock/attendance`) — the dashboard could silently disagree with the
 * Attendance module after a teacher corrected a day. Now both surfaces read
 * the ONE record set:
 *   - pct / present / late / absent — computeStats over the student's records
 *   - windowLabel — from the first/last record dates
 *   - trend — the honest weekly aggregation (weeks without records simply
 *     do not appear; no synthetic pre-window history)
 */
import { useMemo } from 'react'
import {
  useStudentAttendanceStore,
  computeStats,
  studentRecords,
  weeklyTrend,
} from '@/lib/store/student-attendance-store'
import { DEMO_STUDENT_ID } from '../applications/student'

export interface AttendanceSnapshot {
  /** Overall attendance percentage over recorded school days. */
  pct: number
  present: number
  late: number
  absent: number
  /** Recorded school days. */
  total: number
  /** e.g. 'November – December 2025' (from the records themselves). */
  windowLabel: string
  /** Weekly trend points from real records (may be short — that's honest). */
  trend: { name: string; v: number }[]
  /** Week-over-week delta, when at least two weeks exist. */
  weekDelta: number | null
}

export function useAttendanceSnapshot(): AttendanceSnapshot {
  const records = useStudentAttendanceStore((s) => s.records)
  return useMemo(() => {
    const my = studentRecords(records, DEMO_STUDENT_ID)
    const stats = computeStats(my)
    const trend = weeklyTrend(my)
    const windowLabel = (() => {
      if (my.length === 0) return ''
      const first = new Date(`${my[0].date}T00:00:00`)
      const last = new Date(`${my[my.length - 1].date}T00:00:00`)
      const a = first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      const b = last.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      return a === b ? a : `${first.toLocaleDateString('en-IN', { month: 'long' })} – ${b}`
    })()
    const weekDelta =
      trend.length >= 2 ? +(trend[trend.length - 1].v - trend[trend.length - 2].v).toFixed(1) : null
    return {
      pct: stats.percent,
      present: stats.present,
      late: stats.late,
      absent: stats.absent,
      total: stats.total,
      windowLabel,
      trend,
      weekDelta,
    }
  }, [records])
}
