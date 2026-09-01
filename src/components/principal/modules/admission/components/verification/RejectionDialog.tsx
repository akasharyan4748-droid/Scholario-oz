'use client'

import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface RejectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rejectionReason: string
  onRejectionReasonChange: (value: string) => void
  onConfirm: () => void
}

export function RejectionDialog({
  open,
  onOpenChange,
  rejectionReason,
  onRejectionReasonChange,
  onConfirm,
}: RejectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <XCircle className="h-5 w-5" />
            Reject Admission Application
          </DialogTitle>
          <DialogDescription className="text-xs">
            The application will be moved to the Rejected queue and held for a 60-day retention period. You can restore it anytime prior to automatic archival.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2">
          <label className="text-xs font-semibold">Specify Rejection Reason (Required for Audit):</label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => onRejectionReasonChange(e.target.value)}
            placeholder="e.g. CBSE Grade 10 transfer quota exhausted for current session..."
            className="text-xs"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
