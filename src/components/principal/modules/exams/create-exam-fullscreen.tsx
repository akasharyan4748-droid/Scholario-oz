'use client'

/**
 * CreateExamFullScreen — smart template-first examination creator.
 *
 * Template flow: Select → Dates → Review Generated → Create
 * Custom flow: Manual form with classes, subjects, marks, schedule
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, ChevronRight, ChevronLeft, Sparkles, AlertTriangle, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateExam } from '@/lib/exams/use-exams'
import { TemplateSelection } from './tabs/template-selection'
import { type ExamTemplate } from './tabs/exam-templates'
import { generateExamConfig, validateSchedule, type GeneratedExamConfig, type ClassInfo, FIXED_PASS_PERCENTAGE } from '@/lib/exams/template-engine'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClassDTO {
  id: string; name: string; gradeLevel: string | null; section: string | null
  studentCount: number; subjects: Array<{ id: string; name: string; code: string | null; fullMarks: number; passMarks: number }>
}

interface Props {
  classes: ClassDTO[]
  academicYear: string
  onBack: () => void
  onCreated: (exam: any) => void
}

export function CreateExamFullScreen({ classes, academicYear, onBack, onCreated }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(null)
  const [mode, setMode] = useState<'template' | 'custom'>('template')

  if (mode === 'custom' || selectedTemplate?.isCustom) {
    return <CustomExamCreator classes={classes} academicYear={academicYear} onBack={() => { setMode('template'); setSelectedTemplate(null) }} onCreated={onCreated} />
  }

  return (
    <TemplateFlow
      classes={classes}
      academicYear={academicYear}
      selectedTemplate={selectedTemplate}
      onSelectTemplate={(t) => { setSelectedTemplate(t); if (t.isCustom) setMode('custom') }}
      onBack={onBack}
      onCreated={onCreated}
    />
  )
}

// ─── Template Flow (3 steps) ───────────────────────────────────────

function TemplateFlow({ classes, academicYear, selectedTemplate, onSelectTemplate, onBack, onCreated }: {
  classes: ClassDTO[]
  academicYear: string
  selectedTemplate: ExamTemplate | null
  onSelectTemplate: (t: ExamTemplate) => void
  onBack: () => void
  onCreated: (exam: any) => void
}) {
  const [step, setStep] = useState<'Template' | 'Dates' | 'Review'>('Template')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { create, loading } = useCreateExam()

  const classInfos: ClassInfo[] = useMemo(() =>
    classes.map((c) => ({ id: c.id, name: c.name, gradeLevel: c.gradeLevel, studentCount: c.studentCount,
      subjects: c.subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })) })), [classes])

  const generated = useMemo(() => {
    if (!selectedTemplate || !startDate) return null
    return generateExamConfig(selectedTemplate, startDate, endDate || startDate, classInfos)
  }, [selectedTemplate, startDate, endDate, classInfos])

  const warnings = useMemo(() => {
    if (!generated || !selectedTemplate) return []
    return validateSchedule(generated, selectedTemplate)
  }, [generated, selectedTemplate])

  // Editable schedule state
  const [editedSchedule, setEditedSchedule] = useState<GeneratedExamConfig['schedule']>([])
  useEffect(() => {
    if (generated) setEditedSchedule([...generated.schedule])
  }, [generated])

  const canProceed = () => {
    if (step === 'Template') return selectedTemplate !== null
    if (step === 'Dates') return startDate !== ''
    return true
  }

  const handleCreate = async () => {
    if (!generated) return
    try {
      const exam = await create({
        name: generated.name, type: generated.type, session: academicYear,
        startDate: generated.startDate, endDate: generated.endDate,
        passPercentage: FIXED_PASS_PERCENTAGE,
        classIds: generated.selectedClassIds,
        subjectsByClass: generated.subjectsByClass,
        schedule: editedSchedule.map((s) => ({
          classId: s.classId, subjectId: s.subjectId, date: s.date,
          startTime: s.startTime, endTime: s.endTime, room: s.room || undefined,
          invigilatorName: s.invigilatorName || undefined,
        })),
      })
      toast.success('Examination created', { description: `${exam.name} with ${generated.summary.totalPapers} papers.` })
      onCreated(exam)
    } catch (e: any) {
      toast.error('Failed to create', { description: e.message })
    }
  }

  const STEPS = ['Template', 'Dates', 'Review'] as const
  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="flex flex-col h-full -mt-4 -mx-4 sm:-mx-6">
      <Header step={step} stepIndex={stepIndex} totalSteps={3} onBack={onBack} onStepBack={() => stepIndex > 0 && setStep(STEPS[stepIndex - 1] as any)} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
              {step === 'Template' && (
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Choose Examination Type</p>
                  <TemplateSelection selectedTemplateId={selectedTemplate?.id ?? null} onSelect={onSelectTemplate} />
                </div>
              )}
              {step === 'Dates' && selectedTemplate && (
                <DatesStep template={selectedTemplate} startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} classInfos={classInfos} />
              )}
              {step === 'Review' && generated && (
                <ReviewStep generated={generated} template={selectedTemplate!} classInfos={classInfos} warnings={warnings} editedSchedule={editedSchedule} setEditedSchedule={setEditedSchedule} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Footer stepIndex={stepIndex} totalSteps={3} canProceed={canProceed()} onNext={() => stepIndex < 2 && setStep(STEPS[stepIndex + 1] as any)} onBack={() => stepIndex > 0 ? setStep(STEPS[stepIndex - 1] as any) : onBack()} onCreate={handleCreate} loading={loading} hasWarnings={warnings.length > 0} />
    </div>
  )
}

// ─── Dates Step ─────────────────────────────────────────────────────

function DatesStep({ template, startDate, endDate, setStartDate, setEndDate, classInfos }: {
  template: ExamTemplate
  startDate: string; endDate: string
  setStartDate: (v: string) => void; setEndDate: (v: string) => void
  classInfos: ClassInfo[]
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {template.icon}
        <h3 className="text-sm font-semibold">{template.label}</h3>
      </div>

      <div>
        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Choose Examination Dates</p>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1.5">
            <Label>Start Date <span className="text-destructive">*</span></Label>
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
          </div>
          <div className="space-y-1.5">
            <Label>Last Examination Date</Label>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="Last date" />
          </div>
        </div>
        {startDate && !endDate && <p className="text-[10px] text-muted-foreground mt-1">Single-day examination. Add last date for multi-day.</p>}
      </div>

      {/* Auto-config preview */}
      <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Auto-Generated Configuration</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span>Classes: <span className="text-foreground font-medium">{classInfos.length} eligible</span></span>
          <span>Subjects: <span className="text-foreground font-medium">Auto-selected</span></span>
          <span>Marks: <span className="text-foreground font-medium">{template.metadata.maxMarks} per subject</span></span>
          <span>Pass: <span className="text-foreground font-medium">{FIXED_PASS_PERCENTAGE}% (fixed)</span></span>
          <span>Schedule: <span className="text-foreground font-medium">{template.metadata.papersPerDay} papers/day</span></span>
          {template.metadata.theoryMarks && template.metadata.practicalMarks ? (
            <span>Components: <span className="text-foreground font-medium">{template.metadata.theoryMarks} + {template.metadata.practicalMarks}</span></span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── Review Step (with editable schedule) ────────────────────────────

function ReviewStep({ generated, template, classInfos, warnings, editedSchedule, setEditedSchedule }: {
  generated: GeneratedExamConfig
  template: ExamTemplate
  classInfos: ClassInfo[]
  warnings: Array<{ type: string; message: string }>
  editedSchedule: GeneratedExamConfig['schedule']
  setEditedSchedule: (s: GeneratedExamConfig['schedule']) => void
}) {
  const scheduleByDate = useMemo(() => {
    const map = new Map<string, typeof editedSchedule>()
    for (const item of editedSchedule) {
      if (!map.has(item.date)) map.set(item.date, [])
      map.get(item.date)!.push(item)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [editedSchedule])

  const updateScheduleItem = (idx: number, field: string, value: string) => {
    const updated = [...editedSchedule]
    updated[idx] = { ...updated[idx], [field]: value }
    setEditedSchedule(updated)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Check className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold">Generated Examination</span>
        </div>
        <h2 className="font-display text-base font-bold">{generated.name}</h2>
        <div className="grid grid-cols-4 gap-3 mt-3">
          <Stat label="Classes" value={generated.summary.totalClasses} />
          <Stat label="Subjects" value={generated.summary.totalSubjects} />
          <Stat label="Papers" value={generated.summary.totalPapers} />
          <Stat label="Students" value={generated.summary.totalStudents} />
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Editable Schedule */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Generated Schedule (Editable)</p>
          <span className="text-[9px] text-muted-foreground">Click to edit</span>
        </div>
        <div className="space-y-2">
          {scheduleByDate.map(([date, items]) => (
            <div key={date}>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">{formatDate(date)}</p>
              {items.map((item) => {
                const idx = editedSchedule.indexOf(item)
                const cls = classInfos.find((c) => c.id === item.classId)
                const subj = cls?.subjects.find((s) => s.id === item.subjectId)
                return (
                  <div key={`${item.classId}-${item.subjectId}-${item.date}`} className="grid grid-cols-12 gap-2 items-center p-2 rounded border border-border/40 text-[10px]">
                    <input
                      type="date" value={item.date}
                      onChange={(e) => updateScheduleItem(idx, 'date', e.target.value)}
                      className="col-span-3 h-6 text-[10px] bg-transparent border-0 outline-none"
                    />
                    <input
                      type="time" value={item.startTime}
                      onChange={(e) => updateScheduleItem(idx, 'startTime', e.target.value)}
                      className="col-span-2 h-6 text-[10px] bg-transparent border-0 outline-none"
                    />
                    <input
                      type="time" value={item.endTime}
                      onChange={(e) => updateScheduleItem(idx, 'endTime', e.target.value)}
                      className="col-span-2 h-6 text-[10px] bg-transparent border-0 outline-none"
                    />
                    <span className="col-span-3 truncate">{subj?.name ?? '—'}</span>
                    <span className="col-span-2 truncate text-muted-foreground">{cls?.name ?? '—'}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Custom Exam Creator ─────────────────────────────────────────────

function CustomExamCreator({ classes, academicYear, onBack, onCreated }: {
  classes: ClassDTO[]
  academicYear: string
  onBack: () => void
  onCreated: (exam: any) => void
}) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [room, setRoom] = useState('')
  const [invigilator, setInvigilator] = useState('')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [hasPractical, setHasPractical] = useState(false)
  const [maxMarks, setMaxMarks] = useState(100)
  const [theoryMarks, setTheoryMarks] = useState(100)
  const [practicalMarks, setPracticalMarks] = useState(0)
  const [subjects, setSubjects] = useState<Array<{ subjectId: string; name: string; maxMarks: number; theoryMarks: number; practicalMarks: number }>>([])
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)
  const { create, loading } = useCreateExam()

  const availableSubjects = useMemo(() => {
    const seen = new Map<string, string>()
    for (const cls of classes) {
      if (selectedClassIds.includes(cls.id)) {
        for (const s of cls.subjects) {
          if (!subjects.find((x) => x.subjectId === s.id)) seen.set(s.id, s.name)
        }
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [classes, selectedClassIds, subjects])

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) => prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId])
  }

  const addSubject = (subjectId: string, subjectName: string) => {
    setSubjects((prev) => [...prev, { subjectId, name: subjectName, maxMarks, theoryMarks: hasPractical ? theoryMarks : maxMarks, practicalMarks: hasPractical ? practicalMarks : 0 }])
    setShowSubjectPicker(false)
  }

  const removeSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.subjectId !== subjectId))
  }

  const updateSubject = (subjectId: string, field: string, value: number) => {
    setSubjects((prev) => prev.map((s) => s.subjectId === subjectId ? { ...s, [field]: value } : s))
  }

  const togglePractical = () => {
    const newVal = !hasPractical
    setHasPractical(newVal)
    if (newVal) {
      setTheoryMarks(70); setPracticalMarks(30)
      setSubjects((prev) => prev.map((s) => ({ ...s, theoryMarks: 70, practicalMarks: 30 })))
    } else {
      setTheoryMarks(maxMarks); setPracticalMarks(0)
      setSubjects((prev) => prev.map((s) => ({ ...s, theoryMarks: s.maxMarks, practicalMarks: 0 })))
    }
  }

  const handleCreate = async () => {
    if (!name.trim() || !startDate || selectedClassIds.length === 0 || subjects.length === 0) {
      toast.error('Please fill all required fields')
      return
    }
    try {
      const subjectsByClass: Record<string, any[]> = {}
      for (const classId of selectedClassIds) {
        subjectsByClass[classId] = subjects.map((s) => ({
          subjectId: s.subjectId, maxMarks: s.maxMarks, passMarks: Math.round(s.maxMarks * FIXED_PASS_PERCENTAGE / 100),
          theoryMarks: s.theoryMarks, practicalMarks: s.practicalMarks,
        }))
      }
      const exam = await create({
        name: name.trim(), type: 'Custom', session: academicYear,
        startDate, endDate: endDate || startDate,
        passPercentage: FIXED_PASS_PERCENTAGE,
        classIds: selectedClassIds, subjectsByClass,
        schedule: subjects.flatMap((s) => selectedClassIds.map((classId) => ({
          classId, subjectId: s.subjectId, date: startDate, startTime, endTime, room: room || undefined, invigilatorName: invigilator || undefined,
        }))),
      })
      toast.success('Examination created')
      onCreated(exam)
    } catch (e: any) {
      toast.error('Failed to create', { description: e.message })
    }
  }

  return (
    <div className="flex flex-col h-full -mt-4 -mx-4 sm:-mx-6">
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-semibold">Custom Examination</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Build your own examination</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Details */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Examination Details</p>
            <div className="space-y-1.5">
              <Label>Examination Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diagnostic Test" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date <span className="text-destructive">*</span></Label>
                <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Examination Date</Label>
                <DatePicker value={endDate} onChange={setEndDate} placeholder="Last date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Room No.</Label>
                <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Room 101" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Invigilation Teacher</Label>
                <Input value={invigilator} onChange={(e) => setInvigilator(e.target.value)} placeholder="Teacher name" className="text-sm" />
              </div>
            </div>
          </div>

          {/* Classes */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Classes</p>
            <div className="grid grid-cols-2 gap-2">
              {classes.map((cls) => (
                <label key={cls.id} className={cn('flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
                  selectedClassIds.includes(cls.id) ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/30')}>
                  <Checkbox checked={selectedClassIds.includes(cls.id)} onCheckedChange={() => toggleClass(cls.id)} />
                  <span className="text-xs font-medium">{cls.name}</span>
                  <span className="text-[9px] text-muted-foreground ml-auto">{cls.studentCount} students</span>
                </label>
              ))}
            </div>
          </div>

          {/* Assessment Components Toggle */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Assessment Components</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-foreground">Theory</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <button onClick={togglePractical} className={cn('flex items-center gap-1 text-[10px] font-medium', hasPractical ? 'text-foreground' : 'text-muted-foreground')}>
                  <span>Practical</span>
                  <span className={cn('h-1.5 w-1.5 rounded-full', hasPractical ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <div className="space-y-1">
                <Label className="text-[9px]">Maximum Marks</Label>
                <Input type="number" value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} className="h-7 text-xs" />
              </div>
              {hasPractical && (
                <>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Theory</Label>
                    <Input type="number" value={theoryMarks} onChange={(e) => setTheoryMarks(Number(e.target.value))} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Practical</Label>
                    <Input type="number" value={practicalMarks} onChange={(e) => setPracticalMarks(Number(e.target.value))} className="h-7 text-xs" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Subjects</p>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => setShowSubjectPicker(!showSubjectPicker)}>
                <Plus className="h-3 w-3" /> Add Subject
              </Button>
            </div>
            {showSubjectPicker && availableSubjects.length > 0 && (
              <div className="rounded-lg border border-border p-2 space-y-1">
                {availableSubjects.map((s) => (
                  <button key={s.id} onClick={() => addSubject(s.id, s.name)} className="w-full text-left text-xs p-1.5 rounded hover:bg-muted/40">
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            {subjects.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-2">No subjects added yet.</p>
            ) : (
              <div className="space-y-1">
                {subjects.map((s) => (
                  <div key={s.subjectId} className="grid grid-cols-12 gap-2 items-center p-2 rounded border border-border/40 text-xs">
                    <span className="col-span-4 font-medium truncate">{s.name}</span>
                    <input type="number" value={s.maxMarks} onChange={(e) => updateSubject(s.subjectId, 'maxMarks', Number(e.target.value))} className="col-span-2 h-6 text-[10px] text-center bg-transparent border-0 outline-none" title="Max" />
                    {hasPractical && <input type="number" value={s.theoryMarks} onChange={(e) => updateSubject(s.subjectId, 'theoryMarks', Number(e.target.value))} className="col-span-2 h-6 text-[10px] text-center bg-transparent border-0 outline-none" title="Theory" />}
                    {hasPractical && <input type="number" value={s.practicalMarks} onChange={(e) => updateSubject(s.subjectId, 'practicalMarks', Number(e.target.value))} className="col-span-2 h-6 text-[10px] text-center bg-transparent border-0 outline-none" title="Practical" />}
                    <button onClick={() => removeSubject(s.subjectId)} className="col-span-1 text-muted-foreground hover:text-rose-500 justify-self-end">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card/80 backdrop-blur sticky bottom-0 px-4 sm:px-6 py-3 flex justify-between">
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={onBack}>
          <ChevronLeft className="h-3.5 w-3.5" /> Cancel
        </Button>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={loading || !name.trim() || !startDate || selectedClassIds.length === 0 || subjects.length === 0}>
          {loading ? 'Creating…' : (<><Check className="h-3.5 w-3.5" /> Create Examination</>)}
        </Button>
      </div>
    </div>
  )
}

// ─── Shared components ──────────────────────────────────────────────

function Header({ step, stepIndex, totalSteps, onBack, onStepBack }: {
  step: string; stepIndex: number; totalSteps: number; onBack: () => void; onStepBack: () => void
}) {
  const STEPS = ['Template', 'Dates', 'Review']
  return (
    <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={stepIndex > 0 ? onStepBack : onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-semibold">Create Examination</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Step {stepIndex + 1} of {totalSteps} · {STEPS[stepIndex]}</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border-border">Draft</span>
      </div>
      <div className="px-4 sm:px-6 pb-3">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <button onClick={() => i < stepIndex && onStepBack()} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                i === stepIndex ? 'bg-primary text-primary-foreground' : i < stepIndex ? 'text-emerald-600 hover:bg-emerald-500/5 cursor-pointer' : 'text-muted-foreground')}>
                <span className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
                  i < stepIndex ? 'bg-emerald-500 text-white' : i === stepIndex ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground')}>
                  {i < stepIndex ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className={cn('h-px w-4 sm:w-8', i < stepIndex ? 'bg-emerald-500' : 'bg-border')} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Footer({ stepIndex, totalSteps, canProceed, onNext, onBack, onCreate, loading, hasWarnings }: {
  stepIndex: number; totalSteps: number; canProceed: boolean; onNext: () => void; onBack: () => void; onCreate: () => void; loading: boolean; hasWarnings: boolean
}) {
  return (
    <div className="border-t border-border bg-card/80 backdrop-blur sticky bottom-0 px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={onBack}>
        <ChevronLeft className="h-3.5 w-3.5" /> {stepIndex === 0 ? 'Cancel' : 'Back'}
      </Button>
      {stepIndex < totalSteps - 1 ? (
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onNext} disabled={!canProceed}>
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onCreate} disabled={loading}>
          {loading ? 'Creating…' : (<><Check className="h-3.5 w-3.5" /> Create Examination</>)}
        </Button>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/30 px-2.5 py-1.5">
      <p className="text-[9px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold tabular-nums">{value}</p>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
