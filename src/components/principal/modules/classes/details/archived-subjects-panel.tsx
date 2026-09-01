'use client'

/**
 * ArchivedSubjectsPanel — subject-specific archive content built on the
 * universal UniversalArchivePanel.
 *
 * Spec §7 / §25: archived subjects are preserved per-class for restore.
 * The panel reads from `liveClass.archivedSubjects` (which now stores
 * subject IDs + a display-name snapshot from archive time). Code and
 * category are resolved from the canonical `academicSubjects` registry.
 */

import { useMemo } from 'react'
import { Archive } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useStudentsStore } from '@/lib/store/students-store'
import type { ClassRecord, ArchivedSubject } from '@/lib/store/students-store'
import { UniversalArchivePanel, type ArchiveItem } from '../../shared/universal-archive-panel'
import { toast } from 'sonner'

function toArchiveItem(a: ArchivedSubject): ArchiveItem {
  // ArchivedSubject stores both id (canonical) and name (snapshot at archive time).
  // Use id as the unique key so restore/delete actions hit the right subject.
  return { id: a.id, name: a.name, archivedAt: a.archivedAt }
}

export function ArchivedSubjectsPanel({ open, onOpenChange, cls, onRestore, onDelete }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  cls: ClassRecord
  onRestore: (subjectId: string) => void
  onDelete: (subjectId: string) => void
}) {
  const liveClass = useStudentsStore((s) => s.getClassById(cls.id)) ?? cls
  const academicSubjects = useStudentsStore((s) => s.academicSubjects)

  const archivedItems: ArchiveItem[] = useMemo(
    () => (liveClass.archivedSubjects ?? []).map(toArchiveItem),
    [liveClass.archivedSubjects]
  )

  return (
    <UniversalArchivePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Archived Subjects"
      description={`not available for ${liveClass.name}`}
      searchPlaceholder="Search archived subjects…"
      items={archivedItems}
      onRestore={(item) => {
        onRestore(item.id)
        toast.success(`${item.name} restored`)
      }}
      onDelete={(item) => {
        onDelete(item.id)
        toast.success(`${item.name} permanently deleted`)
      }}
      emptyState={
        <div className="py-12 text-center">
          <Archive className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No archived subjects</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            Archived subjects will appear here for recovery.
          </p>
        </div>
      }
      renderItem={(item) => {
        // Resolve canonical metadata by id (Spec §28). If the subject has
        // been renamed since archiving, the snapshot name is shown but the
        // code/category reflect the current registry state.
        const subj = academicSubjects.find((s) => s.id === item.id)
        const category = subj?.category ?? 'Core'
        const code = subj?.code ?? item.name.substring(0, 3).toUpperCase()
        return (
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Archive className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">{code}</Badge>
                <span className="text-[10px] text-muted-foreground">{category}</span>
              </div>
              {item.archivedAt && (
                <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                  Archived {new Date(item.archivedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )
      }}
    />
  )
}
