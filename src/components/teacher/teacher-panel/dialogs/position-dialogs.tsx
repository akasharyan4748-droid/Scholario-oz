'use client'

import { useState } from 'react'
import { XCircle, AlertCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface DeclineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason: string
  setReason: (r: string) => void
  onConfirm: () => void
}

export function DeclineDialog({ open, onOpenChange, reason, setReason, onConfirm }: DeclineDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <XCircle className="h-5 w-5" /> Decline Position Assignment
          </DialogTitle>
          <DialogDescription className="text-xs">
            Please provide a brief reason for declining this responsibility. The Principal will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Textarea
            placeholder="e.g. Current workload capacity exceeded due to Board exam preparation…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[90px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Confirm Decline</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ClarifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  setQuery: (q: string) => void
  onConfirm: () => void
}

export function ClarifyDialog({ open, onOpenChange, query, setQuery, onConfirm }: ClarifyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" /> Request Clarification
          </DialogTitle>
          <DialogDescription className="text-xs">
            Specify your question or required details regarding working hours, expectations, or assistance needed.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Textarea
            placeholder="e.g. Kindly clarify if additional assistant invigilators will be provided for weekend sessions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[90px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={onConfirm}>
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function usePositionDialogs() {
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [clarifyDialogOpen, setClarifyDialogOpen] = useState(false)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [clarifyQuery, setClarifyQuery] = useState('')

  return {
    declineDialogOpen,
    setDeclineDialogOpen,
    clarifyDialogOpen,
    setClarifyDialogOpen,
    selectedAssignmentId,
    setSelectedAssignmentId,
    declineReason,
    setDeclineReason,
    clarifyQuery,
    setClarifyQuery,
  }
}
