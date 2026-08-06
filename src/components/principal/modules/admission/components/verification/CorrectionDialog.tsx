'use client'

import { AlertTriangle } from 'lucide-react'
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

interface CorrectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  overallRemarks: string
  onOverallRemarksChange: (value: string) => void
  onConfirm: () => void
}

export function CorrectionDialog({
  open,
  onOpenChange,
  overallRemarks,
  onOverallRemarksChange,
  onConfirm,
}: CorrectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Return Application for Correction
          </DialogTitle>
          <DialogDescription className="text-xs">
            The application will be marked as "Need Correction". The applicant/admin will be notified to edit only the flagged sections and resubmit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2">
          <label className="text-xs font-semibold">Overall Correction Instructions:</label>
          <Textarea
            value={overallRemarks}
            onChange={(e) => onOverallRemarksChange(e.target.value)}
            placeholder="Explain required corrections..."
            className="text-xs"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
            Confirm & Return to Applicant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
