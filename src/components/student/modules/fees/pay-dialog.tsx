'use client'

/**
 * PayDialog — the payment flow's stage machine (§9).
 *
 * form → processing → result → receipt, one AnimatePresence, honest
 * stage transitions (never a "Paid" claim from a button click — the
 * canonical transaction's status decides, §10).
 */

import { AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { FeeTransaction } from '@/lib/store/fee-store'
import { PayForm, type PayRequest } from './pay-form'
import { PayProcessingStage, PayReceiptStage, PayResultStage } from './pay-stages'
import type { NextDue } from './fee-status'

export type PayStage = 'form' | 'processing' | 'result' | 'receipt'

interface PayDialogProps {
  open: boolean
  stage: PayStage
  txn: FeeTransaction | null
  /** In-flight payment metadata (amount/method for the processing stage). */
  amount: number
  method: string
  onlineModes: { id: string; label: string }[]
  gatewayProvider: string | null
  gatewayTestMode: boolean
  totalDue: number
  nextDue: NextDue | null
  nextDueCovers: string[]
  studentName: string
  onPay: (req: PayRequest) => void
  onDownload: () => void
  onDone: () => void
  onOpenChange: (open: boolean) => void
}

export function PayDialog({
  open, stage, txn, amount, method, onlineModes, gatewayProvider, gatewayTestMode,
  totalDue, nextDue, nextDueCovers, studentName, onPay, onDownload, onDone, onOpenChange,
}: PayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto max-w-md sm:max-w-md">
        <AnimatePresence mode="wait" initial={false}>
          {stage === 'form' && (
            <PayForm
              key="form"
              totalDue={totalDue}
              nextDue={nextDue}
              nextDueCovers={nextDueCovers}
              onlineModes={onlineModes}
              gatewayProvider={gatewayProvider}
              gatewayTestMode={gatewayTestMode}
              studentName={studentName}
              onPay={onPay}
              onCancel={() => onOpenChange(false)}
            />
          )}
          {stage === 'processing' && <PayProcessingStage key="processing" amount={amount} method={method} />}
          {stage === 'result' && txn && <PayResultStage key="result" txn={txn} gatewayProvider={gatewayProvider} />}
          {stage === 'receipt' && txn && (
            <PayReceiptStage key="receipt" txn={txn} gatewayProvider={gatewayProvider} onDownload={onDownload} onDone={onDone} />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
