'use client'

/**
 * ClassTeachers — class & section teacher assignment.
 *
 * Brief section 16 (Terminology):
 *   - "Class Teacher" + "Assistant Class Teacher" (no "Class Teaching Team").
 *
 * Brief section 19 / 20 (Normal view + Edit mode):
 *   - Normal mode: clean avatar + name + employeeId · department.
 *   - Edit mode: selector becomes editable; same visual language as Subjects.
 *
 * Brief section 21 (Existing values must hydrate into edit state):
 *   - `buildInitialState()` reads from canonical cls state.
 *   - `enterEdit()` pre-populates `pending` with that state.
 *
 * Brief section 22 (Real data persistence):
 *   - `save()` writes through the canonical students-store actions
 *     `updateClassTeacher` and `updateSectionTeacher`.
 *
 * Brief section 26 (Inline × must not bypass safety):
 *   - The inline × on the selected teacher chip has been removed.
 *   - Removal happens only via the explicit "Remove" button → confirmation dialog.
 *
 * Brief section 39 (No box-inside-box):
 *   - Section blocks use a thin top divider, not a wrapping card.
 */
import { useState } from 'react'
import { Pencil, ChevronDown, Search, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useStudentsStore } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { getTeacherById, teachers } from '@/lib/mock/teachers'
import { toast } from 'sonner'

type Mode = 'separate' | 'merged'

/**
 * Pending state shape.
 * Keys:
 *   - 'class_teacher'      → class-level Class Teacher
 *   - 'assistant'          → class-level Assistant Class Teacher (currently informational)
 *   - 'section_teacher|<secId>' → section-level Class Teacher
 *   - 'assistant|<secId>'  → section-level Assistant (currently informational)
 */
type PendingMap = Record<string, string>

export function ClassTeachers({ cls }: { cls: ClassRecord }) {
  // Subscribe to the canonical class so external mutations reflect here.
  const liveClass = useStudentsStore((s) => s.getClassById(cls.id)) ?? cls
  const updateClassTeacher = useStudentsStore((s) => s.updateClassTeacher)
  const updateSectionTeacher = useStudentsStore((s) => s.updateSectionTeacher)

  const [mode, setMode] = useState<Mode>('separate')
  const [editMode, setEditMode] = useState(false)
  const [pending, setPending] = useState<PendingMap>({})
  const [removals, setRemovals] = useState<string[]>([])
  const [confirmRemove, setConfirmRemove] = useState<{ key: string; label: string; name: string } | null>(null)

  const buildInitialState = (): PendingMap => {
    const state: PendingMap = {}
    if (liveClass.classTeacherId) state['class_teacher'] = liveClass.classTeacherId
    liveClass.sections.forEach((sec) => {
      if (sec.classTeacherId) state[`section_teacher|${sec.id}`] = sec.classTeacherId
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

    // Section Teachers (separate mode only saves section-level assignments)
    liveClass.sections.forEach((sec) => {
      const key = `section_teacher|${sec.id}`
      const nextId = removals.includes(key)
        ? null
        : (pending[key] ?? initial[key] ?? null)
      const prevId = initial[key] ?? null
      if ((prevId ?? null) !== (nextId ?? null)) {
        updateSectionTeacher(liveClass.id, sec.id, nextId)
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
        <div className="inline-flex h-9 p-1 gap-1 rounded-full bg-muted/60">
          <button
            type="button"
            onClick={() => setMode('separate')}
            className={cn(
              'px-4 rounded-full text-xs font-medium transition-all',
              mode === 'separate' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Separate by section
          </button>
          <button
            type="button"
            onClick={() => setMode('merged')}
            className={cn(
              'px-4 rounded-full text-xs font-medium transition-all',
              mode === 'merged' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Merged (class-wide)
          </button>
        </div>
        {!editMode ? (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={enterEdit}>
            <Pencil className="h-3 w-3" /> Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={exitEdit}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600" onClick={save} disabled={!hasChanges}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Class-level: Class Teacher + Assistant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeacherField
          label="Class Teacher"
          teacherId={resolveTeacherId('class_teacher', liveClass.classTeacherId)}
          editMode={editMode}
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
          teacherId={resolveTeacherId('assistant', null)}
          editMode={editMode}
          isRemoved={removals.includes('assistant')}
          onSet={(v) => setP('assistant', v)}
          onMarkRem={() => setConfirmRemove({ key: 'assistant', label: 'Assistant Class Teacher', name: 'Teacher' })}
          onUnmarkRem={() => unmarkRem('assistant')}
        />
      </div>

      <div className="border-t border-border/40" />

      {/* Section rows (separate mode) */}
      {mode === 'separate' && (
        <div className="space-y-4">
          {liveClass.sections.map((sec) => (
            <div key={sec.id}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-foreground text-[10px] font-semibold">{sec.name}</div>
                <span className="text-xs font-medium text-foreground">Section {sec.name}</span>
                <span className="text-[10px] text-muted-foreground">Room {sec.room || liveClass.room}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                <TeacherField
                  label="Section Teacher"
                  teacherId={resolveTeacherId(`section_teacher|${sec.id}`, sec.classTeacherId)}
                  editMode={editMode}
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
                  teacherId={resolveTeacherId(`assistant|${sec.id}`, null)}
                  editMode={editMode}
                  isRemoved={removals.includes(`assistant|${sec.id}`)}
                  onSet={(v) => setP(`assistant|${sec.id}`, v)}
                  onMarkRem={() => setConfirmRemove({ key: `assistant|${sec.id}`, label: 'Assistant', name: 'Teacher' })}
                  onUnmarkRem={() => unmarkRem(`assistant|${sec.id}`)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merged (class-wide) mode */}
      {mode === 'merged' && (
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
      )}

      {/* Remove confirmation dialog */}
      <Dialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Remove {confirmRemove?.label}?</DialogTitle>
            <DialogDescription className="text-xs">
              {confirmRemove?.name} will no longer be assigned to {liveClass.name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirmRemove) { markRem(confirmRemove.key); setConfirmRemove(null) }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TeacherField — read mode shows avatar+name; edit mode shows picker  */
/* ------------------------------------------------------------------ */
function TeacherField({ label, teacherId, editMode, isRemoved, onSet, onMarkRem, onUnmarkRem }: {
  label: string
  teacherId: string
  editMode: boolean
  isRemoved: boolean
  onSet: (v: string) => void
  onMarkRem: () => void
  onUnmarkRem: () => void
}) {
  const teacher = teacherId ? getTeacherById(teacherId) : null

  if (isRemoved) {
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-medium text-rose-600">{label} — marked for removal</span>
        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={onUnmarkRem}>Undo</Button>
      </div>
    )
  }

  if (editMode) {
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
        <TeacherPicker selectedId={teacherId} onSelect={onSet} placeholder={`Select ${label}`} />
        {teacherId && (
          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-rose-600 p-0" onClick={onMarkRem}>
            <UserX className="h-3 w-3" /> Remove
          </Button>
        )}
      </div>
    )
  }

  // Read mode — clean avatar + name + meta row
  return (
    <div className="flex items-center gap-2 py-1">
      {teacher ? (
        <>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">
            {teacher.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground truncate">{teacher.name}</p>
            <p className="text-[10px] text-muted-foreground">{teacher.employeeId} · {teacher.department}</p>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
            <UserX className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-sm text-muted-foreground/60 italic">Vacant</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TeacherPicker — premium searchable picker, pre-populated display    */
/* ------------------------------------------------------------------ */
function TeacherPicker({ selectedId, onSelect, placeholder }: {
  selectedId: string
  onSelect: (id: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = teachers.find((t) => t.id === selectedId)

  const filtered = (() => {
    const q = search.toLowerCase()
    return teachers.filter((t) =>
      t.status === 'Active' &&
      (t.name.toLowerCase().includes(q) ||
        t.employeeId.toLowerCase().includes(q) ||
        (t.department || '').toLowerCase().includes(q))
    )
  })()

  // Trigger button: shows the selected teacher as a chip (pre-populated),
  // or shows the placeholder text when vacant. Either way, clicking opens
  // the same Popover. Brief section 26: NO inline × destructive action —
  // only the explicit Remove button (in TeacherField) handles removal.
  const trigger = selected ? (
    <div className="flex items-center justify-between w-full gap-2 rounded-lg border border-border bg-card p-2 hover:border-primary/40 transition-colors text-left">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">
          {selected.avatar}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate leading-tight">{selected.name}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{selected.employeeId} · {selected.department}</p>
        </div>
      </div>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </div>
  ) : (
    <div className="flex items-center justify-between w-full h-9 px-3 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:border-primary/40 transition-colors">
      <span>{placeholder}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </div>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="block w-full text-left">
          {trigger}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teachers…"
              className="pl-8 h-8 text-xs bg-card"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No teachers found.</p>
          ) : filtered.slice(0, 30).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onSelect(t.id); setOpen(false); setSearch('') }}
              className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">
                {t.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate leading-tight">{t.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{t.employeeId} · {t.department}</p>
              </div>
              {selectedId === t.id && (
                <span className="text-[10px] text-emerald-600 font-medium shrink-0">Selected</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
