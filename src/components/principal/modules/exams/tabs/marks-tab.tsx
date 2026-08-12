'use client'

/**
 * MarksTab — Principal-facing marks entry workspace.
 *
 * Select exam → class → subject, then see a spreadsheet of REAL students
 * from that class. Marks persist immediately to /api/exams/[id]/marks/single.
 * Workflow states: DRAFT → SUBMITTED → VERIFIED → LOCKED are visible per row.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Check, Lock, Send, ShieldCheck, AlertCircle, Save } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InlineLoading } from '../inline-loading'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useExam,
  useMarks,
  useSetMark,
  useSubmitMarks,
  useVerifyMarks,
  useLockMarks,
} from '@/lib/exams/use-exams'
import { type ExamMarkDTO, type StudentDTO, MARK_STATUSES } from '@/lib/exams/types'

interface Props {
  exams: Array<{ id: string; name: string }>
}

export function MarksTab({ exams }: Props) {
  const [examId, setExamId] = useState<string | null>(exams[0]?.id ?? null)
  const [classId, setClassId] = useState<string | null>(null)
  const [subjectId, setSubjectId] = useState<string | null>(null)

  const { exam } = useExam(examId)

  // Auto-select first class & subject when exam loads
  useEffect(() => {
    if (exam) {
      if (!classId && exam.classes[0]) setClassId(exam.classes[0].classId)
      const firstSubjectForClass = exam.subjects.find((s) => s.classId === (classId || exam.classes[0]?.classId))
      if (!subjectId && firstSubjectForClass) setSubjectId(firstSubjectForClass.subjectId)
    }
  }, [exam, classId, subjectId])

  const { students, marks, loading, reload } = useMarks(examId, classId, subjectId)

  if (exams.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-xs text-muted-foreground">No examinations created yet. Create one in the Exams tab first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Selector bar */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Examination</Label>
            <Select value={examId ?? undefined} onValueChange={(v) => { setExamId(v); setClassId(null); setSubjectId(null) }}>
              <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Select exam" /></SelectTrigger>
              <SelectContent>
                {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Class</Label>
            <Select value={classId ?? undefined} onValueChange={(v) => { setClassId(v); setSubjectId(null) }}>
              <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {exam?.classes.map((c) => <SelectItem key={c.classId} value={c.classId}>{c.className}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Subject</Label>
            <Select value={subjectId ?? undefined} onValueChange={setSubjectId}>
              <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {exam?.subjects.filter((s) => !classId || s.classId === classId).map((s) => (
                  <SelectItem key={s.subjectId} value={s.subjectId}>{s.subjectName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!examId || !classId || !subjectId ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-xs text-muted-foreground">Select an exam, class, and subject to begin entering marks.</p>
        </div>
      ) : loading ? (
        <InlineLoading label="Loading students and marks…" />
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-xs text-muted-foreground">No students found in this class.</p>
        </div>
      ) : (
        <MarksGrid
          examId={examId}
          classId={classId}
          subjectId={subjectId}
          exam={exam}
          students={students}
          marks={marks}
          onMutated={reload}
        />
      )}
    </div>
  )
}

function MarksGrid({
  examId,
  classId,
  subjectId,
  exam,
  students,
  marks,
  onMutated,
}: {
  examId: string
  classId: string
  subjectId: string
  exam: any
  students: StudentDTO[]
  marks: ExamMarkDTO[]
  onMutated: () => void
}) {
  const subjectConfig = exam?.subjects.find((s: any) => s.subjectId === subjectId && s.classId === classId)
  const maxMarks = subjectConfig?.maxMarks ?? 100
  const passMarks = subjectConfig?.passMarks ?? 33
  const { set } = useSetMark()
  const { submit: submitMarksHook } = useSubmitMarks()
  const { verify } = useVerifyMarks()
  const { lock } = useLockMarks()

  // Local mark edits (debounced save)
  const [localMarks, setLocalMarks] = useState<Record<string, { marks: string; status: string }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())

  // Sync local state with server marks
  useEffect(() => {
    const newLocal: Record<string, { marks: string; status: string }> = {}
    for (const s of students) {
      const m = marks.find((mk) => mk.studentId === s.id)
      newLocal[s.id] = {
        marks: m ? (m.status !== 'PRESENT' ? '' : (m.marksObtained?.toString() ?? '')) : '',
        status: m?.status ?? 'PRESENT',
      }
    }
    setLocalMarks(newLocal)
    setDirty(new Set())
  }, [students, marks])

  const saveStudent = useCallback(async (studentId: string) => {
    const local = localMarks[studentId]
    if (!local) return
    setSaving((p) => ({ ...p, [studentId]: true }))
    try {
      const marksValue = local.marks === '' ? null : parseFloat(local.marks)
      if (local.marks !== '' && (isNaN(marksValue as number) || (marksValue as number) < 0 || (marksValue as number) > maxMarks)) {
        toast.error(`Invalid marks (max ${maxMarks})`, { description: `Enter a value between 0 and ${maxMarks}, or set status to Absent/Medical/Exempted.` })
        return
      }
      await set(examId, {
        classId,
        subjectId,
        studentId,
        marksObtained: marksValue,
        status: local.status as any,
      })
      setDirty((p) => { const n = new Set(p); n.delete(studentId); return n })
    } catch (e: any) {
      toast.error('Failed to save mark', { description: e.message })
    } finally {
      setSaving((p) => ({ ...p, [studentId]: false }))
    }
  }, [localMarks, maxMarks, set, examId, classId, subjectId])

  const handleMarkChange = (studentId: string, value: string) => {
    setLocalMarks((p) => ({ ...p, [studentId]: { ...p[studentId], marks: value } }))
    setDirty((p) => { const n = new Set(p); n.add(studentId); return n })
  }
  const handleStatusChange = (studentId: string, value: string) => {
    setLocalMarks((p) => ({ ...p, [studentId]: { ...p[studentId], status: value, marks: value === 'PRESENT' ? p[studentId].marks : '' } }))
    setDirty((p) => { const n = new Set(p); n.add(studentId); return n })
  }

  const handleSaveAll = async () => {
    for (const sid of dirty) {
      await saveStudent(sid)
    }
    onMutated()
    toast.success('All marks saved')
  }

  const workflowState = marks[0]?.workflowStatus ?? 'DRAFT'
  const isLocked = workflowState === 'LOCKED'
  const isDeclared = exam?.resultStatus === 'Result Declared'

  const handleWorkflowAction = async (action: 'submit' | 'verify' | 'lock') => {
    // Save any pending edits first
    if (dirty.size > 0) await handleSaveAll()
    try {
      if (action === 'submit') {
        const r = await submitMarksHook(examId, { classId, subjectId })
        toast.success(`Submitted ${r.submitted} marks`, { description: 'Marks are now pending verification.' })
      } else if (action === 'verify') {
        const r = await verify(examId, { classId, subjectId })
        toast.success(`Verified ${r.verified} marks`, { description: 'Marks are now ready to be locked.' })
      } else if (action === 'lock') {
        const r = await lock(examId, { classId, subjectId })
        toast.success(`Locked ${r.locked} marks`, { description: 'Marks are now immutable. Results can be declared.' })
      }
      onMutated()
    } catch (e: any) {
      toast.error(`Failed to ${action} marks`, { description: e.message })
    }
  }

  const handleDeclareResults = async () => {
    try {
      const r = await fetch(`/api/exams/${examId}/results/declare`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      const b = await r.json()
      if (b.ok) {
        toast.success('Results declared!', { description: 'Exam status is now Completed.' })
        onMutated()
      } else {
        toast.error('Failed to declare results', { description: b.error })
      }
    } catch (e: any) {
      toast.error('Failed to declare results', { description: e.message })
    }
  }

  const enteredCount = marks.filter((m) => m.marksObtained !== null || m.status !== 'PRESENT').length
  const total = marks.length || students.length
  const pct = total > 0 ? Math.round((enteredCount / total) * 100) : 0

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card p-3 flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{exam?.name} — {subjectConfig?.subjectName}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {subjectConfig?.subjectName} · Max {maxMarks} · Pass {passMarks} · {students.length} students · {enteredCount}/{total} entered ({pct}%)
          </p>
        </div>
        <WorkflowBadge state={workflowState} />
        {dirty.size > 0 && (
          <Button size="sm" variant="default" className="h-7 text-xs gap-1.5" onClick={handleSaveAll}>
            <Save className="h-3 w-3" /> Save {dirty.size} unsaved
          </Button>
        )}
        {!isLocked && !isDeclared && (
          <>
            {workflowState === 'DRAFT' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleWorkflowAction('submit')}>
                <Send className="h-3 w-3" /> Submit
              </Button>
            )}
            {workflowState === 'SUBMITTED' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleWorkflowAction('verify')}>
                <ShieldCheck className="h-3 w-3" /> Verify
              </Button>
            )}
            {workflowState === 'VERIFIED' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleWorkflowAction('lock')}>
                <Lock className="h-3 w-3" /> Lock
              </Button>
            )}
          </>
        )}
        {exam?.resultStatus === 'Result Ready' && (
          <Button size="sm" className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleDeclareResults}>
            <Check className="h-3 w-3" /> Declare Results
          </Button>
        )}
      </div>

      {/* Spreadsheet */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="border-b border-border">
              <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2 w-16">Roll #</th>
              <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2">Student</th>
              <th className="text-center text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2 w-16">Max</th>
              <th className="text-center text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2 w-24">Marks</th>
              <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2 w-32">Status</th>
              <th className="text-left text-[9px] uppercase font-semibold text-muted-foreground px-3 py-2 w-16">State</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const m = marks.find((mk) => mk.studentId === s.id)
              const local = localMarks[s.id] || { marks: '', status: 'PRESENT' }
              const isDirty = dirty.has(s.id)
              const isSaving = saving[s.id]
              const cellState = m?.workflowStatus ?? 'DRAFT'
              const cellLocked = isLocked || cellState === 'LOCKED'
              return (
                <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 font-mono text-[10px]">{s.rollNo ?? '—'}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium">{s.name}</p>
                    {m?.remarks && <p className="text-[9px] text-muted-foreground italic">{m.remarks}</p>}
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">{maxMarks}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={local.marks}
                      onChange={(e) => handleMarkChange(s.id, e.target.value)}
                      onBlur={() => isDirty && saveStudent(s.id)}
                      disabled={cellLocked || local.status !== 'PRESENT'}
                      placeholder={local.status !== 'PRESENT' ? '—' : '0'}
                      className={cn(
                        'h-7 w-20 mx-auto text-xs text-center',
                        local.marks !== '' && parseFloat(local.marks) > maxMarks && 'border-rose-500/50 bg-rose-500/5',
                        local.marks !== '' && parseFloat(local.marks) < passMarks && parseFloat(local.marks) >= 0 && 'border-amber-500/40',
                      )}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={local.status} onValueChange={(v) => handleStatusChange(s.id, v)} disabled={cellLocked}>
                      <SelectTrigger size="sm" className="h-7 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MARK_STATUSES.map((st) => (
                          <SelectItem key={st} value={st}>{st === 'PRESENT' ? 'Present' : st.charAt(0) + st.slice(1).toLowerCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <CellStateBadge state={cellState} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {isSaving && <span className="text-[9px] text-muted-foreground">saving…</span>}
                    {isDirty && !isSaving && <span className="text-[9px] text-amber-600">●</span>}
                    {cellLocked && <Lock className="h-3 w-3 text-muted-foreground inline" />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isDeclared && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-emerald-600" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Results have been declared. Marks are now permanently locked.</p>
        </div>
      )}
    </div>
  )
}

function WorkflowBadge({ state }: { state: string }) {
  const cls = {
    DRAFT: 'bg-muted text-muted-foreground border-border',
    SUBMITTED: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    VERIFIED: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    LOCKED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  }[state] || 'bg-muted text-muted-foreground border-border'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', cls)}>
      {state === 'DRAFT' && <Save className="h-2.5 w-2.5" />}
      {state === 'SUBMITTED' && <Send className="h-2.5 w-2.5" />}
      {state === 'VERIFIED' && <ShieldCheck className="h-2.5 w-2.5" />}
      {state === 'LOCKED' && <Lock className="h-2.5 w-2.5" />}
      {state}
    </span>
  )
}

function CellStateBadge({ state }: { state: string }) {
  const cls = {
    DRAFT: 'text-muted-foreground',
    SUBMITTED: 'text-amber-600 dark:text-amber-400',
    VERIFIED: 'text-violet-600 dark:text-violet-400',
    LOCKED: 'text-emerald-600 dark:text-emerald-400',
  }[state] || 'text-muted-foreground'
  return <span className={cn('text-[9px] font-semibold uppercase', cls)}>{state}</span>
}
