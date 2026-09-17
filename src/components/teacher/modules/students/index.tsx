'use client'

// Teacher Students module entry point — real DB roster per class.
//
// `teacher-panel.tsx` imports the named `StudentsModule` export. The index
// owns the page-level state (selected student for the profile sheet) and
// composes QuickStats, StudentsGrid and the StudentProfileSheet — all fed
// by GET /api/teacher/students (classes this teacher works with).

import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { ModuleToolbar } from '../../teacher-panel/module-toolbar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { toCsv } from '@/lib/csv'
import { downloadCSVFile } from '@/lib/download-file'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/shared/ui'
import { QuickStats } from './quick-stats'
import { StudentsGrid } from './students-grid'
import { StudentProfileSheet } from './student-profile-sheet'
import { useStudentDirectory, type DirectoryStudent } from './hooks'

export function StudentsModule() {
  const [selected, setSelected] = useState<DirectoryStudent | null>(null)
  const { data, error, reload, classId, setClassId, activeClass, students } = useStudentDirectory()

  const handleExport = () => {
    if (!activeClass || students.length === 0) return
    const csv = toCsv(
      ['Roll No', 'Admission No', 'Name', 'Gender', 'Guardian', 'Guardian Phone', 'Attendance %'],
      students.map((s) => [
        s.rollNo ?? '', s.admissionNo ?? '', s.name, s.gender ?? '', s.guardianName ?? '', s.guardianPhone ?? '',
        s.attendancePct != null ? `${s.attendancePct}%` : 'No records',
      ]),
    )
    const safeLabel = activeClass.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    downloadCSVFile(csv, `${safeLabel}-student-list.csv`)
    toast.success('Export ready', {
      description: `${activeClass.label} student list · ${students.length} students · CSV`,
    })
  }

  if (error) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm font-medium">Couldn&apos;t load the student directory</p>
        <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
        <Button size="sm" onClick={reload}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      </GlassCard>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading student directory">
        <div className="h-9 w-full animate-pulse rounded-xl bg-muted/40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
      </div>
    )
  }

  if (data.classes.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-2 p-10 text-center">
        <p className="text-sm font-medium">No classes assigned yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Your classes appear here once the school assigns you as class teacher or subject teacher.
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-5">
      <ModuleToolbar
        context={activeClass ? `${activeClass.label} · student profiles` : 'Student profiles'}
        action={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={students.length === 0}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      {/* Class selector — class-teacher classes carry a subtle marker */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Classes">
        {data.classes.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={classId === c.id}
            onClick={() => setClassId(c.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              classId === c.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'glass text-muted-foreground hover:text-foreground',
            )}
          >
            {c.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', classId === c.id ? 'bg-primary-foreground/20' : 'bg-muted')}>
              {c.studentCount}
            </span>
            {c.isClassTeacher && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', classId === c.id ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary')}>
                Class Teacher
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Quick stats */}
      <QuickStats students={students} classLabel={activeClass?.label ?? ''} subjects={activeClass?.subjects ?? []} />

      {/* Filters + grid */}
      <StudentsGrid students={students} onSelect={setSelected} />

      {/* Student profile sheet */}
      <StudentProfileSheet student={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
