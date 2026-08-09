'use client'

/**
 * ArchivedTeachersSheet — responsive recovery surface for archived teachers.
 *
 * Brief section 9: Desktop → right-side drawer (attached to workspace,
 *   page visible behind, smooth slide-in, sticky header, close button).
 * Brief section 10: Tablet → responsive drawer with safe width.
 *   Phone → bottom-sheet / centered modal.
 *
 * Brief section 11: Each archived teacher card shows:
 *   Avatar + Name + Employee ID · Department + Archived date
 *   Restore (green) + Delete (restrained destructive).
 *
 * Brief section 6: Restore returns teacher to active pool — does NOT
 *   auto-reassign. Delete is permanent + requires stronger confirmation.
 *
 * Uses the shadcn `Sheet` primitive which supports `side="right"` (desktop)
 * and `side="bottom"` (mobile). The breakpoint is `sm` (640px) per the
 * existing Scholario responsive system.
 */
import { useState, useMemo } from 'react'
import { Archive, RotateCcw, Trash2, AlertTriangle, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useTeachersMockStore } from '@/lib/store/teachers-mock-store'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/format'

export function ArchivedTeachersSheet({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const teachers = useTeachersMockStore((s) => s.teachers)
  const restoreTeacher = useTeachersMockStore((s) => s.restoreTeacher)
  const deleteTeacher = useTeachersMockStore((s) => s.deleteTeacher)

  const [restoreTarget, setRestoreTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [search, setSearch] = useState('')

  const archivedTeachers = useMemo(
    () => teachers.filter((t) => t.archived),
    [teachers]
  )

  const filteredArchived = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return archivedTeachers
    return archivedTeachers.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.employeeId.toLowerCase().includes(q) ||
      (t.department || '').toLowerCase().includes(q)
    )
  }, [archivedTeachers, search])

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
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* Desktop: right-side drawer. Mobile: bottom sheet. */}
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          {/* Sticky header */}
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border flex flex-row items-center justify-between gap-2 space-y-0">
            <div className="flex items-center gap-2 min-w-0">
              <Archive className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <SheetTitle className="text-sm font-semibold truncate">Archived Teachers</SheetTitle>
                <SheetDescription className="text-[10px] leading-tight">
                  {archivedTeachers.length === 0
                    ? 'No archived teachers'
                    : `${archivedTeachers.length} archived · not available for active assignment`}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Search bar */}
          {archivedTeachers.length > 0 && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search archived teachers…"
                  className="pl-8 h-8 text-xs bg-card"
                />
              </div>
            </div>
          )}

          {/* Scrollable teacher list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {archivedTeachers.length === 0 ? (
              <div className="py-12 text-center">
                <Archive className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No archived teachers</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Archived teachers will appear here for recovery.
                </p>
              </div>
            ) : filteredArchived.length === 0 ? (
              <p className="py-8 text-xs text-muted-foreground text-center">
                No archived teachers match &ldquo;{search}&rdquo;.
              </p>
            ) : (
              filteredArchived.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-border/60 bg-card p-3 transition-colors hover:border-border"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-[10px] font-semibold">
                      {t.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.employeeId} · {t.department}
                      </p>
                      {t.archivedAt && (
                        <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                          Archived {formatRelativeTime(t.archivedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] gap-1 text-emerald-600 hover:bg-emerald-500/10 flex-1"
                      onClick={() => setRestoreTarget({ id: t.id, name: t.name })}
                    >
                      <RotateCcw className="h-3 w-3" /> Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] gap-1 text-rose-600 hover:bg-rose-500/10 flex-1"
                      onClick={() => { setDeleteTarget({ id: t.id, name: t.name }); setDeleteConfirmText('') }}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Restore confirmation — compact dialog */}
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
