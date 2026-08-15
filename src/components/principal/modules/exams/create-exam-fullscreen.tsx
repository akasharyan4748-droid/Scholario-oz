'use client'

/**
 * CreateExamFullScreen — single-page examination creation form.
 *
 * NOT a wizard. One well-organized page with logical sections:
 *   1. Examination Type (compact pills + small Custom)
 *   2. Examination Name (auto-filled from template)
 *   3. Classes (multi-select; senior classes are stream-aware)
 *   4. Subjects (smart deduplication by NAME — appears ONCE even when
 *      multiple classes share the subject; grouped by academic structure)
 *   5. Assessment (max marks + theory/practical — practical only when
 *      applicable; no passing marks field — 33% is global)
 *   6. Examination Window (start/end date — past dates blocked — start time)
 *   7. Generated Schedule (auto-preview, editable later)
 *
 * Subject deduplication: when Grade 9-A and Grade 10-A both have
 * "Mathematics", the subject appears ONCE in the picker, and is associated
 * with both classes at create time. This fixes the duplicate-subject bug.
 *
 * Stream-aware: when Grade 11 or 12 classes are selected, their stream
 * (Science-PCM, Science-PCB, Commerce, Humanities) groups subjects so the
 * principal sees structured selections, not a flat list.
 *
 * Validation: date range must fit required working days (Sundays skipped).
 * Past dates are blocked.
 */

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Plus, X, AlertTriangle, Calendar, Clock } from 'lucide-react'
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
  type GeneratedScheduleItem,
} from '@/lib/exams/template-engine'
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

// Grouped subject — keyed by name (so duplicates across classes collapse to one)
interface GroupedSubject extends SubjectInfo {
  // Which classes (from those selected) actually offer this subject
  availableInClassIds: string[]
  availableInClassNames: string[]
}

interface SubjectGroup {
  // Academic structure label, e.g. "Classes 9-10", "Science — PCM", "Commerce"
  label: string
  // Stream key, if applicable
  stream: string | null
  subjects: GroupedSubject[]
}

export function CreateExamFullScreen({ classes, academicYear, onBack, onCreated }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(null)
  const [name, setName] = useState('')
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set())
  const [hasPractical, setHasPractical] = useState(false)
  const [maxMarks, setMaxMarks] = useState(100)
  const [theoryMarks, setTheoryMarks] = useState(100)
  const [practicalMarks, setPracticalMarks] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [examTime, setExamTime] = useState('09:00')
  const { create, loading } = useCreateExam()

  // Today's date in YYYY-MM-DD (used to block past dates)
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }, [])

  // When template is selected, auto-populate name + assessment defaults
  const handleTemplateSelect = useCallback((t: ExamTemplate) => {
    setSelectedTemplate(t)
    // Auto-fill name from template label (principal can edit)
    setName(t.label)
    // Auto-apply assessment defaults
    const meta = getTemplateMeta(t.id)
    setMaxMarks(meta.maxMarks)
    setTheoryMarks(meta.theoryMarks)
    setPracticalMarks(meta.practicalMarks)
    setHasPractical(meta.hasPractical)
  }, [])

  // ─── Class selection ────────────────────────────────────────────────
  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId],
    )
  }

  // Selected classes (full objects)
  const selectedClasses = useMemo(
    () => classes.filter((c) => selectedClassIds.includes(c.id)),
    [classes, selectedClassIds],
  )

  // ─── Smart subject grouping ──────────────────────────────────────────
  // Group selected classes into:
  //   • Classes 6-10 (general stream) — common subjects
  //   • Senior stream groups (Science-PCM, Science-PCB, Commerce, Humanities)
  // Each group shows subjects DEDUPLICATED BY NAME — so selecting Grade 9-A
  // and Grade 10-A produces ONE "Mathematics" entry, not two.
  const subjectGroups = useMemo<SubjectGroup[]>(() => {
    if (selectedClasses.length === 0) return []

    // Bucket classes by academic structure
    const juniorBuckets = new Map<string, ClassDTO[]>() // "6-8", "9-10"
    const seniorBuckets = new Map<string, ClassDTO[]>() // stream key

    for (const c of selectedClasses) {
      const grade = parseInt(c.gradeLevel ?? '0', 10)
      if (grade >= 11) {
        const stream = c.stream ?? 'General'
        if (!seniorBuckets.has(stream)) seniorBuckets.set(stream, [])
        seniorBuckets.get(stream)!.push(c)
      } else if (grade >= 9) {
        const key = '9-10'
        if (!juniorBuckets.has(key)) juniorBuckets.set(key, [])
        juniorBuckets.get(key)!.push(c)
      } else if (grade >= 6) {
        const key = '6-8'
        if (!juniorBuckets.has(key)) juniorBuckets.set(key, [])
        juniorBuckets.get(key)!.push(c)
      }
    }

    const groups: SubjectGroup[] = []

    // Junior groups — common subjects (deduped by name)
    for (const [key, bucketClasses] of juniorBuckets) {
      const subjectsByName = new Map<string, GroupedSubject>()
      for (const c of bucketClasses) {
        for (const s of c.subjects) {
          const existing = subjectsByName.get(s.name)
          if (existing) {
            if (!existing.availableInClassIds.includes(c.id)) {
              existing.availableInClassIds.push(c.id)
              existing.availableInClassNames.push(c.name)
            }
          } else {
            subjectsByName.set(s.name, {
              id: s.id, // first class's subject id — used as the canonical id
              name: s.name,
              code: s.code,
              availableInClassIds: [c.id],
              availableInClassNames: [c.name],
            })
          }
        }
      }
      const label = key === '9-10' ? 'Classes 9–10 (Secondary)' : 'Classes 6–8 (Middle School)'
      groups.push({
        label,
        stream: null,
        subjects: Array.from(subjectsByName.values()).sort((a, b) => a.name.localeCompare(b.name)),
      })
    }

    // Senior groups — by stream
    const STREAM_LABELS: Record<string, string> = {
      'Science-PCM': 'Science — PCM',
      'Science-PCB': 'Science — PCB',
      'Science-PCMB': 'Science — PCMB',
      'Commerce': 'Commerce',
      'Humanities': 'Humanities / Arts',
    }
    for (const [stream, bucketClasses] of seniorBuckets) {
      const subjectsByName = new Map<string, GroupedSubject>()
      for (const c of bucketClasses) {
        for (const s of c.subjects) {
          const existing = subjectsByName.get(s.name)
          if (existing) {
            if (!existing.availableInClassIds.includes(c.id)) {
              existing.availableInClassIds.push(c.id)
              existing.availableInClassNames.push(c.name)
            }
          } else {
            subjectsByName.set(s.name, {
              id: s.id,
              name: s.name,
              code: s.code,
              availableInClassIds: [c.id],
              availableInClassNames: [c.name],
            })
          }
        }
      }
      const label = STREAM_LABELS[stream] ?? stream
      groups.push({
        label,
        stream,
        subjects: Array.from(subjectsByName.values()).sort((a, b) => a.name.localeCompare(b.name)),
      })
    }

    return groups
  }, [selectedClasses])

  // All deduped subjects available across selected classes (flat list)
  const allAvailableSubjects = useMemo(() => {
    return subjectGroups.flatMap((g) => g.subjects)
  }, [subjectGroups])

  // Auto-suggest subjects when classes change (only if user hasn't manually
  // deselected anything). For simplicity: when classIds change, reset to all
  // available subjects.
  const handleClassToggle = (classId: string) => {
    const newSelectedClassIds = selectedClassIds.includes(classId)
      ? selectedClassIds.filter((c) => c !== classId)
      : [...selectedClassIds, classId]
    setSelectedClassIds(newSelectedClassIds)
    // Recompute available subjects and auto-select all (suggestion)
    const newSelectedClasses = classes.filter((c) => newSelectedClassIds.includes(c.id))
    const suggested = new Set<string>()
    const seen = new Map<string, string>() // name → first subjectId
    for (const c of newSelectedClasses) {
      for (const s of c.subjects) {
        if (!seen.has(s.name)) {
          seen.set(s.name, s.id)
          suggested.add(s.id)
        }
      }
    }
    setSelectedSubjectIds(suggested)
  }

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev)
      if (next.has(subjectId)) next.delete(subjectId)
      else next.add(subjectId)
      return next
    })
  }

  // Selected subject objects (full info)
  const selectedSubjects = useMemo(
    () => allAvailableSubjects.filter((s) => selectedSubjectIds.has(s.id)),
    [allAvailableSubjects, selectedSubjectIds],
  )

  // ─── Assessment toggling ─────────────────────────────────────────────
  const togglePractical = () => {
    const newVal = !hasPractical
    setHasPractical(newVal)
    if (newVal && selectedTemplate) {
      const meta = getTemplateMeta(selectedTemplate.id)
      setTheoryMarks(meta.theoryMarks)
      setPracticalMarks(meta.practicalMarks)
    } else if (newVal) {
      setTheoryMarks(70)
      setPracticalMarks(30)
    } else {
      setTheoryMarks(maxMarks)
      setPracticalMarks(0)
    }
  }

  // ─── Date range validation ───────────────────────────────────────────
  const dateValidation = useMemo(() => {
    if (!selectedTemplate || !startDate || selectedSubjects.length === 0) return null
    return validateDateRange(
      selectedTemplate.id,
      startDate,
      endDate || startDate,
      selectedSubjects.length,
    )
  }, [selectedTemplate, startDate, endDate, selectedSubjects.length])

  // ─── Generated schedule preview ──────────────────────────────────────
  const generatedSchedule = useMemo<GeneratedScheduleItem[]>(() => {
    if (!selectedTemplate || !startDate || selectedSubjects.length === 0 || (dateValidation && !dateValidation.isValid)) {
      return []
    }
    const classInfos: ClassInfo[] = selectedClasses.map((c) => ({
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      stream: c.stream,
      studentCount: c.studentCount,
      subjects: c.subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
    }))
    const config = generateExamConfig(
      selectedTemplate.id,
      name.trim() || selectedTemplate.label,
      startDate,
      endDate || startDate,
      classInfos,
      selectedSubjects,
      examTime,
    )
    return config.schedule
  }, [selectedTemplate, startDate, endDate, selectedClasses, selectedSubjects, name, examTime, dateValidation])

  // ─── Can create? ─────────────────────────────────────────────────────
  const canCreate =
    name.trim().length > 0 &&
    selectedTemplate !== null &&
    selectedClassIds.length > 0 &&
    selectedSubjects.length > 0 &&
    startDate.length > 0 &&
    (!dateValidation || dateValidation.isValid)

  // ─── Handle create ───────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!canCreate || !selectedTemplate) return
    try {
      const classInfos: ClassInfo[] = selectedClasses.map((c) => ({
        id: c.id,
        name: c.name,
        gradeLevel: c.gradeLevel,
        stream: c.stream,
        studentCount: c.studentCount,
        subjects: c.subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
      }))

      const generated = generateExamConfig(
        selectedTemplate.id,
        name.trim(),
        startDate,
        endDate || startDate,
        classInfos,
        selectedSubjects,
        examTime,
      )

      // Override marks config from user input
      generated.subjects = generated.subjects.map((s) => ({
        ...s,
        maxMarks,
        theoryMarks: hasPractical ? theoryMarks : maxMarks,
        practicalMarks: hasPractical ? practicalMarks : 0,
      }))

      // Build subjectsByClass — for each selected class, filter to only
      // subjects that exist in that class (by name, since IDs differ per class).
      // This is the fix for the multi-class duplicate-subject bug.
      const subjectsByClass: Record<string, Array<{ subjectId: string; maxMarks: number; theoryMarks: number; practicalMarks: number }>> = {}
      for (const classId of selectedClassIds) {
        const cls = classes.find((c) => c.id === classId)
        if (!cls) continue
        const classSubjectNames = new Set(cls.subjects.map((s) => s.name))
        // For each selected subject (canonical id from first class that had it),
        // find the matching subject in THIS class by name
        subjectsByClass[classId] = selectedSubjects
          .filter((sel) => classSubjectNames.has(sel.name))
          .map((sel) => {
            const classSubj = cls.subjects.find((s) => s.name === sel.name)!
            return {
              subjectId: classSubj.id,
              maxMarks,
              theoryMarks: hasPractical ? theoryMarks : maxMarks,
              practicalMarks: hasPractical ? practicalMarks : 0,
            }
          })
      }

      // Build schedule — one slot per selected subject, shared across all
      // selected classes. Use the canonical subjectId from selectedSubjects.
      // The service will validate that each subjectId exists for each class
      // — we filter per-class to avoid validation errors.
      const fullSchedule = selectedClassIds.flatMap((classId) => {
        const cls = classes.find((c) => c.id === classId)
        if (!cls) return []
        const classSubjectNames = new Set(cls.subjects.map((s) => s.name))
        return generated.schedule
          .filter((s) => classSubjectNames.has(s.subjectName))
          .map((s) => {
            // Find THIS class's subjectId for this subject name
            const classSubj = cls.subjects.find((cs) => cs.name === s.subjectName)!
            return {
              classId,
              subjectId: classSubj.id,
              date: s.date,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room || undefined,
              invigilatorName: s.invigilatorName || undefined,
            }
          })
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

      toast.success('Examination created as Draft', {
        description: `${selectedSubjects.length} subjects scheduled across ${selectedClassIds.length} classes. Review and publish when ready.`,
      })
      onCreated(exam)
    } catch (e: any) {
      toast.error('Failed to create examination', { description: e.message })
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Compact header */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
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
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border-border">
          Draft · {academicYear}
        </span>
      </div>

      {/* Scrollable form area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* ─── 1. Examination Type ─────────────────────────────────── */}
          <Section label="Examination Type" required>
            <TemplateSelection selectedTemplateId={selectedTemplate?.id ?? null} onSelect={handleTemplateSelect} />
          </Section>

          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* ─── 2. Examination Name ──────────────────────────────── */}
              <Section label="Examination Name" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Unit Test 1"
                  className="h-9 text-sm max-w-md"
                />
              </Section>

              {/* ─── 3. Classes ──────────────────────────────────────── */}
              <Section label="Classes" required hint="Senior classes (11-12) are stream-aware.">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {classes.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id)
                    return (
                      <label
                        key={cls.id}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors',
                          isSelected ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/30',
                        )}
                      >
                        <Checkbox checked={isSelected} onCheckedChange={() => handleClassToggle(cls.id)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{cls.name}</p>
                          {cls.stream && (
                            <p className="text-[9px] text-muted-foreground truncate">{cls.stream}</p>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground ml-auto shrink-0 tabular-nums">
                          {cls.studentCount}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </Section>

              {/* ─── 4. Subjects (grouped + deduped) ─────────────────── */}
              {subjectGroups.length > 0 && (
                <Section
                  label="Subjects"
                  required
                  hint="Subjects appear once even when shared across classes."
                >
                  <div className="space-y-3">
                    {subjectGroups.map((group) => (
                      <div key={group.label}>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.subjects.map((subj) => {
                            const isSelected = selectedSubjectIds.has(subj.id)
                            return (
                              <button
                                key={subj.id}
                                onClick={() => toggleSubject(subj.id)}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-all',
                                  isSelected
                                    ? 'border-primary/40 bg-primary/10 text-foreground'
                                    : 'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted/30',
                                )}
                                title={`Available in: ${subj.availableInClassNames.join(', ')}`}
                              >
                                <span
                                  className={cn(
                                    'flex h-3.5 w-3.5 items-center justify-center rounded-full border shrink-0',
                                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                                  )}
                                >
                                  {isSelected && <Check className="h-2.5 w-2.5" />}
                                </span>
                                {subj.name}
                                {subj.availableInClassIds.length > 1 && (
                                  <span className="text-[9px] text-muted-foreground ml-1">
                                    ×{subj.availableInClassIds.length}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* ─── 5. Assessment ──────────────────────────────────── */}
              {selectedSubjects.length > 0 && (
                <Section
                  label="Assessment"
                  hint={hasPractical ? 'Theory + Practical' : 'Theory only · 33% pass (global)'}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={togglePractical}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors',
                        hasPractical
                          ? 'border-primary/40 bg-primary/10 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/30',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-3 w-3 items-center justify-center rounded-full border',
                          hasPractical ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                        )}
                      >
                        {hasPractical && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                      </span>
                      Include Practical
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md">
                    <Field label="Maximum Marks">
                      <Input
                        type="number"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </Field>
                    <Field label="Theory">
                      <Input
                        type="number"
                        value={theoryMarks}
                        onChange={(e) => setTheoryMarks(Number(e.target.value))}
                        className="h-8 text-xs"
                        disabled={!hasPractical}
                      />
                    </Field>
                    {hasPractical && (
                      <Field label="Practical">
                        <Input
                          type="number"
                          value={practicalMarks}
                          onChange={(e) => setPracticalMarks(Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </Field>
                    )}
                  </div>
                  {hasPractical && theoryMarks + practicalMarks !== maxMarks && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
                      ⚠ Theory ({theoryMarks}) + Practical ({practicalMarks}) = {theoryMarks + practicalMarks}, not {maxMarks}
                    </p>
                  )}
                </Section>
              )}

              {/* ─── 6. Examination Window ──────────────────────────── */}
              {selectedSubjects.length > 0 && (
                <Section label="Examination Window" required>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <Field label="Start Date">
                      <DatePicker
                        value={startDate}
                        onChange={setStartDate}
                        placeholder="Start date"
                        minDate={today}
                      />
                    </Field>
                    <Field label="Last Examination Date">
                      <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        placeholder="Last date"
                        minDate={startDate || today}
                      />
                    </Field>
                  </div>
                  <div className="flex items-center gap-3 mt-3 max-w-md">
                    <Field label="Examination Start Time">
                      <Input
                        type="time"
                        value={examTime}
                        onChange={(e) => setExamTime(e.target.value)}
                        className="h-8 text-xs w-32"
                      />
                    </Field>
                    <p className="text-[10px] text-muted-foreground mt-4">
                      {selectedTemplate.id.startsWith('unit-test')
                        ? 'Unit Test · 2 papers/day · 1 hour each · 15-min gap'
                        : selectedTemplate.id === 'half-yearly' || selectedTemplate.id === 'annual'
                          ? '1 paper/day · 3h 15m duration'
                          : '1 paper/day'}
                    </p>
                  </div>
                  {startDate && !endDate && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Single-day examination. Add last date for multi-day.
                    </p>
                  )}

                  {/* Date validation warning */}
                  {dateValidation && !dateValidation.isValid && startDate && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mt-3 flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-[11px]">
                        <p className="text-amber-700 dark:text-amber-300 font-medium">
                          {dateValidation.message}
                        </p>
                        <p className="text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                          Required: {dateValidation.requiredDays} working days · Available: {dateValidation.availableDays}
                        </p>
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {/* ─── 7. Generated Schedule Preview ──────────────────── */}
              {generatedSchedule.length > 0 && (
                <Section
                  label="Generated Examination Schedule"
                  hint={`${generatedSchedule.length} papers · Sundays skipped · ${selectedClassIds.length} classes share each slot`}
                >
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="max-h-72 overflow-y-auto">
                      {groupScheduleByDate(generatedSchedule).map((day, di) => (
                        <div key={day.date} className={cn(di > 0 && 'border-t border-border/40')}>
                          <div className="px-3 py-1.5 bg-muted/30 flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] font-semibold">
                              {formatDateLong(day.date)}
                            </span>
                            <span className="text-[9px] text-muted-foreground ml-auto">
                              {day.items.length} paper{day.items.length === 1 ? '' : 's'}
                            </span>
                          </div>
                          {day.items.map((item, ii) => (
                            <div
                              key={`${item.subjectId}-${ii}`}
                              className="px-3 py-2 flex items-center gap-3 text-xs border-t border-border/20 first:border-t-0"
                            >
                              <div className="flex items-center gap-1 text-muted-foreground tabular-nums shrink-0 w-28">
                                <Clock className="h-3 w-3" />
                                <span>{item.startTime}</span>
                                <span className="text-muted-foreground/60">→</span>
                                <span>{item.endTime}</span>
                              </div>
                              <span className="font-medium truncate flex-1">{item.subjectName}</span>
                              <span className="text-[9px] text-muted-foreground shrink-0">
                                {item.classIds.length} class{item.classIds.length === 1 ? '' : 'es'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Schedule can be edited after creation from the Examination workspace.
                  </p>
                </Section>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Compact footer */}
      <div className="border-t border-border bg-card px-4 sm:px-6 py-2.5 flex justify-between items-center shrink-0">
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

// ─── Layout helpers ──────────────────────────────────────────────────

function Section({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </h2>
        {hint && <span className="text-[10px] text-muted-foreground/70">· {hint}</span>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

// ─── Schedule grouping helper ─────────────────────────────────────────

function groupScheduleByDate(items: GeneratedScheduleItem[]): Array<{ date: string; items: GeneratedScheduleItem[] }> {
  const map = new Map<string, GeneratedScheduleItem[]>()
  for (const it of items) {
    if (!map.has(it.date)) map.set(it.date, [])
    map.get(it.date)!.push(it)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayItems]) => ({ date, items: dayItems.sort((a, b) => a.startTime.localeCompare(b.startTime)) }))
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
