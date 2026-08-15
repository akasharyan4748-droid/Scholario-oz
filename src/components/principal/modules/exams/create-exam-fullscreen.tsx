'use client'

/**
 * CreateExamFullScreen — smart template-first examination creator.
 *
 * Flow: Select Template → Choose Dates → Review Generated Exam → Create
 * Advanced customization available via "Customize" toggle.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, ChevronRight, ChevronLeft, Sparkles, Settings, Calendar, CheckCircle2, AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useCreateExam } from '@/lib/exams/use-exams'
import { TemplateSelection } from './tabs/template-selection'
import { EXAM_TEMPLATES, type ExamTemplate } from './tabs/exam-templates'
import { generateExamConfig, getTemplateMetadata, inferSubjectDifficulty, type GeneratedExamConfig, type ClassInfo } from '@/lib/exams/template-engine'
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

const STEPS = ['Template', 'Dates', 'Review'] as const
type Step = typeof STEPS[number]

export function CreateExamFullScreen({ classes, academicYear, onBack, onCreated }: Props) {
  const [step, setStep] = useState<Step>('Template')
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showCustomize, setShowCustomize] = useState(false)
  const [customName, setCustomName] = useState('')
  const { create, loading } = useCreateExam()

  // Convert classes to engine format
  const classInfos: ClassInfo[] = useMemo(() =>
    classes.map((c) => ({
      id: c.id, name: c.name, gradeLevel: c.gradeLevel, studentCount: c.studentCount,
      subjects: c.subjects.map((s) => ({
        id: s.id, name: s.name, code: s.code,
        difficulty: inferSubjectDifficulty(s.name),
      })),
    })), [classes])

  // Generate exam config when dates are provided
  const generated = useMemo(() => {
    if (!selectedTemplate || !startDate) return null
    const name = customName || selectedTemplate.defaults.defaultName
    return generateExamConfig(
      selectedTemplate.id, name, startDate, endDate || startDate,
      classInfos,
    )
  }, [selectedTemplate, startDate, endDate, customName, classInfos])

  const stepIndex = STEPS.indexOf(step)
  const canProceed = () => {
    if (step === 'Template') return selectedTemplate !== null
    if (step === 'Dates') return startDate !== ''
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

  const handleCreate = async () => {
    if (!generated) return
    try {
      const exam = await create({
        name: generated.name,
        type: generated.type,
        session: academicYear,
        startDate: generated.startDate,
        endDate: generated.endDate,
        passPercentage: generated.passPercentage,
        classIds: generated.selectedClassIds,
        subjectsByClass: generated.subjectsByClass,
        schedule: generated.schedule.map((s) => ({
          classId: s.classId, subjectId: s.subjectId, date: s.date,
          startTime: s.startTime, endTime: s.endTime, room: s.room,
          invigilatorName: s.invigilatorName || undefined,
        })),
      })
      toast.success('Examination created', { description: `"${exam.name}" created with ${generated.marksSummary.totalPapers} papers.` })
      onCreated(exam)
    } catch (e: any) {
      toast.error('Failed to create examination', { description: e.message })
    }
  }

  return (
    <div className="flex flex-col h-full -mt-4 -mx-4 sm:-mx-6">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={onBack} aria-label="Back" title="Back to Examinations"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-base font-semibold">Create Examination</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">Step {stepIndex + 1} of {STEPS.length} · {step}</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border-border">Draft</span>
          </div>
        </div>
        {/* Stepper */}
        <div className="px-4 sm:px-6 pb-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <button onClick={() => i < stepIndex && setStep(s)}
                  className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    i === stepIndex ? 'bg-primary text-primary-foreground' :
                    i < stepIndex ? 'text-emerald-600 hover:bg-emerald-500/5 cursor-pointer' : 'text-muted-foreground')}>
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold',
                    i < stepIndex ? 'bg-emerald-500 text-white' :
                    i === stepIndex ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground')}>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
              {step === 'Template' && <TemplateStep selectedTemplate={selectedTemplate} onSelect={(t) => { setSelectedTemplate(t); setCustomName('') }} classInfos={classInfos} />}
              {step === 'Dates' && selectedTemplate && <DatesStep template={selectedTemplate} startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} customName={customName} setCustomName={setCustomName} showCustomize={showCustomize} setShowCustomize={setShowCustomize} />}
              {step === 'Review' && generated && <ReviewStep generated={generated} templateName={selectedTemplate?.label ?? ''} templateId={selectedTemplate?.id ?? ''} classInfos={classInfos} />}
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
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={loading || !generated}>
              {loading ? 'Creating…' : (<><Check className="h-3.5 w-3.5" /> Create Examination</>)}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Template Selection ──────────────────────────────────────

function TemplateStep({ selectedTemplate, onSelect, classInfos }: {
  selectedTemplate: ExamTemplate | null
  onSelect: (t: ExamTemplate) => void
  classInfos: ClassInfo[]
}) {
  const gradeLevels = classInfos.map((c) => c.gradeLevel).filter(Boolean) as string[]

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Choose Examination Type</p>
      <TemplateSelection selectedTemplateId={selectedTemplate?.id ?? null} onSelect={onSelect} availableGradeLevels={gradeLevels} />

      {selectedTemplate && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            {selectedTemplate.icon}
            <h3 className="text-sm font-semibold">{selectedTemplate.label}</h3>
            <span className="text-[10px] text-muted-foreground">{selectedTemplate.description}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {getTemplateMetadata(selectedTemplate.id).map((m) => (
              <span key={m.label} className="text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">{m.value}</span> {m.label}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Step 2: Dates ───────────────────────────────────────────────────

function DatesStep({ template, startDate, endDate, setStartDate, setEndDate, customName, setCustomName, showCustomize, setShowCustomize }: {
  template: ExamTemplate
  startDate: string; endDate: string
  setStartDate: (v: string) => void; setEndDate: (v: string) => void
  customName: string; setCustomName: (v: string) => void
  showCustomize: boolean; setShowCustomize: (v: boolean) => void
}) {
  return (
    <div className="space-y-4">
      {/* Template summary */}
      <div className="flex items-center gap-2">
        {template.icon}
        <h3 className="text-sm font-semibold">{template.label}</h3>
      </div>

      {/* Dates */}
      <div>
        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Choose Examination Dates</p>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1.5">
            <Label>Start Date <span className="text-destructive">*</span></Label>
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
          </div>
          <div className="space-y-1.5">
            <Label>End Date</Label>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" />
          </div>
        </div>
        {startDate && !endDate && (
          <p className="text-[10px] text-muted-foreground mt-1">Single-day examination. Add end date for multi-day.</p>
        )}
      </div>

      {/* Auto-generated info */}
      <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">Auto-Generated Configuration</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span>Classes: <span className="text-foreground font-medium">All eligible</span></span>
          <span>Subjects: <span className="text-foreground font-medium">Auto-selected</span></span>
          <span>Marks: <span className="text-foreground font-medium">{template.defaults.defaultMaxMarks} per subject</span></span>
          <span>Pass: <span className="text-foreground font-medium">{template.defaults.passPercentage}%</span></span>
          <span>Schedule: <span className="text-foreground font-medium">Auto-generated</span></span>
          <span>Passing: <span className="text-foreground font-medium">School default</span></span>
        </div>
      </div>

      {/* Customize toggle */}
      <button onClick={() => setShowCustomize(!showCustomize)} className="text-[10px] text-primary hover:underline flex items-center gap-1">
        <Settings className="h-3 w-3" /> {showCustomize ? 'Hide customization' : 'Customize examination name'}
      </button>

      {showCustomize && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
          <div className="space-y-1.5 max-w-md">
            <Label>Examination Name (optional)</Label>
            <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={template.defaults.defaultName} className="text-sm" />
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Step 3: Review Generated Exam ───────────────────────────────────

function ReviewStep({ generated, templateName, templateId, classInfos }: {
  generated: GeneratedExamConfig
  templateName: string
  templateId: string
  classInfos: ClassInfo[]
}) {
  // Group schedule by date
  const scheduleByDate = useMemo(() => {
    const map = new Map<string, typeof generated.schedule>()
    for (const item of generated.schedule) {
      if (!map.has(item.date)) map.set(item.date, [])
      map.get(item.date)!.push(item)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [generated.schedule])

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold">Generated Examination</span>
        </div>
        <h2 className="font-display text-base font-bold tracking-tight">{generated.name}</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">{templateName} · {formatDate(generated.startDate)}{generated.endDate !== generated.startDate ? ` — ${formatDate(generated.endDate)}` : ''}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mt-3">
          <ReviewStat label="Classes" value={generated.selectedClassIds.length} />
          <ReviewStat label="Subjects" value={Object.values(generated.subjectsByClass).reduce((s, subs) => s + subs.length, 0)} />
          <ReviewStat label="Papers" value={generated.marksSummary.totalPapers} />
          <ReviewStat label="Students" value={generated.marksSummary.totalStudents} />
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Configuration Status</p>
        <div className="space-y-1">
          {[
            { label: 'Classes assigned', done: generated.selectedClassIds.length > 0 },
            { label: 'Subjects assigned', done: Object.values(generated.subjectsByClass).every((s) => s.length > 0) },
            { label: 'Marks configured', done: true },
            { label: 'Schedule generated', done: generated.schedule.length > 0 },
            { label: 'Passing rules applied', done: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              {item.done ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
              <span className={item.done ? 'text-foreground' : 'text-amber-600'}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Schedule Preview */}
      {scheduleByDate.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Generated Schedule</p>
          <div className="space-y-2">
            {scheduleByDate.map(([date, items]) => (
              <div key={date}>
                <p className="text-[10px] font-bold text-muted-foreground mb-1">{formatDate(date)}</p>
                <div className="space-y-1">
                  {items.map((item, i) => {
                    const cls = classInfos.find((c) => c.id === item.classId)
                    const subj = cls?.subjects.find((s) => s.id === item.subjectId)
                    return (
                      <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 rounded border border-border/40">
                        <span className="font-mono tabular-nums text-muted-foreground">{item.startTime}</span>
                        <span className="font-medium">{subj?.name ?? '—'}</span>
                        <span className="text-muted-foreground">{cls?.name ?? '—'}</span>
                        {item.room && <span className="text-muted-foreground">· {item.room}</span>}
                        <span className={cn('ml-auto text-[9px] font-semibold', item.shift === 'morning' ? 'text-amber-600' : 'text-sky-600')}>
                          {item.shift}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewStat({ label, value }: { label: string; value: number }) {
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
