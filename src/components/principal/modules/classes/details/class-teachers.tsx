'use client'

/**
 * ClassTeachers — class & section teacher assignment.
 *
 * Brief section 3 + 4 + 5 + 6: Normal mode is an information view
 * (entity cards, not a form). Edit mode is a refined transition where
 * the same entity cards become editable via SearchableSelect. No
 * crude collection of large dropdown forms.
 *
 * Brief section 7 + 8 + 16: Use simple terminology:
 *   - "Class Teacher"
 *   - "Assistant Class Teacher"
 *   - For section: "Section Teacher" + "Assistant"
 * Avoid "Class Teaching Team" / "Section Assignments" / etc.
 *
 * Brief section 9 + 21: Existing values MUST hydrate into edit mode.
 *   buildInitialState() reads from canonical cls state.
 *   enterEdit() pre-populates pending with that state.
 *
 * Brief section 18: Replace ≠ Archive. Replacing a teacher keeps the
 *   old teacher active globally — only the class relationship changes.
 *
 * Brief section 19 + 20 + 27: NO inline × destructive button on the
 *   selected chip. Removal happens only via explicit "Remove" button
 *   → universal ConfirmDialog.
 *
 * Brief section 22 + 35 + 37: Save writes through canonical store
 *   actions; all 4 relationship types (class teacher, class assistant,
 *   section teacher, section assistant) persist; mutations propagate
 *   live to Overview + header badges.
 *
 * Brief section 23 + 24 + 25: Uses the shared `SearchableSelect` —
 *   a polished, reusable SCHOLARIO control. Search Input has a stable
 *   `key` so it is NEVER recreated during rerenders (cursor bug fix).
 */
import { useState } from 'react'
import { Pencil, UserX, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { getTeacherById, teachers } from '@/lib/mock/teachers'
import { SegmentedTabs } from '../../shared/segmented-tabs'
import { SearchableSelect, type SearchableSelectOption } from '../../shared/searchable-select'
import { ConfirmDialog } from '../../shared/confirm-dialog'
import { EntityCard } from '../../shared/entity-card'
import { toast } from 'sonner'

type Mode = 'separate' | 'merged'

/**
 * Pending state shape.
 *   'class_teacher'                  → class-level Class Teacher
 *   'class_assistant'                → class-level Assistant Class Teacher
 *   'section_teacher|<secId>'        → section-level Class Teacher
 *   'section_assistant|<secId>'      → section-level Assistant Class Teacher
 */
type PendingMap = Record<string, string>

/* ------------------------------------------------------------------ */
/* Build teacher options for SearchableSelect                          */
/* ------------------------------------------------------------------ */
function buildTeacherOptions(excludeId?: string): SearchableSelectOption[] {
  return teachers
    .filter((t) => t.status === 'Active')
    .filter((t) => t.id !== excludeId)
    .map((t) => ({
      id: t.id,
      label: t.name,
      avatar: t.avatar,
      meta: `${t.employeeId} · ${t.department}`,
    }))
}

/* ------------------------------------------------------------------ */
/* ClassTeachers — main component                                     */
/* ------------------------------------------------------------------ */
export function ClassTeachers({ cls }: { cls: ClassRecord }) {
  // Subscribe to canonical class so external mutations reflect here.
  const liveClass = useStudentsStore((s) => s.getClassById(cls.id)) ?? cls
  const updateClassTeacher = useStudentsStore((s) => s.updateClassTeacher)
  const updateClassAssistantTeacher = useStudentsStore((s) => s.updateClassAssistantTeacher)
  const updateSectionTeacher = useStudentsStore((s) => s.updateSectionTeacher)
  const updateSectionAssistantTeacher = useStudentsStore((s) => s.updateSectionAssistantTeacher)

  const [mode, setMode] = useState<Mode>('separate')
  const [editMode, setEditMode] = useState(false)
  const [pending, setPending] = useState<PendingMap>({})
  const [removals, setRemovals] = useState<string[]>([])
  const [confirmRemove, setConfirmRemove] = useState<{ key: string; label: string; name: string } | null>(null)

  // Build initial pending state from canonical class assignments.
  const buildInitialState = (): PendingMap => {
    const state: PendingMap = {}
    if (liveClass.classTeacherId) state['class_teacher'] = liveClass.classTeacherId
    if (liveClass.assistantTeacherId) state['class_assistant'] = liveClass.assistantTeacherId
    liveClass.sections.forEach((sec) => {
      if (sec.classTeacherId) state[`section_teacher|${sec.id}`] = sec.classTeacherId
      if (sec.assistantTeacherId) state[`section_assistant|${sec.id}`] = sec.assistantTeacherId
    })
    return state
  }

  const hasChanges = (() => {
    const initial = buildInitialState()
    // Changed / added
    for (const [k, v] of Object.entries(pending)) {
      if (initial[k] !== v) return true
    }
    // Removed
    if (removals.length > 0) return true
    // New assignments (keys in pending not in initial)
    for (const k of Object.keys(pending)) {
      if (!Object.prototype.hasOwnProperty.call(initial, k) && pending[k]) return true
    }
    return false
  })()

  const setP = (k: string, v: string) => setPending((p) => ({ ...p, [k]: v }))
  const markRem = (k: string) => {
    setRemovals((p) => [...p, k])
    setPending((p) => { const n = { ...p }; delete n[k]; return n })
  }
  const unmarkRem = (k: string) => setRemovals((p) => p.filter((x) => x !== k))

  const enterEdit = () => {
    setEditMode(true)
    setPending(buildInitialState()) // Pre-populate with existing values
    setRemovals([])
  }
  const exitEdit = () => {
    setEditMode(false)
    setPending({})
    setRemovals([])
  }

  const save = () => {
    const initial = buildInitialState()
    let changeCount = 0

    // Class Teacher
    const classTeacherNext = removals.includes('class_teacher')
      ? null
      : (pending['class_teacher'] ?? initial['class_teacher'] ?? null)
    if ((initial['class_teacher'] ?? null) !== (classTeacherNext ?? null)) {
      updateClassTeacher(liveClass.id, classTeacherNext)
      changeCount++
    }

    // Class Assistant
    const classAssistantNext = removals.includes('class_assistant')
      ? null
      : (pending['class_assistant'] ?? initial['class_assistant'] ?? null)
    if ((initial['class_assistant'] ?? null) !== (classAssistantNext ?? null)) {
      updateClassAssistantTeacher(liveClass.id, classAssistantNext)
      changeCount++
    }

    // Section Teachers + Assistants
    liveClass.sections.forEach((sec) => {
      const teacherKey = `section_teacher|${sec.id}`
      const teacherNext = removals.includes(teacherKey)
        ? null
        : (pending[teacherKey] ?? initial[teacherKey] ?? null)
      const teacherPrev = initial[teacherKey] ?? null
      if ((teacherPrev ?? null) !== (teacherNext ?? null)) {
        updateSectionTeacher(liveClass.id, sec.id, teacherNext)
        changeCount++
      }

      const assistantKey = `section_assistant|${sec.id}`
      const assistantNext = removals.includes(assistantKey)
        ? null
        : (pending[assistantKey] ?? initial[assistantKey] ?? null)
      const assistantPrev = initial[assistantKey] ?? null
      if ((assistantPrev ?? null) !== (assistantNext ?? null)) {
        updateSectionAssistantTeacher(liveClass.id, sec.id, assistantNext)
        changeCount++
      }
    })

    if (changeCount > 0) toast.success(`${changeCount} assignment(s) updated`)
    exitEdit()
  }

  // Resolve what to display: pending value if editing, otherwise canonical value
  const resolveTeacherId = (key: string, fallback: string | null | undefined): string => {
    if (editMode) {
      if (removals.includes(key)) return ''
      return pending[key] ?? ''
    }
    return fallback ?? ''
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle + Edit */}
      <div className="flex items-center justify-between gap-2">
        <SegmentedTabs
          tabs={[
            { value: 'separate', label: 'Separate by section' },
            { value: 'merged', label: 'Merged (class-wide)' },
          ]}
          value={mode}
          onValueChange={(v) => setMode(v as Mode)}
        />
        {!editMode ? (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={enterEdit}>
            <Pencil className="h-3 w-3" /> Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={exitEdit}>Cancel</Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:saturate-50"
              onClick={save}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Class-level: Class Teacher + Assistant Class Teacher */}
      <section>
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Class Teacher</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TeacherField
            label="Class Teacher"
            teacherId={resolveTeacherId('class_teacher', liveClass.classTeacherId)}
            editMode={editMode}
            pickerId="class_teacher"
            isRemoved={removals.includes('class_teacher')}
            onSet={(v) => setP('class_teacher', v)}
            onMarkRem={() => setConfirmRemove({
              key: 'class_teacher',
              label: 'Class Teacher',
              name: getTeacherById(liveClass.classTeacherId || '')?.name ?? 'Teacher',
            })}
            onUnmarkRem={() => unmarkRem('class_teacher')}
          />
          <TeacherField
            label="Assistant Class Teacher"
            teacherId={resolveTeacherId('class_assistant', liveClass.assistantTeacherId)}
            editMode={editMode}
            pickerId="class_assistant"
            isRemoved={removals.includes('class_assistant')}
            onSet={(v) => setP('class_assistant', v)}
            onMarkRem={() => setConfirmRemove({
              key: 'class_assistant',
              label: 'Assistant Class Teacher',
              name: getTeacherById(liveClass.assistantTeacherId || '')?.name ?? 'Teacher',
            })}
            onUnmarkRem={() => unmarkRem('class_assistant')}
          />
        </div>
      </section>

      {/* Section rows (separate mode) */}
      {mode === 'separate' && (
        <section>
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Sections</p>
          <div className="space-y-4">
            {liveClass.sections.map((sec) => (
              <div key={sec.id}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-foreground text-[10px] font-semibold">{sec.name}</div>
                  <span className="text-xs font-medium text-foreground">Section {sec.name}</span>
                  <span className="text-[10px] text-muted-foreground">Room {sec.room || liveClass.room}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                  <TeacherField
                    label="Section Teacher"
                    teacherId={resolveTeacherId(`section_teacher|${sec.id}`, sec.classTeacherId)}
                    editMode={editMode}
                    pickerId={`section_teacher|${sec.id}`}
                    isRemoved={removals.includes(`section_teacher|${sec.id}`)}
                    onSet={(v) => setP(`section_teacher|${sec.id}`, v)}
                    onMarkRem={() => setConfirmRemove({
                      key: `section_teacher|${sec.id}`,
                      label: 'Section Teacher',
                      name: getTeacherById(sec.classTeacherId || '')?.name ?? 'Teacher',
                    })}
                    onUnmarkRem={() => unmarkRem(`section_teacher|${sec.id}`)}
                  />
                  <TeacherField
                    label="Assistant"
                    teacherId={resolveTeacherId(`section_assistant|${sec.id}`, sec.assistantTeacherId)}
                    editMode={editMode}
                    pickerId={`section_assistant|${sec.id}`}
                    isRemoved={removals.includes(`section_assistant|${sec.id}`)}
                    onSet={(v) => setP(`section_assistant|${sec.id}`, v)}
                    onMarkRem={() => setConfirmRemove({
                      key: `section_assistant|${sec.id}`,
                      label: 'Assistant',
                      name: getTeacherById(sec.assistantTeacherId || '')?.name ?? 'Teacher',
                    })}
                    onUnmarkRem={() => unmarkRem(`section_assistant|${sec.id}`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Merged (class-wide) mode */}
      {mode === 'merged' && (
        <section>
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Sections</p>
          <div className="space-y-1.5">
            {liveClass.sections.map((sec) => {
              const secTeacher = sec.classTeacherId ? getTeacherById(sec.classTeacherId) : null
              return (
                <div key={sec.id} className="flex items-center justify-between py-1.5 border-t border-border/30 first:border-t-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-foreground text-[9px] font-semibold">{sec.name}</div>
                    <span className="text-xs text-muted-foreground">Section {sec.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {secTeacher ? (
                      <>
                        <Badge variant="outline" className="text-[8px] text-amber-600 border-amber-500/30">OVERRIDE</Badge>
                        <span className="text-xs text-foreground">{secTeacher.name}</span>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="text-[8px] text-muted-foreground">INHERITED</Badge>
                        <span className="text-xs text-muted-foreground">Uses class teacher</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Universal Remove confirmation */}
      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
        title={`Remove ${confirmRemove?.label}?`}
        description={`${confirmRemove?.name} will no longer be assigned to ${liveClass.name}. The teacher remains active globally and can be reassigned elsewhere.`}
        tone="destructive"
        icon={UserX}
        confirmLabel="Remove"
        onConfirm={() => {
          if (confirmRemove) { markRem(confirmRemove.key); setConfirmRemove(null) }
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TeacherField — read mode shows EntityCard; edit mode shows          */
/*   SearchableSelect + Remove button. Visual consistency between the  */
/*   two modes is the entire point of the brief (sections 4 + 5).      */
/* ------------------------------------------------------------------ */
function TeacherField({ label, teacherId, editMode, pickerId, isRemoved, onSet, onMarkRem, onUnmarkRem }: {
  label: string
  teacherId: string
  editMode: boolean
  pickerId: string
  isRemoved: boolean
  onSet: (v: string) => void
  onMarkRem: () => void
  onUnmarkRem: () => void
}) {
  const teacher = teacherId ? getTeacherById(teacherId) : null

  if (isRemoved) {
    return (
      <div className="flex items-center justify-between py-1 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3">
        <span className="text-xs font-medium text-rose-600">{label} — marked for removal</span>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={onUnmarkRem}>
          <RotateCcw className="h-3 w-3" /> Undo
        </Button>
      </div>
    )
  }

  if (editMode) {
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-foreground">{label}</p>
        <SearchableSelect
          pickerId={pickerId}
          selectedId={teacherId}
          onSelect={onSet}
          placeholder={`Select ${label}`}
          options={buildTeacherOptions()}
        />
        {teacherId && (
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-rose-600 p-0 hover:bg-rose-500/10" onClick={onMarkRem}>
            <UserX className="h-3 w-3" /> Remove
          </Button>
        )}
      </div>
    )
  }

  // Read mode — clean EntityCard representation.
  // Same visual family as SubjectCard (brief section 3 + 26).
  if (teacher) {
    return (
      <EntityCard
        leading={teacher.avatar}
        title={teacher.name}
        metadata={`${teacher.employeeId} · ${teacher.department}`}
        secondary={<span className="text-[10px] text-muted-foreground">{label}</span>}
      />
    )
  }

  // Vacant state — same EntityCard but in 'vacant' tone (dashed border, italic title).
  return (
    <EntityCard
      tone="vacant"
      leading={<UserX className="h-3.5 w-3.5" />}
      title={label}
      secondary={<span className="text-[10px] text-muted-foreground">Vacant</span>}
    />
  )
}
