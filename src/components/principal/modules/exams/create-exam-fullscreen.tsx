'use client'

/**
 * CreateExamFullScreen — single-page examination creation form.
 *
 * DESIGN PRINCIPLE: "Principal should select as little as possible.
 * Scholario should already know the rest."
 *
 * The form consumes existing school configuration:
 *   • Classes + their subjects come from Students & Classes
 *   • Streams come from each class's `stream` field (already configured)
 *   • Exam rules (max marks, duration, papers/day, gap, Sunday skip) come
 *     from Examination Settings via the template engine
 *
 * Principal flow:
 *   1. Pick examination type (UT1, UT2, Half-Yearly, UT3, UT4, Annual, Custom)
 *      → name auto-fills, assessment auto-configures
 *   2. Select classes (just checkboxes — streams are shown automatically)
 *      → subjects auto-include from class configuration (READ-ONLY by default)
 *   3. Pick start date / last date / start time (past dates blocked)
 *      → schedule auto-generates with Sunday skip + conflict-safe slots
 *   4. Review generated schedule
 *   5. Create Examination → saved as DRAFT
 *
 * Subjects are auto-included from the selected classes' configuration.
 * The Principal can toggle "Edit" to remove/add exceptional subjects, but
 * the default workflow requires ZERO manual subject selection.
 *
 * No layout container around the form — page breathes naturally like the
 * rest of the Principal panel. Only a compact bottom action bar remains.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, AlertTriangle, Pencil, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'

import { useCreateExamMock } from '@/lib/exams/use-exams-mock'
import { TemplateSelection } from './tabs/template-selection'
import { type ExamTemplate } from './tabs/exam-templates'
import {
  getTemplateMeta,
  generateExamConfig,
  validateDateRange,
  countScheduleSlots,
  FIXED_PASS_PERCENTAGE,
  type ClassInfo,
  type SubjectInfo,
} from '@/lib/exams/template-engine'
import { useScheduleState } from '@/lib/exams/schedule/use-schedule-state'
import type { ScheduleClass, ScheduleOptions } from '@/lib/exams/schedule/schedule-types'
import { ScheduleTable } from './schedule/schedule-table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface ClassDTO {
  id: string
  name: string
  gradeLevel: string | null
  section: string | null
  stream: string | null
  studentCount: number
  subjects: Array<{
    id: string
    name: string
    code: string | null
    fullMarks: number
    passMarks: number
    isCore?: boolean
    examinable?: boolean
    displayOrder?: number
  }>
}

/** Examination-level class — sections collapsed into one selectable unit. */
interface ExamClass {
  key: string           // unique key: `${gradeLevel}-${stream ?? 'general'}`
  label: string         // "Class 9" or "Class 11 — Science PCM"
  gradeLevel: string
  stream: string | null
  sectionIds: string[]  // all section class IDs that belong to this exam class
  sectionCount: number
  studentCount: number
  subjects: ClassDTO['subjects']  // merged subjects from all sections (deduped by name)
}

/** Transform raw DB classes (with sections) into examination-level classes. */
function normalizeToExamClasses(classes: ClassDTO[]): ExamClass[] {
  const byKey = new Map<string, ExamClass>()
  for (const cls of classes) {
    const grade = cls.gradeLevel ?? '0'
    const stream = cls.stream ?? null
    const key = `${grade}-${stream ?? 'general'}`
    const existing = byKey.get(key)
    if (existing) {
      // Merge section into existing exam class
      existing.sectionIds.push(cls.id)
      existing.sectionCount++
      existing.studentCount += cls.studentCount
      // Merge subjects (dedupe by name — keep first occurrence)
      const existingNames = new Set(existing.subjects.map(s => s.name))
      for (const subj of cls.subjects) {
        if (!existingNames.has(subj.name)) {
          existing.subjects.push(subj)
          existingNames.add(subj.name)
        }
      }
    } else {
      // Create new examination-level class — Spec §9 canonical labels.
      // Prefer `cls.name` (e.g. "Pre-Nursery", "KG", "Class 6") over a
      // reconstructed "Class ${grade}" so non-numeric grade levels render
      // with their proper display name (Spec §21 — use "Class", not grade).
      const streamLabel = stream
        ? stream.startsWith('Science-')
          ? `Science ${stream.slice('Science-'.length)}`
          : stream
        : null
      // Spec §21: prefer the canonical class name from Students & Classes.
      // For classes whose name already starts with "Class " (e.g. "Class 6"),
      // use it verbatim. For others (Pre-Nursery, KG) use the name as-is.
      const baseName = cls.name || `Class ${grade}`
      const label = streamLabel
        ? `${baseName} — ${streamLabel}`
        : baseName
      byKey.set(key, {
        key,
        label,
        gradeLevel: grade,
        stream,
        sectionIds: [cls.id],
        sectionCount: 1,
        studentCount: cls.studentCount,
        subjects: [...cls.subjects],
      })
    }
  }
  // Sort numerically by gradeLevel, then by stream
  return Array.from(byKey.values()).sort((a, b) => {
    const ga = parseInt(a.gradeLevel, 10)
    const gb = parseInt(b.gradeLevel, 10)
    if (ga !== gb) return ga - gb
    return (a.stream ?? '').localeCompare(b.stream ?? '')
  })
}

interface Props {
  classes: ClassDTO[]
  academicYear: string
  onBack: () => void
  onCreated: (exam: any) => void
}

// Deduped subject — appears once even when shared across multiple selected classes
interface DedupedSubject extends SubjectInfo {
  availableInClassIds: string[]
  availableInClassNames: string[]
}

export function CreateExamFullScreen({ classes, academicYear, onBack, onCreated }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(null)
  const [name, setName] = useState('')
  const [selectedExamClassKeys, setSelectedExamClassKeys] = useState<string[]>([])
  const [subjectsEditable, setSubjectsEditable] = useState(false)
  const [deselectedSubjectNames, setDeselectedSubjectNames] = useState<Set<string>>(new Set())
  const [hasPractical, setHasPractical] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [examTime, setExamTime] = useState('09:00')
  const { create, loading } = useCreateExamMock()

  // Normalize raw DB classes into examination-level classes
  const examClasses = useMemo(() => normalizeToExamClasses(classes), [classes])

  // Selected exam classes (full objects)
  const selectedExamClasses = useMemo(
    () => examClasses.filter((c) => selectedExamClassKeys.includes(c.key)),
    [examClasses, selectedExamClassKeys],
  )

  // Expand to all section-level class IDs for API calls
  const selectedClassIds = useMemo(
    () => selectedExamClasses.flatMap((c) => c.sectionIds),
    [selectedExamClasses],
  )

  // Selected classes as ClassDTO[] for schedule generation
  const selectedClasses = useMemo(
    () => classes.filter((c) => selectedClassIds.includes(c.id)),
    [classes, selectedClassIds],
  )

  // Spec §1 — earliest selectable examination date is TOMORROW (today disabled).
  // Uses local-date helpers (no UTC shift) to avoid the "18 Aug" off-by-one bug.
  const minStartDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1) // tomorrow
    d.setHours(0, 0, 0, 0)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  // Spec §2 — if startDate moves forward past the existing endDate, clear
  // endDate so the user picks a fresh valid end (rather than leaving an
  // impossible range like Start=20 Aug, End=19 Aug).
  useEffect(() => {
    if (endDate && startDate && endDate < startDate) {
      setEndDate('')
    }
  }, [startDate, endDate])

  // ─── Template selection → auto-fill name + assessment ────────────────
  const handleTemplateSelect = useCallback((t: ExamTemplate) => {
    setSelectedTemplate(t)
    setName(t.label)
    const meta = getTemplateMeta(t.id)
    setHasPractical(meta.hasPractical)
  }, [])

  // ─── Class selection ────────────────────────────────────────────────
  const handleClassToggle = (examClassKey: string) => {
    setSelectedExamClassKeys((prev) =>
      prev.includes(examClassKey) ? prev.filter((k) => k !== examClassKey) : [...prev, examClassKey],
    )
  }

  // ─── Auto-included subjects (deduped by NAME across all selected classes) ───
  // This is the source of truth — subjects come FROM the class configuration.
  // No manual entry, no stream-selection step. The principal only verifies.
  const autoSubjects = useMemo<DedupedSubject[]>(() => {
    const byName = new Map<string, DedupedSubject>()
    for (const c of selectedClasses) {
      for (const s of c.subjects) {
        const existing = byName.get(s.name)
        if (existing) {
          if (!existing.availableInClassIds.includes(c.id)) {
            existing.availableInClassIds.push(c.id)
            existing.availableInClassNames.push(c.name)
          }
        } else {
          byName.set(s.name, {
            id: s.id, // canonical id from first class that has it
            name: s.name,
            code: s.code,
            availableInClassIds: [c.id],
            availableInClassNames: [c.name],
          })
        }
      }
    }
    return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [selectedClasses])

  // Final subject list — auto-included MINUS any the principal explicitly deselected
  const effectiveSubjects = useMemo(
    () => autoSubjects.filter((s) => !deselectedSubjectNames.has(s.name)),
    [autoSubjects, deselectedSubjectNames],
  )

  const toggleSubjectDeselection = (subjectName: string) => {
    setDeselectedSubjectNames((prev) => {
      const next = new Set(prev)
      if (next.has(subjectName)) next.delete(subjectName)
      else next.add(subjectName)
      return next
    })
  }

  // ─── Assessment config (driven by template, not manual entry) ─────────
  const assessment = useMemo(() => {
    if (!selectedTemplate) return null
    const meta = getTemplateMeta(selectedTemplate.id)
    return {
      maxMarks: meta.maxMarks,
      theoryMarks: hasPractical ? meta.theoryMarks : meta.maxMarks,
      practicalMarks: hasPractical ? meta.practicalMarks : 0,
      hasPractical,
    }
  }, [selectedTemplate, hasPractical])

  const togglePractical = () => {
    if (!selectedTemplate) return
    const meta = getTemplateMeta(selectedTemplate.id)
    // Only allow toggling practical ON if the template supports it
    if (!hasPractical && meta.practicalMarks === 0) {
      toast.info('Practical not applicable for this examination type', {
        description: `${selectedTemplate.label} is theory-only by default.`,
      })
      return
    }
    setHasPractical(!hasPractical)
  }

  // ─── Date range validation ───────────────────────────────────────────
  // Use slot count (collapses Mathematics/Biology stream alternatives into
  // one slot per Spec §13/§41) so the required-days calculation matches
  // what the scheduler will actually generate.
  const dateValidation = useMemo(() => {
    if (!selectedTemplate || !startDate || effectiveSubjects.length === 0) return null
    const slotCount = countScheduleSlots(effectiveSubjects.map((s) => s.name))
    return validateDateRange(
      selectedTemplate.id,
      startDate,
      endDate || startDate,
      slotCount,
    )
  }, [selectedTemplate, startDate, endDate, effectiveSubjects])

  // ─── Per-class timetable (Spec §4 / §10 / §11 — no cross-contamination) ──
  // Build ScheduleClass[] from the SELECTED exam classes (each with its OWN
  // subjects) + ScheduleOptions from the template + date window.
  const scheduleClasses: ScheduleClass[] = useMemo(() => {
    return selectedExamClasses.map((ec) => ({
      id: ec.key,
      label: ec.label,
      subjects: ec.subjects.map((s) => ({ id: s.id, name: s.name, code: s.code ?? '' })),
    }))
  }, [selectedExamClasses])

  const scheduleOptions: ScheduleOptions | null = useMemo(() => {
    if (!selectedTemplate || !startDate) return null
    const meta = getTemplateMeta(selectedTemplate.id)
    return {
      startDate,
      endDate: endDate || startDate,
      papersPerDay: meta.papersPerDay,
      startTime: examTime,
      paperDurationMin: meta.paperDurationMin,
      gapMin: meta.gapMin,
    }
  }, [selectedTemplate, startDate, endDate, examTime])

  const scheduleState = useScheduleState({ classes: scheduleClasses, options: scheduleOptions })

  // ─── Can create? ─────────────────────────────────────────────────────
  const canCreate =
    name.trim().length > 0 &&
    selectedTemplate !== null &&
    selectedExamClassKeys.length > 0 &&
    effectiveSubjects.length > 0 &&
    startDate.length > 0 &&
    startDate >= minStartDate &&
    (!endDate || endDate >= startDate) &&
    (!dateValidation || dateValidation.isValid)

  // ─── Handle create ───────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!canCreate || !selectedTemplate || !assessment) return
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
        effectiveSubjects,
        examTime,
      )

      // Apply assessment config from template (not manual entry)
      generated.subjects = generated.subjects.map((s) => ({
        ...s,
        maxMarks: assessment.maxMarks,
        theoryMarks: assessment.theoryMarks,
        practicalMarks: assessment.practicalMarks,
      }))

      // Build subjectsByClass — for each selected class, filter to only
      // subjects that exist in that class (matched by name, since IDs differ).
      const subjectsByClass: Record<string, Array<{ subjectId: string; maxMarks: number; theoryMarks: number; practicalMarks: number }>> = {}
      for (const classId of selectedClassIds) {
        const cls = classes.find((c) => c.id === classId)
        if (!cls) continue
        const classSubjectNames = new Set(cls.subjects.map((s) => s.name))
        subjectsByClass[classId] = effectiveSubjects
          .filter((sel) => classSubjectNames.has(sel.name))
          .map((sel) => {
            const classSubj = cls.subjects.find((s) => s.name === sel.name)!
            return {
              subjectId: classSubj.id,
              maxMarks: assessment.maxMarks,
              theoryMarks: assessment.theoryMarks,
              practicalMarks: assessment.practicalMarks,
            }
          })
      }

      // Build schedule — use the per-class timetable from scheduleState.
      // The timetable already respects each class's own subjects (no cross-
      // contamination, Spec §11) and reflects any manual drag reorders.
      // Map exam-class keys back to the underlying section class IDs so the
      // storage layer can route per-section.
      const fullSchedule = scheduleState.flattened.map((item) => {
        // Resolve the exam-class key to the first section classId for storage.
        const examCls = selectedExamClasses.find((ec) => ec.key === item.classId)
        const classId = examCls?.sectionIds[0] ?? item.classId
        return {
          classId,
          subjectId: item.subjectId,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          room: item.room || undefined,
          invigilatorName: item.invigilatorName || undefined,
        }
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
        description: `${effectiveSubjects.length} subjects scheduled across ${selectedClassIds.length} classes. Review and publish when ready.`,
      })
      onCreated(exam)
    } catch (e: any) {
      toast.error('Failed to create examination', { description: e.message })
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────
  // NO top header container. Page breathes naturally. Only bottom action bar.
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable form area — starts directly with content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* ─── 1. Examination Type ─────────────────────────────────── */}
          <Section label="Examination Type" required>
            <TemplateSelection selectedTemplateId={selectedTemplate?.id ?? null} onSelect={handleTemplateSelect} />
          </Section>

          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
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
              <Section
                label="Classes"
                required
                hint={selectedExamClassKeys.length > 0 ? `${selectedExamClassKeys.length} selected` : undefined}
              >
                {examClasses.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3">No classes configured. Add classes in Students &amp; Classes first.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {examClasses.map((examCls) => {
                      const isSelected = selectedExamClassKeys.includes(examCls.key)
                      return (
                        <div
                          key={examCls.key}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => handleClassToggle(examCls.key)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClassToggle(examCls.key) } }}
                          className={cn(
                            'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30',
                            isSelected ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted/30',
                          )}
                        >
                          <span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded-full border shrink-0', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40')}>
                            {isSelected && <Check className="h-2.5 w-2.5" />}
                          </span>
                          <span>{examCls.label}</span>
                          {examCls.sectionCount > 1 && <span className="text-[9px] text-muted-foreground/60">· {examCls.sectionCount} sections</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Section>

              {/* ─── 4. Subjects (auto-included, READ-ONLY by default) ──── */}
              {autoSubjects.length > 0 && (
                <Section
                  label="Subjects"
                  hint={`${effectiveSubjects.length} auto-included from selected classes`}
                >
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    {subjectsEditable ? (
                      // Editable mode — principal can deselect individual subjects
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {autoSubjects.map((subj) => {
                            const isSelected = !deselectedSubjectNames.has(subj.name)
                            return (
                              <button
                                key={subj.id}
                                onClick={() => toggleSubjectDeselection(subj.name)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all',
                                  isSelected
                                    ? 'border-primary/40 bg-primary/10 text-foreground'
                                    : 'border-border bg-card text-muted-foreground/60 line-through',
                                )}
                              >
                                <span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded-full border shrink-0', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40')}>
                                  {isSelected && <Check className="h-2.5 w-2.5" />}
                                </span>
                                {subj.name}
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex justify-end pt-1 border-t border-border/40">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] gap-1"
                            onClick={() => {
                              setSubjectsEditable(false)
                              setDeselectedSubjectNames(new Set())
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Read-only mode — subjects shown as plain chips, with subtle Edit affordance
                      <div className="flex flex-wrap items-center gap-1.5">
                        {effectiveSubjects.map((subj) => (
                          <span
                            key={subj.id}
                            className="inline-flex items-center rounded-md bg-card border border-border/60 px-2 py-1 text-xs font-medium"
                          >
                            {subj.name}
                          </span>
                        ))}
                        <button
                          onClick={() => setSubjectsEditable(true)}
                          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/60 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-border transition-colors ml-1"
                          aria-label="Edit subjects"
                        >
                          <Pencil className="h-2.5 w-2.5" /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* ─── 5. Assessment (auto-configured from template) ─────── */}
              {assessment && (
                <Section label="Assessment">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Theory / Practical toggle — obvious active state */}
                    <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                          !hasPractical ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            !hasPractical ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                          )}
                        />
                        Theory
                      </span>
                      <button
                        onClick={togglePractical}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                          hasPractical ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                        )}
                        aria-pressed={hasPractical}
                      >
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            hasPractical ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                          )}
                        />
                        Practical
                      </button>
                    </div>
                    {/* Auto marks summary — read-only display, not inputs */}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold text-foreground tabular-nums">{assessment.maxMarks}</span>
                        max
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold text-foreground tabular-nums">{assessment.theoryMarks}</span>
                        theory
                      </span>
                      {hasPractical && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="font-semibold text-foreground tabular-nums">{assessment.practicalMarks}</span>
                            practical
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Section>
              )}

              {/* ─── 6. Examination Window ──────────────────────────── */}
              {effectiveSubjects.length > 0 && (
                <Section label="Examination Window" required>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <Field label="Start Date">
                      <DatePicker
                        value={startDate}
                        onChange={setStartDate}
                        placeholder="Start date"
                        minDate={minStartDate}
                      />
                    </Field>
                    <Field label="End Date">
                      <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        placeholder="End date"
                        minDate={startDate || minStartDate}
                      />
                    </Field>
                  </div>
                  <div className="flex items-center gap-3 mt-3 max-w-md flex-wrap">
                    <Field label="Start Time">
                      <Input
                        type="time"
                        value={examTime}
                        onChange={(e) => setExamTime(e.target.value)}
                        className="h-9 text-xs w-32"
                      />
                    </Field>
                    <p className="text-[10px] text-muted-foreground mt-4">
                      {selectedTemplate.id.startsWith('unit-test')
                        ? '2 papers/day · 1h each · 15-min gap'
                        : selectedTemplate.id === 'half-yearly' || selectedTemplate.id === 'annual'
                          ? '1 paper/day · 3h 15m'
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

              {/* ─── 7. Generated Schedule Preview (class-column timetable) ─── */}
              {scheduleState.timetable && scheduleState.timetable.rows.length > 0 && (
                <Section
                  label="Generated Schedule"
                  hint={`${scheduleState.timetable.rows.length} slot${scheduleState.timetable.rows.length === 1 ? '' : 's'} · ${scheduleState.timetable.classes.length} class${scheduleState.timetable.classes.length === 1 ? '' : 'es'}`}
                >
                  <ScheduleTable
                    timetable={scheduleState.timetable}
                    onMoveSubject={scheduleState.moveSubjectCell}
                  />
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Drag a subject vertically within its class column to reorder. Schedule can also be edited after creation.
                  </p>
                </Section>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Lightweight action row — no card/slab */}
      <div className="px-4 sm:px-6 pb-4 pt-2 shrink-0">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" onClick={onBack}>
            <ArrowLeft className="h-3 w-3" /> Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-[11px] gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleCreate}
            disabled={loading || !canCreate}
          >
            {loading ? 'Creating…' : (<><Check className="h-3 w-3" /> Create Examination</>)}
          </Button>
        </div>
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
      <div className="flex items-baseline gap-2 mb-2.5">
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
// Groups schedule items by date. Within a date, items sharing the SAME
// start+end time (e.g. Mathematics and Biology on the same slot per
// Spec §13/§41) are merged into a single row labelled "A / B".
//
// NOTE: The legacy `groupScheduleByDate` + `formatDateLong` helpers that
// rendered the old vertical schedule list have been removed — the new
// `<ScheduleTable>` component (in ./schedule/schedule-table.tsx) handles
// the timetable rendering, and date formatting lives in
// `@/lib/exams/format-helpers`.

