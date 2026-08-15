'use client'

/**
 * CreateExamFullScreen — full-screen 5-step examination creation wizard.
 *
 * Replaces the old modal CreateExamDialog. The Principal enters this
 * workspace from the "Create Examination" button. Steps:
 *   1. Details
 *   2. Classes & Subjects
 *   3. Schedule
 *   4. Configuration
 *   5. Review
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, ChevronRight, ChevronLeft, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { useCreateExam } from '@/lib/exams/use-exams'
import { EXAM_TYPES, type ExamDTO } from '@/lib/exams/types'
import { TemplateSelection } from './tabs/template-selection'
import { type ExamTemplate, getTemplateById } from './tabs/exam-templates'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClassDTO {
  id: string
  name: string
  gradeLevel: string | null
  section: string | null
  studentCount: number
  room?: string | null
  subjects: Array<{ id: string; name: string; code: string | null; fullMarks: number; passMarks: number }>
}

interface Props {
  classes: ClassDTO[]
  academicYear: string
  onBack: () => void
  onCreated: (exam: ExamDTO) => void
}

const STEPS = ['Details', 'Classes & Subjects', 'Schedule', 'Configuration', 'Review'] as const
type Step = typeof STEPS[number]

interface SubjectConfig {
  subjectId: string
  name: string
  maxMarks: number
  passingMarks: number
  theoryMarks: number
  practicalMarks: number
  oralMarks: number
  date: string
  startTime: string
  endTime: string
  room: string
  invigilator: string
}

export function CreateExamFullScreen({ classes, academicYear, onBack, onCreated }: Props) {
  const [step, setStep] = useState<Step>('Details')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<string>('Unit Test')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [subjectsByClass, setSubjectsByClass] = useState<Record<string, SubjectConfig[]>>({})
  const [passPercentage, setPassPercentage] = useState(33)
  const [graceLimit, setGraceLimit] = useState(5)
  const [gradingType, setGradingType] = useState('marks')
  const [allowLateSubmission, setAllowLateSubmission] = useState(true)
  const [allowResubmission, setAllowResubmission] = useState(true)
  const { create, loading } = useCreateExam()

  // Handle template selection — apply defaults
  const handleTemplateSelect = (template: ExamTemplate) => {
    setSelectedTemplateId(template.id)
    setType(template.defaults.type)
    setName(template.defaults.defaultName)
    setPassPercentage(template.defaults.passPercentage)
    setGradingType(template.defaults.gradingType)
    setAllowLateSubmission(template.defaults.allowLateSubmission)
    setAllowResubmission(template.defaults.allowResubmission)
  }

  // Auto-select subjects when a class is added
  useEffect(() => {
    for (const classId of selectedClassIds) {
      if (!subjectsByClass[classId]) {
        const cls = classes.find((c) => c.id === classId)
        if (cls) {
          setSubjectsByClass((prev) => ({
            ...prev,
            [classId]: cls.subjects.map((s) => ({
              subjectId: s.id,
              name: s.name,
              maxMarks: s.fullMarks,
              passingMarks: s.passMarks,
              theoryMarks: s.fullMarks,
              practicalMarks: 0,
              oralMarks: 0,
              date: '',
              startTime: '09:00',
              endTime: '10:00',
              room: '',
              invigilator: '',
            })),
          }))
        }
      }
    }
    setSubjectsByClass((prev) => {
      const next: Record<string, SubjectConfig[]> = {}
      for (const classId of selectedClassIds) {
        if (prev[classId]) next[classId] = prev[classId]
      }
      return next
    })
  }, [selectedClassIds, classes])

  const stepIndex = STEPS.indexOf(step)
  const canProceed = () => {
    if (step === 'Details') return selectedTemplateId !== null && name.trim() !== '' && startDate !== ''
    if (step === 'Classes & Subjects') return selectedClassIds.length > 0 && Object.values(subjectsByClass).every((s) => s.length > 0)
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

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) => prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId])
  }

  const updateSubject = (classId: string, subjectId: string, field: keyof SubjectConfig, value: string | number) => {
    setSubjectsByClass((prev) => ({
      ...prev,
      [classId]: (prev[classId] || []).map((s) => s.subjectId === subjectId ? { ...s, [field]: value } : s),
    }))
  }

  const toggleAllSubjects = (classId: string, selectAll: boolean) => {
    setSubjectsByClass((prev) => {
      const cls = classes.find((c) => c.id === classId)
      if (!cls) return prev
      if (selectAll) {
        return { ...prev, [classId]: cls.subjects.map((s) => ({
          subjectId: s.id, name: s.name, maxMarks: s.fullMarks, passingMarks: s.passMarks,
          theoryMarks: s.fullMarks, practicalMarks: 0, oralMarks: 0, date: '', startTime: '09:00',
          endTime: '10:00', room: '', invigilator: '',
        }))}
      }
      return { ...prev, [classId]: [] }
    })
  }

  const handleCreate = async () => {
    try {
      const exam = await create({
        name: name.trim(),
        type,
        session: academicYear,
        startDate,
        endDate: endDate || startDate,
        passPercentage,
        classIds: selectedClassIds,
        subjectsByClass: Object.fromEntries(
          Object.entries(subjectsByClass).map(([classId, subs]) => [
            classId,
            subs.map((s) => ({
              subjectId: s.subjectId,
              maxMarks: s.maxMarks,
              passMarks: s.passingMarks,
              theoryMarks: s.theoryMarks,
              practicalMarks: s.practicalMarks,
            })),
          ])
        ),
        schedule: Object.entries(subjectsByClass).flatMap(([classId, subs]) =>
          subs.filter((s) => s.date).map((s) => ({
            classId,
            subjectId: s.subjectId,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room || undefined,
            invigilatorName: s.invigilator || undefined,
          }))
        ),
      })
      toast.success('Examination created', { description: `"${exam.name}" has been saved.` })
      onCreated(exam)
    } catch (e: any) {
      toast.error('Failed to create examination', { description: e.message })
    }
  }

  // Compute warnings for Review step
  const warnings: string[] = []
  selectedClassIds.forEach((classId) => {
    const subs = subjectsByClass[classId] ?? []
    const noSchedule = subs.filter((s) => !s.date)
    if (noSchedule.length > 0) warnings.push(`${noSchedule.length} subjects in ${classes.find((c) => c.id === classId)?.name} have no schedule.`)
    subs.forEach((s) => {
      if (s.passingMarks > s.maxMarks) warnings.push(`${s.name}: passing marks exceed max marks.`)
      if (s.theoryMarks + s.practicalMarks + s.oralMarks !== s.maxMarks && (s.theoryMarks + s.practicalMarks + s.oralMarks) > 0) {
        // Only warn if sub-components don't sum to max
      }
    })
  })

  return (
    <div className="flex flex-col h-full -mt-4 -mx-4 sm:-mx-6">
      {/* Top header */}
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onBack}
                aria-label="Back to Examinations"
                title="Back to Examinations"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-base font-semibold">Create Examination</h1>
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
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* ── Step 1: Choose Template & Customize ── */}
              {step === 'Details' && (
                <div className="space-y-4">
                  {/* Template Selection */}
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Choose Examination Type</p>
                    <TemplateSelection
                      selectedTemplateId={selectedTemplateId}
                      onSelect={handleTemplateSelect}
                      availableGradeLevels={selectedClassIds.length > 0
                        ? selectedClassIds.map(id => classes.find(c => c.id === id)?.gradeLevel).filter(Boolean) as string[]
                        : undefined
                      }
                    />
                  </div>

                  {/* Details (only show after template selected) */}
                  {selectedTemplateId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-2">
                        {/* Name + Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Examination Name <span className="text-destructive">*</span></Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Half-Yearly Examination" className="text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Examination Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v)}>
                              <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Dates + Pass */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label>Start Date <span className="text-destructive">*</span></Label>
                            <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>End Date</Label>
                            <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Pass Percentage</Label>
                            <Input type="number" value={passPercentage} onChange={(e) => setPassPercentage(Number(e.target.value))} className="text-sm" />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <Label>Description / Instructions</Label>
                          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes visible to staff and students" className="text-sm min-h-[60px]" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Hint to select template first */}
                  {!selectedTemplateId && (
                    <p className="text-xs text-muted-foreground text-center py-2">Select an examination type above to begin.</p>
                  )}
                </div>
              )}

              {/* ── Step 2: Classes & Subjects ── */}
              {step === 'Classes & Subjects' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-3">Select Classes</h3>
                    {classes.length === 0 && (
                      <p className="text-xs text-rose-600">No classes found. Add classes in the Classes module first.</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {classes.map((cls) => (
                        <label key={cls.id} className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          selectedClassIds.includes(cls.id) ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/30'
                        )}>
                          <Checkbox
                            checked={selectedClassIds.includes(cls.id)}
                            onCheckedChange={() => toggleClass(cls.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{cls.name}</p>
                            <p className="text-[10px] text-muted-foreground">{cls.studentCount} students · {cls.subjects.length} subjects</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedClassIds.map((classId) => {
                    const cls = classes.find((c) => c.id === classId)
                    const subs = subjectsByClass[classId] || []
                    return (
                      <div key={classId} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold">{cls?.name} — Subjects & Marks</h3>
                          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => toggleAllSubjects(classId, subs.length === 0)}>
                            {subs.length === 0 ? 'Select all' : 'Deselect all'}
                          </Button>
                        </div>
                        {subs.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-3 text-center">No subjects selected. Click "Select all" or pick subjects below.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-border/60">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-b border-border">
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Subject</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Max</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Pass</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Theory</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Practical</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Oral</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subs.map((s) => (
                                  <TableRow key={s.subjectId} className="border-b border-border/40 last:border-0">
                                    <TableCell className="py-1.5 text-xs font-medium">{s.name}</TableCell>
                                    <TableCell className="py-1.5 text-center">
                                      <Input type="number" value={s.maxMarks} onChange={(e) => updateSubject(classId, s.subjectId, 'maxMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                                    </TableCell>
                                    <TableCell className="py-1.5 text-center">
                                      <Input type="number" value={s.passingMarks} onChange={(e) => updateSubject(classId, s.subjectId, 'passingMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                                    </TableCell>
                                    <TableCell className="py-1.5 text-center">
                                      <Input type="number" value={s.theoryMarks} onChange={(e) => updateSubject(classId, s.subjectId, 'theoryMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                                    </TableCell>
                                    <TableCell className="py-1.5 text-center">
                                      <Input type="number" value={s.practicalMarks} onChange={(e) => updateSubject(classId, s.subjectId, 'practicalMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                                    </TableCell>
                                    <TableCell className="py-1.5 text-center">
                                      <Input type="number" value={s.oralMarks} onChange={(e) => updateSubject(classId, s.subjectId, 'oralMarks', Number(e.target.value))} className="h-7 text-xs w-14 text-center" />
                                    </TableCell>
                                    <TableCell className="py-1.5">
                                      <button onClick={() => updateSubject(classId, s.subjectId, 'subjectId', s.subjectId)} className="text-muted-foreground hover:text-rose-500 transition-colors text-xs">
                                        ✕
                                      </button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Step 3: Schedule ── */}
              {step === 'Schedule' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-1">Examination Schedule</h3>
                    <p className="text-[10px] text-muted-foreground mb-3">Optional. Set date, time, and room per subject. Conflict detection runs on save.</p>
                    {selectedClassIds.map((classId) => {
                      const cls = classes.find((c) => c.id === classId)
                      const subs = subjectsByClass[classId] || []
                      return (
                        <div key={classId} className="mb-4 last:mb-0">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">{cls?.name}</p>
                          <div className="overflow-x-auto rounded-lg border border-border">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-b border-border">
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Subject</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Date</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Time</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Room</TableHead>
                                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Invigilator</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subs.map((s) => (
                                  <TableRow key={s.subjectId} className="border-b border-border/40 last:border-0">
                                    <TableCell className="py-1.5 text-xs font-medium">{s.name}</TableCell>
                                    <TableCell className="py-1.5">
                                      <DatePicker value={s.date} onChange={(v) => updateSubject(classId, s.subjectId, 'date', v)} compact placeholder="Date" className="w-[120px]" />
                                    </TableCell>
                                    <TableCell className="py-1.5">
                                      <div className="flex items-center gap-1">
                                        <Input type="time" value={s.startTime} onChange={(e) => updateSubject(classId, s.subjectId, 'startTime', e.target.value)} className="h-7 text-xs w-16" />
                                        <span className="text-[10px] text-muted-foreground">–</span>
                                        <Input type="time" value={s.endTime} onChange={(e) => updateSubject(classId, s.subjectId, 'endTime', e.target.value)} className="h-7 text-xs w-16" />
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-1.5">
                                      <Input value={s.room} onChange={(e) => updateSubject(classId, s.subjectId, 'room', e.target.value)} className="h-7 text-xs w-24" placeholder="Room" />
                                    </TableCell>
                                    <TableCell className="py-1.5">
                                      <Input value={s.invigilator} onChange={(e) => updateSubject(classId, s.subjectId, 'invigilator', e.target.value)} className="h-7 text-xs w-28" placeholder="Name" />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 4: Configuration ── */}
              {step === 'Configuration' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <h3 className="text-sm font-semibold mb-3">Marks & Passing</h3>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-[10px]">Pass Percentage</Label>
                          <Input type="number" value={passPercentage} onChange={(e) => setPassPercentage(Number(e.target.value))} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-[10px]">Grace Marks Limit (per subject)</Label>
                          <Input type="number" value={graceLimit} onChange={(e) => setGraceLimit(Number(e.target.value))} className="h-8 text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <h3 className="text-sm font-semibold mb-3">Result Calculation</h3>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p>• Rank calculated by percentage (highest first)</p>
                        <p>• Ties share the same rank</p>
                        <p>• Compartment: 1 subject failed</p>
                        <p>• Retest: 2 subjects failed</p>
                        <p>• Not Promoted: 3+ subjects failed</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 5: Review ── */}
              {step === 'Review' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-3">Final Review</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <ReviewField label="Name" value={name || '—'} />
                      <ReviewField label="Type" value={type} />
                      <ReviewField label="Pass %" value={`${passPercentage}%`} />
                      <ReviewField label="Start" value={startDate || '—'} />
                      <ReviewField label="End" value={endDate || '—'} />
                      <ReviewField label="Classes" value={`${selectedClassIds.length}`} />
                      <ReviewField label="Subjects" value={`${Object.values(subjectsByClass).reduce((s, subs) => s + subs.length, 0)}`} />
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3 text-xs">
                      <p className="font-medium mb-1">Classes</p>
                      <p className="text-muted-foreground">{selectedClassIds.map((id) => classes.find((c) => c.id === id)?.name).filter(Boolean).join(', ') || 'None'}</p>
                    </div>
                  </div>

                  {warnings.length > 0 && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4" /> Warnings ({warnings.length})
                      </h3>
                      <ul className="space-y-1 text-xs text-amber-700/80 dark:text-amber-300/80 list-disc list-inside">
                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {warnings.length === 0 && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Everything is ready
                      </h3>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">No conflicts detected. You can create this examination.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer — sticky bottom */}
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
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating…' : (<><Check className="h-3.5 w-3.5" /> Create Examination</>)}
            </Button>
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
