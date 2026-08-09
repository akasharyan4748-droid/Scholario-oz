'use client'

import { useState, useMemo } from 'react'
import { BookOpen, Plus, Archive, Pencil, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { ClassRecord } from '@/lib/store/students-store'
import { getTeacherById } from '@/lib/mock/teachers'
import { SUBJECTS_BY_LEVEL } from '@/lib/store/students-store/constants'
import { toast } from 'sonner'

/**
 * ClassSubjects — subject allocation as a page-level section (no outer card container).
 * Default = clean read mode. Edit mode reveals per-subject actions.
 */
export function ClassSubjects({ cls }: { cls: ClassRecord }) {
  const [subjects, setSubjects] = useState(cls.subjects)
  const [editMode, setEditMode] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null)

  const handleAdd = (subject: string) => {
    if (subjects.includes(subject)) { toast.error(`${subject} is already allocated`); return }
    setSubjects([...subjects, subject])
    toast.success(`${subject} added to ${cls.name}`)
    setAddOpen(false)
  }

  const handleArchive = () => {
    if (!archiveTarget) return
    setSubjects(subjects.filter((s) => s !== archiveTarget))
    toast.success(`${archiveTarget} archived`)
    setArchiveTarget(null)
  }

  const subjectMeta = (name: string) => {
    const levelSubjects = SUBJECTS_BY_LEVEL[cls.level] || []
    return { code: name.substring(0, 3).toUpperCase(), category: levelSubjects.includes(name) ? 'Core' : 'Elective' }
  }

  return (
    <div className="space-y-3">
      {/* Section header — no outer card */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">Subjects</p>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => toast.info('Archived subjects — feature coming')} title="Archived subjects">
            <Archive className="h-3.5 w-3.5" />
          </Button>
          {editMode ? (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => setEditMode(false)}>Done</Button>
          ) : (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => setEditMode(true)}><Pencil className="h-3 w-3" /> Edit</Button>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="h-3 w-3" /> Add Subject
          </Button>
        </div>
      </div>

      {/* Subject cards — directly on page, no outer container */}
      {subjects.length === 0 ? (
        <div className="py-6 text-center">
          <BookOpen className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">No subjects allocated for this class.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {subjects.map((subj) => {
            const meta = subjectMeta(subj)
            const teacher = cls.classTeacherId ? getTeacherById(cls.classTeacherId) : null
            return (
              <div key={subj} className="rounded-lg border border-border/60 bg-card p-3 hover:border-border transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      <p className="text-sm font-medium text-foreground truncate">{subj}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">{meta.code}</Badge>
                      <span className="text-[10px] text-muted-foreground">{meta.category}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {teacher ? teacher.name : 'No teacher assigned'}
                    </p>
                  </div>
                  {editMode && (
                    <button onClick={() => setArchiveTarget(subj)} className="text-[10px] text-amber-600 hover:text-amber-700 font-medium px-1.5 py-0.5 rounded hover:bg-amber-500/10 transition-colors shrink-0">
                      Archive
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddSubjectDialog open={addOpen} onOpenChange={setAddOpen} existingSubjects={subjects} onAdd={handleAdd} cls={cls} />

      <Dialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Archive {archiveTarget}?</DialogTitle>
            <DialogDescription className="text-xs">
              This will remove {archiveTarget} from the active subjects for {cls.name}. Historical academic records will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setArchiveTarget(null)}>Cancel</Button>
            <Button variant="outline" size="sm" className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10" onClick={handleArchive}>Archive Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddSubjectDialog({ open, onOpenChange, existingSubjects, onAdd, cls }: {
  open: boolean; onOpenChange: (o: boolean) => void; existingSubjects: string[]; onAdd: (s: string) => void; cls: ClassRecord
}) {
  const [search, setSearch] = useState('')
  const available = useMemo(() => (SUBJECTS_BY_LEVEL[cls.level] || []).filter((s) => !existingSubjects.includes(s)), [existingSubjects, cls.level])
  const filtered = useMemo(() => available.filter((s) => s.toLowerCase().includes(search.toLowerCase())), [available, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Add Subject</DialogTitle>
          <DialogDescription className="text-xs">Select a subject to allocate to {cls.name}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject…" className="pl-8 h-8 text-xs" autoFocus />
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/30">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No subjects available to add.</p>
            ) : filtered.map((s) => (
              <button key={s} onClick={() => onAdd(s)} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/40 transition-colors text-left">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{s}</p><p className="text-[10px] text-muted-foreground">{s.substring(0, 3).toUpperCase()}</p></div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
