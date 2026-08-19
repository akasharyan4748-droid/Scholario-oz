'use client'

/**
 * ExamWorkspace — full-screen examination workspace.
 *
 * Replaces the old modal ExamWorkspaceDialog. The Principal enters
 * this workspace when they click an exam. It takes over the entire
 * content area with a top header (back + title + status) and a
 * 10-section navigation bar.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Pencil, Save, Download, Lock, Unlock, Clock, Award, Megaphone, CheckCircle2, FileText, User, Filter, RotateCcw, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { InlineLoading } from './inline-loading'
import { generateSchedulePDF } from '@/lib/exams/schedule-pdf'
import { buildTimetableFromExam, buildConsolidatedTimetableFromExam } from '@/lib/exams/schedule/exam-timetable'
import type { ScheduleTimetable } from '@/lib/exams/schedule/schedule-types'
import { useScheduleState } from '@/lib/exams/schedule/use-schedule-state'
import { ScheduleTable } from './schedule/schedule-table'
import { OfficialTimetable } from './schedule/official-timetable'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDateLong } from '@/lib/exams/format-helpers'
import { useExamMock as useExam } from '@/lib/exams/use-exams-mock'
import {
  useUpdateExam,
  useAddScheduleItem,
  useDeleteScheduleItem,
} from '@/lib/exams/use-exams'
import type { ExamDTO } from '@/lib/exams/types'
import {
  useUpdateScheduleItemV2,
  useTeachers,
  useAssignInvigilator,
} from '@/lib/exams/use-exams-extended'
import {
  useMockMarksStore,
  type PaperTimelineEvent,
} from '@/lib/exams/mock-marks-data'
import { useSubmitMarksMock, useVerifyMarksMock, useLockMarksMock, useUnlockMarksMock, useDeclareResultsMock, usePublishResultsMock, useInitMockMarks } from '@/lib/exams/use-marks-mock'
import { useMockAuditStore, AUDIT_ACTION_LABELS, type AuditAction } from '@/lib/exams/mock-audit-data'
import { getGradeForPercentage, DEFAULT_GRADE_BOUNDARIES } from '@/lib/exams/types'
import { useStudentsStore } from '@/lib/store/students-store'
import { useRoleGate } from '@/lib/exams/use-role-gate'
import { generateClassResultPDF, generateStudentResultPDF } from '@/lib/exams/result-pdf'
import {
  GraceSection,
  OutcomesSection,
} from './workspace-sections-extended'
import { CollapsibleSection } from './collapsible-section'
import { SeatingSection } from './seating/seating-section'
import { ExamAttendanceSection } from './exam-attendance-section'

interface Props {
  examId: string
  onBack: () => void
  onMutated: () => void
}

type Tab = 'overview' | 'schedule' | 'marks' | 'attendance' | 'outcomes' | 'seating' | 'grace' | 'grade' | 'audit'

// Tabs grouped into 3 phases for easier scanning.
// Each group is rendered with a small separator dot before it.
// NOTE: The old "results" tab has been merged into "marks" to remove the
// duplication the spec called out. Marks now contains the full assessment
// experience (entry → submit → verify → lock → declare → publish → view).
const TAB_GROUPS: Array<{ label: string; items: Array<{ value: Tab; label: string }> }> = [
  {
    label: 'Setup',
    items: [
      { value: 'overview', label: 'Overview' },
      { value: 'schedule', label: 'Schedule' },
      { value: 'seating', label: 'Seating' },
    ],
  },
  {
    label: 'Execution',
    items: [
      { value: 'marks', label: 'Marks' },
      { value: 'attendance', label: 'Attendance' },
    ],
  },
  {
    label: 'Post-Exam',
    items: [
      { value: 'grade', label: 'Grade' },
      { value: 'outcomes', label: 'Outcomes' },
      { value: 'grace', label: 'Grace' },
      { value: 'audit', label: 'Audit' },
    ],
  },
]

// Flat list (kept for backward-compat callers like onNavigate callbacks)
const TABS = TAB_GROUPS.flatMap((g) => g.items)

export function ExamWorkspace({ examId, onBack, onMutated }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const { exam, loading, error, reload } = useExam(examId)
  // Initialize mock marks when the exam loads.
  useInitMockMarks(exam)

  const handleReload = () => {
    reload()
    onMutated()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top header — full width */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1 shrink-0" onClick={onBack}>
                <ArrowLeft className="h-3.5 w-3.5" /> Examinations
              </Button>
              <div className="h-6 w-px bg-border shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight truncate">{exam?.name ?? 'Loading…'}</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  {exam ? `${exam.type} · ${exam.session} · ${exam.classes.length} classes · ${exam.subjects.length} subjects` : ''}
                </p>
              </div>
            </div>
            {exam && (
              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={exam.status} />
                <ResultStatusPill status={exam.resultStatus} />
              </div>
            )}
          </div>
        </div>
        {/* Section navigation — grouped by phase */}
        <div className="px-4 sm:px-6 pb-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {TAB_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex items-center gap-2">
                {gi > 0 && <span className="text-muted-foreground/40 text-xs select-none" aria-hidden>•</span>}
                <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
                  {group.items.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTab(t.value)}
                      className={cn(
                        'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap',
                        tab === t.value
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content — full available width */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <InlineLoading label="Loading examination…" />
        ) : error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        ) : !exam ? null : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {tab === 'overview' && <OverviewSection exam={exam} onReload={handleReload} onNavigate={setTab} />}
              {tab === 'schedule' && <ScheduleSection exam={exam} onReload={handleReload} />}
              {tab === 'marks' && <MarksSection exam={exam} onReload={handleReload} />}
              {tab === 'outcomes' && <OutcomesSection examId={exam.id} exam={exam} onReload={handleReload} />}
              {tab === 'seating' && <SeatingSection exam={exam} />}
              {tab === 'attendance' && <ExamAttendanceSection exam={exam} />}
              {tab === 'grade' && <GradeSection exam={exam} />}
              {tab === 'grace' && <GraceSection examId={exam.id} exam={exam} onReload={handleReload} />}
              {tab === 'audit' && <AuditSection examId={exam.id} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Draft: 'bg-muted text-muted-foreground border-border',
    Scheduled: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    Ongoing: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    Completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    Cancelled: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shadow-sm', cls[status] ?? 'bg-muted text-muted-foreground border-border')}>{status}</span>
}

function ResultStatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    'Not Started': 'bg-muted/60 text-muted-foreground border-border',
    'Marks Entry': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    'Under Verification': 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    'Result Ready': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    'Result Declared': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shadow-sm', cls[status] ?? 'bg-muted text-muted-foreground border-border')}>{status}</span>
}

// ─── Overview Section with Exam Readiness ─────────────────────────────

function OverviewSection({ exam, onReload, onNavigate }: { exam: ExamDTO; onReload: () => void; onNavigate: (t: Tab) => void }) {
  const { update } = useUpdateExam()
  const gate = useRoleGate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exam.name)
  const [status, setStatus] = useState(exam.status)
  const [startDate, setStartDate] = useState(exam.startDate ?? '')
  const [endDate, setEndDate] = useState(exam.endDate ?? '')

  const handleSave = async () => {
    try {
      await update(exam.id, { name, status, startDate, endDate })
      toast.success('Exam updated')
      setEditing(false)
      onReload()
    } catch (e: any) {
      toast.error('Failed to update exam', { description: e.message })
    }
  }

  // Compute real readiness indicators
  const readiness = [
    { label: 'Classes configured', done: exam.classes.length > 0, navigate: 'overview' as Tab },
    { label: 'Subjects configured', done: exam.subjects.length > 0, navigate: 'overview' as Tab },
    { label: 'Schedule published', done: exam.schedule.length > 0, navigate: 'schedule' as Tab },
    { label: 'Marks entry started', done: exam.markSummary.entered > 0, navigate: 'marks' as Tab },
    { label: 'Marks verified', done: exam.markSummary.verified > 0, navigate: 'marks' as Tab },
    { label: 'Marks locked', done: exam.markSummary.locked > 0, navigate: 'marks' as Tab },
    { label: 'Results declared', done: exam.resultStatus === 'Result Declared', navigate: 'marks' as Tab },
  ]

  const entered = exam.markSummary.entered
  const total = exam.markSummary.total
  const pct = exam.markSummary.pct

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Classes" value={exam.classes.length} sub={`${exam.classes.reduce((s: number, c: any) => s + c.studentCount, 0)} students`} />
        <Kpi label="Subjects" value={exam.subjects.length} sub={`${exam.schedule.length} scheduled`} />
        <Kpi label="Marks Entry" value={`${entered}/${total}`} sub={`${pct}% entered`} progress={pct} />
        <Kpi label="Schedule" value={exam.schedule.length} sub={`${exam.schedule.length} sessions`} />
      </div>

      {/* Exam readiness */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Exam Readiness</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {readiness.map((r) => (
            <button
              key={r.label}
              onClick={() => onNavigate(r.navigate)}
              className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
            >
              <span className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                r.done ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
              )}>
                {r.done ? '✓' : '—'}
              </span>
              <span className="text-xs flex-1">{r.label}</span>
              {!r.done && <span className="text-[9px] text-muted-foreground">pending</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Edit / details */}
      {gate.canEdit ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Examination Details</h3>
            {!editing ? (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={handleSave}>
                  <Save className="h-3 w-3" /> Save
                </Button>
              </div>
            )}
          </div>
          {!editing ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DetailField label="Name" value={exam.name} />
              <DetailField label="Status" value={exam.status} />
              <DetailField label="Start" value={exam.startDate ?? '—'} />
              <DetailField label="End" value={exam.endDate ?? '—'} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px]">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger size="sm" className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Start Date</Label>
                <DatePicker value={startDate} onChange={setStartDate} />
              </div>
              <div>
                <Label className="text-[10px]">End Date</Label>
                <DatePicker value={endDate} onChange={setEndDate} />
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Kpi({ label, value, sub, progress }: { label: string; value: any; sub?: string; progress?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-2 h-1 rounded-full bg-muted/60 overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className="text-xs font-medium truncate">{value}</p>
    </div>
  )
}



// ─── Schedule Section — canonical timetable (view + edit + download) ──

function ScheduleSection({ exam }: { exam: ExamDTO }) {
  const gate = useRoleGate()
  const [editMode, setEditMode] = useState(false)

  // Build the canonical timetable from the exam's stored schedule.
  const timetable = useMemo(() => buildTimetableFromExam(exam), [exam])
  const consolidated = useMemo(() => buildConsolidatedTimetableFromExam(exam), [exam])

  // Edit-mode state (drag/drop override).
  const [editTimetable, setEditTimetable] = useState<ScheduleTimetable | null>(null)
  const editState = useScheduleState({
    classes: timetable.classes,
    options: null,
  })

  const handleDownload = () => {
    try { generateSchedulePDF(exam, consolidated) } catch { toast.error('Failed to generate PDF') }
  }

  const dateRangeLabel = useMemo(() => {
    if (!exam.startDate) return ''
    const startLbl = formatDateLong(exam.startDate)
    if (!exam.endDate || exam.endDate === exam.startDate) return startLbl
    return `${startLbl} – ${formatDateLong(exam.endDate)}`
  }, [exam.startDate, exam.endDate])

  const examType = exam.type === 'UT1' ? 'Unit Test 1' : exam.type === 'UT2' ? 'Unit Test 2' : exam.type === 'HALF_YEARLY' ? 'Half-Yearly' : exam.type === 'ANNUAL' ? 'Annual' : exam.type
  const papersPerDay = timetable.rows.length > 0 && timetable.rows.length > 1 && timetable.rows[0].date === timetable.rows[1].date ? 2 : 1
  const startTime = exam.schedule[0]?.startTime ?? '09:00'

  return (
    <div className="space-y-3">
      {/* Compact action row — Edit + Download only (no Archive) */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] text-muted-foreground">
          {exam.schedule.length} papers · {exam.classes.length} classes
        </div>
        <div className="flex items-center gap-1">
          {gate.canManageSchedule && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditMode(!editMode)} title={editMode ? 'View Mode' : 'Edit Timetable'}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleDownload} title="Download Schedule">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {editMode ? (
        <div className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditMode(false); toast.success('Schedule saved') }}>
              <Save className="h-3 w-3" /> Save Changes
            </Button>
          </div>
          {timetable.rows.length > 0 ? (
            <ScheduleTable timetable={timetable} onMoveSubject={() => {}} />
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">No schedule items. Add them from Create Examination.</div>
          )}
        </div>
      ) : (
        consolidated.rows.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">No schedule items yet.</div>
        ) : (
          <OfficialTimetable
            timetable={consolidated}
            schoolName="Demo School of Scholario"
            examName={exam.name}
            examType={examType}
            academicSession={exam.session ?? '2025-2026'}
            dateRangeLabel={dateRangeLabel}
            startTime={startTime}
            papersPerDay={papersPerDay}
          />
        )
      )}
    </div>
  )
}



// ─── Marks Section — paper-level workflow control center ──────────────

/** Map a subject name to a teacher for display (demo only). */
function teacherForSubject(subjectName: string): string {
  const s = subjectName.toLowerCase()
  if (s.includes('math')) return 'Mr. Anil Sharma'
  if (s.includes('english')) return 'Ms. Priya Nair'
  if (s.includes('physics')) return 'Dr. Lakshmi Iyer'
  if (s.includes('chemistry')) return 'Mr. Venkat Naidu'
  if (s.includes('biology')) return 'Mrs. Anjali Desai'
  if (s.includes('social')) return 'Mr. Karthik Reddy'
  if (s.includes('hindi')) return 'Mrs. Meera Joshi'
  if (s.includes('commerce') || s.includes('account')) return 'Mr. Sandeep Gupta'
  return 'Mr. Rajesh Kumar'
}

function MarksSection({ exam }: { exam: ExamDTO; onReload: () => void }) {
  const { submit } = useSubmitMarksMock()
  const { verify } = useVerifyMarksMock()
  const { lock } = useLockMarksMock()
  const { unlock } = useUnlockMarksMock()
  const { declare } = useDeclareResultsMock()
  const { publish } = usePublishResultsMock()
  const [classId, setClassId] = useState(exam.classes[0]?.classId ?? '')
  const [showResults, setShowResults] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<{ classId: string; subjectId: string } | null>(null)
  const storeMarks = useMockMarksStore((s) => s.marks)
  const declaredClassIds = useMockMarksStore((s) => s.declaredClassIds)
  const publishedClassIds = useMockMarksStore((s) => s.publishedClassIds)

  const allMarks = useMemo(() => storeMarks.filter((m) => m.examId === exam.id), [storeMarks, exam.id])

  // Summary
  const summary = useMemo(() => {
    const total = allMarks.length
    const entered = allMarks.filter((m) => m.marksObtained !== null).length
    const submitted = allMarks.filter((m) => ['SUBMITTED', 'VERIFIED', 'LOCKED'].includes(m.workflowStatus)).length
    const verified = allMarks.filter((m) => ['VERIFIED', 'LOCKED'].includes(m.workflowStatus)).length
    const locked = allMarks.filter((m) => m.workflowStatus === 'LOCKED').length
    const pct = total > 0 ? Math.round((entered / total) * 100) : 0
    return { total, entered, submitted, verified, locked, pct }
  }, [allMarks])

  // Per-class result readiness
  const classReadiness = useMemo(() => {
    return exam.classes.map((c: any) => {
      const classMarks = allMarks.filter((m) => m.classId === c.classId)
      const classSubjects = exam.subjects.filter((s: any) => s.classId === c.classId)
      const lockedPapers = new Set(
        classMarks.filter((m) => m.workflowStatus === 'LOCKED').map((m) => m.subjectId)
      )
      const isReady = classSubjects.length > 0 && classSubjects.every((s: any) => lockedPapers.has(s.subjectId))
      const isDeclared = declaredClassIds.includes(`${exam.id}:${c.classId}`)
      const isPublished = publishedClassIds.includes(`${exam.id}:${c.classId}`)
      return {
        classId: c.classId, className: c.className,
        totalPapers: classSubjects.length,
        lockedPapers: lockedPapers.size,
        missingPapers: classSubjects.filter((s: any) => !lockedPapers.has(s.subjectId)),
        isReady, isDeclared, isPublished,
      }
    })
  }, [exam, allMarks, declaredClassIds, publishedClassIds])

  // Subject-wise progress rows — with teacher ownership
  const subjectRows = useMemo(() => {
    const rows: Array<{ classId: string; className: string; subjectId: string; subjectName: string; teacher: string; total: number; entered: number; status: string }> = []
    for (const c of exam.classes) {
      for (const subj of exam.subjects.filter((s: any) => s.classId === c.classId)) {
        const marks = allMarks.filter((m) => m.classId === c.classId && m.subjectId === subj.subjectId)
        const entered = marks.filter((m) => m.marksObtained !== null).length
        const statuses = new Set(marks.map((m) => m.workflowStatus))
        const allLocked = marks.length > 0 && [...statuses].every((s) => s === 'LOCKED')
        const allVerified = marks.length > 0 && [...statuses].every((s) => ['VERIFIED', 'LOCKED'].includes(s))
        const allSubmitted = marks.length > 0 && [...statuses].every((s) => ['SUBMITTED', 'VERIFIED', 'LOCKED'].includes(s))
        const status = allLocked ? 'LOCKED' : allVerified ? 'VERIFIED' : allSubmitted ? 'SUBMITTED' : entered > 0 ? 'IN_PROGRESS' : 'DRAFT'
        rows.push({
          classId: c.classId, className: c.className,
          subjectId: subj.subjectId, subjectName: subj.subjectName,
          teacher: teacherForSubject(subj.subjectName),
          total: marks.length, entered, status,
        })
      }
    }
    return rows
  }, [exam, allMarks])

  const handleAction = async (action: 'submit' | 'verify' | 'lock' | 'unlock' | 'declare' | 'publish', cid?: string, sid?: string) => {
    try {
      const filter = cid ? { classId: cid, ...(sid ? { subjectId: sid } : {}) } : {}
      if (action === 'submit') { const r = await submit(exam.id, filter); toast.success(`Submitted ${r.submitted} marks`) }
      else if (action === 'verify') { const r = await verify(exam.id, filter); toast.success(`Verified ${r.verified} marks`) }
      else if (action === 'lock') { const r = await lock(exam.id, filter); toast.success(`Locked ${r.locked} marks`) }
      else if (action === 'unlock') { const r = await unlock(exam.id, filter, 'Principal review'); toast.success(`Unlocked ${r.unlocked} marks for review`) }
      else if (action === 'declare') { await declare(exam.id, cid); toast.success(`${classReadiness.find((c) => c.classId === cid)?.className} results declared`) }
      else if (action === 'publish') { const r = await publish(exam.id, cid); toast.success(`Published · ${r.notificationsSent} students notified`) }
      onReload()
    } catch (e: any) { toast.error('Action failed', { description: e.message }) }
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Stat label="Students" value={String(summary.total)} />
        <Stat label="Entered" value={`${summary.entered}/${summary.total}`} pct={summary.pct} />
        <Stat label="Submitted" value={String(summary.submitted)} />
        <Stat label="Verified" value={String(summary.verified)} />
        <Stat label="Locked" value={String(summary.locked)} />
        <Stat label="Papers" value={String(subjectRows.length)} />
      </div>

      {/* Subject-wise progress — paper-level actions with teacher ownership */}
      <CollapsibleSection
        title="Subject Progress (per paper)"
        subtitle={`${subjectRows.length} papers`}
        accent="violet"
      >
        <div className="overflow-x-auto max-h-[20rem]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Class</th>
                <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Subject</th>
                <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Teacher</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Entered</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
                <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjectRows.map((r, i) => {
                const enteredPct = r.total > 0 ? Math.round((r.entered / r.total) * 100) : 0
                return (
                <tr key={i} className="border-t border-border/40 hover:bg-muted/40 even:bg-muted/15 transition-colors">
                  <td className="px-2 py-2 text-muted-foreground text-[11px]">{r.className}</td>
                  <td className="px-2 py-2 font-medium text-[11px]">{r.subjectName}</td>
                  <td className="px-2 py-2 text-muted-foreground text-[11px]">{r.teacher}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="text-[11px] tabular-nums font-medium">{r.entered}/{r.total}</span>
                      <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', enteredPct === 100 ? 'bg-emerald-500' : enteredPct > 0 ? 'bg-amber-500' : 'bg-muted-foreground/30')}
                          style={{ width: `${enteredPct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    {r.status === 'LOCKED' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        <Lock className="h-2.5 w-2.5" /> Locked
                      </span>
                    ) : r.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                      </span>
                    ) : r.status === 'SUBMITTED' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        <Send className="h-2.5 w-2.5" /> Submitted
                      </span>
                    ) : r.status === 'IN_PROGRESS' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/5 text-amber-600 border border-amber-500/15">
                        <Clock className="h-2.5 w-2.5" /> In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-muted/40 text-muted-foreground border border-border/40">
                        Not Started
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {r.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleAction('submit', r.classId, r.subjectId)} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-primary hover:bg-primary/10 transition-colors">
                          <Send className="h-2.5 w-2.5" /> Submit
                        </button>
                      )}
                      {r.status === 'SUBMITTED' && (
                        <button onClick={() => handleAction('verify', r.classId, r.subjectId)} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-sky-600 hover:bg-sky-500/10 transition-colors">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verify
                        </button>
                      )}
                      {r.status === 'VERIFIED' && (
                        <button onClick={() => handleAction('lock', r.classId, r.subjectId)} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-emerald-600 hover:bg-emerald-500/10 transition-colors">
                          <Lock className="h-2.5 w-2.5" /> Lock
                        </button>
                      )}
                      {r.status === 'LOCKED' && (
                        <button
                          onClick={() => handleAction('unlock', r.classId, r.subjectId)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-amber-600 hover:bg-amber-500/10 transition-colors"
                          title="Unlock for editing (Principal only)"
                        >
                          <Unlock className="h-2.5 w-2.5" /> Unlock
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedPaper({ classId: r.classId, subjectId: r.subjectId })}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="View timeline"
                      >
                        <Clock className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
              {subjectRows.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">No subjects configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Class result control — per-class declaration + publish */}
      <CollapsibleSection title="Class Results" subtitle={`${classReadiness.length} classes`} accent="emerald">
        <div className="divide-y divide-border/40">
          {classReadiness.map((c) => (
            <div key={c.classId} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium">{c.className}</p>
                <p className="text-[9px] text-muted-foreground">
                  {c.lockedPapers}/{c.totalPapers} papers locked
                  {!c.isReady && c.missingPapers.length > 0 && ` · Missing: ${c.missingPapers.map((m: any) => m.subjectName).join(', ')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.isPublished ? (
                  <span className="text-[9px] font-medium text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> Published</span>
                ) : c.isDeclared ? (
                  <button onClick={() => handleAction('publish', c.classId)} className="text-[9px] text-primary hover:underline flex items-center gap-0.5"><Megaphone className="h-2.5 w-2.5" /> Publish</button>
                ) : c.isReady ? (
                  <button onClick={() => handleAction('declare', c.classId)} className="text-[9px] text-primary hover:underline flex items-center gap-0.5"><Award className="h-2.5 w-2.5" /> Declare</button>
                ) : (
                  <span className="text-[9px] text-amber-600">Pending</span>
                )}
                <button onClick={() => { setClassId(c.classId); setShowResults(true) }} className="text-[9px] text-muted-foreground hover:text-foreground hover:underline">View</button>
              </div>
            </div>
          ))}
          {classReadiness.length === 0 && <div className="py-4 text-center text-xs text-muted-foreground">No classes configured.</div>}
        </div>
      </CollapsibleSection>

      {/* Paper timeline drawer */}
      {selectedPaper && (
        <PaperTimelineInline
          exam={exam}
          classId={selectedPaper.classId}
          subjectId={selectedPaper.subjectId}
          onClose={() => setSelectedPaper(null)}
        />
      )}

      {/* Results view */}
      {showResults && (
        <ResultsInline exam={exam} classId={classId} onClose={() => setShowResults(false)} />
      )}

      {/* Subject analytics */}
      <SubjectAnalytics exam={exam} allMarks={allMarks} />
    </div>
  )
}

function Stat({ label, value, pct }: { label: string; value: string; pct?: number }) {
  return (
    <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
      <p className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[11px] font-semibold text-foreground truncate">{value}</p>
      {pct !== undefined && (
        <div className="h-0.5 rounded-full bg-muted mt-1 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

function SubjectAnalytics({ exam, allMarks }: { exam: ExamDTO; allMarks: any[] }) {
  const [filterClass, setFilterClass] = useState('all')
  const analytics = useMemo(() => {
    const rows: Array<{ className: string; subjectName: string; entered: number; total: number; avg: number; highest: number; lowest: number; passCount: number; failCount: number; absentCount: number; pendingCount: number; pct: number }> = []
    for (const c of exam.classes) {
      if (filterClass !== 'all' && c.classId !== filterClass) continue
      for (const subj of exam.subjects.filter((s: any) => s.classId === c.classId)) {
        const marks = allMarks.filter((m) => m.classId === c.classId && m.subjectId === subj.subjectId)
        const entered = marks.filter((m) => m.marksObtained !== null)
        const total = marks.length
        const values = entered.map((m) => m.marksObtained!)
        const avg = values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0
        const highest = values.length > 0 ? Math.max(...values) : 0
        const lowest = values.length > 0 ? Math.min(...values) : 0
        const passCount = values.filter((v) => v >= subj.maxMarks * 0.33).length
        const failCount = values.filter((v) => v < subj.maxMarks * 0.33).length
        const absentCount = marks.filter((m) => m.status === 'ABSENT').length
        const pendingCount = total - entered.length
        const pct = total > 0 ? Math.round((entered.length / total) * 100) : 0
        rows.push({ className: c.className, subjectName: subj.subjectName, entered: entered.length, total, avg, highest, lowest, passCount, failCount, absentCount, pendingCount, pct })
      }
    }
    return rows
  }, [exam, allMarks, filterClass])

  return (
    <CollapsibleSection
      title="Subject Analytics"
      subtitle={`${analytics.length} rows`}
      accent="sky"
      actions={
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="h-5 text-[9px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Classes</option>
          {exam.classes.map((c: any) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
        </select>
      }
    >
      <div className="overflow-x-auto max-h-[16rem]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
            <tr>
              <th className="text-left px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Class</th>
              <th className="text-left px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Subject</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Entered</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Avg</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">High</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Low</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Pass</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Fail</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">Absent</th>
              <th className="text-center px-2 py-1 text-[8px] uppercase font-semibold text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {analytics.map((r, i) => (
              <tr key={i} className="border-t border-border/30 hover:bg-muted/20">
                <td className="px-2 py-1 text-muted-foreground">{r.className}</td>
                <td className="px-2 py-1 font-medium">{r.subjectName}</td>
                <td className="px-2 py-1 text-center tabular-nums">{r.entered}/{r.total}</td>
                <td className="px-2 py-1 text-center tabular-nums">{r.avg}</td>
                <td className="px-2 py-1 text-center tabular-nums text-emerald-600">{r.highest}</td>
                <td className="px-2 py-1 text-center tabular-nums text-rose-600">{r.lowest}</td>
                <td className="px-2 py-1 text-center tabular-nums text-emerald-600">{r.passCount}</td>
                <td className="px-2 py-1 text-center tabular-nums text-rose-600">{r.failCount}</td>
                <td className="px-2 py-1 text-center tabular-nums text-amber-600">{r.absentCount}</td>
                <td className="px-2 py-1 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="w-8 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-[8px] tabular-nums">{r.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {analytics.length === 0 && <tr><td colSpan={10} className="py-4 text-center text-muted-foreground">No data available.</td></tr>}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  )
}

function ResultsInline({ exam, classId, onClose }: { exam: ExamDTO; classId: string; onClose: () => void }) {
  const storeMarks = useMockMarksStore((s) => s.marks)
  const allExamMarks = storeMarks
  const marks = useMemo(() => allExamMarks.filter((m) => m.examId === exam.id && m.classId === classId), [allExamMarks, exam.id, classId])
  const allStudents = useStudentsStore((s) => s.students)
  const students = useMemo(() => allStudents.filter((st) => st.classId === classId && st.status === 'Active'), [allStudents, classId])
  const subjects = exam.subjects.filter((s: any) => s.classId === classId)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  const results = useMemo(() => {
    return students.map((st) => {
      let totalObtained = 0; let totalMax = 0
      const subjResults = subjects.map((subj: any) => {
        const mark = marks.find((m) => m.studentId === st.id && m.subjectId === subj.subjectId)
        const obtained = mark?.marksObtained ?? null
        if (obtained !== null) totalObtained += obtained
        totalMax += subj.maxMarks
        const pct = obtained !== null && subj.maxMarks > 0 ? Math.round((obtained / subj.maxMarks) * 100 * 100) / 100 : 0
        const grade = pct >= 90 ? 'A1' : pct >= 80 ? 'A2' : pct >= 70 ? 'B1' : pct >= 60 ? 'B2' : pct >= 50 ? 'C1' : pct >= 33 ? 'C2' : 'E'
        return { subjectName: subj.subjectName, maxMarks: subj.maxMarks, obtained, percentage: pct, grade, passed: pct >= 33 }
      })
      const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 100) / 100 : 0
      const grade = pct >= 90 ? 'A1' : pct >= 80 ? 'A2' : pct >= 70 ? 'B1' : pct >= 60 ? 'B2' : pct >= 50 ? 'C1' : pct >= 33 ? 'C2' : 'E'
      return { studentId: st.id, name: st.name, rollNo: st.rollNo, className: exam.classes.find((c: any) => c.classId === classId)?.className ?? '', subjects: subjResults, totalObtained, totalMax, percentage: pct, grade, passed: pct >= 33, rank: 0 as number | null }
    }).sort((a, b) => b.percentage - a.percentage).map((r, i) => ({ ...r, rank: i + 1 }))
  }, [marks, students, subjects, exam, classId])

  const selectedResult = results.find((r) => r.studentId === selectedStudent)

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">Class Result — {exam.classes.find((c: any) => c.classId === classId)?.className}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1" onClick={() => { generateClassResultPDF(exam, exam.classes.find((c: any) => c.classId === classId)?.className ?? '', results) }}>
            <Download className="h-3 w-3" /> PDF
          </Button>
          <button onClick={onClose} className="text-[9px] text-muted-foreground hover:text-foreground">Close</button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[24rem]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
            <tr>
              <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Roll</th>
              <th className="text-left px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Student</th>
              {subjects.map((s: any) => <th key={s.subjectId} className="text-center px-1 py-1.5 text-[8px] font-semibold text-muted-foreground">{s.subjectName.substring(0, 6)}</th>)}
              <th className="text-right px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Total</th>
              <th className="text-right px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">%</th>
              <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Grade</th>
              <th className="text-center px-2 py-1.5 text-[9px] uppercase font-semibold text-muted-foreground">Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.studentId} className="border-t border-border/40 hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedStudent(r.studentId)}>
                <td className="px-2 py-1 text-muted-foreground tabular-nums">{r.rollNo}</td>
                <td className="px-2 py-1 font-medium">{r.name} {r.rank && r.rank <= 3 && <span className="text-[8px] text-amber-600">#{r.rank}</span>}</td>
                {r.subjects.map((s, i) => <td key={i} className="px-1 py-1 text-center tabular-nums">{s.obtained ?? '—'}</td>)}
                <td className="px-2 py-1 text-right tabular-nums">{r.totalObtained}/{r.totalMax}</td>
                <td className="px-2 py-1 text-right tabular-nums font-semibold">{r.percentage}%</td>
                <td className="px-2 py-1 text-center font-semibold">{r.grade}</td>
                <td className="px-2 py-1 text-center"><span className={cn('text-[9px] font-medium', r.passed ? 'text-emerald-600' : 'text-rose-600')}>{r.passed ? 'PASS' : 'FAIL'}</span></td>
              </tr>
            ))}
            {results.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No results available.</td></tr>}
          </tbody>
        </table>
      </div>
      {selectedResult && (
        <StudentResultDetail exam={exam} result={selectedResult} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  )
}

function StudentResultDetail({ exam, result, onClose }: { exam: ExamDTO; result: any; onClose: () => void }) {
  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">{result.name}</p>
          <p className="text-[9px] text-muted-foreground">Roll {result.rollNo} · {result.className}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1" onClick={() => generateStudentResultPDF(exam, result)}>
            <Download className="h-3 w-3" /> PDF
          </Button>
          <button onClick={onClose} className="text-[9px] text-muted-foreground hover:text-foreground">Close</button>
        </div>
      </div>
      <table className="w-full text-xs">
        <thead><tr>
          <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground py-1">Subject</th>
          <th className="text-right text-[9px] uppercase font-semibold text-muted-foreground py-1">Max</th>
          <th className="text-right text-[9px] uppercase font-semibold text-muted-foreground py-1">Obtained</th>
          <th className="text-right text-[9px] uppercase font-semibold text-muted-foreground py-1">%</th>
          <th className="text-center text-[9px] uppercase font-semibold text-muted-foreground py-1">Grade</th>
        </tr></thead>
        <tbody>
          {result.subjects.map((s: any, i: number) => (
            <tr key={i} className="border-t border-border/30">
              <td className="py-1 font-medium">{s.subjectName}</td>
              <td className="py-1 text-right tabular-nums">{s.maxMarks}</td>
              <td className="py-1 text-right tabular-nums">{s.obtained ?? '—'}</td>
              <td className="py-1 text-right tabular-nums">{s.percentage}%</td>
              <td className="py-1 text-center">{s.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-4 pt-1 border-t border-border/40">
        <span className="text-[10px] font-semibold">Total: {result.totalObtained}/{result.totalMax}</span>
        <span className="text-[10px] font-semibold">Percentage: {result.percentage}%</span>
        <span className="text-[10px] font-semibold">Grade: {result.grade}</span>
        <span className={cn('text-[10px] font-semibold', result.passed ? 'text-emerald-600' : 'text-rose-600')}>{result.passed ? 'PASS' : 'FAIL'}</span>
      </div>
    </div>
  )
}

// ─── Paper Timeline (inline drawer) ──────────────────────────────────

function PaperTimelineInline({ exam, classId, subjectId, onClose }: {
  exam: ExamDTO
  classId: string
  subjectId: string
  onClose: () => void
}) {
  // Select the raw timeline array (stable reference) and derive with useMemo.
  const timeline = useMockMarksStore((s) => s.timeline)
  const paperTimeline = useMemo(
    () => timeline
      .filter((e) => e.examId === exam.id && e.classId === classId && e.subjectId === subjectId)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [timeline, exam.id, classId, subjectId],
  )
  const className = exam.classes.find((c: any) => c.classId === classId)?.className ?? classId
  const subjectName = exam.subjects.find((s: any) => s.classId === classId && s.subjectId === subjectId)?.subjectName ?? subjectId
  const teacher = teacherForSubject(subjectName)

  const actionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    OPENED: { label: 'Marks Entry Opened', icon: <FileText className="h-3 w-3" />, color: 'text-slate-500' },
    ENTERED: { label: 'Marks Entered', icon: <Pencil className="h-3 w-3" />, color: 'text-amber-600' },
    SUBMITTED: { label: 'Marks Submitted', icon: <Send className="h-3 w-3" />, color: 'text-amber-600' },
    VERIFIED: { label: 'Marks Verified', icon: <CheckCircle2 className="h-3 w-3" />, color: 'text-blue-600' },
    LOCKED: { label: 'Marks Locked', icon: <Lock className="h-3 w-3" />, color: 'text-emerald-600' },
    UNLOCKED: { label: 'Marks Unlocked', icon: <Unlock className="h-3 w-3" />, color: 'text-rose-600' },
  }

  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-3 bg-card/40">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">{className} · {subjectName}</p>
          <p className="text-[9px] text-muted-foreground">Teacher: {teacher} · {paperTimeline.length} events</p>
        </div>
        <button onClick={onClose} className="text-[9px] text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <div className="relative pl-5 space-y-2 max-h-64 overflow-y-auto">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border/60" />
        {paperTimeline.length === 0 && (
          <p className="text-[10px] text-muted-foreground py-2">No timeline events yet.</p>
        )}
        {paperTimeline.map((e: PaperTimelineEvent) => {
          const cfg = actionConfig[e.action] ?? { label: e.action, icon: <Clock className="h-3 w-3" />, color: 'text-muted-foreground' }
          return (
            <div key={e.id} className="relative">
              <span className={cn('absolute -left-[14px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-card border border-border', cfg.color)}>
                {cfg.icon}
              </span>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium">{cfg.label}</p>
                  <p className="text-[9px] text-muted-foreground">by {e.byName} · {e.byRole}</p>
                  {e.note && <p className="text-[9px] text-muted-foreground/80 mt-0.5">{e.note}</p>}
                </div>
                <span className="text-[9px] text-muted-foreground/70 shrink-0 tabular-nums">
                  {new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Grade Section — grading policy + distribution + subject comparison ─

function GradeSection({ exam }: { exam: ExamDTO }) {
  const [filterClass, setFilterClass] = useState('all')
  const [filterSubject, setFilterSubject] = useState('all')
  const storeMarks = useMockMarksStore((s) => s.marks)
  const allMarks = useMemo(() => storeMarks.filter((m) => m.examId === exam.id), [storeMarks, exam.id])

  // Use the central grading configuration (DEFAULT_GRADE_BOUNDARIES from types.ts).
  // In production this would come from the school's GradeScale table.
  const gradeScale = DEFAULT_GRADE_BOUNDARIES

  // Compute per-student subject percentages → grades.
  const gradeData = useMemo(() => {
    const distribution: Record<string, number> = {}
    for (const g of gradeScale) distribution[g.grade] = 0
    let totalStudents = 0
    let passedCount = 0
    let failedCount = 0
    let absentCount = 0
    let highestPct = 0
    let lowestPct = 100
    let pctSum = 0
    let pctCount = 0

    // Group marks by student (within filter scope).
    const studentIds = new Set(allMarks.map((m) => m.studentId))
    for (const studentId of studentIds) {
      const studentMarks = allMarks.filter((m) => m.studentId === studentId)
      // Apply class filter.
      if (filterClass !== 'all') {
        const studentClassId = studentMarks[0]?.classId
        if (studentClassId !== filterClass) continue
      }
      let totalObtained = 0
      let totalMax = 0
      let isAbsentInAll = true
      for (const subj of exam.subjects.filter((s: any) => s.classId === studentMarks[0]?.classId)) {
        // Apply subject filter for per-subject distribution.
        if (filterSubject !== 'all' && subj.subjectId !== filterSubject) continue
        const mark = studentMarks.find((m) => m.subjectId === subj.subjectId)
        if (mark?.status === 'ABSENT' || mark?.marksObtained === null) {
          // Absent or missing — don't add to totals.
          continue
        }
        isAbsentInAll = false
        totalObtained += mark!.marksObtained ?? 0
        totalMax += subj.maxMarks
      }
      if (totalMax === 0) continue
      totalStudents++
      const pct = Math.round((totalObtained / totalMax) * 100 * 100) / 100
      if (isAbsentInAll) {
        absentCount++
        continue
      }
      highestPct = Math.max(highestPct, pct)
      lowestPct = Math.min(lowestPct, pct)
      pctSum += pct
      pctCount++
      const { grade } = getGradeForPercentage(pct, [])
      distribution[grade] = (distribution[grade] ?? 0) + 1
      if (pct >= 33) passedCount++
      else failedCount++
    }
    const avgPct = pctCount > 0 ? Math.round((pctSum / pctCount) * 10) / 10 : 0
    return { distribution, totalStudents, passedCount, failedCount, absentCount, highestPct, lowestPct, avgPct }
  }, [allMarks, exam, gradeScale, filterClass, filterSubject])

  // Subject comparison: per-subject grade distribution.
  const subjectComparison = useMemo(() => {
    const rows: Array<{ subjectName: string; className: string; distribution: Record<string, number>; total: number }> = []
    for (const c of exam.classes) {
      if (filterClass !== 'all' && c.classId !== filterClass) continue
      for (const subj of exam.subjects.filter((s: any) => s.classId === c.classId)) {
        if (filterSubject !== 'all' && subj.subjectId !== filterSubject) continue
        const marks = allMarks.filter((m) => m.classId === c.classId && m.subjectId === subj.subjectId)
        const dist: Record<string, number> = {}
        for (const g of gradeScale) dist[g.grade] = 0
        let total = 0
        for (const m of marks) {
          if (m.status === 'ABSENT' || m.marksObtained === null) continue
          const pct = subj.maxMarks > 0 ? (m.marksObtained / subj.maxMarks) * 100 : 0
          const { grade } = getGradeForPercentage(pct, [])
          dist[grade] = (dist[grade] ?? 0) + 1
          total++
        }
        rows.push({ subjectName: subj.subjectName, className: c.className, distribution: dist, total })
      }
    }
    return rows
  }, [allMarks, exam, gradeScale, filterClass, filterSubject])

  const maxDist = Math.max(1, ...Object.values(gradeData.distribution))

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Stat label="Students" value={String(gradeData.totalStudents)} />
        <Stat label="Passed" value={String(gradeData.passedCount)} />
        <Stat label="Failed" value={String(gradeData.failedCount)} />
        <Stat label="Absent" value={String(gradeData.absentCount)} />
        <Stat label="Average %" value={`${gradeData.avgPct}%`} />
        <Stat label="Pass %" value={`${gradeData.totalStudents > 0 ? Math.round((gradeData.passedCount / gradeData.totalStudents) * 100) : 0}%`} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] uppercase font-semibold text-muted-foreground flex items-center gap-1"><Filter className="h-2.5 w-2.5" /> Filters:</span>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Classes</option>
          {exam.classes.map((c: any) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
        </select>
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Subjects</option>
          {exam.subjects.map((s: any, i: number) => <option key={`${s.subjectId}-${i}`} value={s.subjectId}>{s.subjectName}</option>)}
        </select>
      </div>

      {/* Grade policy view */}
      <CollapsibleSection title="Grade Scale (Active Policy)" subtitle={`${gradeScale.length} grades`} accent="violet" defaultOpen={true}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-2">
          {gradeScale.map((g) => {
            const colorMap: Record<string, string> = {
              A1: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
              A2: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
              B1: 'border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300',
              B2: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300',
              C1: 'border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-300',
              C2: 'border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300',
              E: 'border-rose-600/40 bg-rose-600/10 text-rose-800 dark:text-rose-400',
            }
            return (
              <div key={g.grade} className={cn('rounded-lg border p-2.5 text-center transition-colors', colorMap[g.grade] ?? 'border-border/60 bg-muted/20')}>
                <p className="text-lg font-bold tabular-nums">{g.grade}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {g.minPct === 0 ? 'Below 33' : g.minPct === 33 ? '33 – 49' : `${g.minPct}+`}
                </p>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Grade distribution */}
      <CollapsibleSection title="Grade Distribution" subtitle={`${gradeData.totalStudents} students`} accent="emerald">
        <div className="p-3 space-y-2">
          {gradeScale.map((g) => {
            const count = gradeData.distribution[g.grade] ?? 0
            const pct = gradeData.totalStudents > 0 ? Math.round((count / gradeData.totalStudents) * 1000) / 10 : 0
            const barWidth = Math.round((count / maxDist) * 100)
            const barColorMap: Record<string, string> = {
              A1: 'from-emerald-500 to-emerald-400',
              A2: 'from-emerald-500 to-emerald-400',
              B1: 'from-sky-500 to-sky-400',
              B2: 'from-amber-500 to-amber-400',
              C1: 'from-orange-500 to-orange-400',
              C2: 'from-rose-500 to-rose-400',
              E: 'from-rose-600 to-rose-500',
            }
            const isEmpty = count === 0
            return (
              <div key={g.grade} className="flex items-center gap-3">
                <span className="w-7 text-[11px] font-bold tabular-nums text-center">{g.grade}</span>
                <div className="flex-1 h-5 rounded-md bg-muted/30 overflow-hidden relative">
                  <div
                    className={cn('h-full rounded-md transition-all duration-500 bg-gradient-to-r', barColorMap[g.grade] ?? 'from-primary to-primary/80')}
                    style={{ width: `${barWidth}%`, minWidth: barWidth > 0 ? '4px' : '0' }}
                  />
                  {isEmpty && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] text-muted-foreground/50">—</span>
                  )}
                </div>
                <span className={cn('w-7 text-[11px] tabular-nums text-right font-medium', isEmpty && 'text-muted-foreground/50')}>{isEmpty ? '—' : count}</span>
                <span className={cn('w-12 text-[10px] tabular-nums text-right', isEmpty ? 'text-muted-foreground/50' : 'text-muted-foreground')}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Subject comparison */}
      <CollapsibleSection title="Subject Comparison" subtitle={`${subjectComparison.length} papers`} accent="sky" defaultOpen={false}>
        <div className="overflow-x-auto max-h-[18rem]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                <th className="text-left px-2 py-1 text-[9px] uppercase font-semibold text-muted-foreground">Class</th>
                <th className="text-left px-2 py-1 text-[9px] uppercase font-semibold text-muted-foreground">Subject</th>
                <th className="text-center px-2 py-1 text-[9px] uppercase font-semibold text-muted-foreground">Total</th>
                {gradeScale.map((g) => (
                  <th key={g.grade} className="text-center px-1 py-1 text-[8px] font-semibold text-muted-foreground">{g.grade}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjectComparison.map((r, i) => (
                <tr key={i} className="border-t border-border/30 hover:bg-muted/20">
                  <td className="px-2 py-1 text-muted-foreground">{r.className}</td>
                  <td className="px-2 py-1 font-medium">{r.subjectName}</td>
                  <td className="px-2 py-1 text-center tabular-nums">{r.total}</td>
                  {gradeScale.map((g) => (
                    <td key={g.grade} className="px-1 py-1 text-center tabular-nums text-[9px]">
                      {r.distribution[g.grade] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
              {subjectComparison.length === 0 && (
                <tr><td colSpan={2 + gradeScale.length} className="py-4 text-center text-muted-foreground">No data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Grade analysis highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Highest %" value={`${gradeData.highestPct}%`} />
        <Stat label="Lowest %" value={`${gradeData.lowestPct}%`} />
        <Stat label="Average %" value={`${gradeData.avgPct}%`} />
        <Stat label="Pass %" value={`${gradeData.totalStudents > 0 ? Math.round((gradeData.passedCount / gradeData.totalStudents) * 100) : 0}%`} />
      </div>
    </div>
  )
}

// ─── Audit Section — timeline + filters + canonical store ──────────────

function AuditSection({ examId }: { examId: string }) {
  const events = useMockAuditStore((s) => s.events)
  const [filterAction, setFilterAction] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterUser, setFilterUser] = useState('all')

  const examEvents = useMemo(
    () => events.filter((e) => e.examId === examId),
    [events, examId],
  )

  const users = useMemo(() => {
    const set = new Map<string, string>()
    for (const e of examEvents) {
      if (e.userName) set.set(e.userName, e.userName)
    }
    return Array.from(set.values())
  }, [examEvents])

  const filtered = useMemo(() => {
    return examEvents
      .filter((e) => filterAction === 'all' || e.action === filterAction)
      .filter((e) => filterRole === 'all' || e.userRole === filterRole)
      .filter((e) => filterUser === 'all' || e.userName === filterUser)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [examEvents, filterAction, filterRole, filterUser])

  const hasFilters = filterAction !== 'all' || filterRole !== 'all' || filterUser !== 'all'

  const actionIcon: Record<string, React.ReactNode> = {
    EXAM_CREATED: <FileText className="h-3 w-3" />,
    SCHEDULE_UPDATED: <Clock className="h-3 w-3" />,
    SEATING_GENERATED: <FileText className="h-3 w-3" />,
    INVIGILATOR_ASSIGNED: <User className="h-3 w-3" />,
    MARKS_ENTERED: <Pencil className="h-3 w-3" />,
    MARKS_SUBMITTED: <Send className="h-3 w-3" />,
    MARKS_VERIFIED: <CheckCircle2 className="h-3 w-3" />,
    MARKS_LOCKED: <Lock className="h-3 w-3" />,
    MARKS_UNLOCKED: <Unlock className="h-3 w-3" />,
    ATTENDANCE_SUBMITTED: <CheckCircle2 className="h-3 w-3" />,
    GRACE_APPLIED: <Award className="h-3 w-3" />,
    RESULT_DECLARED: <Award className="h-3 w-3" />,
    RESULT_PUBLISHED: <Megaphone className="h-3 w-3" />,
    OUTCOME_OVERRIDDEN: <FileText className="h-3 w-3" />,
  }

  const actionColor: Record<string, string> = {
    MARKS_LOCKED: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    MARKS_UNLOCKED: 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/30',
    MARKS_VERIFIED: 'text-sky-700 dark:text-sky-300 bg-sky-500/15 border-sky-500/30',
    MARKS_SUBMITTED: 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30',
    ATTENDANCE_SUBMITTED: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    GRACE_APPLIED: 'text-violet-700 dark:text-violet-300 bg-violet-500/15 border-violet-500/30',
    RESULT_DECLARED: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    RESULT_PUBLISHED: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
        {hasFilters ? 'No audit events match your filters.' : 'No audit entries yet. Actions on marks, attendance, grace, and results will appear here.'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] uppercase font-semibold text-muted-foreground flex items-center gap-1"><Filter className="h-2.5 w-2.5" /> Filters:</span>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Actions</option>
          {Object.keys(AUDIT_ACTION_LABELS).map((a) => (
            <option key={a} value={a}>{AUDIT_ACTION_LABELS[a as AuditAction]}</option>
          ))}
        </select>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Roles</option>
          <option value="PRINCIPAL">Principal</option>
          <option value="TEACHER">Teacher</option>
          <option value="SYSTEM">System</option>
        </select>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="h-6 text-[10px] rounded bg-transparent border border-border/40 px-1">
          <option value="all">All Users</option>
          {users.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setFilterAction('all'); setFilterRole('all'); setFilterUser('all') }}
            className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
          >
            <RotateCcw className="h-2.5 w-2.5" /> Clear
          </button>
        )}
        <span className="text-[9px] text-muted-foreground ml-auto">{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <CollapsibleSection title="Audit Trail" subtitle={`${filtered.length} events`} accent="emerald">
        <div className="relative pl-8 py-3 space-y-3 max-h-[500px] overflow-y-auto">
          {/* Vertical line — stronger */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-border via-border/60 to-transparent" />
          {filtered.map((e) => {
            const label = AUDIT_ACTION_LABELS[e.action as AuditAction] ?? e.action
            const icon = actionIcon[e.action] ?? <Clock className="h-3 w-3" />
            const color = actionColor[e.action] ?? 'text-muted-foreground bg-muted border-border'
            return (
              <div key={e.id} className="relative group">
                <span className={cn('absolute -left-[20px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-transform group-hover:scale-110', color)}>
                  {icon}
                </span>
                <div className="rounded-lg border border-border/50 bg-card px-3 py-2 hover:bg-muted/30 hover:border-border transition-colors shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{e.summary}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium bg-muted/60 text-muted-foreground">
                          <User className="h-2 w-2" /> {e.userName ?? 'System'}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium bg-primary/10 text-primary">
                          {e.userRole}
                        </span>
                        {e.metadata && Object.keys(e.metadata).length > 0 && (
                          <span className="text-[9px] text-muted-foreground/70">
                            {Object.entries(e.metadata).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground/70 shrink-0 tabular-nums whitespace-nowrap font-mono">
                      {new Date(e.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>
    </div>
  )
}
