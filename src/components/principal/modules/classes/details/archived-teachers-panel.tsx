'use client'

/**
 * ArchivedTeachersPanel — teacher-specific archive content built on the
 * universal UniversalArchivePanel.
 *
 * Brief section 5: Each teacher card shows avatar + name + employee ID ·
 *   department + archived date. Restore (green) + Delete (rose).
 *
 * Brief section 6: Restore returns teacher to active pool — does NOT
 *   auto-reassign. Delete is permanent + type-to-confirm.
 *
 * Brief section 12: Uses the shared UniversalArchivePanel — no duplicate
 *   Sheet/Dialog infrastructure.
 */
import { useMemo } from 'react'
import { Archive } from 'lucide-react'
import { useTeachersMockStore } from '@/lib/store/teachers-mock-store'
import { UniversalArchivePanel, type ArchiveItem } from '../../shared/universal-archive-panel'
import { formatRelativeTime } from '@/lib/format'
import { toast } from 'sonner'

export function ArchivedTeachersPanel({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const teachers = useTeachersMockStore((s) => s.teachers)
  const restoreTeacher = useTeachersMockStore((s) => s.restoreTeacher)
  const deleteTeacher = useTeachersMockStore((s) => s.deleteTeacher)

  const archivedItems: ArchiveItem[] = useMemo(
    () => teachers
      .filter((t) => t.archived)
      .map((t) => ({ id: t.id, name: t.name, archivedAt: t.archivedAt })),
    [teachers]
  )

  return (
    <UniversalArchivePanel
      open={open}
      onOpenChange={onOpenChange}
      title="Archived Teachers"
      description="not available for active assignment"
      searchPlaceholder="Search archived teachers…"
      items={archivedItems}
      onRestore={(item) => {
        restoreTeacher(item.id)
        toast.success(`${item.name} restored to active pool`)
      }}
      onDelete={(item) => {
        deleteTeacher(item.id)
        toast.success(`${item.name} permanently deleted`)
      }}
      emptyState={
        <div className="py-12 text-center">
          <Archive className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No archived teachers</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            Archived teachers will appear here for recovery.
          </p>
        </div>
      }
      renderItem={(item) => {
        const teacher = teachers.find((t) => t.id === item.id)
        if (!teacher) return null
        return (
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">
              {teacher.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{teacher.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {teacher.employeeId} · {teacher.department}
              </p>
              {teacher.archivedAt && (
                <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                  Archived {formatRelativeTime(teacher.archivedAt)}
                </p>
              )}
            </div>
          </div>
        )
      }}
    />
  )
}
