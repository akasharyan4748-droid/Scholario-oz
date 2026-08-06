'use client'

import { studentAttendanceCalendar } from '@/lib/mock/attendance'

export const attendanceTrend = [
  { name: 'Jun', v: 95 }, { name: 'Jul', v: 94 }, { name: 'Aug', v: 92 },
  { name: 'Sep', v: 95 }, { name: 'Oct', v: 93 }, { name: 'Nov', v: 93 },
]

export const presentCount = studentAttendanceCalendar.filter((d) => d.status === 'present').length
export const lateCount = studentAttendanceCalendar.filter((d) => d.status === 'late').length
export const absentCount = studentAttendanceCalendar.filter((d) => d.status === 'absent').length
export const totalDays = studentAttendanceCalendar.length
export const attendancePct = Math.round(((presentCount + lateCount) / totalDays) * 100)
