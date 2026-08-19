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
import { ArrowLeft, Pencil, Save, Download } from 'lucide-react'
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
  useSubmitMarks,
  useVerifyMarks,
  useLockMarks,
  useDeclareResults,
  useAuditLogs,
  useClassResults,
} from '@/lib/exams/use-exams'
import type { ExamDTO } from '@/lib/exams/types'
import {
  useUpdateScheduleItemV2,
  useTeachers,
  useAssignInvigilator,
  usePublishResults,
} from '@/lib/exams/use-exams-extended'
import { useRoleGate } from '@/lib/exams/use-role-gate'
import {
  AttendanceSection,
  GraceSection,
  OutcomesSection,
  CsvImportSection,
} from './workspace-sections-extended'
import { SeatingSection } from './seating/seating-section'

interface Props {
  examId: string
  onBack: () => void
  onMutated: () => void
}

type Tab = 'overview' | 'schedule' | 'marks' | 'import' | 'results' | 'outcomes' | 'seating' | 'attendance' | 'grace' | 'audit'

// Tabs grouped into 3 phases for easier scanning.
// Each group is rendered with a small separator dot before it.
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
      { value: 'import', label: 'Import' },
      { value: 'attendance', label: 'Attendance' },
    ],
  },
  {
    label: 'Post-Exam',
    items: [
      { value: 'results', label: 'Results' },
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

  const handleReload = () => {
    reload()
    onMutated()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top header — full width */}
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={onBack}>
                <ArrowLeft className="h-3.5 w-3.5" /> Examinations
              </Button>
              <div className="h-5 w-px bg-border" />
              <div className="min-w-0">
                <h1 className="text-base font-semibold truncate">{exam?.name ?? 'Loading…'}</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">
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
              {tab === 'import' && <CsvImportSection examId={exam.id} exam={exam} onReload={handleReload} />}
              {tab === 'results' && <ResultsSection exam={exam} onReload={handleReload} />}
              {tab === 'outcomes' && <OutcomesSection examId={exam.id} exam={exam} onReload={handleReload} />}
              {tab === 'seating' && <SeatingSection exam={exam} />}
              {tab === 'attendance' && <AttendanceSection examId={exam.id} exam={exam} onReload={handleReload} />}
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
    Scheduled: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    Ongoing: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    Cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', cls[status] ?? 'bg-muted text-muted-foreground border-border')}>{status}</span>
}

function ResultStatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    'Not Started': 'bg-muted/60 text-muted-foreground border-border',
    'Marks Entry': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    'Under Verification': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    'Result Ready': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
    'Result Declared': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', cls[status] ?? 'bg-muted text-muted-foreground border-border')}>{status}</span>
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
    { label: 'Results declared', done: exam.resultStatus === 'Result Declared', navigate: 'results' as Tab },
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

// ─── Marks Section (workflow controls) ────────────────────────────────

function MarksSection({ exam, onReload }: { exam: ExamDTO; onReload: () => void }) {
  const { submit } = useSubmitMarks()
  const { verify } = useVerifyMarks()
  const { lock } = useLockMarks()
  const { declare } = useDeclareResults()
  const { publish } = usePublishResults()
  const gate = useRoleGate()
  const [classId, setClassId] = useState(exam.classes[0]?.classId ?? '')
  const [subjectId, setSubjectId] = useState('')

  const subjectsForClass = exam.subjects.filter((s: any) => s.classId === classId)

  const handleAction = async (action: 'submit' | 'verify' | 'lock' | 'declare' | 'publish') => {
    try {
      const filter = { classId, ...(subjectId ? { subjectId } : {}) }
      if (action === 'submit') {
        const r = await submit(exam.id, filter)
        toast.success(`Submitted ${r.submitted} marks`)
      } else if (action === 'verify') {
        const r = await verify(exam.id, filter)
        toast.success(`Verified ${r.verified} marks`)
      } else if (action === 'lock') {
        const r = await lock(exam.id, filter)
        toast.success(`Locked ${r.locked} marks`)
      } else if (action === 'declare') {
        await declare(exam.id)
        toast.success('Results declared')
      } else if (action === 'publish') {
        const r = await publish(exam.id, { notifyStudents: true, notifyParents: true })
        toast.success(`Results published`, { description: `${r.notificationsSent} notifications sent.` })
      }
      onReload()
    } catch (e: any) {
      toast.error(`Failed to ${action}`, { description: e.message })
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Workflow Controls</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Select value={classId} onValueChange={(v) => { setClassId(v); setSubjectId('') }}>
            <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              {exam.classes.map((c: any) => <SelectItem key={c.classId} value={c.classId}>{c.className}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subjectId || 'all'} onValueChange={(v) => setSubjectId(v === 'all' ? '' : v)}>
            <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="All Subjects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects in Class</SelectItem>
              {subjectsForClass.map((s: any) => <SelectItem key={s.subjectId} value={s.subjectId}>{s.subjectName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {gate.canSubmitMarks && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('submit')} disabled={exam.resultStatus === 'Result Declared'}>
              Submit
            </Button>
          )}
          {gate.canVerifyMarks && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('verify')} disabled={exam.resultStatus === 'Result Declared'}>
              Verify
            </Button>
          )}
          {gate.canLockMarks && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('lock')} disabled={exam.resultStatus === 'Result Declared'}>
              Lock
            </Button>
          )}
          {gate.canDeclareResults && (
            <Button size="sm" variant="default" className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction('declare')} disabled={exam.resultStatus !== 'Result Ready'}>
              Declare
            </Button>
          )}
          {gate.canPublishResults && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('publish')} disabled={exam.resultStatus !== 'Result Declared'}>
              Publish & Notify
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Progress Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Total Mark Rows" value={exam.markSummary.total} />
          <Stat label="Entered" value={exam.markSummary.entered} />
          <Stat label="Submitted" value={exam.markSummary.submitted} />
          <Stat label="Verified" value={exam.markSummary.verified} />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground px-1">
        Tip: Use the Marks tab in the main Examinations navigation for spreadsheet entry.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2">
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-bold">{value}</p>
    </div>
  )
}

// ─── Results Section ─────────────────────────────────────────────────

function ResultsSection({ exam, onReload }: { exam: ExamDTO; onReload: () => void }) {
  void onReload
  const [classId, setClassId] = useState(exam.classes[0]?.classId ?? '')
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">View Results by Class</p>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Select class" /></SelectTrigger>
          <SelectContent>
            {exam.classes.map((c: any) => <SelectItem key={c.classId} value={c.classId}>{c.className}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {classId && <ClassResultsInline examId={exam.id} classId={classId} />}
    </div>
  )
}

function ClassResultsInline({ examId, classId }: { examId: string; classId: string }) {
  const { data, loading, error } = useClassResults(examId, classId)
  if (loading) return <InlineLoading label="Computing results…" />
  if (error) return <div className="text-xs text-rose-700">{error}</div>
  if (!data || data.analytics.totalStudents === 0) return <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">No results yet.</div>
  const a = data.analytics
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Total Students" value={a.totalStudents} />
        <Stat label="Passed" value={a.passed} />
        <Stat label="Failed" value={a.failed} />
        <Stat label="Pass %" value={`${a.passRate}%`} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Stat label="Class Average" value={`${a.averagePercentage}%`} />
        <Stat label="Highest" value={`${a.highestPercentage}%`} />
        <Stat label="Lowest" value={`${a.lowestPercentage}%`} />
      </div>
      <div>
        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Class Toppers</p>
        <div className="space-y-1">
          {a.toppers.map((t: any, i: number) => (
            <div key={t.studentId} className="flex items-center justify-between text-xs p-1.5 rounded border border-border/40">
              <span className="font-medium">#{t.rank} · {t.name} ({t.rollNo ?? '—'})</span>
              <span className="font-bold tabular-nums">{t.percentage}% · {t.grade}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Audit Section ───────────────────────────────────────────────────

function AuditSection({ examId }: { examId: string }) {
  const { logs, loading } = useAuditLogs(examId)
  if (loading) return <InlineLoading label="Loading audit log…" />
  if (logs.length === 0) {
    return <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">No audit entries yet.</div>
  }
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-xs font-semibold">Audit Trail ({logs.length} entries)</p>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 sticky top-0">
            <tr>
              <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Timestamp</th>
              <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Action</th>
              <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">User</th>
              <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Entity</th>
              <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-3 py-2 font-mono text-[10px] font-semibold text-primary">{log.action}</td>
                <td className="px-3 py-2">{log.userName ?? '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{log.entity ?? '—'}</td>
                <td className="px-3 py-2 text-[10px] text-muted-foreground max-w-[200px] truncate">
                  {log.oldValue && <span className="text-rose-600">-{log.oldValue.slice(0, 50)}</span>}
                  {log.newValue && <span className="text-emerald-600 ml-1">+{log.newValue.slice(0, 50)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
