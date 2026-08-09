'use client'

import { useState, useMemo } from 'react'
import { UserCheck, Users, Pencil, ChevronDown, Search, Check, X, UserX } from 'lucide-react'
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

/**
 * ClassTeachers — teacher assignment management.
 * Supports: Separate mode (independent per-section) and Merged mode (class default + overrides).
 * One global Save Changes for all modifications.
 */
export function ClassTeachers({ cls }: { cls: ClassRecord }) {
  const [mode, setMode] = useState<Mode>('separate')
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({})
  const [removeTargets, setRemoveTargets] = useState<string[]>([])
  const [confirmRemove, setConfirmRemove] = useState<{ key: string; label: string; teacherName: string } | null>(null)

  const hasChanges = Object.keys(pendingChanges).length > 0 || removeTargets.length > 0
  const setPending = (key: string, teacherId: string) => setPendingChanges((p) => ({ ...p, [key]: teacherId }))
  const clearPending = (key: string) => setPendingChanges((p) => { const n = { ...p }; delete n[key]; return n })
  const markRemoval = (key: string) => { setRemoveTargets((p) => [...p, key]); setPendingChanges((p) => { const n = { ...p }; delete n[key]; return n }) }
  const unmarkRemoval = (key: string) => setRemoveTargets((p) => p.filter((k) => k !== key))
  const cancelAll = () => { setPendingChanges({}); setRemoveTargets([]) }

  const saveAll = () => {
    let count = 0
    Object.entries(pendingChanges).forEach(() => count++)
    removeTargets.forEach(() => count++)
    if (count > 0) toast.success(`${count} assignment(s) updated`)
    cancelAll()
  }

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex items-center justify-center">
        <div className="inline-flex h-9 p-1 gap-1 rounded-full bg-muted/60">
          <button onClick={() => setMode('separate')} className={cn('px-4 rounded-full text-xs font-medium transition-all', mode === 'separate' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Separate by section</button>
          <button onClick={() => setMode('merged')} className={cn('px-4 rounded-full text-xs font-medium transition-all', mode === 'merged' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Merged (class-wide)</button>
        </div>
      </div>

      {/* Class Teaching Team */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Class Teaching Team</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AssignmentSlot label="Class Teacher" cls={cls} role="class_teacher" sectionId={null} pendingChanges={pendingChanges} removeTargets={removeTargets} onSetPending={setPending} onClearPending={clearPending} onMarkRemoval={markRemoval} onUnmarkRemoval={unmarkRemoval} onConfirmRemove={setConfirmRemove} />
          <AssignmentSlot label="Assistant Class Teacher" cls={cls} role="assistant" sectionId={null} pendingChanges={pendingChanges} removeTargets={removeTargets} onSetPending={setPending} onClearPending={clearPending} onMarkRemoval={markRemoval} onUnmarkRemoval={unmarkRemoval} onConfirmRemove={setConfirmRemove} />
        </div>
      </div>

      {/* Section Assignments */}
      {mode === 'separate' && (
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Section Assignments</p>
          <div className="space-y-3">
            {cls.sections.map((sec) => (
              <div key={sec.id} className="rounded-lg border border-border/60 bg-background/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">{sec.name}</div>
                  <p className="text-sm font-semibold text-foreground">Section {sec.name}</p>
                  <Badge variant="outline" className="text-[8px] ml-auto">{mode === 'separate' ? 'DIRECT' : 'INHERIT'}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <AssignmentSlot label="Section Teacher" cls={cls} role="section_teacher" sectionId={sec.id} pendingChanges={pendingChanges} removeTargets={removeTargets} onSetPending={setPending} onClearPending={clearPending} onMarkRemoval={markRemoval} onUnmarkRemoval={unmarkRemoval} onConfirmRemove={setConfirmRemove} />
                  <AssignmentSlot label="Assistant" cls={cls} role="assistant" sectionId={sec.id} pendingChanges={pendingChanges} removeTargets={removeTargets} onSetPending={setPending} onClearPending={clearPending} onMarkRemoval={markRemoval} onUnmarkRemoval={unmarkRemoval} onConfirmRemove={setConfirmRemove} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merged mode: sections show inherited */}
      {mode === 'merged' && (
        <div className="rounded-lg border border-border/60 bg-card p-4">
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Section Inheritance</p>
          <div className="space-y-2">
            {cls.sections.map((sec) => {
              const secTeacher = sec.classTeacherId ? getTeacherById(sec.classTeacherId) : null
              const isOverride = !!secTeacher
              return (
                <div key={sec.id} className="flex items-center justify-between py-1.5 border-t border-border/40 first:border-t-0">
                  <div className="flex items-center gap-2"><div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-[9px] font-semibold">{sec.name}</div><span className="text-xs text-muted-foreground">Section {sec.name}</span></div>
                  <div className="flex items-center gap-2">
                    {isOverride ? (
                      <><Badge variant="outline" className="text-[8px] text-amber-600 border-amber-500/30">OVERRIDE</Badge><span className="text-xs text-foreground">{secTeacher?.name}</span></>
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

      {/* Global Save bar */}
      {hasChanges && (
        <div className="sticky bottom-0 left-0 right-0 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t border-border flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{Object.keys(pendingChanges).length + removeTargets.length} change(s) pending</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={cancelAll}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveAll}>Save Changes</Button>
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      <Dialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Remove {confirmRemove?.label}?</DialogTitle>
            <DialogDescription className="text-xs">{confirmRemove?.teacherName} will no longer be assigned to {cls.name}.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => { if (confirmRemove) { markRemoval(confirmRemove.key); setConfirmRemove(null) } }}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* AssignmentSlot — read-mostly with pencil edit */
function AssignmentSlot({ label, cls, role, sectionId, pendingChanges, removeTargets, onSetPending, onClearPending, onMarkRemoval, onUnmarkRemoval, onConfirmRemove }: {
  label: string; cls: ClassRecord; role: string; sectionId: string | null
  pendingChanges: Record<string, string>; removeTargets: string[]
  onSetPending: (k: string, v: string) => void; onClearPending: (k: string) => void; onMarkRemoval: (k: string) => void; onUnmarkRemoval: (k: string) => void
  onConfirmRemove: (val: { key: string; label: string; teacherName: string }) => void
}) {
  const key = `${role}|${sectionId || 'null'}`
  const [editing, setEditing] = useState(false)
  const currentId = sectionId ? cls.sections.find((s) => s.id === sectionId)?.classTeacherId : cls.classTeacherId
  const teacher = currentId ? getTeacherById(currentId) : null
  const pendingId = pendingChanges[key]
  const isMarkedForRemoval = removeTargets.includes(key)

  if (isMarkedForRemoval) {
    return (
      <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div><p className="text-xs font-semibold text-rose-600">{label} — marked for removal</p><p className="text-[10px] text-muted-foreground mt-0.5">{teacher?.name} will be removed on Save</p></div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onUnmarkRemoval(key)}>Undo</Button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-primary/40 bg-background/50 p-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
        <TeacherSelector teachers={teachers} selectedId={pendingId || ''} onSelect={(id) => onSetPending(key, id)} excludeId={currentId} placeholder={`Select ${label}`} />
        <div className="flex items-center justify-end gap-2 mt-2">
          {currentId && <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 text-rose-600" onClick={() => { onConfirmRemove({ key, label, teacherName: teacher?.name || 'Teacher' }) }}><UserX className="h-3 w-3" /> Remove</Button>}
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setEditing(false); onClearPending(key) }}>Cancel</Button>
        </div>
      </div>
    )
  }

  if (teacher) {
    return (
      <div className="rounded-lg border border-border/60 bg-background/50 p-3 group">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold">{teacher.avatar}</div>
            <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{teacher.name}</p><p className="text-[10px] text-muted-foreground">{teacher.employeeId} · {teacher.department}</p></div>
          </div>
          <button onClick={() => { setEditing(true); if (currentId) onSetPending(key, currentId) }} className="text-muted-foreground hover:text-primary p-1.5 rounded-md hover:bg-muted/60 transition-colors shrink-0" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground italic">Vacant</span>
        <button onClick={() => { setEditing(true) }} className="flex items-center justify-between h-8 px-3 rounded-lg border border-border bg-white text-xs text-muted-foreground hover:border-primary/40 transition-colors"><span>Assign</span><ChevronDown className="h-3.5 w-3.5 ml-1.5" /></button>
      </div>
    </div>
  )
}

/* TeacherSelector — compact dropdown with search + conflict tags */
function TeacherSelector({ teachers, selectedId, onSelect, excludeId, placeholder }: {
  teachers: any[]; selectedId: string; onSelect: (id: string) => void; excludeId?: string; placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = teachers.find((t) => t.id === selectedId)
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return teachers.filter((t) => t.status === 'Active' && (t.name.toLowerCase().includes(q) || t.employeeId.toLowerCase().includes(q) || (t.department || '').toLowerCase().includes(q)))
  }, [teachers, search])

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white p-2">
        <div className="flex items-center gap-2 min-w-0"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-semibold">{selected.avatar}</div><div className="min-w-0"><p className="text-sm font-medium text-foreground truncate leading-tight">{selected.name}</p><p className="text-[10px] text-muted-foreground leading-tight">{selected.employeeId} · {selected.department}</p></div></div>
        <button type="button" onClick={() => onSelect('')} className="text-muted-foreground hover:text-rose-600 p-1"><X className="h-3.5 w-3.5" /></button>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex items-center justify-between w-full h-8 px-3 rounded-lg border border-border bg-white text-xs text-muted-foreground hover:border-primary/40 transition-colors"><span>{placeholder}</span><ChevronDown className="h-3.5 w-3.5" /></button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border"><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teacher…" className="pl-8 h-8 text-xs bg-white" autoFocus /></div></div>
        <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
          {filtered.length === 0 ? <p className="px-3 py-3 text-xs text-muted-foreground text-center">No teachers found.</p> : filtered.slice(0, 30).map((t) => (
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
