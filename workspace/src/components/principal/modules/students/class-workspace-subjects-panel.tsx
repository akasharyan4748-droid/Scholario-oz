'use client'

import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { getTeacherById } from '@/lib/mock/teachers'
import { type ClassRecord } from '@/lib/store/students-store'

export function SubjectsPanel({ classRecord }: { classRecord: ClassRecord }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow><TableHead className="text-xs">Subject</TableHead><TableHead className="text-xs hidden sm:table-cell">Department</TableHead><TableHead className="text-xs text-center">Periods/wk</TableHead><TableHead className="text-xs hidden md:table-cell">Teacher</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {classRecord.subjects.map((subj, i) => {
            const t = getTeacherById(`T-${String(i + 2).padStart(3, '0')}`)
            return (
              <TableRow key={subj}>
                <TableCell className="text-xs font-medium py-2"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary" />{subj}</div></TableCell>
                <TableCell className="text-xs hidden sm:table-cell py-2 text-muted-foreground">{t?.department ?? '—'}</TableCell>
                <TableCell className="text-xs text-center py-2 font-mono">{6 - (i % 3)}</TableCell>
                <TableCell className="text-xs hidden md:table-cell py-2">{t ? <span className="inline-flex items-center gap-1.5"><GradientAvatar name={t.name} initials={t.avatar} size="sm" className="h-5 w-5 text-[9px]" />{t.name}</span> : '—'}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
