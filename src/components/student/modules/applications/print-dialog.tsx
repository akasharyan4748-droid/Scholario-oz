'use client'

/**
 * SubmissionDocumentDialog — the student's view of the OFFICIAL filled copy
 * of their application (shared ApplicationPrintDocument from the Principal
 * module, read-only). Doubles as the "View" details dialog and the
 * "Print form" action: the document renders on screen as a preview, with
 * Print / Download buttons driving the shared print pipeline.
 *
 * The payment read-out is ALWAYS derived from the canonical fee ledger via
 * deriveSubmissionPayment — nothing is stored or faked here.
 */

import { Download, Printer } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  ApplicationPrintDocument, printApplicationDocument,
  downloadApplicationDocument, applicationDocFileName,
} from '@/components/principal/modules/applications/application-print'
import {
  applicationPayments, deriveSubmissionPayment,
  type ApplicationSubmission, type SchoolApplication,
} from '@/lib/store/applications-store'
import { formatINR, formatDate } from '@/lib/format'

interface SubmissionDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: SchoolApplication | null
  sub: ApplicationSubmission | null
}

export function SubmissionDocumentDialog({ open, onOpenChange, app, sub }: SubmissionDocumentDialogProps) {
  if (!app || !sub) return null

  const pay = deriveSubmissionPayment(app, sub)
  // Payment read-out is derived INSIDE the official document from the
  // canonical fee ledger (payment status + receipt numbers on the slip).
  void pay
  void applicationPayments
  void formatINR
  void formatDate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="text-left shrink-0">
          <DialogTitle className="text-base">Filled application copy</DialogTitle>
          <DialogDescription className="text-[11px]">
            Official record for {sub.studentName} · {sub.className}-{sub.section} · submitted {new Date(sub.submittedAt).toLocaleDateString('en-IN')}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-white p-4">
          <ApplicationPrintDocument app={app} sub={sub} notes={sub.reviewNotes} />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => downloadApplicationDocument(applicationDocFileName({ app, sub }))}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => printApplicationDocument()}>
            <Printer className="h-3.5 w-3.5" /> Print form
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
