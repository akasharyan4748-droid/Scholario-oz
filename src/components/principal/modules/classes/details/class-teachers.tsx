'use client'

import { useState, useMemo } from 'react'
import { Pencil, Check, X, ChevronDown, Search, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ClassRecord } from '@/lib/store/students-store'
import { getTeacherById, teachers } from '@/lib/mock/teachers'
import { toast } from 'sonner'

type Mode = 'separate' | 'merged'

export function ClassTeachers({ cls }: { cls: ClassRecord }) {
  const [mode, setMode] = useState<Mode>('separate')
  const [editMode, setEditMode] = useState(false)
  const [pending, setPending] = useState<Record<string, string>>({})
  const [removals, setRemovals] = useState<string[]>([])
  const [confirmRemove, setConfirmRemove] = useState<{ key: string; label: string; name: string } | null>(null)

  // Build initial state from current assignments — this is the KEY FIX
  // Keys: 'class_teacher', 'assistant', 'section_teacher|<secId>', 'assistant|<secId>'
  const buildInitialState = (): Record<string, string> => {
    const state: Record<string, string> = {}
    if (cls.classTeacherId) state['class_teacher'] = cls.classTeacherId
    cls.sections.forEach((sec) => {
      if (sec.classTeacherId) state[`section_teacher|${sec.id}`] = sec.classTeacherId
    })
    return state
  }

  const hasChanges = (() => {
    const initial = buildInitialState()
    // Check for changed/added
    for (const [k, v] of Object.entries(pending)) {
      if (initial[k] !== v) return true
    }
    // Check for removed
    if (removals.length > 0) return true
    // Check for new assignments (keys in pending not in initial)
    const pendingKeys = new Set(Object.keys(pending))
    const initialKeys = new Set(Object.keys(initial))
    for (const k of pendingKeys) { if (!initialKeys.has(k) && pending[k]) return true }
    return false
  })()

  const setP = (k: string, v: string) => setPending((p) => ({ ...p, [k]: v }))
  const clearP = (k: string) => setPending((p) => { const n = { ...p }; delete n[k]; return n })
  const markRem = (k: string) => { setRemovals((p) => [...p, k]); setPending((p) => { const n = { ...p }; delete n[k]; return n }) }
  const unmarkRem = (k: string) => setRemovals((p) => p.filter((x) => x !== k))

  const enterEdit = () => {
    setEditMode(true)
    setPending(buildInitialState()) // PRE-POPULATE with existing values
    setRemovals([])
  }
  const exitEdit = () => { setEditMode(false); setPending({}); setRemovals([]) }
  const save = () => {
    const c = Object.keys(pending).filter(k => {
      const init = buildInitialState()
      return init[k] !== pending[k]
    }).length + removals.length
    if (c > 0) toast.success(`${c} assignment(s) updated`)
    exitEdit()
  }

  // Resolve what to show: pending value if editing, otherwise canonical value
  const resolveTeacherId = (key: string, fallback: string | null | undefined): string => {
    if (editMode) {
      if (removals.includes(key)) return ''
      return pending[key] || ''
    }
    return fallback || ''
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle + Edit */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex h-9 p-1 gap-1 rounded-full bg-muted/60">
          <button onClick={() => setMode('separate')} className={cn('px-4 rounded-full text-xs font-medium transition-all', mode === 'separate' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Separate by section</button>
          <button onClick={() => setMode('merged')} className={cn('px-4 rounded-full text-xs font-medium transition-all', mode === 'merged' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Merged (class-wide)</button>
        </div>
        {!editMode ? (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={enterEdit}><Pencil className="h-3 w-3" /> Edit</Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={exitEdit}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={save} disabled={!hasChanges}>Save Changes</Button>
          </div>
        )}
      </div>

      {/* Class-level: Class Teacher + Assistant — compact two-column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeacherField label="Class Teacher" teacherId={resolveTeacherId('class_teacher', cls.classTeacherId)} editMode={editMode} isRemoved={removals.includes('class_teacher')} onSet={(v) => setP('class_teacher', v)} onClear={() => clearP('class_teacher')} onMarkRem={() => setConfirmRemove({ key: 'class_teacher', label: 'Class Teacher', name: getTeacherById(cls.classTeacherId || '')?.name || 'Teacher' })} onUnmarkRem={() => unmarkRem('class_teacher')} />
        <TeacherField label="Assistant Class Teacher" teacherId={resolveTeacherId('assistant', null)} editMode={editMode} isRemoved={removals.includes('assistant')} onSet={(v) => setP('assistant', v)} onClear={() => clearP('assistant')} onMarkRem={() => setConfirmRemove({ key: 'assistant', label: 'Assistant Class Teacher', name: 'Teacher' })} onUnmarkRem={() => unmarkRem('assistant')} />
      </div>

      <div className="border-t border-border/40" />

      {/* Section rows */}
      {mode === 'separate' && (
        <div className="space-y-4">
          {cls.sections.map((sec) => (
            <div key={sec.id}>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-foreground text-[10px] font-semibold">{sec.name}</div>
                <span className="text-xs font-medium text-foreground">Section {sec.name}</span>
                <span className="text-[10px] text-muted-foreground">Room {sec.room || cls.room}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                <TeacherField label="Section Teacher" teacherId={resolveTeacherId(`section_teacher|${sec.id}`, sec.classTeacherId)} editMode={editMode} isRemoved={removals.includes(`section_teacher|${sec.id}`)} onSet={(v) => setP(`section_teacher|${sec.id}`, v)} onClear={() => clearP(`section_teacher|${sec.id}`)} onMarkRem={() => setConfirmRemove({ key: `section_teacher|${sec.id}`, label: 'Section Teacher', name: getTeacherById(sec.classTeacherId || '')?.name || 'Teacher' })} onUnmarkRem={() => unmarkRem(`section_teacher|${sec.id}`)} />
                <TeacherField label="Assistant" teacherId={resolveTeacherId(`assistant|${sec.id}`, null)} editMode={editMode} isRemoved={removals.includes(`assistant|${sec.id}`)} onSet={(v) => setP(`assistant|${sec.id}`, v)} onClear={() => clearP(`assistant|${sec.id}`)} onMarkRem={() => setConfirmRemove({ key: `assistant|${sec.id}`, label: 'Assistant', name: 'Teacher' })} onUnmarkRem={() => unmarkRem(`assistant|${sec.id}`)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merged mode */}
      {mode === 'merged' && (
        <div className="space-y-1.5">
          {cls.sections.map((sec) => {
            const secTeacher = sec.classTeacherId ? getTeacherById(sec.classTeacherId) : null
            return (
              <div key={sec.id} className="flex items-center justify-between py-1.5 border-t border-border/30 first:border-t-0">
                <div className="flex items-center gap-2"><div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-foreground text-[9px] font-semibold">{sec.name}</div><span className="text-xs text-muted-foreground">Section {sec.name}</span></div>
                <div className="flex items-center gap-2">
                  {secTeacher ? (
                    <><Badge variant="outline" className="text-[8px] text-amber-600 border-amber-500/30">OVERRIDE</Badge><span className="text-xs text-foreground">{secTeacher.name}</span></>
                  ) : (
                    <><Badge variant="outline" className="text-[8px] text-muted-foreground">INHERITED</Badge><span className="text-xs text-muted-foreground">Uses class teacher</span></>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Remove {confirmRemove?.label}?</DialogTitle>
            <DialogDescription className="text-xs">{confirmRemove?.name} will no longer be assigned to {cls.name}.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => { if (confirmRemove) { markRem(confirmRemove.key); setConfirmRemove(null) } }}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* TeacherField — read mode: clean avatar+name row. Edit mode: TeacherPicker pre-populated. */
function TeacherField({ label, teacherId, editMode, isRemoved, onSet, onClear, onMarkRem, onUnmarkRem }: {
  label: string; teacherId: string; editMode: boolean; isRemoved: boolean
  onSet: (v: string) => void; onClear: () => void; onMarkRem: () => void; onUnmarkRem: () => void
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
        {teacherId && <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-rose-600 p-0" onClick={onMarkRem}><UserX className="h-3 w-3" /> Remove</Button>}
      </div>
    )
  }

  // Read mode — clean row
  return (
    <div className="flex items-center gap-2 py-1">
      {teacher ? (
        <>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">{teacher.avatar}</div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground truncate">{teacher.name}</p>
            <p className="text-[10px] text-muted-foreground">{teacher.employeeId} · {teacher.department}</p>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground"><UserX className="h-3.5 w-3.5" /></div>
          <div><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-sm text-muted-foreground/60 italic">Vacant</p></div>
        </div>
      )}
    </div>
  )
}

/* TeacherPicker — premium searchable picker, pre-populated with existing value */
function TeacherPicker({ selectedId, onSelect, placeholder }: {
  selectedId: string; onSelect: (id: string) => void; placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = teachers.find((t) => t.id === selectedId)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return teachers.filter((t) => t.status === 'Active' && (t.name.toLowerCase().includes(q) || t.employeeId.toLowerCase().includes(q) || (t.department || '').toLowerCase().includes(q)))
  }, [search])

  // If a teacher is already selected, show the selected state (pre-populated)
  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white p-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">{selected.avatar}</div>
          <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate leading-tight">{selected.name}</p><p className="text-[10px] text-muted-foreground leading-tight">{selected.employeeId} · {selected.department}</p></div>
        </div>
        <button type="button" onClick={() => onSelect('')} className="text-muted-foreground hover:text-rose-600 p-1"><X className="h-3.5 w-3.5" /></button>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex items-center justify-between w-full h-9 px-3 rounded-lg border border-border bg-white text-xs text-muted-foreground hover:border-primary/40 transition-colors">
          <span>{placeholder}</span><ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teachers…" className="pl-8 h-8 text-xs bg-white" autoFocus />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No teachers found.</p>
          ) : filtered.slice(0, 30).map((t) => (
            <button key={t.id} type="button" onClick={() => { onSelect(t.id); setOpen(false); setSearch('') }} className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-muted/40 transition-colors">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">{t.avatar}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate leading-tight">{t.name}</p><p className="text-[10px] text-muted-foreground leading-tight">{t.employeeId} · {t.department}</p></div>
              {selectedId === t.id && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
