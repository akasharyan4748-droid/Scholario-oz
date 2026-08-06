'use client'

import { ChevronRight } from 'lucide-react'
import { GlassCard, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { type StudentRecord } from '@/lib/store/students-store'

export function StudentsPanel({
  students, onStudentClick,
}: {
  students: StudentRecord[]
  onStudentClick: (s: StudentRecord) => void
}) {
  const sorted = [...students].sort((a, b) => a.rollNo.localeCompare(b.rollNo))
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs w-12">Roll</TableHead>
            <TableHead className="text-xs">Student</TableHead>
            <TableHead className="text-xs hidden sm:table-cell">Attendance</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Fee</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Grade</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((s) => (
            <TableRow key={s.id} className="cursor-pointer hover:bg-accent/30" onClick={() => onStudentClick(s)}>
              <TableCell className="text-xs font-mono py-2">{s.rollNo}</TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <GradientAvatar name={s.name} initials={s.avatar} size="sm" className="h-7 w-7 text-[10px]" />
                  <div className="min-w-0"><p className="text-xs font-medium truncate">{s.name}</p><p className="text-[10px] text-muted-foreground font-mono">{s.admissionNo}</p></div>
                </div>
              </TableCell>
              <TableCell className="text-xs hidden sm:table-cell py-2"><span className={cn('font-semibold', s.attendance >= 90 ? 'text-emerald-600 dark:text-emerald-400' : s.attendance >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>{s.attendance}%</span></TableCell>
              <TableCell className="text-xs hidden md:table-cell py-2">{s.feeStatus === 'Paid' ? <StatusBadge status="Paid" variant="success" /> : s.feeStatus === 'Partial' ? <StatusBadge status="Partial" variant="warning" /> : <StatusBadge status="Pending" variant="danger" />}</TableCell>
              <TableCell className="text-xs hidden lg:table-cell py-2"><Badge variant="secondary" className="text-[10px]">{s.academics.overallGrade}</Badge></TableCell>
              <TableCell className="py-2"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
