'use client'

/**
 * ClassSubjects — subject allocation management.
 *
 * Brief section 12 + 13: Compact premium cards. Section heading such as
 * "Subjects" — sufficient. NO outer white wrapper around the cards.
 *
 * Brief section 13 + 14 + 33: Subject archive must actually work as a
 * lifecycle: Active → Archive → Restore → Active. Archive must update
 * the underlying state, NOT just hide the card visually. The archived
 * subject is preserved in `cls.archivedSubjects` and recoverable via
 * the Restore dialog.
 *
 * Brief section 14: Normal mode is clean. Edit mode reveals Archive
 * actions intentionally to prevent accidental destructive clicks.
 *
 * Brief section 11 + 12: Uses the SAME shared SubjectCard as Overview
 * (management variant when in edit mode, read-only variant otherwise).
 *
 * Brief section 27: Canonical section heading:
 *   `text-xs font-bold text-primary mb-3 uppercase tracking-wider`
 */
import { useState, useMemo } from 'react'
import { BookOpen, Plus, Archive, Pencil, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useStudentsStore } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { SUBJECTS_BY_LEVEL } from '@/lib/store/students-store/constants'
import { SubjectCard } from './subject-card'
import { ArchivedSubjectsPanel } from './archived-subjects-panel'
import { ConfirmDialog } from '../../shared/confirm-dialog'
import { toast } from 'sonner'

export function ClassSubjects({ cls }: { cls: ClassRecord }) {
  // Subscribe to canonical class so external mutations (archive/add/restore)
  // reflect here immediately. Brief section 22 + 33.
  const liveClass = useStudentsStore((s) => s.getClassById(cls.id)) ?? cls
  const addClassSubject = useStudentsStore((s) => s.addClassSubject)
  const archiveClassSubject = useStudentsStore((s) => s.archiveClassSubject)
  const restoreClassSubject = useStudentsStore((s) => s.restoreClassSubject)
  const deleteArchivedSubject = useStudentsStore((s) => s.deleteArchivedSubject)

  const [editMode, setEditMode] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null)
  const [archivedOpen, setArchivedOpen] = useState(false)

  const handleAdd = (subject: string) => {
    if (liveClass.subjects.includes(subject)) {
      toast.error(`${subject} is already allocated`)
      return
    }
    addClassSubject(liveClass.id, subject)
    toast.success(`${subject} added to ${liveClass.name}`)
    setAddOpen(false)
  }

  const handleArchive = () => {
    if (!archiveTarget) return
    archiveClassSubject(liveClass.id, archiveTarget)
    toast.success(`${archiveTarget} archived — recoverable from Archive`)
    setArchiveTarget(null)
  }

  const handleRestore = (subject: string) => {
    restoreClassSubject(liveClass.id, subject)
  }

  const handleDelete = (subject: string) => {
    deleteArchivedSubject(liveClass.id, subject)
  }

  const archivedCount = liveClass.archivedSubjects?.length ?? 0

  return (
    <div className="space-y-3">
      {/* Header row — compact label + actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">Subjects</p>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setArchivedOpen(true)}
            title="View archived subjects"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Archived</span>
            {archivedCount > 0 && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-300">{archivedCount}</Badge>
            )}
          </Button>
          {editMode ? (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => setEditMode(false)}>Done</Button>
          ) : (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => setEditMode(true)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="h-3 w-3" /> Add Subject
          </Button>
        </div>
      </div>

      {/* Subject cards — directly on page, no outer container */}
      {liveClass.subjects.length === 0 ? (
        <div className="py-6 text-center">
          <BookOpen className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">No subjects allocated for this class.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {liveClass.subjects.map((subj) => (
            <SubjectCard
              key={subj}
              subject={subj}
              cls={liveClass}
              manageable={editMode}
              onArchive={(s) => setArchiveTarget(s)}
            />
          ))}
        </div>
      )}

      <AddSubjectDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingSubjects={liveClass.subjects}
        onAdd={handleAdd}
        cls={liveClass}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
        title={`Archive ${archiveTarget}?`}
        description={`${archiveTarget} will leave the active subject list for ${liveClass.name}. Historical academic records will be preserved. The subject can be restored from the Archive.`}
        tone="amber"
        icon={Archive}
        confirmLabel="Archive Subject"
        onConfirm={handleArchive}
      />

      {/* Archived subjects recovery panel (universal) */}
      <ArchivedSubjectsPanel
        open={archivedOpen}
        onOpenChange={setArchivedOpen}
        cls={liveClass}
        onRestore={handleRestore}
        onDelete={handleDelete}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* AddSubjectDialog — search + select from canonical subjects list    */
/* ------------------------------------------------------------------ */
function AddSubjectDialog({ open, onOpenChange, existingSubjects, onAdd, cls }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  existingSubjects: string[]
  onAdd: (s: string) => void
  cls: ClassRecord
}) {
  const [search, setSearch] = useState('')
  const available = useMemo(
    () => (SUBJECTS_BY_LEVEL[cls.level] || []).filter((s) => !existingSubjects.includes(s)),
    [existingSubjects, cls.level]
  )
  const filtered = useMemo(
    () => available.filter((s) => s.toLowerCase().includes(search.toLowerCase())),
    [available, search]
  )

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
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject…"
              className="pl-8 h-8 text-xs"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/30">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No subjects available to add.</p>
            ) : filtered.map((s) => (
              <button
                key={s}
                onClick={() => onAdd(s)}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/40 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s}</p>
                  <p className="text-[10px] text-muted-foreground">{s.substring(0, 3).toUpperCase()} · {SUBJECTS_BY_LEVEL[cls.level].includes(s) ? 'Core' : 'Elective'}</p>
                </div>
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
