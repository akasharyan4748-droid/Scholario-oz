'use client'

import { Activity, AlertTriangle, Calendar } from 'lucide-react'
import type { StudentRecord } from '@/lib/store/students-store'
import { Metric, Section } from './shared'

type Props = { student: StudentRecord }

export function AttendanceTab({ student }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<Activity className="h-3.5 w-3.5" />} label="Avg" value={`${student.attendance}%`} color="text-emerald-600 dark:text-emerald-400" />
        <Metric icon={<Calendar className="h-3.5 w-3.5" />} label="Present" value={`${Math.round(student.attendance * 1.8)}`} color="text-violet-600 dark:text-violet-400" />
        <Metric icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Absent" value={`${Math.round((100 - student.attendance) * 1.8)}`} color="text-rose-600 dark:text-rose-400" />
      </div>
      <Section title="Monthly Attendance">
        <div className="space-y-2">
          {student.attendanceTrend.map((m) => (
            <div key={m.month} className="flex items-center gap-2">
              <span className="text-xs font-medium w-10">{m.month}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${m.percent}%`, background: m.percent >= 90 ? 'oklch(0.6 0.18 150)' : m.percent >= 75 ? 'oklch(0.7 0.15 75)' : 'oklch(0.6 0.2 25)' }} />
              </div>
              <span className="text-xs font-semibold w-10 text-right">{m.percent}%</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
