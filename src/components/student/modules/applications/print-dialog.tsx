'use client'

/**
 * SubmissionDocumentDialog — the student's view of the OFFICIAL filled copy
 * of their tour application (TOUR-1: the same fixed A4 "Parent Consent Form"
 * template the school prints, never a generic web layout).
 *
 * The payment read-out is ALWAYS derived from the canonical fee ledger via
 * deriveSubmissionPayment — nothing is stored or faked here. Print/Download
 * drive the shared tour-document pipeline (clone → #print-root → A4 @page).
 */

import { Download, Printer } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  TourFormDocument, useFitA4Zoom, printTourDocument,
} from '@/components/principal/modules/applications/tour-form-document'
import { downloadTourFormPDF } from '@/components/principal/modules/applications/tour-form-pdf'
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
  const [ref, zoom] = useFitA4Zoom<HTMLDivElement>()
  if (!app || !sub) return null

  const pay = deriveSubmissionPayment(app, sub)
  // Payment history belonging to THIS application only — every receipt the
  // student (or the office) recorded against it, read from the canonical
  // fee ledger. Nothing else from the student's account is mixed in.
  const history = applicationPayments(app).filter((t) => t.studentId === sub.studentId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="text-left shrink-0 border-b border-border pb-2">
          <DialogTitle className="text-base">Filled application copy</DialogTitle>
          <DialogDescription className="text-[11px]">
            Official record for {sub.studentName} · {sub.className}-{sub.section} · submitted {new Date(sub.submittedAt).toLocaleDateString('en-IN')}
            {app.payment.mode !== 'None' && (
              <> · {pay.status === 'Paid'
                ? `Paid · ${pay.receiptNos.join(', ')}`
                : pay.status === 'Awaiting Verification'
                  ? 'Payment under verification'
                  : `Not paid — ${formatINR(Math.max(0, pay.expectedAmount - pay.paidAmount))} payable`}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Properly-scaled live A4 preview of the SAME official template the
            school prints — the student always sees exactly what will print. */}
        <div ref={ref} className="min-h-0 flex-1 overflow-auto rounded-lg bg-muted/40 p-2">
          <div style={{ zoom, width: 'fit-content', margin: '0 auto' }}>
            <TourFormDocument app={app} sub={sub} payment={pay} />
          </div>
        </div>

        {history.length > 0 && (
          <div className="shrink-0 rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Payment history</p>
            <ul className="mt-1 space-y-0.5">
              {history.map((t) => (
                <li key={t.id} className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{t.receiptNo}</span>
                  {' · '}{formatINR(t.amount)} · {t.mode} · {formatDate(t.date)}
                  {' · '}{t.status === 'Success' ? 'Paid' : t.status}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { void downloadTourFormPDF(app, sub, { payment: pay }) }}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => printTourDocument()}>
            <Printer className="h-3.5 w-3.5" /> Print form
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
