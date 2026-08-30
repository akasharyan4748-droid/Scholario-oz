'use client'

import { AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { PayStage, PaymentStudentInfo } from './data'
import { PaymentFormStage } from './payment-form-stage'
import { PaymentProcessingStage, PaymentSuccessStage, PaymentReceiptStage } from './payment-stages'

export type { PaymentStudentInfo }

interface PaymentDialogProps {
  open: boolean
  stage: PayStage
  method: string
  paidAmount: number
  totalPending: number
  student: PaymentStudentInfo
  /** Transfer reference entered by the parent (shown on the acknowledgement). */
  reference?: string
  /** Canonical receipt number from the fee ledger. */
  receiptNo?: string
  /** Active gateway provider — routes the form through the gateway checkout. */
  gatewayProvider?: string | null
  /** Gateway-confirmed → success/receipt stages show the OFFICIAL receipt. */
  confirmed?: boolean
  onOpenChange: (open: boolean) => void
  onMethodChange: (method: string) => void
  onPay: (reference: string) => void
  onDownload: () => void
  onComplete: () => void
}

export function PaymentDialog({
  open, stage, method, paidAmount, totalPending, student, reference, receiptNo,
  gatewayProvider, confirmed,
  onOpenChange, onMethodChange, onPay, onDownload, onComplete,
}: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md" showCloseButton={stage !== 'processing'}>
        <AnimatePresence mode="wait">
          {stage === 'form' && (
            <PaymentFormStage
              key="form"
              method={method}
              totalPending={totalPending}
              student={student}
              gatewayProvider={gatewayProvider}
              onMethodChange={onMethodChange}
              onCancel={() => onOpenChange(false)}
              onPay={onPay}
            />
          )}
          {stage === 'processing' && (
            <PaymentProcessingStage key="processing" paidAmount={paidAmount} method={method} />
          )}
          {stage === 'success' && (
            <PaymentSuccessStage key="success" paidAmount={paidAmount} method={method} confirmed={confirmed} gatewayProvider={gatewayProvider} />
          )}
          {stage === 'receipt' && (
            <PaymentReceiptStage
              key="receipt"
              paidAmount={paidAmount}
              method={method}
              student={student}
              reference={reference}
              receiptNo={receiptNo}
              confirmed={confirmed}
              gatewayProvider={gatewayProvider}
              onDownload={onDownload}
              onComplete={onComplete}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
