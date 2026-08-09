'use client'

/**
 * ArchivedSubjectsPanel — subject-specific archive content built on the
 * universal UniversalArchivePanel.
 *
 * Brief section 6: Subject archive uses THE SAME universal archive panel
 *   as Teachers. No separate centered modal.
 *
 * Each subject card shows: subject name + code + category + archived date.
 * Restore + Delete (type-to-confirm) shared via the universal panel.
 */
import { useMemo } from 'react'
import { Archive } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useStudentsStore } from '@/lib/store/students-store'
import { SUBJECTS_BY_LEVEL } from '@/lib/store/students-store/constants'
import type { ClassRecord, ArchivedSubject } from '@/lib/store/students-store'
import { UniversalArchivePanel, type ArchiveItem } from '../../shared/universal-archive-panel'
import { toast } from 'sonner'

function toArchiveItem(a: ArchivedSubject): ArchiveItem {
  return { id: a.name, name: a.name, archivedAt: a.archivedAt }
}

export function ArchivedSubjectsPanel({ open, onOpenChange, cls, onRestore, onDelete }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  cls: ClassRecord
  onRestore: (subject: string) => void
  onDelete: (subject: string) => void
}) {
  // Subscribe to canonical class so archived subjects reflect immediately
  // even if the user archives a subject while the panel is open.
  const liveClass = useStudentsStore((s) => s.getClassById(cls.id)) ?? cls

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
        onRestore(item.name)
        toast.success(`${item.name} restored`)
      }}
      onDelete={(item) => {
        onDelete(item.name)
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
        const levelSubjects = SUBJECTS_BY_LEVEL[liveClass.level] || []
        const category = levelSubjects.includes(item.name) ? 'Core' : 'Elective'
        const code = item.name.substring(0, 3).toUpperCase()
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
