'use client'

import { Wallet, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { FeeStructureStepProps as Props } from './FeeStructureStep/types'
import { useFeeCalculations } from './FeeStructureStep/useFeeCalculations'
import { SelectionPanel } from './FeeStructureStep/SelectionPanel'
import { SummaryPanel } from './FeeStructureStep/SummaryPanel'

export type { FeeDataState } from './FeeStructureStep/types'
export { defaultFeeDataState } from './FeeStructureStep/types'

export function FeeStructureStep({ className, feeState, onChangeFeeState, flags }: Props) {
  const calc = useFeeCalculations(className, feeState, onChangeFeeState, flags)

  return (
    <div className="space-y-5">
      {/* Header — READ-ONLY indicator */}
      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-900 dark:text-emerald-50 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display">Fee Structure — {calc.feeStructure?.category}</h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200/70">Class: {className || '—'} · Live from Fee Management</p>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-600/40 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-emerald-900/30 text-xs font-mono font-bold gap-1">
          <Lock className="h-3 w-3" /> Read-Only
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SelectionPanel
          feeState={feeState}
          onChangeFeeState={onChangeFeeState}
          flags={flags}
          schoolSettings={calc.schoolSettings}
          classBooks={calc.classBooks}
          uniforms={calc.uniforms}
          examConfig={calc.examConfig}
          examTotal={calc.examTotal}
          booksTotal={calc.booksTotal}
          booksCount={calc.booksCount}
          uniformTotal={calc.uniformTotal}
          uniformCount={calc.uniformCount}
          activityKitTotal={calc.activityKitTotal}
          activityKitCount={calc.activityKitCount}
          transportCost={calc.transportCost}
          hostelCost={calc.hostelCost}
          registrationFee={calc.registrationFee}
          admissionFee={calc.admissionFee}
          tuitionFee={calc.tuitionFee}
          otherHeadsTotal={calc.otherHeadsTotal}
          updateSelection={calc.updateSelection}
          toggleSelection={calc.toggleSelection}
          handleApplyWaiver={calc.handleApplyWaiver}
        />

        <SummaryPanel
          registrationFee={calc.registrationFee}
          admissionFee={calc.admissionFee}
          tuitionFee={calc.tuitionFee}
          otherHeadsTotal={calc.otherHeadsTotal}
          examTotal={calc.examTotal}
          booksTotal={calc.booksTotal}
          booksCount={calc.booksCount}
          uniformTotal={calc.uniformTotal}
          uniformCount={calc.uniformCount}
          activityKitTotal={calc.activityKitTotal}
          activityKitCount={calc.activityKitCount}
          transportTotal={calc.transportTotal}
          hostelTotal={calc.hostelTotal}
          grossFee={calc.grossFee}
          scholarshipAmount={calc.scholarshipAmount}
          waiverAmount={calc.waiverAmount}
          netTotal={calc.netTotal}
          initialInstallment={calc.initialInstallment}
          remainingBalance={calc.remainingBalance}
        />
      </div>
    </div>
  )
}
