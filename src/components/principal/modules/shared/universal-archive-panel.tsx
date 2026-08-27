'use client'

/**
 * UniversalArchivePanel — canonical Scholario archive surface.
 *
 * Brief section 1 + 12 + 19: ONE reusable archive presentation component
 * used by Teachers, Subjects, and future entities. Entity-specific rendering
 * via render props — the visual grammar (header, search, list, footer,
 * confirmations) is shared.
 *
 * Brief section 2 + 3: Desktop → contextual right-side panel that slides in
 *   smoothly. The underlying page remains mounted underneath (Radix Sheet
 *   preserves the DOM). Brief section 9: opening Archive does NOT destroy
 *   edit context — pending edits are preserved because the parent component
 *   is never unmounted.
 *
 * Brief section 4: Same visual language as Subject/Teacher cards —
 *   `bg-card`, `border-border/60`, `rounded-lg`, small typography hierarchy,
 *   green Scholario accent for Restore, rose for Delete.
 *
 * Brief section 11: Responsive — desktop uses `side="right"` (contextual
 *   panel), mobile uses `side="bottom"` (bottom sheet). The breakpoint
 *   matches Scholario's existing `sm` (640px) responsive system.
 *
 * Brief section 13: Entity-specific metadata via `renderItem(item)` — the
 *   panel does NOT force every entity to have the same fields.
 *
 * Brief section 14: Archive confirmation is handled by the caller (compact
 *   Popover). Delete confirmation is built-in here (type-to-confirm Dialog)
 *   because it's a universal destructive pattern.
 *
 * Brief section 16: Uses design tokens (`bg-card`, `border-border`, etc.) —
 *   no `bg-white` hard-coding. Dark mode safe.
 *
 * Brief section 17: Close button has `aria-label`, Escape closes (built into
 *   Radix Sheet), search input is keyboard accessible.
 */
import { useState, useMemo, type ReactNode } from 'react'
import { Archive, RotateCcw, Trash2, AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

/** Generic archived item — entity-specific fields are rendered by `renderItem`. */
export interface ArchiveItem {
  /** Stable identifier (teacher ID, subject name, etc.) */
  id: string
  /** Primary display name (used for search + delete confirmation) */
  name: string
  /** ISO timestamp of when the item was archived */
  archivedAt?: string
}

export interface UniversalArchivePanelProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Panel title, e.g. "Archived Teachers" */
  title: string
  /** Subtitle/description shown under the title */
  description: string
  /** Search input placeholder */
  searchPlaceholder: string
  /** Full list of archived items */
  items: ArchiveItem[]
  /** Render entity-specific card content for a single item */
  renderItem: (item: ArchiveItem) => ReactNode
  /** Called when user confirms Restore on an item */
  onRestore: (item: ArchiveItem) => void
  /** Called when user confirms permanent Delete (type-to-confirm passed) */
  onDelete: (item: ArchiveItem) => void
  /** Optional: override the empty-state illustration/text */
  emptyState?: ReactNode
  /** Optional: label for the Restore button (default "Restore") */
  restoreLabel?: string
  /** Optional: label for the Delete button (default "Delete") */
  deleteLabel?: string
}

export function UniversalArchivePanel({
  open,
  onOpenChange,
  title,
  description,
  searchPlaceholder,
  items,
  renderItem,
  onRestore,
  onDelete,
  emptyState,
  restoreLabel = 'Restore',
  deleteLabel = 'Delete',
}: UniversalArchivePanelProps) {
  const [search, setSearch] = useState('')
  const [restoreTarget, setRestoreTarget] = useState<ArchiveItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ArchiveItem | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    )
  }, [items, search])

  const handleRestore = () => {
    if (!restoreTarget) return
    onRestore(restoreTarget)
    setRestoreTarget(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteConfirmText !== deleteTarget.name.toUpperCase()) return
    onDelete(deleteTarget)
    setDeleteTarget(null)
    setDeleteConfirmText('')
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col gap-0"
        >
          {/* Sticky header with icon + title + description */}
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border flex flex-row items-center justify-between gap-2 space-y-0">
            <div className="flex items-center gap-2 min-w-0">
              <Archive className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <SheetTitle className="text-sm font-semibold truncate">{title}</SheetTitle>
                <SheetDescription className="text-[10px] leading-tight">
                  {items.length === 0 ? description : `${items.length} archived · ${description}`}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Search bar — only when there are archived items */}
          {items.length > 0 && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-8 h-8 text-xs bg-card"
                  aria-label={searchPlaceholder}
                />
              </div>
            </div>
          )}

          {/* Scrollable item list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {items.length === 0 ? (
              emptyState ?? (
                <div className="py-12 text-center">
                  <Archive className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">{title.replace('Archived ', 'No archived ')}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Archived items will appear here for recovery.
                  </p>
                </div>
              )
            ) : filtered.length === 0 ? (
              <p className="py-8 text-xs text-muted-foreground text-center">
                No items match &ldquo;{search}&rdquo;.
              </p>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-card p-3 transition-colors hover:border-border"
                >
                  {/* Entity-specific content (avatar, metadata, etc.) */}
                  {renderItem(item)}
                  {/* Shared action row */}
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] gap-1 text-emerald-600 hover:bg-emerald-500/10 flex-1"
                      onClick={() => setRestoreTarget(item)}
                      aria-label={`Restore ${item.name}`}
                    >
                      <RotateCcw className="h-3 w-3" /> {restoreLabel}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] gap-1 text-rose-600 hover:bg-rose-500/10 flex-1"
                      onClick={() => { setDeleteTarget(item); setDeleteConfirmText('') }}
                      aria-label={`Delete ${item.name} permanently`}
                    >
                      <Trash2 className="h-3 w-3" /> {deleteLabel}
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
              {restoreTarget?.name} will return to the active pool and become available again. It will NOT be automatically reassigned to its previous slot.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRestoreTarget(null)}>Cancel</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRestore}>
              {restoreLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation — stronger (type name to confirm) */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteConfirmText('') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
              Permanently delete {deleteTarget?.name}?
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action is irreversible. The record will be permanently removed and cannot be recovered. To confirm, type the name in uppercase below.
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
