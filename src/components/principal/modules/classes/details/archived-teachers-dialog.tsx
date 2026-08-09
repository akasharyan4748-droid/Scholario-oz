'use client'

/**
 * ArchivedTeachersDialog — recovery surface for archived teachers.
 *
 * Brief section 5: "Clicking Archived should reveal an elegant archive surface."
 *   - Shows all teachers with `archived === true` in the teachers-mock-store.
 *   - Each row: avatar + name + employee ID + department + archived date.
 *   - Restore: returns teacher to active pool (does NOT auto-reassign).
 *   - Delete permanently: stronger confirmation (irreversible).
 *
 * Brief section 5 + 16: archive/restore/delete operate on the teacher
 * LIFECYCLE state, separate from the class assignment state.
 */
import { useState, useMemo } from 'react'
import { Archive, RotateCcw, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useTeachersMockStore } from '@/lib/store/teachers-mock-store'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/format'

export function ArchivedTeachersDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const teachers = useTeachersMockStore((s) => s.teachers)
  const restoreTeacher = useTeachersMockStore((s) => s.restoreTeacher)
  const deleteTeacher = useTeachersMockStore((s) => s.deleteTeacher)

  const [restoreTarget, setRestoreTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const archivedTeachers = useMemo(
    () => teachers.filter((t) => t.archived),
    [teachers]
  )

  const handleRestore = () => {
    if (!restoreTarget) return
    restoreTeacher(restoreTarget.id)
    toast.success(`${restoreTarget.name} restored to active pool`)
    setRestoreTarget(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteConfirmText !== deleteTarget.name.toUpperCase()) return
    deleteTeacher(deleteTarget.id)
    toast.success(`${deleteTarget.name} permanently deleted`)
    setDeleteTarget(null)
    setDeleteConfirmText('')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Archive className="h-4 w-4 text-muted-foreground" />
              Archived Teachers
            </DialogTitle>
            <DialogDescription className="text-xs">
              {archivedTeachers.length === 0
                ? 'No archived teachers. Archived teachers will appear here for recovery.'
                : `${archivedTeachers.length} archived teacher${archivedTeachers.length === 1 ? '' : 's'}. Restore to return to active pool, or permanently delete.`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 max-h-96 overflow-y-auto">
            {archivedTeachers.length === 0 ? (
              <div className="py-8 text-center">
                <Archive className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No archived teachers.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/60 divide-y divide-border/30">
                {archivedTeachers.map((t) => (
                  <div key={t.id} className="px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">
                        {t.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {t.employeeId} · {t.department}
                          {t.archivedAt && (
                            <span className="ml-1.5 text-muted-foreground/60">
                              · archived {formatRelativeTime(t.archivedAt)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] gap-1 text-emerald-600 hover:bg-emerald-500/10"
                        onClick={() => setRestoreTarget({ id: t.id, name: t.name })}
                        title="Restore teacher to active pool"
                      >
                        <RotateCcw className="h-3 w-3" /> Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] gap-1 text-rose-600 hover:bg-rose-500/10"
                        onClick={() => { setDeleteTarget({ id: t.id, name: t.name }); setDeleteConfirmText('') }}
                        title="Permanently delete teacher record"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore confirmation — compact */}
      <Dialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-emerald-600" />
              Restore {restoreTarget?.name}?
            </DialogTitle>
            <DialogDescription className="text-xs">
              {restoreTarget?.name} will return to the active teacher pool and become available for assignment. They will NOT be automatically reassigned to their previous slot.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRestoreTarget(null)}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRestore}>
              Restore Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation — stronger (type teacher name to confirm) */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteConfirmText('') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
              Permanently delete {deleteTarget?.name}?
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action is irreversible. The teacher record will be permanently removed and cannot be recovered. To confirm, type the teacher&rsquo;s name in uppercase below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteTarget?.name.toUpperCase()}
              className="h-8 text-xs font-mono"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setDeleteTarget(null); setDeleteConfirmText('') }}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteConfirmText !== deleteTarget?.name.toUpperCase()}
              onClick={handleDelete}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
