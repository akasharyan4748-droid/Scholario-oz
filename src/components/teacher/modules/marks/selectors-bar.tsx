'use client'

/**
 * marks/selectors-bar — the exam → class → subject scope picker.
 *
 * Each select is populated from the previous selection's children
 * (exam.classes → class.subjects); changing a parent resets the child to
 * its first option. The meta row under the selects restates the exam's
 * type, dates and result status from the same payload.
 */

import { CalendarRange, FileText } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { GridSelection, MarksExam } from './types'

interface SelectorsBarProps {
  exams: MarksExam[]
  selection: GridSelection | null
  onSelectionChange: (next: GridSelection) => void
}

/** Result-status badge tone: declared/published → success, in progress → warning. */
function resultStatusVariant(resultStatus: string): 'success' | 'warning' | 'neutral' {
  const s = resultStatus.toLowerCase()
  if (s.includes('declar') || s.includes('publish')) return 'success'
  if (s.includes('progress') || s.includes('pending')) return 'warning'
  return 'neutral'
}

export function SelectorsBar({ exams, selection, onSelectionChange }: SelectorsBarProps) {
  const exam = exams.find((e) => e.id === selection?.examId) ?? null
  const classes = exam?.classes ?? []
  const cls = classes.find((c) => c.classId === selection?.classId) ?? null
  const subjects = cls?.subjects ?? []

  const changeExam = (examId: string) => {
    const nextExam = exams.find((e) => e.id === examId)
    const nextClass = nextExam?.classes[0]
    const nextSubject = nextClass?.subjects[0]
    if (!nextExam || !nextClass || !nextSubject) return
    onSelectionChange({ examId, classId: nextClass.classId, subjectId: nextSubject.id })
  }

  const changeClass = (classId: string) => {
    if (!exam) return
    const nextClass = exam.classes.find((c) => c.classId === classId)
    const nextSubject = nextClass?.subjects[0]
    if (!nextClass || !nextSubject) return
    onSelectionChange({ examId: exam.id, classId, subjectId: nextSubject.id })
  }

  const changeSubject = (subjectId: string) => {
    if (!exam || !cls) return
    onSelectionChange({ examId: exam.id, classId: cls.classId, subjectId })
  }

  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="marks-exam-select" className="text-[11px] font-medium uppercase tracking-wider">
            Examination
          </Label>
          <Select value={selection?.examId ?? ''} onValueChange={changeExam} disabled={exams.length === 0}>
            <SelectTrigger id="marks-exam-select" className="h-9 w-full">
              <SelectValue placeholder="Select examination" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{e.name}</span>
                    {e.dateLabel && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">{e.dateLabel}</span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="marks-class-select" className="text-[11px] font-medium uppercase tracking-wider">
            Class
          </Label>
          <Select value={selection?.classId ?? ''} onValueChange={changeClass} disabled={classes.length === 0}>
            <SelectTrigger id="marks-class-select" className="h-9 w-full">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.classId} value={c.classId}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="marks-subject-select" className="text-[11px] font-medium uppercase tracking-wider">
            Subject
          </Label>
          <Select
            value={selection?.subjectId ?? ''}
            onValueChange={changeSubject}
            disabled={subjects.length === 0}
          >
            <SelectTrigger id="marks-subject-select" className="h-9 w-full">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{s.name}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">max {s.maxMarks}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {exam && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" aria-hidden="true" />
            Type: <span className="font-medium text-foreground">{exam.type}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <CalendarRange className="h-3 w-3" aria-hidden="true" />
            <span className="font-medium text-foreground">{exam.dateLabel || 'Dates to be announced'}</span>
          </span>
          <span aria-hidden="true">·</span>
          <StatusBadge
            status={exam.resultStatus}
            variant={resultStatusVariant(exam.resultStatus)}
            dot
          />
        </div>
      )}
    </GlassCard>
  )
}
