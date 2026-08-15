'use client'

/**
 * CreateExamFullScreen — single-page examination creation form.
 *
 * One clean page:
 *   Examination Type (template) + Name
 *   Classes (multi-select)
 *   Subjects (only those common to ALL selected classes — prevents
 *     the "subject not found for class X" validation error)
 *   Marks (Theory/Practical toggle)
 *   Schedule Window (start/end dates + exam time)
 *   Create → auto-schedule → open workspace
 *
 * Bug fixes vs previous version:
 *   • Multi-class subjects: was union (broke when classes had different subject sets);
 *     now uses intersection — only subjects common to all selected classes are
 *     auto-populated, with manual "Add Subject" still available from any class.
 *   • Subject picker UX: previously rendered picker + "No subjects selected" empty
 *     state simultaneously. Now mutually exclusive.
 *   • Header/footer: removed -mt-4 / -mx-4 negative-margin hack that caused overlap.
 *     Container uses a clean flex column without negative margins.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Plus, X, AlertTriangle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateExam } from '@/lib/exams/use-exams'
import { TemplateSelection } from './tabs/template-selection'
import { type ExamTemplate } from './tabs/exam-templates'
import {
  getTemplateMeta,
  generateExamConfig,
  validateDateRange,
  FIXED_PASS_PERCENTAGE,
  type ClassInfo,
  type SubjectInfo,
} from '@/lib/exams/template-engine'
import { suggestSubjectsForClass } from '@/lib/exams/curriculum'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface ClassDTO {
  id: string
  name: string
  gradeLevel: string | null
  section: string | null
  stream: string | null
  studentCount: number
  subjects: Array<{ id: string; name: string; code: string | null; fullMarks: number; passMarks: number }>
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

  // Available subjects = subjects from any selected class that aren't already selected.
  // This is the UNION (for the manual picker) — the principal can add subjects
  // even if they're not common to every class. The create call then validates
  // per-class. If a subject doesn't exist for a class, that class simply doesn't
  // get marks entered for it (handled in createExam service).
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

  // When classes change, auto-populate subjects from the INTERSECTION of selected classes.
  // This prevents the multi-class picker bug where union included subjects that
  // don't exist for some classes, breaking createExam validation.
  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) => {
      const newIds = prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
      const selectedClasses = classes.filter((c) => newIds.includes(c.id))
      if (selectedClasses.length === 0) {
        setSelectedSubjects([])
        return newIds
      }
      // Find subjects common to ALL selected classes (intersection by id).
      const subjectCounts = new Map<string, { info: SubjectInfo; count: number }>()
      for (const cls of selectedClasses) {
        for (const s of cls.subjects) {
          const existing = subjectCounts.get(s.id)
          if (existing) existing.count++
          else subjectCounts.set(s.id, { info: { id: s.id, name: s.name, code: s.code }, count: 1 })
        }
      }
      // Only keep subjects that appear in EVERY selected class
      const intersection = Array.from(subjectCounts.values())
        .filter((s) => s.count === selectedClasses.length)
        .map((s) => s.info)
      // Preserve previously-removed manual selections: if user removed a subject
      // earlier, don't re-add it.
      setSelectedSubjects((prevSelected) => {
        const prevRemoved = prevSelected.length === 0 ? new Set<string>() : null
        // Simpler: just use intersection, ignoring previous removals.
        // The user can re-remove via the × button if needed.
        return intersection
      })
      return newIds
    })
  }

  const addSubject = (s: SubjectInfo) => {
    setSelectedSubjects((prev) => prev.find((x) => x.id === s.id) ? prev : [...prev, s])
    setShowSubjectPicker(false)
  }

  const removeSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s.id !== subjectId))
  }

  // Suggest subjects based on the first selected class's grade level + stream
  const handleSuggestSubjects = () => {
    if (selectedClassIds.length === 0) {
      toast.error('Select at least one class first')
      return
    }
    const firstClass = classes.find((c) => c.id === selectedClassIds[0])
    if (!firstClass) return
    const suggestions = suggestSubjectsForClass(firstClass.gradeLevel, firstClass.stream)
    // Match suggestions to actual subjects in the selected classes (by name)
    const allClassSubjects = classes
      .filter((c) => selectedClassIds.includes(c.id))
      .flatMap((c) => c.subjects)
    const matched: SubjectInfo[] = []
    for (const preset of suggestions) {
      const found = allClassSubjects.find((s) => s.name === preset.name || s.code === preset.code)
      if (found && !matched.find((m) => m.id === found.id)) {
        matched.push({ id: found.id, name: found.name, code: found.code })
      }
    }
    if (matched.length === 0) {
      toast.info('No matching subjects found in selected classes', {
        description: 'Add subjects to your classes from the Students & Classes module first.',
      })
      return
    }
    setSelectedSubjects(matched)
    toast.success(`Suggested ${matched.length} subjects`, {
      description: `Based on ${firstClass.gradeLevel ?? 'class'}${firstClass.stream && firstClass.stream !== 'General' ? ` • ${firstClass.stream}` : ''}`,
    })
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
        ...s,
        maxMarks,
        theoryMarks: hasPractical ? theoryMarks : maxMarks,
        practicalMarks: hasPractical ? practicalMarks : 0,
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

      // For each class, filter subjects to only those that exist in that class.
      // This prevents the "subject not found for class X" validation error when
      // subjects were manually added from one class but not another.
      const subjectsByClass: Record<string, any[]> = {}
      for (const classId of selectedClassIds) {
        const cls = classes.find((c) => c.id === classId)
        if (!cls) continue
        const classSubjectIds = new Set(cls.subjects.map((s) => s.id))
        subjectsByClass[classId] = generated.subjects
          .filter((s) => classSubjectIds.has(s.subjectId))
          .map((s) => ({
            subjectId: s.subjectId,
            maxMarks: s.maxMarks,
            passMarks: Math.round(s.maxMarks * FIXED_PASS_PERCENTAGE / 100),
            theoryMarks: s.theoryMarks,
            practicalMarks: s.practicalMarks,
          }))
      }

      // Duplicate schedule for each class — only for subjects that exist in that class.
      const fullSchedule = selectedClassIds.flatMap((classId) => {
        const cls = classes.find((c) => c.id === classId)
        if (!cls) return []
        const classSubjectIds = new Set(cls.subjects.map((s) => s.id))
        return generated.schedule
          .filter((s) => classSubjectIds.has(s.subjectId))
          .map((s) => ({
            classId,
            subjectId: s.subjectId,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room || undefined,
            invigilatorName: s.invigilatorName || undefined,
          }))
      })

      const exam = await create({
        name: name.trim(),
        type: selectedTemplate.name,
        session: academicYear,
        startDate,
        endDate: endDate || startDate,
        passPercentage: FIXED_PASS_PERCENTAGE,
        classIds: selectedClassIds,
        subjectsByClass,
        schedule: fullSchedule,
      })
      toast.success('Examination created', {
        description: `${selectedSubjects.length} subjects scheduled across ${classInfos.length} classes.`,
      })
      onCreated(exam)
    } catch (e: any) {
      toast.error('Failed to create', { description: e.message })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact header */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold">Create Examination</h1>
        </div>
        <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold bg-muted text-muted-foreground border-border">
          Draft
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Examination type selection */}
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">
              Examination Type
            </p>
            <TemplateSelection selectedTemplateId={selectedTemplate?.id ?? null} onSelect={handleTemplateSelect} />
          </div>

          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Examination name */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Examination
                </p>
                <div className="space-y-1.5">
                  <Label>
                    Examination Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Unit Test 1"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Classes */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Classes
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {classes.map((cls) => (
                    <label
                      key={cls.id}
                      className={cn(
                        'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors',
                        selectedClassIds.includes(cls.id)
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border hover:bg-muted/30',
                      )}
                    >
                      <Checkbox
                        checked={selectedClassIds.includes(cls.id)}
                        onCheckedChange={() => toggleClass(cls.id)}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-medium truncate">{cls.name}</span>
                        {(cls.stream || cls.section) && (
                          <span className="text-[9px] text-muted-foreground truncate">
                            {cls.stream && cls.stream !== 'General' ? cls.stream : cls.section ?? ''}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
                        {cls.studentCount}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Subjects
                  </p>
                  <div className="flex items-center gap-1.5">
                    {selectedClassIds.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] gap-1"
                        onClick={handleSuggestSubjects}
                      >
                        <Sparkles className="h-3 w-3" /> Suggest
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] gap-1"
                      onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                      disabled={selectedClassIds.length === 0 || availableSubjects.length === 0}
                    >
                      <Plus className="h-3 w-3" /> Add Subject
                    </Button>
                  </div>
                </div>

                {/* Subject picker dropdown (only shown when picker is open AND there are available subjects) */}
                {showSubjectPicker && availableSubjects.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-lg border border-border p-2 space-y-1 max-h-44 overflow-y-auto"
                  >
                    {availableSubjects.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addSubject(s)}
                        className="w-full text-left text-xs p-1.5 rounded hover:bg-muted/40 transition-colors"
                      >
                        {s.name}
                        {s.code && (
                          <span className="text-[9px] text-muted-foreground ml-2">{s.code}</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Empty state OR chips list — NEVER both at once */}
                {selectedSubjects.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-2">
                    {selectedClassIds.length === 0
                      ? 'Select classes first.'
                      : availableSubjects.length === 0
                        ? 'All subjects from selected classes are already added.'
                        : 'No subjects selected yet. Click "Add Subject" or "Suggest" to begin.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubjects.map((s) => (
                      <motion.span
                        key={s.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 text-xs"
                      >
                        {s.name}
                        <button
                          onClick={() => removeSubject(s.id)}
                          className="text-muted-foreground hover:text-rose-500 transition-colors"
                          aria-label={`Remove ${s.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}

                {/* Helper note for multi-class selection */}
                {selectedClassIds.length > 1 && selectedSubjects.length > 0 && (
                  <p className="text-[9px] text-muted-foreground italic">
                    Auto-populated with subjects common to all selected classes.
                    Manually add others if a subject exists in only some classes.
                  </p>
                )}
              </div>

              {/* Assessment */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Assessment
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-foreground">Theory</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <button
                      onClick={togglePractical}
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-medium',
                        hasPractical ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <span>Practical</span>
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          hasPractical ? 'bg-emerald-500' : 'bg-muted-foreground/30',
                        )}
                      />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md">
                  <div className="space-y-1">
                    <Label className="text-[9px]">Maximum Marks</Label>
                    <Input
                      type="number"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  {hasPractical && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[9px]">Theory</Label>
                        <Input
                          type="number"
                          value={theoryMarks}
                          onChange={(e) => setTheoryMarks(Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px]">Practical</Label>
                        <Input
                          type="number"
                          value={practicalMarks}
                          onChange={(e) => setPracticalMarks(Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                      </div>
                      {theoryMarks + practicalMarks !== maxMarks && (
                        <p className="col-span-full text-[9px] text-amber-600 dark:text-amber-400">
                          ⚠ Theory + Practical ({theoryMarks + practicalMarks}) ≠ Maximum Marks ({maxMarks})
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Schedule Window */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Schedule Window
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div className="space-y-1.5">
                    <Label>
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last Examination Date</Label>
                    <DatePicker value={endDate} onChange={setEndDate} placeholder="Last date" />
                  </div>
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <Label>Examination Start Time</Label>
                  <Input
                    type="time"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    className="text-sm"
                  />
                </div>
                {startDate && !endDate && (
                  <p className="text-[10px] text-muted-foreground">
                    Single-day examination. Add last date for multi-day.
                  </p>
                )}

                {/* Date validation warning */}
                {dateValidation && !dateValidation.isValid && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                        {dateValidation.message}
                      </p>
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
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleCreate}
          disabled={loading || !canCreate}
        >
          {loading ? 'Creating…' : (
            <>
              <Check className="h-3.5 w-3.5" /> Create Examination
            </>
          )}
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
