'use client'

// Salary & Payroll module entry. Holds shared UI state (selected slip record,
// process-payroll dialog open + stage + bonus) and composes all sub-sections.

import { useState } from 'react'
import { Wallet, Plus } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { salaryAnalytics, type SalaryRecord } from '@/lib/mock/finance'
import { school } from '@/lib/mock/school'
import { toast } from 'sonner'
import { type ProcessStage } from './data'
import { SalaryOverview } from './overview'
import { PayrollRun } from './payroll-run'
import { PayrollComposition } from './composition'
import { PayslipSheet } from './payslip'
import { ProcessPayrollDialog } from './process-dialog'

export function SalaryModule() {
  const [selected, setSelected] = useState<SalaryRecord | null>(null)
  const [processOpen, setProcessOpen] = useState(false)
  const [stage, setStage] = useState<ProcessStage>('confirm')
  const [bonus, setBonus] = useState(0)

  const handleProcessStart = () => {
    setStage('processing')
    setTimeout(() => {
      setStage('success')
    }, 2800)
  }

  const handleProcessClose = () => {
    if (stage === 'processing') return
    if (stage === 'success') {
      toast.success('Payroll disbursed 🎉', {
        description: `₹${(salaryAnalytics.totalMonthly / 100000).toFixed(2)}L paid to ${school.totalTeachers + school.totalStaff - salaryAnalytics.pendingCount} employees via direct deposit.`,
      })
    }
    setProcessOpen(false)
    setTimeout(() => { setStage('confirm'); setBonus(0) }, 200)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Salary & Payroll"
        subtitle="Process monthly payroll · manage slips, bonuses & deductions"
        icon={<Wallet className="h-5 w-5" />}
        action={
          <Button
            onClick={() => { setStage('confirm'); setProcessOpen(true) }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
          >
            <Plus className="h-4 w-4" /> Process Payroll
          </Button>
        }
      />

      <SalaryOverview />
      <PayrollRun onRowClick={setSelected} />
      <PayrollComposition />

      <PayslipSheet
        selected={selected}
        bonus={bonus}
        onBonusChange={setBonus}
        onClose={() => setSelected(null)}
      />

      <ProcessPayrollDialog
        open={processOpen}
        stage={stage}
        onOpenChange={handleProcessClose}
        onStart={handleProcessStart}
        onClose={handleProcessClose}
      />
    </div>
  )
}

