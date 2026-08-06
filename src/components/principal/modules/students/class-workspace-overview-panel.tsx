'use client'

import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { getTeacherById } from '@/lib/mock/teachers'
import { cn } from '@/lib/utils'
import { type ClassRecord, type StudentRecord, getVirtualOccupied } from '@/lib/store/students-store'
import { toast } from 'sonner'
import { StatTile, ActionBtn } from './shared'
import {
  Users, UserCheck, CalendarClock, ClipboardList, FileText, Award,
} from 'lucide-react'

export function OverviewPanel({
  classRecord, students, teacher, virtualOccupied,
}: {
  classRecord: ClassRecord
  students: StudentRecord[]
  teacher: ReturnType<typeof getTeacherById>
  virtualOccupied: number
}) {
  const presentToday = Math.round(virtualOccupied * 0.93)
  const avgAttendance = students.length > 0 ? Math.round(students.reduce((a, s) => a + s.attendance, 0) / students.length) : 0
  const feePaidRate = students.length > 0 ? students.filter((s) => s.feeStatus === 'Paid').length / students.length : 0.6
  const feePaidCount = Math.round(virtualOccupied * feePaidRate)
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatTile label="Present Today" value={presentToday} sub={`of ${virtualOccupied}`} accent="emerald" />
          <StatTile label="Avg Attendance" value={`${avgAttendance}%`} accent="violet" />
          <StatTile label="Fee Paid" value={`${feePaidCount}/${virtualOccupied}`} accent="amber" />
          <StatTile label="Subjects" value={classRecord.subjects.length} accent="rose" />
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> Section-wise Capacity</h4>
          <div className="space-y-3">
            {classRecord.sections.map((sec) => {
              const count = getVirtualOccupied(sec.id, sec.capacity)
              const pct = Math.round((count / sec.capacity) * 100)
              const over = count > sec.capacity
              const full = !over && pct >= 95
              return (
                <div key={sec.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">Section {sec.name}</span>
                    <span className={cn('font-semibold', over ? 'text-rose-600 dark:text-rose-400' : full ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>{count} / {sec.capacity} {over && '· Overloaded'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: over ? 'oklch(0.6 0.2 25)' : full ? 'oklch(0.7 0.15 75)' : 'oklch(0.6 0.18 150)' }} />
                    </div>
                    <span className="text-[11px] font-medium w-9 text-right">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-primary" /> Faculty</h4>
          {teacher && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <GradientAvatar name={teacher.name} initials={teacher.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{teacher.name}</p>
                <p className="text-[10px] text-muted-foreground">Class Teacher · {teacher.department}</p>
              </div>
              <Badge variant="secondary" className="text-[9px]">Primary</Badge>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-3">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-primary" /> Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn icon={<ClipboardList className="h-3 w-3" />} label="Attendance" onClick={() => toast.success('Attendance opened', { description: `${classRecord.name} · ${virtualOccupied} students` })} />
            <ActionBtn icon={<FileText className="h-3 w-3" />} label="Report" onClick={() => toast.success('Class report generated')} />
            <ActionBtn icon={<Award className="h-3 w-3" />} label="ID Cards" onClick={() => toast.success('ID Cards queued', { description: `${virtualOccupied} cards` })} />
            <ActionBtn icon={<CalendarClock className="h-3 w-3" />} label="Timetable" onClick={() => toast.info('Timetable editor')} />
          </div>
        </div>
      </div>
    </div>
  )
}
