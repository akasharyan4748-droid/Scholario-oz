'use client'

import { studentAttendanceCalendar } from '@/lib/mock/attendance'

export const presentCount = studentAttendanceCalendar.filter((d) => d.status === 'present').length
export const lateCount = studentAttendanceCalendar.filter((d) => d.status === 'late').length
export const absentCount = studentAttendanceCalendar.filter((d) => d.status === 'absent').length
export const totalDays = studentAttendanceCalendar.length
export const attendancePct = Math.round(((presentCount + lateCount) / totalDays) * 100)

// STU-F — window label derived from the calendar records (e.g.
// 'November – December 2025'). Used wherever the dashboard labels the
// attendance period instead of a hardcoded month.
export const attendanceWindowLabel = (() => {
  if (studentAttendanceCalendar.length === 0) return ''
  const first = new Date(studentAttendanceCalendar[0].date)
  const last = new Date(studentAttendanceCalendar[studentAttendanceCalendar.length - 1].date)
  const firstLabel = first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const lastLabel = last.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  if (firstLabel === lastLabel) return firstLabel
  return `${first.toLocaleDateString('en-IN', { month: 'long' })} – ${lastLabel}`
})()

// Inline history for months with no calendar records (pre-window months),
// keyed by calendar month index (0=Jan … 11=Dec) — en-IN short labels have
// quirks (September renders as 'Sept'), so the lookup must not depend on
// the label string.
const INLINE_HISTORY: Record<number, number> = {
  0: 93, 1: 94, 2: 95, 3: 94, 4: 95, 5: 95,
  6: 94, 7: 92, 8: 95, 9: 93, 10: 93, 11: 93,
}

// STU-F — attendance trend DERIVED from studentAttendanceCalendar:
//   • months with records aggregate per-month (group by 'YYYY-MM' → percent);
//   • months with no records fall back to the inline history;
//   • the LATEST month is always the live overall rate (attendancePct) so
//     the chart endpoint can never disagree with the KPI gauge (96 for
//     STU-58) — the latest month is still in progress, so the honest
//     "current" value is the window rate, not a partial-month percent.
// Output: 6 points ending at the calendar's latest month, e.g.
// Jul 94 · Aug 92 · Sep 95 · Oct 93 · Nov 94 · Dec 96.
export const attendanceTrend = (() => {
  const monthly = new Map<string, { counted: number; total: number }>()
  for (const r of studentAttendanceCalendar) {
    const key = r.date.slice(0, 7)
    const agg = monthly.get(key) ?? { counted: 0, total: 0 }
    agg.total += 1
    if (r.status === 'present' || r.status === 'late') agg.counted += 1
    monthly.set(key, agg)
  }
  const latestKey = studentAttendanceCalendar.length > 0
    ? studentAttendanceCalendar[studentAttendanceCalendar.length - 1].date.slice(0, 7)
    : null
  if (!latestKey) return [{ name: 'Now', v: attendancePct }]

  const months: { key: string; name: string; monthIdx: number }[] = []
  const [y, m] = latestKey.split('-').map(Number)
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      name: d.toLocaleDateString('en-IN', { month: 'short' }),
      monthIdx: d.getMonth(),
    })
  }
  return months.map(({ key, name, monthIdx }) => {
    if (key === latestKey) return { name, v: attendancePct }
    const agg = monthly.get(key)
    if (agg && agg.total > 0) return { name, v: Math.round((agg.counted / agg.total) * 100) }
    return { name, v: INLINE_HISTORY[monthIdx] ?? attendancePct }
  })
})()
