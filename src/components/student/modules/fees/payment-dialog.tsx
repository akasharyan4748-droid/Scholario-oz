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
  onOpenChange: (open: boolean) => void
  onMethodChange: (method: string) => void
  onPay: () => void
  onDownload: () => void
  onComplete: () => void
}

export function PaymentDialog({
  open, stage, method, paidAmount, totalPending, student,
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
              onMethodChange={onMethodChange}
              onCancel={() => onOpenChange(false)}
              onPay={onPay}
            />
          )}
          {stage === 'processing' && (
            <PaymentProcessingStage key="processing" paidAmount={paidAmount} method={method} />
          )}
          {stage === 'success' && (
            <PaymentSuccessStage key="success" paidAmount={paidAmount} method={method} />
          )}
          {stage === 'receipt' && (
            <PaymentReceiptStage
              key="receipt"
              paidAmount={paidAmount}
              method={method}
              student={student}
              onDownload={onDownload}
              onComplete={onComplete}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
