'use client'

/**
 * ExamWorkspaceDialog — Principal's workspace for a single real exam.
 *
 * Sections: Overview | Schedule | Marks | Results | Audit
 * All sections operate on the actual exam entity loaded from the API.
 * Replaces the old hardcoded "Unit Test" details dialog.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Save, Send, ShieldCheck, Lock, Check, History } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { InlineLoading } from './inline-loading'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useExam,
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
import {
  SeatingSection,
  AttendanceSection,
  GraceSection,
  OutcomesSection,
  CsvImportSection,
} from './workspace-sections-extended'
import {
  useUpdateScheduleItemV2,
  useTeachers,
  useAssignInvigilator,
  usePublishResults,
} from '@/lib/exams/use-exams-extended'

interface Props {
  examId: string
  onOpenChange: (o: boolean) => void
  onMutated: () => void
}

type Tab = 'overview' | 'schedule' | 'marks' | 'csv-import' | 'results' | 'outcomes' | 'seating' | 'attendance' | 'grace' | 'audit'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'marks', label: 'Marks' },
  { value: 'csv-import', label: 'Import' },
  { value: 'results', label: 'Results' },
  { value: 'outcomes', label: 'Outcomes' },
  { value: 'seating', label: 'Seating' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'grace', label: 'Grace' },
  { value: 'audit', label: 'Audit' },
]

export function ExamWorkspaceDialog({ examId, onOpenChange, onMutated }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const { exam, loading, error, reload } = useExam(examId)

  const handleReload = () => {
    reload()
    onMutated()
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-5xl p-0 gap-0 max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold truncate">
                {exam?.name ?? 'Loading…'}
              </DialogTitle>
              <DialogDescription className="text-[10px] mt-0.5">
                {exam ? `${exam.type} · ${exam.session} · ${exam.classes.length} classes · ${exam.subjects.length} subjects` : ''}
              </DialogDescription>
            </div>
            {exam && (
              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={exam.status} />
                <ResultStatusPill status={exam.resultStatus} />
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="px-4 py-2 border-b border-border/60 shrink-0">
          <SegmentedTabs tabs={TABS} value={tab} onValueChange={(v) => setTab(v as Tab)} />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <InlineLoading label="Loading examination…" />
          ) : error ? (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          ) : !exam ? null : (
            <AnimatePresence mode="wait">
              {tab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <OverviewSection exam={exam} onReload={handleReload} />
                </motion.div>
              )}
              {tab === 'schedule' && (
                <motion.div key="sc" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <ScheduleSection exam={exam} onReload={handleReload} />
                </motion.div>
              )}
              {tab === 'marks' && (
                <motion.div key="mk" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <MarksSection exam={exam} onReload={handleReload} />
                </motion.div>
              )}
              {tab === 'results' && (
                <motion.div key="rs" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <ResultsSection exam={exam} onReload={handleReload} />
                </motion.div>
              )}
              {tab === 'audit' && (
                <motion.div key="au" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <AuditSection examId={exam.id} />
                </motion.div>
              )}
              {tab === 'csv-import' && (
                <motion.div key="ci" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <CsvImportSection examId={exam.id} exam={exam} onReload={handleReload} />
                </motion.div>
              )}
              {tab === 'outcomes' && (
                <motion.div key="oc" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <OutcomesSection examId={exam.id} exam={exam} onReload={handleReload} />
                </motion.div>
              )}
              {tab === 'seating' && (
                <motion.div key="se" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <SeatingSection examId={exam.id} exam={exam} onReload={handleReload} />
                </motion.div>
              )}
              {tab === 'attendance' && (
                <motion.div key="at" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <AttendanceSection examId={exam.id} exam={exam} onReload={handleReload} />
                </motion.div>
              )}
              {tab === 'grace' && (
                <motion.div key="gr" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <GraceSection examId={exam.id} exam={exam} onReload={handleReload} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
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

// ─── Overview Section ─────────────────────────────────────────────────

function OverviewSection({ exam, onReload }: { exam: any; onReload: () => void }) {
  const { update } = useUpdateExam()
  const [name, setName] = useState(exam.name)
  const [status, setStatus] = useState(exam.status)
  const [startDate, setStartDate] = useState(exam.startDate ?? '')
  const [endDate, setEndDate] = useState(exam.endDate ?? '')

  const handleSave = async () => {
    try {
      await update(exam.id, { name, status, startDate, endDate })
      toast.success('Exam updated')
      onReload()
    } catch (e: any) {
      toast.error('Failed to update exam', { description: e.message })
    }
  }

  const entered = exam.markSummary.entered
  const total = exam.markSummary.total
  const pct = exam.markSummary.pct

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Classes</p>
          <p className="font-display text-2xl font-bold">{exam.classes.length}</p>
          <div className="mt-1 space-y-0.5">
            {exam.classes.map((c: any) => (
              <p key={c.classId} className="text-[10px] text-muted-foreground">{c.className} · {c.studentCount} students</p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Subjects</p>
          <p className="font-display text-2xl font-bold">{exam.subjects.length}</p>
          <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
            {exam.subjects.map((s: any) => (
              <p key={s.subjectId + s.classId} className="text-[10px] text-muted-foreground truncate">
                {s.subjectName} · max {s.maxMarks} · pass {s.passMarks}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Marks Entry Progress</p>
          <p className="font-display text-2xl font-bold">{entered}/{total}</p>
          <div className="mt-2 h-2 rounded-full bg-muted/60 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{pct}% entered</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Edit Examination</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        <Button size="sm" className="mt-3 h-7 text-xs" onClick={handleSave}>
          <Save className="h-3 w-3" /> Save Changes
        </Button>
      </div>
    </div>
  )
}

// ─── Schedule Section ─────────────────────────────────────────────────

function ScheduleSection({ exam, onReload }: { exam: any; onReload: () => void }) {
  const { add } = useAddScheduleItem()
  const { remove } = useDeleteScheduleItem()
  const { update: updateItem } = useUpdateScheduleItemV2()
  const { teachers } = useTeachers(exam.id)
  const { assign: assignInvigilator } = useAssignInvigilator()
  const [classId, setClassId] = useState(exam.classes[0]?.classId ?? '')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [room, setRoom] = useState('')
  const [invigilator, setInvigilator] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRoom, setEditRoom] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')

  const handleAdd = async () => {
    if (!classId || !subjectId || !date) {
      toast.error('Class, subject, and date are required')
      return
    }
    try {
      await add(exam.id, { classId, subjectId, date, startTime, endTime, room, invigilatorName: invigilator })
      toast.success('Schedule item added')
      setSubjectId(''); setDate(''); setRoom(''); setInvigilator('')
      onReload()
    } catch (e: any) {
      toast.error('Failed to add schedule item', { description: e.message })
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      await remove(exam.id, itemId)
      toast.success('Schedule item removed')
      onReload()
    } catch (e: any) {
      toast.error('Failed to remove schedule item', { description: e.message })
    }
  }

  const handleSaveEdit = async (item: any) => {
    try {
      await updateItem(exam.id, item.id, {
        date: editDate || undefined,
        startTime: editStart || undefined,
        endTime: editEnd || undefined,
        room: editRoom,
      })
      toast.success('Schedule item updated')
      setEditingId(null)
      onReload()
    } catch (e: any) {
      toast.error('Failed to update', { description: e.message })
    }
  }

  const handleAssignInvigilator = async (itemId: string, teacherId: string) => {
    if (!teacherId) return
    try {
      await assignInvigilator(exam.id, itemId, teacherId)
      toast.success('Invigilator assigned')
      onReload()
    } catch (e: any) {
      toast.error('Failed to assign invigilator', { description: e.message })
    }
  }

  const subjectsForClass = exam.subjects.filter((s: any) => s.classId === classId)
  const scheduleForClass = exam.schedule.filter((s: any) => s.classId === classId)

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Add Schedule Item</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={classId} onValueChange={(v) => { setClassId(v); setSubjectId('') }}>
            <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              {exam.classes.map((c: any) => <SelectItem key={c.classId} value={c.classId}>{c.className}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              {subjectsForClass.map((s: any) => <SelectItem key={s.subjectId} value={s.subjectId}>{s.subjectName}</SelectItem>)}
            </SelectContent>
          </Select>
          <DatePicker value={date} onChange={setDate} placeholder="Date" />
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-7 text-xs" />
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-7 text-xs" />
          <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room" className="h-7 text-xs" />
          <Input value={invigilator} onChange={(e) => setInvigilator(e.target.value)} placeholder="Invigilator name (or assign below)" className="h-7 text-xs" />
        </div>
        <Button size="sm" className="mt-2 h-7 text-xs gap-1" onClick={handleAdd}>
          <Plus className="h-3 w-3" /> Add to Schedule
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground">
            Schedule for {exam.classes.find((c: any) => c.classId === classId)?.className ?? '—'} ({scheduleForClass.length} items)
          </p>
          {teachers.length > 0 && (
            <span className="text-[10px] text-muted-foreground ml-auto">{teachers.length} teachers available</span>
          )}
        </div>
        {scheduleForClass.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">No schedule items yet. Add one above.</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Subject</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Date</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Time</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Room</th>
                <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Invigilator</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {scheduleForClass.map((s: any) => (
                <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{s.subjectName ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {editingId === s.id ? (
                      <DatePicker value={editDate} onChange={setEditDate} compact placeholder="Date" className="w-[110px]" />
                    ) : (
                      s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {editingId === s.id ? (
                      <div className="flex items-center gap-1">
                        <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="h-6 text-[10px] w-14" />
                        <span className="text-[9px]">–</span>
                        <Input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="h-6 text-[10px] w-14" />
                      </div>
                    ) : (
                      <span>{s.startTime} — {s.endTime}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {editingId === s.id ? (
                      <Input value={editRoom} onChange={(e) => setEditRoom(e.target.value)} placeholder="Room" className="h-6 text-[10px] w-20" />
                    ) : (
                      s.room ?? '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {teachers.length > 0 ? (
                      <Select
                        value={s.invigilatorName ?? ''}
                        onValueChange={(v) => {
                          const teacher = teachers.find((t) => t.name === v)
                          if (teacher) handleAssignInvigilator(s.id, teacher.id)
                        }}
                      >
                        <SelectTrigger size="sm" className="h-6 text-[10px]"><SelectValue placeholder="Assign teacher" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => <SelectItem key={t.id} value={t.name}>{t.name} {t.department ? `· ${t.department}` : ''}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">{s.invigilatorName ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editingId === s.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleSaveEdit(s)} className="text-emerald-600 hover:text-emerald-700">
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground text-[10px]">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(s.id)
                            setEditDate(s.date ? new Date(s.date).toISOString().split('T')[0] : '')
                            setEditStart(s.startTime)
                            setEditEnd(s.endTime)
                            setEditRoom(s.room ?? '')
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Save className="h-3.5 w-3.5 opacity-50" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="text-muted-foreground hover:text-rose-600 transition-colors" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Marks Section (workflow controls) ────────────────────────────────

function MarksSection({ exam, onReload }: { exam: any; onReload: () => void }) {
  const { submit } = useSubmitMarks()
  const { verify } = useVerifyMarks()
  const { lock } = useLockMarks()
  const { declare } = useDeclareResults()
  const { publish } = usePublishResults()
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
        toast.success(`Results published`, { description: `${r.notificationsSent} student notifications sent.` })
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
        <p className="text-[10px] text-muted-foreground mb-3">
          Use the Marks tab for spreadsheet-style entry. Use these controls to advance the workflow state for a class (or class+subject).
        </p>
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
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('submit')} disabled={exam.resultStatus === 'Result Declared'}>
            <Send className="h-3 w-3" /> Submit Marks
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('verify')} disabled={exam.resultStatus === 'Result Declared'}>
            <ShieldCheck className="h-3 w-3" /> Verify Marks
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('lock')} disabled={exam.resultStatus === 'Result Declared'}>
            <Lock className="h-3 w-3" /> Lock Marks
          </Button>
          <Button size="sm" variant="default" className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction('declare')} disabled={exam.resultStatus !== 'Result Ready'}>
            <Check className="h-3 w-3" /> Declare Results
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleAction('publish')} disabled={exam.resultStatus !== 'Result Declared'}>
            <Send className="h-3 w-3" /> Publish & Notify
          </Button>
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

// ─── Results Section (workspace on the actual exam) ──────────────────

function ResultsSection({ exam, onReload }: { exam: any; onReload: () => void }) {
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
      {classId && <ClassResultsInline examId={exam.id} classId={classId} exam={exam} />}
    </div>
  )
}

function ClassResultsInline({ examId, classId, exam }: { examId: string; classId: string; exam: any }) {
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
        <Stat label="Pass %" value={a.passRate} />
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
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <History className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-semibold">Audit Trail</p>
        <span className="text-[10px] text-muted-foreground ml-auto">{logs.length} entries</span>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
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
