'use client'

/**
 * ScheduleTab — combined view of all exam schedules.
 * The actual editing (add/edit/delete schedule items) happens inside
 * the ExamWorkspaceDialog → Schedule section. This tab is a read-only
 * calendar-style rollup.
 */

import { useState, useMemo } from 'react'
import { Calendar, Clock, MapPin, User, FileText } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SegmentedTabs } from '../../shared/segmented-tabs'
import { LoadingState } from '@/components/shared/loading-state'
import { cn } from '@/lib/utils'
import { type ExamDTO } from '@/lib/exams/types'
import { useExamsList } from '@/lib/exams/use-exams'

interface Props {
  exams: ExamDTO[]
  onOpenExam: (id: string) => void
}

export function ScheduleTab({ exams, onOpenExam }: Props) {
  const [examFilter, setExamFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')

  const allScheduleItems = useMemo(() => {
    return exams.flatMap((exam) =>
      exam.schedule.map((s) => ({
        ...s,
        examName: exam.name,
        examType: exam.type,
        examId: exam.id,
      }))
    )
    .filter((s) => {
      if (examFilter !== 'all' && s.examId !== examFilter) return false
      if (classFilter !== 'all' && s.classId !== classFilter) return false
      return true
    })
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''))
  }, [exams, examFilter, classFilter])

  const allClasses = useMemo(() => {
    const seen = new Map<string, string>()
    exams.forEach((e) => e.classes.forEach((c) => seen.set(c.classId, c.className)))
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [exams])

  if (exams.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No examinations created yet. Create one to begin scheduling.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedTabs
          tabs={[
            { value: 'all', label: 'All Exams' },
          ]}
          value="all"
          onValueChange={() => {}}
        />
        <Select value={examFilter} onValueChange={setExamFilter}>
          <SelectTrigger size="sm" className="w-[200px] text-xs rounded-lg">
            <SelectValue placeholder="Filter by exam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger size="sm" className="w-[160px] text-xs rounded-lg">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {allClasses.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground ml-auto">{allScheduleItems.length} scheduled sessions</span>
      </div>

      {allScheduleItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No schedule items yet. Open an exam to add schedule entries.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Exam</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Class</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Subject</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Date</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Time</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Room</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Invigilator</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {allScheduleItems.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => onOpenExam(s.examId)}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate max-w-[160px]">{s.examName}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{s.examType}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{s.className}</td>
                  <td className="px-3 py-2 font-medium">{s.subjectName ?? '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {s.startTime} — {s.endTime}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {s.room ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {s.room}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {s.invigilatorName ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3 w-3" />
                        {s.invigilatorName}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="text-[9px] text-muted-foreground hover:text-primary">→</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
