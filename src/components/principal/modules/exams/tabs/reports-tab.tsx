'use client'

/**
 * ReportsTab — central hub for all examination PDF reports.
 * All reports use REAL exam + result data from the API.
 *
 * Reports:
 *   1. Individual Student Report Card (PDF)
 *   2. Class Grade Sheet (PDF)
 *   3. Admit Card (PDF)
 *   4. Marks Entry / Evaluation Status
 */

import { useState, useMemo } from 'react'
import { FileText, Download, User, GraduationCap, Ticket, ClipboardList } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { InlineLoading } from '../inline-loading'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { type ExamDTO, type AdmitCardStudent, type SchoolContextDTO } from '@/lib/exams/types'
import { useClassResults, useExam } from '@/lib/exams/use-exams'
import {
  generateClassGradeSheetPDF,
  generateStudentReportCardPDF,
  generateBatchAdmitCardPDF,
} from '@/lib/exams/pdf'
import {
  useSchoolContext,
} from '@/lib/exams/use-pdf-context'
import {
  useAdmitCardConfig,
  useReportCardConfig,
} from '@/lib/exams/use-exam-settings'
import type { AdmitCardConfigDTO, ReportCardConfigDTO } from '@/lib/exams/types'

interface Props {
  exams: ExamDTO[]
}

const REPORTS = [
  { id: 'report-card', name: 'Individual Student Report Card', description: 'Single-student A4 PDF with subject marks, totals, grade, rank, signatures.', icon: User },
  { id: 'grade-sheet', name: 'Class Grade Sheet', description: 'All-students A4 landscape PDF with subject marks, totals, ranks.', icon: GraduationCap },
  { id: 'admit-card', name: 'Admit Card', description: 'Student admit card with exam schedule, room, seat, instructions.', icon: Ticket },
  { id: 'eval-status', name: 'Marks Entry / Evaluation Status', description: 'Per-class per-subject marks entry progress overview.', icon: ClipboardList },
]

export function ReportsTab({ exams }: Props) {
  const [examId, setExamId] = useState<string | null>(exams[0]?.id ?? null)
  const [classId, setClassId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)

  const exam = exams.find((e) => e.id === examId) || null
  const firstClassId = exam?.classes[0]?.classId ?? null
  const effectiveClassId = classId || firstClassId
  const { data, loading } = useClassResults(examId, effectiveClassId)
  const students = data?.students ?? []
  const results = data?.results ?? []

  // Fetch school info + report configs for PDF generation
  const { data: schoolCtx } = useSchoolContext()
  const { config: admitCfg } = useAdmitCardConfig()
  const { config: reportCfg } = useReportCardConfig()

  // Sensible fallbacks when settings haven't loaded
  const DEFAULT_ADMIT: AdmitCardConfigDTO = { showPhoto: true, showRollNumber: true, showRoom: true, showSeatNumber: true, showTimetable: true, showInstructions: true, showQrCode: false }
  const DEFAULT_REPORT: ReportCardConfigDTO = { showAttendance: true, showRank: true, showPercentage: true, showGrade: true, showCoScholastic: false, showRemarks: true, showClassTeacherSign: true, showPrincipalSign: true }

  if (exams.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No examinations available to generate reports for.</p>
      </div>
    )
  }

  const handleReport = (reportId: string) => {
    if (!exam || !effectiveClassId) {
      toast.error('Select an exam and class first')
      return
    }
    const className = exam.classes.find((c) => c.classId === effectiveClassId)?.className ?? 'Class'
    const school: SchoolContextDTO = schoolCtx ?? {
      schoolId: '', schoolName: 'School', schoolCode: '', address: null,
      city: null, phone: null, email: null, logoUrl: null, academicYear: exam.session, board: 'CBSE',
    }
    try {
      if (reportId === 'grade-sheet') {
        if (!data || results.length === 0) {
          toast.error('No results to export', { description: 'Enter marks first.' })
          return
        }
        const { filename } = generateClassGradeSheetPDF(exam, className, results, data.analytics, school)
        toast.success('Grade sheet exported', { description: filename })
      } else if (reportId === 'report-card') {
        if (!studentId) {
          toast.error('Select a student')
          return
        }
        const student = students.find((s) => s.id === studentId)
        const result = results.find((r) => r.studentId === studentId)
        if (!student || !result) {
          toast.error('Student not found in this class')
          return
        }
        const { filename } = generateStudentReportCardPDF(exam, result, school, reportCfg ?? DEFAULT_REPORT)
        toast.success('Report card exported', { description: filename })
      } else if (reportId === 'admit-card') {
        if (!studentId) {
          toast.error('Select a student')
          return
        }
        const student = students.find((s) => s.id === studentId)
        if (!student) {
          toast.error('Student not found')
          return
        }
        const studentSchedule = exam.schedule.filter((s) => s.classId === effectiveClassId)
        const admitStudent: AdmitCardStudent = {
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          admissionNo: student.admissionNo,
          className,
          section: exam.classes.find((c) => c.classId === effectiveClassId)?.section ?? null,
          stream: exam.classes.find((c) => c.classId === effectiveClassId)?.stream ?? null,
          photo: null,
          room: null,
          seatNumber: null,
          schedule: studentSchedule.map((s) => ({
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room,
            seatNumber: null,
          })),
        }
        const { filename } = generateBatchAdmitCardPDF(exam, className, [admitStudent], school, admitCfg ?? DEFAULT_ADMIT)
        toast.success('Admit card exported', { description: filename })
      } else if (reportId === 'eval-status') {
        toast.message('Evaluation status is shown below')
      }
    } catch (e: any) {
      toast.error('Report generation failed', { description: e.message })
    }
  }

  return (
    <div className="space-y-3">
      {/* Selector bar */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Examination</Label>
            <Select value={examId ?? undefined} onValueChange={(v) => { setExamId(v); setClassId(null); setStudentId(null) }}>
              <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Select exam" /></SelectTrigger>
              <SelectContent>
                {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Class</Label>
            <Select value={effectiveClassId ?? undefined} onValueChange={(v) => { setClassId(v); setStudentId(null) }}>
              <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {exam?.classes.map((c) => <SelectItem key={c.classId} value={c.classId}>{c.className}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Student (for per-student reports)</Label>
            <Select value={studentId ?? undefined} onValueChange={setStudentId} disabled={loading || students.length === 0}>
              <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} (#{s.rollNo ?? '—'})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => handleReport(r.id)}
            className={cn(
              'group rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all text-left',
              r.id === 'eval-status' && 'cursor-default'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.description}</p>
              </div>
              {r.id !== 'eval-status' && (
                <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Evaluation status table (in-page) */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Marks Entry / Evaluation Status</h3>
        {loading ? (
          <InlineLoading label="Loading evaluation status…" />
        ) : !exam || !effectiveClassId ? (
          <p className="text-xs text-muted-foreground">Select an exam and class.</p>
        ) : (
          <EvaluationStatusTable exam={exam} classId={effectiveClassId} studentsCount={students.length} />
        )}
      </div>
    </div>
  )
}

function EvaluationStatusTable({ exam, classId, studentsCount }: { exam: ExamDTO; classId: string; studentsCount: number }) {
  const subjects = exam.subjects.filter((s) => s.classId === classId)
  if (subjects.length === 0) {
    return <p className="text-xs text-muted-foreground">No subjects configured for this class.</p>
  }
  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border">
            <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Subject</TableHead>
            <TableHead className="text-center text-[9px] uppercase font-semibold text-muted-foreground">Max Marks</TableHead>
            <TableHead className="text-center text-[9px] uppercase font-semibold text-muted-foreground">Pass Marks</TableHead>
            <TableHead className="text-center text-[9px] uppercase font-semibold text-muted-foreground">Students</TableHead>
            <TableHead className="text-center text-[9px] uppercase font-semibold text-muted-foreground">Schedule</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((s) => {
            const schedule = exam.schedule.find((sch) => sch.subjectId === s.subjectId && sch.classId === classId)
            return (
              <TableRow key={s.subjectId} className="border-b border-border/40 last:border-0">
                <TableCell className="py-2 text-xs font-medium">{s.subjectName}</TableCell>
                <TableCell className="py-2 text-center text-xs tabular-nums">{s.maxMarks}</TableCell>
                <TableCell className="py-2 text-center text-xs tabular-nums">{s.passMarks}</TableCell>
                <TableCell className="py-2 text-center text-xs tabular-nums">{studentsCount}</TableCell>
                <TableCell className="py-2 text-center text-xs">
                  {schedule ? (
                    <span className="text-muted-foreground">
                      {schedule.date} · {schedule.startTime}–{schedule.endTime}
                      {schedule.room && ` · ${schedule.room}`}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">Not scheduled</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
