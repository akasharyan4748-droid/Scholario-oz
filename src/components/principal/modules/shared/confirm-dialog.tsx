'use client'

/**
 * ConfirmDialog — universal SCHOLARIO confirmation modal.
 *
 * Canonical pattern (audited from TerminationModal + LockAccountModal +
 * ArchiveSubject dialog):
 *   - Title with semantic icon (AlertTriangle for destructive, Archive for amber, etc.)
 *   - Short description with the affected entity name interpolated
 *   - Cancel (outline) + Action button (variant depends on tone)
 *
 * Brief section 20 + 27: use this for ALL destructive / irreversible actions
 *   (Remove teacher assignment, Archive subject, Permanent delete, etc.)
 * Brief section 19: NO inline × destructive bypass — every destructive action
 *   routes through this dialog.
 */
import { type LucideIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ConfirmTone = 'destructive' | 'amber' | 'primary'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** Tone controls the icon color + button variant. */
  tone?: ConfirmTone
  /** Optional lucide icon to show next to the title. */
  icon?: LucideIcon
  /** Label for the confirm button. Default "Confirm". */
  confirmLabel?: string
  /** Whether the confirm button is disabled (e.g. until type-to-confirm matches). */
  confirmDisabled?: boolean
  /** Called when the user confirms. */
  onConfirm: () => void
}

const TONE_CONFIG: Record<ConfirmTone, {
  titleText: string
  buttonClass: string
  buttonVariant: 'destructive' | 'outline' | 'default'
}> = {
  destructive: {
    titleText: 'text-rose-600',
    buttonClass: '',
    buttonVariant: 'destructive',
  },
  amber: {
    titleText: 'text-amber-600',
    buttonClass: 'text-amber-600 border-amber-500/40 hover:bg-amber-500/10',
    buttonVariant: 'outline',
  },
  primary: {
    titleText: 'text-primary',
    buttonClass: '',
    buttonVariant: 'default',
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  tone = 'destructive',
  icon: Icon,
  confirmLabel = 'Confirm',
  confirmDisabled = false,
  onConfirm,
}: ConfirmDialogProps) {
  const cfg = TONE_CONFIG[tone]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={cn('flex items-center gap-2 text-sm font-semibold', cfg.titleText)}>
            {Icon && <Icon className="h-4 w-4" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant={cfg.buttonVariant}
            size="sm"
            className={cfg.buttonClass}
            disabled={confirmDisabled}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
