'use client'

/**
 * ExamDetailsDialog — examination workspace.
 *
 * Brief §11: Clicking an exam opens a proper workspace with:
 *   Overview · Schedule · Marks · Results · Reports
 * Brief §12: Overview shows useful info + progress (not giant analytics).
 * Brief §13: Schedule management with conflict detection.
 * Brief §14-17: Marks entry table with validation + absent handling.
 * Brief §19-22: Result generation + declaration + grade sheet.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, BookOpen, Users, CheckCircle2, Clock, Lock, Upload, AlertCircle, Award, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { SegmentedTabs } from '../shared/segmented-tabs'
import {
  type Exam,
  calculateResult,
  getMarksProgress,
  getExamMarksProgress,
  EXAM_STATUS_STYLES,
  RESULT_STATUS_STYLES,
} from '@/lib/mock/exams-data'
import { class2AAttendance } from '@/lib/mock/attendance'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type DetailTab = 'overview' | 'schedule' | 'marks' | 'results'

interface ExamDetailsDialogProps {
  exam: Exam
  onOpenChange: (o: boolean) => void
}

export function ExamDetailsDialog({ exam, onOpenChange }: ExamDetailsDialogProps) {
  const [tab, setTab] = useState<DetailTab>('overview')

  const classConfig = exam.classConfigs[0]
  const progress = getExamMarksProgress(exam)

  return (
    <Dialog open={!!exam} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1rem)] sm:max-w-3xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            {exam.name}
            <span className="text-[10px] font-normal text-muted-foreground">· {exam.session}</span>
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            {exam.type} · {exam.classes.join(', ')} · {classConfig?.subjects.length || 0} subjects
          </DialogDescription>
        </DialogHeader>

        {/* Status row */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/20">
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', EXAM_STATUS_STYLES[exam.status])}>
            {exam.status}
          </span>
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', RESULT_STATUS_STYLES[exam.resultStatus])}>
            {exam.resultStatus}
          </span>
          {exam.resultStatus === 'Marks Entry' && progress.total > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {progress.entered}/{progress.total} marks entered ({progress.pct}%)
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="px-4 py-2 border-b border-border/60">
          <SegmentedTabs
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'schedule', label: 'Schedule' },
              { value: 'marks', label: 'Marks' },
              { value: 'results', label: 'Results' },
            ]}
            value={tab}
            onValueChange={(v) => setTab(v as DetailTab)}
          />
        </div>

        {/* Tab content */}
        <div className="p-4 overflow-y-auto">
          {tab === 'overview' && <OverviewTab exam={exam} />}
          {tab === 'schedule' && <ScheduleTab exam={exam} />}
          {tab === 'marks' && <MarksTab exam={exam} />}
          {tab === 'results' && <ResultsTab exam={exam} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ──────────────────────────────────────────────────────────
   Overview Tab
   ────────────────────────────────────────────────────────── */
function OverviewTab({ exam }: { exam: Exam }) {
  const classConfig = exam.classConfigs[0]
  const progress = getExamMarksProgress(exam)

  return (
    <div className="space-y-4">
      {/* Key info */}
      <div className="grid grid-cols-2 gap-3">
        <InfoItem icon={<Calendar className="h-3.5 w-3.5" />} label="Date Range" value={`${exam.startDate} → ${exam.endDate}`} />
        <InfoItem icon={<Users className="h-3.5 w-3.5" />} label="Classes" value={exam.classes.join(', ')} />
        <InfoItem icon={<BookOpen className="h-3.5 w-3.5" />} label="Subjects" value={`${classConfig?.subjects.length || 0} configured`} />
        <InfoItem icon={<Calendar className="h-3.5 w-3.5" />} label="Schedule" value={`${exam.schedule.length} entries`} />
      </div>

      {/* Progress bars */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Progress</p>
        <ProgressItem label="Subjects configured" value={classConfig?.subjects.length || 0} max={classConfig?.subjects.length || 0} />
        <ProgressItem label="Schedule entries" value={exam.schedule.length} max={classConfig?.subjects.length || 0} />
        <ProgressItem label="Marks entered" value={progress.entered} max={progress.total} pct={progress.pct} />
        <ProgressItem
          label="Result status"
          value={exam.resultStatus === 'Result Declared' ? 1 : 0}
          max={1}
          pct={exam.resultStatus === 'Result Declared' ? 100 : 0}
          labelOverride={exam.resultStatus}
        />
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2.5">
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">{icon} {label}</p>
      <p className="text-xs font-medium text-foreground mt-1">{value}</p>
    </div>
  )
}

function ProgressItem({ label, value, max, pct, labelOverride }: { label: string; value: number; max: number; pct?: number; labelOverride?: string }) {
  const percentage = pct !== undefined ? pct : (max > 0 ? Math.round((value / max) * 100) : 0)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn('h-full rounded-full', percentage === 100 ? 'bg-emerald-500' : percentage > 50 ? 'bg-amber-500' : 'bg-rose-500')}
        />
      </div>
      <span className="text-[10px] font-medium tabular-nums w-20 text-right shrink-0">
        {labelOverride || `${value}/${max} · ${percentage}%`}
      </span>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Schedule Tab
   ────────────────────────────────────────────────────────── */
function ScheduleTab({ exam }: { exam: Exam }) {
  // Brief §13: Detect conflicts (same room + same time, or same invigilator + same time)
  const conflicts = useMemo(() => {
    const conflicts: string[] = []
    for (let i = 0; i < exam.schedule.length; i++) {
      for (let j = i + 1; j < exam.schedule.length; j++) {
        const a = exam.schedule[i]
        const b = exam.schedule[j]
        if (a.date === b.date && a.startTime === b.startTime) {
          if (a.room === b.room) {
            conflicts.push(`Room conflict: ${a.room} on ${a.date} at ${a.startTime}`)
          }
          if (a.invigilator === b.invigilator) {
            conflicts.push(`Invigilator conflict: ${a.invigilator} on ${a.date} at ${a.startTime}`)
          }
        }
      }
    }
    return conflicts
  }, [exam])

  return (
    <div className="space-y-3">
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5">
          <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 mb-1">
            <AlertCircle className="h-3.5 w-3.5" /> {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''}
          </p>
          {conflicts.map((c, i) => (
            <p key={i} className="text-[10px] text-rose-600/80 dark:text-rose-400/80 ml-5">{c}</p>
          ))}
        </div>
      )}
      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Date</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Subject</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Time</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 hidden sm:table-cell">Room</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 hidden md:table-cell">Invigilator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exam.schedule.map((s, i) => {
              const hasConflict = conflicts.some((c) => c.includes(s.room) && c.includes(s.date))
              return (
                <TableRow key={i} className={cn('border-b border-border/40 last:border-0', hasConflict && 'bg-rose-500/5')}>
                  <TableCell className="py-2 text-xs">{s.date}</TableCell>
                  <TableCell className="py-2 text-xs font-medium">{s.subjectName}</TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">{s.startTime} – {s.endTime}</TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground hidden sm:table-cell">{s.room}</TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground hidden md:table-cell">{s.invigilator}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Marks Tab — Brief §14-17: Efficient digital marks register
   ────────────────────────────────────────────────────────── */
function MarksTab({ exam }: { exam: Exam }) {
  const classConfig = exam.classConfigs[0]
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(classConfig?.subjects[0]?.id || '')
  const [draftMarks, setDraftMarks] = useState<Record<string, { marks: number | null; absent: boolean }>>({})

  const subject = classConfig?.subjects.find((s) => s.id === selectedSubjectId)
  const subjectMarks = classConfig?.marks.find((m) => m.subjectId === selectedSubjectId)

  if (!subject || !subjectMarks) {
    return <p className="text-xs text-muted-foreground text-center py-8">No subjects configured.</p>
  }

  const handleMarkChange = (studentId: string, value: string) => {
    if (value === '') {
      setDraftMarks((prev) => ({ ...prev, [studentId]: { marks: null, absent: false } }))
      return
    }
    if (value.toUpperCase() === 'AB') {
      setDraftMarks((prev) => ({ ...prev, [studentId]: { marks: null, absent: true } }))
      return
    }
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0 || num > subject.maxMarks) return
    setDraftMarks((prev) => ({ ...prev, [studentId]: { marks: num, absent: false } }))
  }

  const getCurrentMark = (studentId: string): { marks: number | null; absent: boolean } => {
    const draft = draftMarks[studentId]
    if (draft) return draft
    const original = subjectMarks.marks.find((m) => m.studentId === studentId)
    return { marks: original?.marksObtained ?? null, absent: original?.isAbsent ?? false }
  }

  const enteredCount = Object.values(draftMarks).filter((d) => d.marks !== null || d.absent).length
  const totalCount = subjectMarks.marks.length

  return (
    <div className="space-y-3">
      {/* Subject selector + progress */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
          <SelectTrigger size="sm" className="w-[180px] text-xs rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {classConfig?.subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name} (Max: {s.maxMarks})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground">
          {enteredCount}/{totalCount} entered · {totalCount - enteredCount} pending
        </span>
      </div>

      {/* Marks entry table — Brief §14: keyboard-friendly digital register */}
      <div className="rounded-lg border border-border overflow-x-auto max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur-sm z-10">
            <TableRow className="border-b border-border">
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 w-12">Roll</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Student</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center w-20">Max</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center w-24">Marks</TableHead>
              <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center w-16">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjectMarks.marks.map((sm) => {
              const current = getCurrentMark(sm.studentId)
              const isOverMax = current.marks !== null && current.marks > subject.maxMarks
              const isValid = current.marks !== null || current.absent
              return (
                <TableRow key={sm.studentId} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <TableCell className="py-1.5 text-xs font-mono tabular-nums text-muted-foreground">{sm.rollNo}</TableCell>
                  <TableCell className="py-1.5 text-xs font-medium">{sm.studentName}</TableCell>
                  <TableCell className="py-1.5 text-xs text-center text-muted-foreground">{subject.maxMarks}</TableCell>
                  <TableCell className="py-1.5 text-center">
                    <Input
                      type="text"
                      value={current.absent ? 'AB' : current.marks ?? ''}
                      onChange={(e) => handleMarkChange(sm.studentId, e.target.value)}
                      placeholder="—"
                      className={cn(
                        'h-7 text-xs w-16 text-center',
                        current.absent ? 'text-rose-600 font-bold' : '',
                        isOverMax ? 'border-rose-500 text-rose-600' : '',
                        isValid && !current.absent && !isOverMax ? 'border-emerald-500/40' : ''
                      )}
                    />
                  </TableCell>
                  <TableCell className="py-1.5 text-center">
                    {current.absent ? (
                      <span className="text-[10px] font-semibold text-rose-600">AB</span>
                    ) : current.marks !== null ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Enter marks or type "AB" for absent. Validation: marks cannot exceed maximum ({subject.maxMarks}).
      </p>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Results Tab — Brief §19-22: Grade sheet + toppers + declaration
   ────────────────────────────────────────────────────────── */
function ResultsTab({ exam }: { exam: Exam }) {
  const [declared, setDeclared] = useState(exam.resultStatus === 'Result Declared')
  const [submitting, setSubmitting] = useState(false)

  const classConfig = exam.classConfigs[0]
  const subjectNames = classConfig?.subjects.map((s) => s.name) || []
  const students = class2AAttendance

  // Calculate results for all students
  const results = useMemo(() => {
    return students.map((student) => {
      const result = calculateResult(exam, classConfig.classId, student.rollNo)
      return { student, result }
    })
  }, [exam, classConfig, students])

  const sortedResults = [...results].sort((a, b) => (b.result?.percentage || 0) - (a.result?.percentage || 0))

  const handleDeclare = () => {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setDeclared(true)
      toast.success('Results declared', {
        description: `${exam.name} results are now published.`,
      })
    }, 1200)
  }

  if (!declared && exam.resultStatus !== 'Result Declared') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Results not declared</h3>
        <p className="text-[11px] text-muted-foreground/70 max-w-xs mb-4">
          Ensure all marks are entered and verified before declaring results.
        </p>
        {exam.resultStatus === 'Result Ready' || exam.resultStatus === 'Under Verification' ? (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleDeclare}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Upload className="h-3.5 w-3.5" />
                </motion.span>
                Declaring…
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" /> Declare Results
              </>
            )}
          </Button>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">Current status: {exam.resultStatus}</p>
        )}
      </div>
    )
  }

  // Grade sheet — Brief §22
  return (
    <div className="space-y-3">
      {/* Class toppers — Brief §23 */}
      <div>
        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Class Toppers</p>
        <div className="flex gap-2">
          {sortedResults.slice(0, 3).map(({ student, result }, i) => (
            <div key={student.rollNo} className={cn(
              'flex-1 rounded-lg border p-2.5 flex items-center gap-2',
              i === 0 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-card border-border'
            )}>
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : 'bg-orange-400 text-white'
              )}>
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{student.name}</p>
                <p className="text-[10px] text-muted-foreground">{result?.percentage}% · {result?.grade}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade sheet table — Brief §22 */}
      <div>
        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Grade Sheet</p>
        <div className="rounded-lg border border-border overflow-x-auto max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur-sm z-10">
              <TableRow className="border-b border-border">
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 w-8">#</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Student</TableHead>
                {subjectNames.map((s) => (
                  <TableHead key={s} className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center hidden md:table-cell">{s.slice(0, 4)}</TableHead>
                ))}
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-right">Total</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-right">%</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResults.map(({ student, result }, i) => (
                <TableRow key={student.rollNo} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <TableCell className="py-1.5 text-xs font-bold">{i + 1}</TableCell>
                  <TableCell className="py-1.5">
                    <p className="text-xs font-medium">{student.name}</p>
                    <p className="text-[9px] text-muted-foreground">#{student.rollNo}</p>
                  </TableCell>
                  {classConfig?.marks.map((sm) => {
                    const mark = sm.marks.find((m) => m.studentId === student.rollNo)
                    return (
                      <TableCell key={sm.subjectId} className="py-1.5 text-center text-xs hidden md:table-cell">
                        {mark?.isAbsent ? (
                          <span className="text-rose-600 font-semibold text-[10px]">AB</span>
                        ) : mark?.marksObtained !== null && mark?.marksObtained !== undefined ? (
                          <span className={cn(
                            mark.marksObtained >= sm.maxMarks * 0.8 ? 'text-emerald-600' :
                            mark.marksObtained >= sm.maxMarks * 0.33 ? 'text-foreground' :
                            'text-rose-600'
                          )}>{mark.marksObtained}</span>
                        ) : '—'}
                      </TableCell>
                    )
                  })}
                  <TableCell className="py-1.5 text-right text-xs font-bold tabular-nums">
                    {result?.totalObtained}<span className="text-muted-foreground text-[9px]">/{result?.totalMax}</span>
                  </TableCell>
                  <TableCell className="py-1.5 text-right text-xs font-semibold tabular-nums">{result?.percentage}%</TableCell>
                  <TableCell className="py-1.5 text-center">
                    <span className={cn('text-[10px] font-bold', result?.gradeColor)}>{result?.grade}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
