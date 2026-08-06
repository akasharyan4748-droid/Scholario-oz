'use client'

import { AnimatePresence } from 'framer-motion'
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog'
import type { Student } from '@/lib/mock/students'
import type { PayStage } from './data'
import { CollectFormStage } from './collect-form-stage'
import { CollectStageRouter } from './collect-result-stages'

// Collect Payment dialog — 4-stage flow: form → processing → success →
// receipt. The parent component owns all state (selectedStudent, amount,
// purpose, method, stage, payOpen) and the handlers; this file is just the
// dialog chrome that conditionally renders each stage. The form stage is
// rendered inline; the processing / success / receipt stages are routed
// through CollectStageRouter to keep this file thin.
export function CollectDialog({
  open,
  stage,
  selectedStudent,
  amount,
  purpose,
  method,
  student,
  receiptNo,
  onSelectStudent,
  onAmountChange,
  onPurposeChange,
  onMethodChange,
  onPay,
  onDone,
  onOpenChange,
}: {
  open: boolean
  stage: PayStage
  selectedStudent: string
  amount: number
  purpose: string
  method: string
  student: Student
  receiptNo: string
  onSelectStudent: (id: string) => void
  onAmountChange: (v: number) => void
  onPurposeChange: (v: string) => void
  onMethodChange: (v: string) => void
  onPay: () => void
  onDone: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md" showCloseButton={stage !== 'processing'}>
        <AnimatePresence mode="wait">
          {stage === 'form' && (
            <CollectFormStage
              selectedStudent={selectedStudent}
              onSelectStudent={onSelectStudent}
              amount={amount}
              onAmountChange={onAmountChange}
              purpose={purpose}
              onPurposeChange={onPurposeChange}
              method={method}
              onMethodChange={onMethodChange}
              student={student}
              onPay={onPay}
            />
          )}
          <CollectStageRouter
            stage={stage}
            amount={amount}
            method={method}
            purpose={purpose}
            student={student}
            receiptNo={receiptNo}
            onDone={onDone}
          />
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
