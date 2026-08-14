'use client'

/**
 * AssignHomeworkFullScreen — full-screen 5-step homework creation wizard.
 *
 * Steps:
 *   1. Details
 *   2. Class & Students
 *   3. Content
 *   4. Schedule
 *   5. Review & Publish
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { useCreateHomework } from '@/lib/homework/use-homework'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClassOption {
  id: string
  name: string
  gradeLevel: string | null
  section: string | null
  studentCount: number
  subjects: Array<{ id: string; name: string; code: string | null }>
}

interface TeacherOption {
  id: string
  name: string
  email: string
  department: string | null
  employeeId: string | null
}

interface Props {
  classes: ClassOption[]
  teachers: TeacherOption[]
  onBack: () => void
  onCreated: (hw: any) => void
}

const STEPS = ['Details', 'Class & Students', 'Content', 'Schedule', 'Review'] as const
type Step = typeof STEPS[number]

export function AssignHomeworkFullScreen({ classes, teachers, onBack, onCreated }: Props) {
  const [step, setStep] = useState<Step>('Details')
  // Step 1
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [chapter, setChapter] = useState('')
  const [learningObjective, setLearningObjective] = useState('')
  // Step 2
  const [classId, setClassId] = useState('')
  // Step 3
  const [content, setContent] = useState('')
  const [maxMarks, setMaxMarks] = useState('')
  const [gradingType, setGradingType] = useState('marks')
  // Step 4
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('23:59')
  const [allowLateSubmission, setAllowLateSubmission] = useState(true)
  const [latePenalty, setLatePenalty] = useState('0')
  const [allowResubmission, setAllowResubmission] = useState(true)
  const { create, loading } = useCreateHomework()

  const stepIndex = STEPS.indexOf(step)
  const selectedClass = classes.find((c) => c.id === classId)
  const selectedTeacher = teachers.find((t) => t.id === teacherId)

  const canProceed = () => {
    if (step === 'Details') return title.trim() !== ''
    if (step === 'Class & Students') return classId !== ''
    if (step === 'Schedule') return dueDate !== ''
    return true
  }

  const handleNext = () => {
    if (!canProceed()) return
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  const handleBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1])
    else onBack()
  }

  const warnings: string[] = []
  if (!classId) warnings.push('No class selected.')
  if (dueDate && assignedDate && dueDate < assignedDate) warnings.push('Due date is before assigned date.')
  if (!subjectId) warnings.push('No subject selected (optional but recommended).')

  const handleCreate = async (publish: boolean) => {
    try {
      const hw = await create({
        title: title.trim(),
        description: description || undefined,
        classId,
        subjectId: subjectId || undefined,
        teacherId: teacherId || undefined,
        teacherName: selectedTeacher?.name,
        topic: topic || undefined,
        chapter: chapter || undefined,
        learningObjective: learningObjective || undefined,
        content: content || undefined,
        maxMarks: maxMarks ? Number(maxMarks) : undefined,
        gradingType,
        assignedDate,
        dueDate,
        dueTime,
        allowLateSubmission,
        latePenalty: Number(latePenalty) || 0,
        allowResubmission,
        status: publish ? 'PUBLISHED' : 'DRAFT',
      })
      toast.success(publish ? 'Homework published' : 'Draft saved', { description: `"${hw.title}" created.` })
      onCreated(hw)
    } catch (e: any) {
      toast.error('Failed to create homework', { description: e.message })
    }
  }

  return (
    <div className="flex flex-col h-full -mt-4 -mx-4 sm:-mx-6">
      {/* Top header */}
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={onBack}>
                <ArrowLeft className="h-3.5 w-3.5" /> Homework
              </Button>
              <div className="h-5 w-px bg-border" />
              <div>
                <h1 className="text-base font-semibold">Assign Homework</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">Step {stepIndex + 1} of {STEPS.length} · {step}</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border-border">
              Draft
            </span>
          </div>
        </div>
        {/* Stepper */}
        <div className="px-4 sm:px-6 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => i < stepIndex && setStep(s)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    i === stepIndex ? 'bg-primary text-primary-foreground' :
                    i < stepIndex ? 'text-emerald-600 hover:bg-emerald-500/5 cursor-pointer' :
                    'text-muted-foreground'
                  )}
                >
                  <span className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
                    i < stepIndex ? 'bg-emerald-500 text-white' :
                    i === stepIndex ? 'bg-primary-foreground text-primary' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {i < stepIndex ? <Check className="h-2.5 w-2.5" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn('h-px w-4 sm:w-8', i < stepIndex ? 'bg-emerald-500' : 'bg-border')} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="space-y-4">
              {/* Step 1: Details */}
              {step === 'Details' && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Homework Details</h3>
                  <div className="space-y-1.5">
                    <Label>Homework Title <span className="text-destructive">*</span></Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 — Algebra Worksheet" className="text-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Select value={subjectId} onValueChange={setSubjectId}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select subject" /></SelectTrigger>
                        <SelectContent>
                          {classes.flatMap((c) => c.subjects).map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Teacher</Label>
                      <Select value={teacherId} onValueChange={setTeacherId}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}{t.department ? ` · ${t.department}` : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description shown on homework cards" className="text-sm min-h-[60px]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Topic (optional)</Label>
                      <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Linear equations" className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Chapter (optional)</Label>
                      <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Chapter 5" className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Learning Objective (optional)</Label>
                      <Input value={learningObjective} onChange={(e) => setLearningObjective(e.target.value)} placeholder="e.g. Solve 2-step equations" className="text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Class & Students */}
              {step === 'Class & Students' && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Class & Students</h3>
                  <div className="space-y-1.5">
                    <Label>Select Class</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {classes.map((c) => (
                        <label key={c.id} className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          classId === c.id ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/30'
                        )}>
                          <Checkbox
                            checked={classId === c.id}
                            onCheckedChange={() => setClassId(c.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">{c.studentCount} students · {c.subjects.length} subjects</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedClass && (
                    <div className="rounded-lg bg-muted/30 p-3 text-xs">
                      <p className="font-medium mb-1">{selectedClass.name}</p>
                      <p className="text-muted-foreground">{selectedClass.studentCount} students will be assigned this homework.</p>
                      <p className="text-muted-foreground mt-1">Empty submission rows auto-create for each student.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Content */}
              {step === 'Content' && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Homework Content</h3>
                  <div className="space-y-1.5">
                    <Label>Content / Instructions</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Full homework instructions, questions, etc. Students will see this when they open the homework."
                      className="text-sm min-h-[120px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Maximum Marks</Label>
                      <Input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} placeholder="e.g. 20" className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Grading Type</Label>
                      <Select value={gradingType} onValueChange={setGradingType}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marks">Marks</SelectItem>
                          <SelectItem value="grade">Grade</SelectItem>
                          <SelectItem value="completion">Completion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">File uploads are not yet integrated. Use the content field above for text-based homework.</p>
                </div>
              )}

              {/* Step 4: Schedule */}
              {step === 'Schedule' && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Schedule</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Assigned Date</Label>
                      <DatePicker value={assignedDate} onChange={setAssignedDate} placeholder="Assigned date" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Due Date <span className="text-destructive">*</span></Label>
                      <DatePicker value={dueDate} onChange={setDueDate} placeholder="Due date" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Due Time</Label>
                      <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Late Penalty (%)</Label>
                      <Input type="number" value={latePenalty} onChange={(e) => setLatePenalty(e.target.value)} placeholder="0" className="text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60">
                      <span className="text-xs">Allow late submissions</span>
                      <Checkbox checked={allowLateSubmission} onCheckedChange={(v) => setAllowLateSubmission(v === true)} />
                    </label>
                    <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60">
                      <span className="text-xs">Allow resubmission after return</span>
                      <Checkbox checked={allowResubmission} onCheckedChange={(v) => setAllowResubmission(v === true)} />
                    </label>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {step === 'Review' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-3">Final Review</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <ReviewField label="Title" value={title || '—'} />
                      <ReviewField label="Class" value={selectedClass?.name ?? '—'} />
                      <ReviewField label="Teacher" value={selectedTeacher?.name ?? '—'} />
                      <ReviewField label="Max Marks" value={maxMarks || '—'} />
                      <ReviewField label="Assigned" value={assignedDate || '—'} />
                      <ReviewField label="Due" value={dueDate || '—'} />
                      <ReviewField label="Due Time" value={dueTime} />
                      <ReviewField label="Grading" value={gradingType} />
                    </div>
                  </div>

                  {warnings.length > 0 ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4" /> Warnings ({warnings.length})
                      </h3>
                      <ul className="space-y-1 text-xs text-amber-700/80 dark:text-amber-300/80 list-disc list-inside">
                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Everything is ready
                      </h3>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">No issues detected. You can save as draft or publish now.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card/80 backdrop-blur sticky bottom-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={handleBack}>
            <ChevronLeft className="h-3.5 w-3.5" /> {stepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNext} disabled={!canProceed()}>
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleCreate(false)} disabled={loading}>
                Save Draft
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleCreate(true)} disabled={loading}>
                {loading ? 'Publishing…' : (<><Check className="h-3.5 w-3.5" /> Publish Homework</>)}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className="text-xs font-medium truncate">{value}</p>
    </div>
  )
}
