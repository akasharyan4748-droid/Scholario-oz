'use client'

/**
 * item-action-dialog — Stock action dialog.
 *
 * Handles all four stock actions: add stock, issue / assign, mark damaged,
 * return stock — driven by the `kind` prop.
 *
 * Each action calls the corresponding store mutation:
 *   add    → addStock(itemId, qty, reason)
 *   issue  → issueItem(itemId, qty, assignedTo, reason)
 *   damaged→ markDamaged(itemId, qty, reason)
 *   return → returnItem(itemId, qty, reason)
 *
 * The store silently no-ops if the item is missing or if qty > available
 * (for issue / damaged) — the dialog pre-validates client-side so the user
 * sees a clear error before invoking the mutation.
 */

import { useState, useEffect } from 'react'
import { Plus, ArrowUpCircle, AlertTriangle, RotateCcw, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { useInventoryStore } from '@/lib/store/inventory-store'
import type { InventoryItem } from '@/lib/store/inventory-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { InvPill } from './inventory-shared'

export type ActionKind = 'add' | 'issue' | 'damaged' | 'return'

interface ItemActionDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  kind: ActionKind
  item: InventoryItem | null
}

const KIND_META: Record<ActionKind, {
  title: string
  icon: React.ReactNode
  description: string
  verb: string
  accent: string
  buttonClass: string
  needsAssignee: boolean
  stockDelta: 'in' | 'out' | 'neutral'
}> = {
  add: {
    title: 'Add Stock',
    icon: <Plus className="h-4 w-4 text-emerald-600" />,
    description: 'Receive new stock and add it to inventory.',
    verb: 'Receive',
    accent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    buttonClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white',
    needsAssignee: false,
    stockDelta: 'in',
  },
  issue: {
    title: 'Issue / Assign',
    icon: <ArrowUpCircle className="h-4 w-4 text-amber-600" />,
    description: 'Issue stock to a department or person. Quantity is deducted from inventory.',
    verb: 'Issue',
    accent: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    buttonClass: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white',
    needsAssignee: true,
    stockDelta: 'out',
  },
  damaged: {
    title: 'Mark Damaged',
    icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
    description: 'Record damaged / lost stock. Quantity is deducted from inventory.',
    verb: 'Report',
    accent: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    buttonClass: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white',
    needsAssignee: false,
    stockDelta: 'out',
  },
  return: {
    title: 'Return Stock',
    icon: <RotateCcw className="h-4 w-4 text-emerald-600" />,
    description: 'Return previously issued stock back to inventory.',
    verb: 'Return',
    accent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    buttonClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white',
    needsAssignee: false,
    stockDelta: 'in',
  },
}

export function ItemActionDialog({ open, onOpenChange, kind, item }: ItemActionDialogProps) {
  const addStock = useInventoryStore((s) => s.addStock)
  const issueItem = useInventoryStore((s) => s.issueItem)
  const markDamaged = useInventoryStore((s) => s.markDamaged)
  const returnItem = useInventoryStore((s) => s.returnItem)

  const [qty, setQty] = useState('')
  const [assignee, setAssignee] = useState('')
  const [reason, setReason] = useState('')

  // Reset state every time the dialog opens.
  useEffect(() => {
    if (open) {
      setQty('')
      setAssignee('')
      setReason('')
    }
  }, [open, kind, item?.id])

  if (!item) return null
  const meta = KIND_META[kind]

  const qtyNum = Math.max(0, parseInt(qty || '0', 10))
  const available = item.quantity
  const maxAllowed = meta.stockDelta === 'out' ? available : undefined
  const exceeds = meta.stockDelta === 'out' && qtyNum > available
  const invalid = qtyNum <= 0 || exceeds || (meta.needsAssignee && !assignee.trim())

  const handleSubmit = () => {
    if (qtyNum <= 0) {
      toast.error('Quantity must be greater than zero')
      return
    }
    if (exceeds) {
      toast.error(`Only ${available} ${item.unit} available`)
      return
    }
    if (meta.needsAssignee && !assignee.trim()) {
      toast.error('Please enter who this item is being issued to')
      return
    }
    const rsn = reason.trim() || (kind === 'add' ? 'Stock received' : kind === 'issue' ? `Issued to ${assignee.trim()}` : kind === 'damaged' ? 'Damaged in storage' : 'Returned to inventory')
    if (kind === 'add') {
      addStock(item.id, qtyNum, rsn)
      toast.success('Stock added', {
        description: `${item.name} · +${qtyNum} ${item.unit} · new total ${item.quantity + qtyNum} ${item.unit}`,
      })
    } else if (kind === 'issue') {
      issueItem(item.id, qtyNum, assignee.trim(), rsn)
      toast.success('Item issued', {
        description: `${qtyNum} ${item.unit} of ${item.name} issued to ${assignee.trim()}`,
      })
    } else if (kind === 'damaged') {
      markDamaged(item.id, qtyNum, rsn)
      toast.success('Damaged stock recorded', {
        description: `${qtyNum} ${item.unit} of ${item.name} marked as damaged`,
      })
    } else if (kind === 'return') {
      returnItem(item.id, qtyNum, rsn)
      toast.success('Stock returned', {
        description: `${qtyNum} ${item.unit} of ${item.name} returned to inventory`,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {meta.icon}
            {meta.title}
          </DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item card */}
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary')}>
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-[11px] text-muted-foreground truncate font-mono">{item.code} · {item.category}</p>
            </div>
            <InvPill accent="bg-muted text-muted-foreground">
              {item.quantity} {item.unit} on hand
            </InvPill>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Quantity <span className="text-muted-foreground">({item.unit})</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Enter quantity"
              className={cn(exceeds && 'border-rose-500 focus-visible:ring-rose-500/30')}
            />
            {exceeds ? (
              <p className="text-[10px] text-rose-600 font-medium">Only {available} {item.unit} available</p>
            ) : maxAllowed !== undefined ? (
              <p className="text-[10px] text-muted-foreground">Up to {available} {item.unit} available</p>
            ) : null}
          </div>

          {/* Assignee (issue only) */}
          {meta.needsAssignee && (
            <div className="space-y-1.5">
              <Label className="text-xs">Issued To</Label>
              <Input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="e.g. Science Lab · Class 10 · Mr. Rohan Mehta"
              />
              <p className="text-[10px] text-muted-foreground">Department, class, or person this item is being issued to.</p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Reason <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                kind === 'add' ? 'Quarterly procurement, new stock received, etc.'
                : kind === 'issue' ? 'Lab practical, classroom use, sports day, etc.'
                : kind === 'damaged' ? 'Broken during lab session, lost in transit, etc.'
                : 'Returned after practical, surplus returned, etc.'
              }
              className="min-h-[64px] text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={invalid}
            className={cn('gap-1.5', meta.buttonClass)}
          >
            {meta.icon}
            {meta.verb} {qtyNum > 0 ? `${qtyNum} ${item.unit}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
