'use client'

/** Quick stats for the active class roster — real counts, honest notes. */

import { motion } from 'framer-motion'
import { Users, UserCheck, CalendarCheck, BookOpen } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import type { DirectoryStudent } from './hooks'

export function QuickStats({
  students,
  classLabel,
  subjects,
}: {
  students: DirectoryStudent[]
  classLabel: string
  subjects: string[]
}) {
  const withRecords = students.filter((s) => s.attendanceRecords > 0)
  const avgAttendance =
    withRecords.length > 0
      ? Math.round(withRecords.reduce((sum, s) => sum + (s.attendancePct ?? 0), 0) / withRecords.length)
      : null
  const girls = students.filter((s) => s.gender?.toUpperCase() === 'FEMALE').length
  const boys = students.filter((s) => s.gender?.toUpperCase() === 'MALE').length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Students"
        value={students.length}
        icon={<Users className="h-5 w-5" />}
        accent="emerald"
        trendLabel={classLabel}
        delay={0}
      />
      <KpiCard
        label="Avg Attendance"
        value={avgAttendance ?? '—'}
        suffix={avgAttendance != null ? '%' : undefined}
        icon={<CalendarCheck className="h-5 w-5" />}
        accent="cyan"
        trendLabel={avgAttendance != null ? `${withRecords.length} with records` : 'No records yet'}
        delay={0.05}
      />
      <KpiCard
        label="Girls · Boys"
        value={`${girls} · ${boys}`}
        icon={<UserCheck className="h-5 w-5" />}
        accent="violet"
        trendLabel="gender split"
        delay={0.1}
      />
      <KpiCard
        label="You Teach"
        value={subjects.length}
        icon={<BookOpen className="h-5 w-5" />}
        accent="amber"
        trendLabel={subjects.length > 0 ? subjects.slice(0, 2).join(', ') : 'Class teacher only'}
        delay={0.15}
      />
    </div>
  )
}
