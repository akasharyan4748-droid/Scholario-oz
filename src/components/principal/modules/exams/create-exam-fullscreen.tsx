'use client'

/**
 * CreateExamFullScreen — single-page examination creation form.
 *
 * NOT a multi-step wizard. One clean page:
 *   Examination Name + Type
 *   Classes + Subjects
 *   Marks (Theory/Practical toggle)
 *   Date Range + Timing
 *   Create Examination → auto-schedule → open workspace
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Plus, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateExam } from '@/lib/exams/use-exams'
import { TemplateSelection } from './tabs/template-selection'
import { type ExamTemplate } from './tabs/exam-templates'
import { getTemplateMeta, generateExamConfig, validateDateRange, FIXED_PASS_PERCENTAGE, type ClassInfo, type SubjectInfo } from '@/lib/exams/template-engine'
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
  const [name, setName] = useState('')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectInfo[]>([])
  const [hasPractical, setHasPractical] = useState(false)
  const [maxMarks, setMaxMarks] = useState(100)
  const [theoryMarks, setTheoryMarks] = useState(100)
  const [practicalMarks, setPracticalMarks] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [examTime, setExamTime] = useState('09:00')
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)
  const { create, loading } = useCreateExam()

  // Auto-apply defaults when template is selected
  const handleTemplateSelect = (t: ExamTemplate) => {
    setSelectedTemplate(t)
    setName(t.label)
    const meta = getTemplateMeta(t.id)
    setMaxMarks(meta.maxMarks)
    setTheoryMarks(meta.theoryMarks)
    setPracticalMarks(meta.practicalMarks)
    setHasPractical(meta.practicalMarks > 0)
  }

  // Available subjects from selected classes
  const availableSubjects = useMemo(() => {
    const seen = new Map<string, SubjectInfo>()
    for (const cls of classes) {
      if (selectedClassIds.includes(cls.id)) {
        for (const s of cls.subjects) {
          if (!selectedSubjects.find((x) => x.id === s.id)) {
            seen.set(s.id, { id: s.id, name: s.name, code: s.code })
          }
        }
      }
    }
    return Array.from(seen.values())
  }, [classes, selectedClassIds, selectedSubjects])

  const classInfos: ClassInfo[] = useMemo(() =>
    classes.filter((c) => selectedClassIds.includes(c.id)).map((c) => ({
      id: c.id, name: c.name, gradeLevel: c.gradeLevel, studentCount: c.studentCount,
      subjects: c.subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
    })), [classes, selectedClassIds])

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) => {
      const newIds = prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
      // Auto-populate subjects from the newly selected class set
      const selectedClasses = classes.filter((c) => newIds.includes(c.id))
      const allSubjects = new Map<string, SubjectInfo>()
      for (const cls of selectedClasses) {
        for (const s of cls.subjects) {
          allSubjects.set(s.id, { id: s.id, name: s.name, code: s.code })
        }
      }
      setSelectedSubjects(Array.from(allSubjects.values()))
      return newIds
    })
  }

  const addSubject = (s: SubjectInfo) => {
    setSelectedSubjects((prev) => [...prev, s])
    setShowSubjectPicker(false)
  }

  const removeSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s.id !== subjectId))
  }

  const togglePractical = () => {
    const newVal = !hasPractical
    setHasPractical(newVal)
    if (newVal && selectedTemplate) {
      const meta = getTemplateMeta(selectedTemplate.id)
      setTheoryMarks(meta.theoryMarks); setPracticalMarks(meta.practicalMarks)
    } else if (newVal) {
      setTheoryMarks(70); setPracticalMarks(30)
    } else {
      setTheoryMarks(maxMarks); setPracticalMarks(0)
    }
  }

  // Date validation
  const dateValidation = useMemo(() => {
    if (!selectedTemplate || !startDate || selectedSubjects.length === 0) return null
    return validateDateRange(selectedTemplate.id, startDate, endDate || startDate, selectedSubjects.length)
  }, [selectedTemplate, startDate, endDate, selectedSubjects])

  const canCreate = name.trim() && selectedTemplate && selectedClassIds.length > 0 && selectedSubjects.length > 0 && startDate && (!dateValidation || dateValidation.isValid)

  const handleCreate = async () => {
    if (!canCreate || !selectedTemplate) return
    try {
      const generated = generateExamConfig(
        selectedTemplate.id, name.trim(), startDate, endDate || startDate,
        classInfos, selectedSubjects,
      )
      // Override with user's marks config
      generated.subjects = generated.subjects.map((s) => ({
        ...s, maxMarks, theoryMarks: hasPractical ? theoryMarks : maxMarks, practicalMarks: hasPractical ? practicalMarks : 0,
      }))
      // Override exam time if not 09:00
      if (examTime !== '09:00') {
        const meta = getTemplateMeta(selectedTemplate.id)
        generated.schedule = generated.schedule.map((item) => {
          if (meta.papersPerDay === 2) {
            const isFirst = item.startTime === '09:00'
            const start = isFirst ? examTime : addTime(examTime, meta.paperDurationMin + meta.gapMin)
            const end = isFirst ? addTime(examTime, meta.paperDurationMin) : addTime(start, meta.paperDurationMin)
            return { ...item, startTime: start, endTime: end }
          }
          return { ...item, startTime: examTime, endTime: addTime(examTime, meta.paperDurationMin) }
        })
      }

      const subjectsByClass: Record<string, any[]> = {}
      for (const classId of selectedClassIds) {
        subjectsByClass[classId] = generated.subjects.map((s) => ({
          subjectId: s.subjectId, maxMarks: s.maxMarks, passMarks: Math.round(s.maxMarks * FIXED_PASS_PERCENTAGE / 100),
          theoryMarks: s.theoryMarks, practicalMarks: s.practicalMarks,
        }))
      }
      const schedule = generated.schedule.map((s) => ({
        classId: s.classIds[0], subjectId: s.subjectId, date: s.date, startTime: s.startTime, endTime: s.endTime,
        room: s.room || undefined, invigilatorName: s.invigilatorName || undefined,
      }))
      // Duplicate schedule for each class (the API expects per-class entries)
      const fullSchedule = selectedClassIds.flatMap((classId) =>
        generated.schedule.map((s) => ({
          classId, subjectId: s.subjectId, date: s.date, startTime: s.startTime, endTime: s.endTime,
          room: s.room || undefined, invigilatorName: s.invigilatorName || undefined,
        }))
      )

      const exam = await create({
        name: name.trim(), type: selectedTemplate.name, session: academicYear,
        startDate, endDate: endDate || startDate, passPercentage: FIXED_PASS_PERCENTAGE,
        classIds: selectedClassIds, subjectsByClass, schedule: fullSchedule,
      })
      toast.success('Examination created', { description: `${selectedSubjects.length} subjects scheduled across ${classInfos.length} classes.` })
      onCreated(exam)
    } catch (e: any) {
      toast.error('Failed to create', { description: e.message })
    }
  }

  return (
    <div className="flex flex-col h-full -mt-4 -mx-4 sm:-mx-6">
      {/* Compact header */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} aria-label="Back" className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold">Create Examination</h1>
        </div>
        <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold bg-muted text-muted-foreground border-border">Draft</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Examination type selection */}
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Examination Type</p>
            <TemplateSelection selectedTemplateId={selectedTemplate?.id ?? null} onSelect={handleTemplateSelect} />
          </div>

          {selectedTemplate && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Examination */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Examination</p>
                <div className="space-y-1.5">
                  <Label>Examination Name <span className="text-destructive">*</span></Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Unit Test 1" className="text-sm" />
                </div>
              </div>

              {/* Classes */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Classes</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {classes.map((cls) => (
                    <label key={cls.id} className={cn('flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors',
                      selectedClassIds.includes(cls.id) ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/30')}>
                      <Checkbox checked={selectedClassIds.includes(cls.id)} onCheckedChange={() => toggleClass(cls.id)} />
                      <span className="text-xs font-medium">{cls.name}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto">{cls.studentCount} students</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Subjects</p>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => setShowSubjectPicker(!showSubjectPicker)} disabled={selectedClassIds.length === 0}>
                    <Plus className="h-3 w-3" /> Add Subject
                  </Button>
                </div>
                {showSubjectPicker && availableSubjects.length > 0 && (
                  <div className="rounded-lg border border-border p-2 space-y-1">
                    {availableSubjects.map((s) => (
                      <button key={s.id} onClick={() => addSubject(s)} className="w-full text-left text-xs p-1.5 rounded hover:bg-muted/40">{s.name}</button>
                    ))}
                  </div>
                )}
                {selectedSubjects.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-2">{selectedClassIds.length === 0 ? 'Select classes first.' : 'No subjects selected yet.'}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubjects.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 text-xs">
                        {s.name}
                        <button onClick={() => removeSubject(s.id)} className="text-muted-foreground hover:text-rose-500"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Assessment */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Assessment</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-foreground">Theory</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <button onClick={togglePractical} className={cn('flex items-center gap-1 text-[10px] font-medium', hasPractical ? 'text-foreground' : 'text-muted-foreground')}>
                      <span>Practical</span>
                      <span className={cn('h-1.5 w-1.5 rounded-full', hasPractical ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md">
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

              {/* Schedule Window */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Schedule Window</p>
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
                <div className="space-y-1.5 max-w-xs">
                  <Label>Examination Start Time</Label>
                  <Input type="time" value={examTime} onChange={(e) => setExamTime(e.target.value)} className="text-sm" />
                </div>
                {startDate && !endDate && <p className="text-[10px] text-muted-foreground">Single-day examination. Add last date for multi-day.</p>}

                {/* Date validation warning */}
                {dateValidation && !dateValidation.isValid && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">{dateValidation.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Compact footer */}
      <div className="border-t border-border bg-card px-4 sm:px-6 py-2 flex justify-between shrink-0">
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" /> Cancel
        </Button>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={loading || !canCreate}>
          {loading ? 'Creating…' : (<><Check className="h-3.5 w-3.5" /> Create Examination</>)}
        </Button>
      </div>
    </div>
  )
}

function addTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hrs = Math.floor(total / 60)
  const mins = total % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}
