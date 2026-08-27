'use client'

/**
 * StructuralRowControls — × (delete row) and + (insert row) controls.
 *
 * Brief section 7-9: × at top-left corner inside the period cell.
 * Brief section 12-14: + centered on the horizontal divider line using
 *   true 50% centering (NOT hardcoded left offset).
 */
import { useState } from 'react'
import { Plus, X, Coffee } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** × button — deletes the structural row. Positioned at top-left of the cell. */
export function RowDeleteButton({ onDelete, label }: { onDelete: () => void; label: string }) {
  return (
    <button
      onClick={onDelete}
      className="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full border border-border/60 bg-card text-muted-foreground hover:text-rose-500 hover:border-rose-400/40 transition-colors flex items-center justify-center shadow-sm z-10"
      title={`Delete ${label}`}
      aria-label={`Delete ${label}`}
    >
      <X className="h-2 w-2" />
    </button>
  )
}

/**
 * RowInsertDivider — tiny + centered on the divider line.
 * Brief section 13: Uses left-1/2 -translate-x-1/2 for TRUE centering
 * relative to the first <td> (period column), NOT a hardcoded left value.
 */
export function RowInsertDivider({
  afterRowNumber,
  hasShortBreak,
  hasLunchBreak,
  onInsert,
}: {
  afterRowNumber: number
  hasShortBreak: boolean
  hasLunchBreak: boolean
  onInsert: (afterRowNumber: number, type: 'period' | 'short_break' | 'lunch_break') => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <tr className="border-t border-border/20" aria-hidden={!open}>
      {/* First td spans only the period column width — + is centered within it */}
      <td className="p-0 h-0 relative">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-4 w-4 rounded-full border border-border/60 bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center shadow-sm"
                title="Insert row"
                aria-label="Insert row"
              >
                <Plus className="h-2 w-2" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1" align="center" sideOffset={4} collisionPadding={8}>
              <InsertOption icon={<Plus className="h-2.5 w-2.5" />} label="Period" onClick={() => { onInsert(afterRowNumber, 'period'); setOpen(false) }} />
              {!hasShortBreak && (
                <InsertOption icon={<Coffee className="h-2.5 w-2.5" />} label="Short Break" onClick={() => { onInsert(afterRowNumber, 'short_break'); setOpen(false) }} />
              )}
              {!hasLunchBreak && (
                <InsertOption icon={<Coffee className="h-2.5 w-2.5" />} label="Lunch Break" onClick={() => { onInsert(afterRowNumber, 'lunch_break'); setOpen(false) }} />
              )}
            </PopoverContent>
          </Popover>
        </div>
      </td>
      {/* Empty td for the remaining columns */}
      <td colSpan={99} className="p-0 h-0" />
    </tr>
  )
}

function InsertOption({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-2 py-1.5 flex items-center gap-1.5 text-left hover:bg-muted/40 transition-colors text-[10px] rounded"
    >
      {icon} {label}
    </button>
  )
}

/** Mobile version of the row insert divider */
export function RowInsertButton({
  afterRowNumber,
  hasShortBreak,
  hasLunchBreak,
  onInsert,
}: {
  afterRowNumber: number
  hasShortBreak: boolean
  hasLunchBreak: boolean
  onInsert: (afterRowNumber: number, type: 'period' | 'short_break' | 'lunch_break') => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex justify-center py-0.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-4 w-4 rounded-full border border-border/60 bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center"
            title="Insert row"
            aria-label="Insert row"
          >
            <Plus className="h-2 w-2" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="center" sideOffset={4} collisionPadding={8}>
          <InsertOption icon={<Plus className="h-2.5 w-2.5" />} label="Period" onClick={() => { onInsert(afterRowNumber, 'period'); setOpen(false) }} />
          {!hasShortBreak && (
            <InsertOption icon={<Coffee className="h-2.5 w-2.5" />} label="Short Break" onClick={() => { onInsert(afterRowNumber, 'short_break'); setOpen(false) }} />
          )}
          {!hasLunchBreak && (
            <InsertOption icon={<Coffee className="h-2.5 w-2.5" />} label="Lunch Break" onClick={() => { onInsert(afterRowNumber, 'lunch_break'); setOpen(false) }} />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
