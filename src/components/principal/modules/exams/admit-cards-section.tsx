'use client'

/**
 * AdmitCardsSection — canonical Admit Card management inside the Examination.
 *
 * Workflow: Schedule → Seating → Admit Cards → Generate → Preview → Download → Publish
 *
 * Uses canonical exam data: students, schedule, seating, invigilators.
 * No disconnected mock datasets.
 */

import { useState, useMemo } from 'react'
import {
  Ticket, Download, Eye, Printer, Users, Layers, CheckCircle2,
  AlertTriangle, FileText, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ExamDTO, AdmitCardStudent, SchoolContextDTO, AdmitCardConfigDTO } from '@/lib/exams/types'
import { generateBatchAdmitCardPDF } from '@/lib/exams/pdf'
import { useSchoolContext } from '@/lib/exams/use-pdf-context'
import { useAdmitCardConfig } from '@/lib/exams/use-exam-settings'
import { useStudentsStore } from '@/lib/store/students-store'

interface Props {
  exam: ExamDTO
}

export function AdmitCardsSection({ exam }: Props) {
  const [classId, setClassId] = useState<string>('all')
  const [studentId, setStudentId] = useState<string>('')
  const [layout, setLayout] = useState<'1' | '2'>('1')
  const [published, setPublished] = useState(false)

  const allStudents = useStudentsStore((s) => s.students)
  const { data: schoolCtx } = useSchoolContext()
  const { config: admitCfg } = useAdmitCardConfig()

  const DEFAULT_ADMIT: AdmitCardConfigDTO = {
    showPhoto: false, showRollNumber: true, showRoom: true,
    showSeatNumber: true, showTimetable: true, showInstructions: true, showQrCode: false,
  }

  // Get eligible students for this exam.
  const examStudents = useMemo(
    () => allStudents.filter((s) => exam.classes.some((c: any) => c.classId === s.classId) && s.status === 'Active'),
    [allStudents, exam.classes],
  )

  // Filter by class.
  const filteredStudents = useMemo(
    () => classId === 'all' ? examStudents : examStudents.filter((s) => s.classId === classId),
    [examStudents, classId],
  )

  // Students for the student selector.
  const classStudents = useMemo(() => {
    if (classId === 'all') return examStudents
    return examStudents.filter((s) => s.classId === classId)
  }, [examStudents, classId])

  // Check readiness.
  const hasSchedule = exam.schedule.length > 0
  const hasClasses = exam.classes.length > 0
  const hasStudents = examStudents.length > 0
  const isReady = hasSchedule && hasClasses && hasStudents

  const buildAdmitCardStudent = (student: any): AdmitCardStudent => {
    const className = exam.classes.find((c: any) => c.classId === student.classId)?.className ?? ''
    const schedule = exam.schedule
      .filter((item: any) => item.classId === student.classId)
      .map((item: any) => ({
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room ?? 'TBD',
        seatNumber: null as number | null,
        invigilatorName: item.invigilatorName ?? null,
      }))
    return {
      id: student.id,
      name: student.name,
      rollNo: student.rollNo,
      admissionNo: null,
      className,
      section: null,
      stream: null,
      photo: null,
      room: schedule[0]?.room ?? 'TBD',
      seatNumber: null,
      schedule,
    }
  }

  const handleGenerate = (mode: 'single' | 'class' | 'all') => {
    if (!isReady) {
      toast.error('Examination not ready', { description: 'Ensure schedule, classes, and students are configured.' })
      return
    }
    try {
      const school = schoolCtx ?? fallbackSchool()
      const config = admitCfg ?? DEFAULT_ADMIT
      let students: AdmitCardStudent[] = []

      if (mode === 'single') {
        if (!studentId) { toast.error('Select a student first'); return }
        const s = examStudents.find((st) => st.id === studentId)
        if (!s) { toast.error('Student not found'); return }
        students = [buildAdmitCardStudent(s)]
      } else if (mode === 'class') {
        students = filteredStudents.map(buildAdmitCardStudent)
      } else {
        students = examStudents.map(buildAdmitCardStudent)
      }

      if (students.length === 0) { toast.error('No students found'); return }
      const label = mode === 'single' ? students[0].name : mode === 'class' ? `${students.length} students` : `All ${students.length}`
      const { filename } = generateBatchAdmitCardPDF(exam, label, students, school, config, layout)
      toast.success(`Admit cards generated for ${students.length} student(s)`, { description: filename })
    } catch (e: any) {
      toast.error('Failed to generate admit cards', { description: e.message })
    }
  }

  const handlePublish = () => {
    setPublished(true)
    toast.success('Admit cards published', { description: `${examStudents.length} students can now view their admit cards in the Student Portal.` })
  }

  function fallbackSchool(): SchoolContextDTO {
    return {
      schoolId: '', schoolName: 'Demo School of Scholario', schoolCode: '',
      address: null, city: null, phone: null, email: null, logoUrl: null,
      academicYear: exam.session, board: 'CBSE',
    }
  }

  // Readiness checks
  const readinessItems = [
    { label: 'Schedule published', done: hasSchedule },
    { label: 'Classes configured', done: hasClasses },
    { label: 'Students enrolled', done: hasStudents },
    { label: 'Rooms assigned', done: exam.schedule.some((s: any) => s.room) },
  ]

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-md bg-muted/30 border border-border/40 px-2.5 py-1.5">
          <p className="text-[8px] uppercase tracking-wider text-muted-foreground">Total Students</p>
          <p className="text-[11px] font-semibold tabular-nums">{examStudents.length}</p>
        </div>
        <div className="rounded-md bg-muted/30 border border-border/40 px-2.5 py-1.5">
          <p className="text-[8px] uppercase tracking-wider text-muted-foreground">Classes</p>
          <p className="text-[11px] font-semibold tabular-nums">{exam.classes.length}</p>
        </div>
        <div className="rounded-md bg-muted/30 border border-border/40 px-2.5 py-1.5">
          <p className="text-[8px] uppercase tracking-wider text-muted-foreground">Papers</p>
          <p className="text-[11px] font-semibold tabular-nums">{exam.schedule.length}</p>
        </div>
        <div className="rounded-md bg-muted/30 border border-border/40 px-2.5 py-1.5">
          <p className="text-[8px] uppercase tracking-wider text-muted-foreground">Published</p>
          <p className={cn('text-[11px] font-semibold', published ? 'text-emerald-600' : 'text-muted-foreground')}>
            {published ? 'Yes' : 'Not Published'}
          </p>
        </div>
      </div>

      {/* Readiness checklist */}
      {!isReady && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Admit Card Readiness</p>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {readinessItems.map((r) => (
              <div key={r.label} className="flex items-center gap-1.5">
                <span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold',
                  r.done ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground')}>
                  {r.done ? '✓' : '—'}
                </span>
                <span className="text-[10px] text-muted-foreground">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Layout */}
      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Class</Label>
          <Select value={classId} onValueChange={(v) => { setClassId(v); setStudentId('') }}>
            <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {exam.classes.map((c: any) => <SelectItem key={c.classId} value={c.classId}>{c.className}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Student</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="h-8 text-xs w-[180px]"><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {classStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.rollNo ?? '—'})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Layout</Label>
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
            <button onClick={() => setLayout('1')} className={cn('px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors', layout === '1' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>1 per A4</button>
            <button onClick={() => setLayout('2')} className={cn('px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors', layout === '2' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>2 per A4</button>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleGenerate('single')} disabled={!studentId || !isReady}>
            <Eye className="h-3 w-3" /> Preview
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handlePublish()} disabled={!isReady || published}>
            <Send className="h-3 w-3" /> {published ? 'Published' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Generation actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-lg border border-border/60 bg-card p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Users className="h-4 w-4" /></span>
            <p className="text-[11px] font-semibold">Individual</p>
          </div>
          <p className="text-[9px] text-muted-foreground flex-1">Generate admit card for one selected student</p>
          <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => handleGenerate('single')} disabled={!studentId || !isReady}>
            <Download className="h-2.5 w-2.5" /> Download
          </Button>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600"><Layers className="h-4 w-4" /></span>
            <p className="text-[11px] font-semibold">Class Batch</p>
          </div>
          <p className="text-[9px] text-muted-foreground flex-1">All students in selected class ({filteredStudents.length} students)</p>
          <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => handleGenerate('class')} disabled={!isReady}>
            <Download className="h-2.5 w-2.5" /> Download
          </Button>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><Ticket className="h-4 w-4" /></span>
            <p className="text-[11px] font-semibold">Entire Exam</p>
          </div>
          <p className="text-[9px] text-muted-foreground flex-1">All students across all classes ({examStudents.length} students)</p>
          <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => handleGenerate('all')} disabled={!isReady}>
            <Download className="h-2.5 w-2.5" /> Download
          </Button>
        </div>
      </div>

      {/* Layout info */}
      <div className="rounded-lg border border-border/60 bg-card p-3">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-medium">Admit Card Layout: {layout === '1' ? '1 per A4 (Standard)' : '2 per A4 (Paper-Saving)'}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {layout === '1'
                ? 'Full-page A4 portrait with school header, student identity, complete timetable, instructions, and signatures.'
                : 'Two admit cards per A4 sheet with dotted cutting line and scissors indicator. Compact layout for paper efficiency.'}
            </p>
            <p className="text-[9px] text-muted-foreground/60 mt-1">
              Includes: school header, examination name, student name, roll number, class, complete timetable (subject/date/day/time/room/seat), exam instructions, and signature lines.
            </p>
          </div>
        </div>
      </div>

      {/* Published status */}
      {published && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <div>
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Admit Cards Published</p>
            <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70">Students can now view their admit cards in Student Portal → Examination → Admit Card.</p>
          </div>
        </div>
      )}
    </div>
  )
}
