'use client'

import { useState } from 'react'
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
import { useMemo } from 'react'

type Mode = 'separate' | 'merged'

export function ClassTeachers({ cls }: { cls: ClassRecord }) {
  const [mode, setMode] = useState<Mode>('separate')
  const [editMode, setEditMode] = useState(false)
  const [pending, setPending] = useState<Record<string, string>>({})
  const [removals, setRemovals] = useState<string[]>([])
  const [confirmRemove, setConfirmRemove] = useState<{ key: string; label: string; name: string } | null>(null)

  const hasChanges = Object.keys(pending).length > 0 || removals.length > 0
  const setP = (k: string, v: string) => setPending((p) => ({ ...p, [k]: v }))
  const clearP = (k: string) => setPending((p) => { const n = { ...p }; delete n[k]; return n })
  const markRem = (k: string) => { setRemovals((p) => [...p, k]); setPending((p) => { const n = { ...p }; delete n[k]; return n }) }
  const unmarkRem = (k: string) => setRemovals((p) => p.filter((x) => x !== k))

  const enterEdit = () => { setEditMode(true); setPending({}); setRemovals([]) }
  const exitEdit = () => { setEditMode(false); setPending({}); setRemovals([]) }
  const save = () => {
    const c = Object.keys(pending).length + removals.length
    if (c > 0) toast.success(`${c} assignment(s) updated`)
    exitEdit()
  }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
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

      {/* Class Teaching Team — flat rows, no nested cards */}
      <div>
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Class Teaching Team</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TeacherRow label="Class Teacher" teacherId={cls.classTeacherId} editMode={editMode} pending={pending} removals={removals} onSet={(v) => setP('class_teacher|null', v)} onClear={() => clearP('class_teacher|null')} onMarkRem={() => setConfirmRemove({ key: 'class_teacher|null', label: 'Class Teacher', name: getTeacherById(cls.classTeacherId)?.name || 'Teacher' })} onUnmarkRem={() => unmarkRem('class_teacher|null')} onConfirmRemove={setConfirmRemove} />
          <TeacherRow label="Assistant" teacherId={null} editMode={editMode} pending={pending} removals={removals} onSet={(v) => setP('assistant|null', v)} onClear={() => clearP('assistant|null')} onMarkRem={() => setConfirmRemove({ key: 'assistant|null', label: 'Assistant', name: 'Teacher' })} onUnmarkRem={() => unmarkRem('assistant|null')} onConfirmRemove={setConfirmRemove} />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* Section Assignments — flat rows */}
      {mode === 'separate' && (
        <div>
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Section Assignments</p>
          <div className="space-y-4">
            {cls.sections.map((sec) => (
              <div key={sec.id}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-semibold">{sec.name}</div>
                  <span className="text-xs font-semibold text-foreground">Section {sec.name}</span>
                  <Badge variant="outline" className="text-[8px] text-muted-foreground">DIRECT</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                  <TeacherRow label="Section Teacher" teacherId={sec.classTeacherId} editMode={editMode} pending={pending} removals={removals} onSet={(v) => setP(`section_teacher|${sec.id}`, v)} onClear={() => clearP(`section_teacher|${sec.id}`)} onMarkRem={() => setConfirmRemove({ key: `section_teacher|${sec.id}`, label: 'Section Teacher', name: getTeacherById(sec.classTeacherId || '')?.name || 'Teacher' })} onUnmarkRem={() => unmarkRem(`section_teacher|${sec.id}`)} onConfirmRemove={setConfirmRemove} />
                  <TeacherRow label="Assistant" teacherId={null} editMode={editMode} pending={pending} removals={removals} onSet={(v) => setP(`assistant|${sec.id}`, v)} onClear={() => clearP(`assistant|${sec.id}`)} onMarkRem={() => setConfirmRemove({ key: `assistant|${sec.id}`, label: 'Assistant', name: 'Teacher' })} onUnmarkRem={() => unmarkRem(`assistant|${sec.id}`)} onConfirmRemove={setConfirmRemove} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merged mode: section inheritance summary */}
      {mode === 'merged' && (
        <div>
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Section Inheritance</p>
          <div className="space-y-1.5">
            {cls.sections.map((sec) => {
              const secTeacher = sec.classTeacherId ? getTeacherById(sec.classTeacherId) : null
              return (
                <div key={sec.id} className="flex items-center justify-between py-1.5 border-t border-border/30 first:border-t-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[9px] font-semibold">{sec.name}</div>
                    <span className="text-xs text-muted-foreground">Section {sec.name}</span>
                  </div>
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
        </div>
      )}

      {/* Remove confirmation */}
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

/* TeacherRow — flat row, no card border. Editable only in editMode. */
function TeacherRow({ label, teacherId, editMode, pending, removals, onSet, onClear, onMarkRem, onUnmarkRem, onConfirmRemove }: {
  label: string; teacherId: string | null | undefined; editMode: boolean
  pending: Record<string, string>; removals: string[]
  onSet: (v: string) => void; onClear: () => void; onMarkRem: () => void; onUnmarkRem: () => void
  onConfirmRemove: (v: { key: string; label: string; name: string }) => void
}) {
  const key = `${label}`
  const teacher = teacherId ? getTeacherById(teacherId) : null
  const pendingId = pending[`${label}|null`] || pending[`${label}`]
  const isRemoved = removals.includes(`${label}|null`) || removals.includes(`${label}`)

  if (isRemoved) {
    return (
      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-semibold text-rose-600">{label} — marked for removal</span>
        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={onUnmarkRem}>Undo</Button>
      </div>
    )
  }

  if (editMode) {
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <TeacherPicker selectedId={pendingId || ''} onSelect={onSet} placeholder={`Select ${label}`} />
        <div className="flex items-center gap-2">
          {teacherId && <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-rose-600" onClick={onMarkRem}><UserX className="h-3 w-3" /> Remove</Button>}
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={onClear}>Clear</Button>
        </div>
      </div>
    )
  }

  // Read mode — clean, no borders, no pencils
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-2 min-w-0">
        {teacher ? (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-semibold">{teacher.avatar}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{teacher.name}</p>
              <p className="text-[10px] text-muted-foreground">{teacher.employeeId} · {teacher.department}</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground text-[10px]"><UserX className="h-3.5 w-3.5" /></div>
            <div><p className="text-sm text-muted-foreground italic">{label}</p><p className="text-[10px] text-muted-foreground/60">Vacant</p></div>
          </>
        )}
      </div>
    </div>
  )
}

/* TeacherPicker — premium searchable command-style picker */
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

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white p-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-semibold">{selected.avatar}</div>
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
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-semibold">{t.avatar}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate leading-tight">{t.name}</p><p className="text-[10px] text-muted-foreground leading-tight">{t.employeeId} · {t.department}</p></div>
              {selectedId === t.id && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
