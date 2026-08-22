'use client'

/**
 * SalaryPayrollSection — operational monthly payroll workspace.
 *
 * - Period selector (Previous / Current / Next) with status badge
 * - Payroll summary (employees, gross, deductions, net)
 * - Process Payroll wizard (9-step)
 * - Payroll table with row actions
 * - Approval / Disbursement workflow
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Play, CheckCircle2, ShieldCheck, Banknote,
  Lock, AlertCircle, Loader2, FileText, X, ArrowRight, ArrowLeft,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSalaryData, useSalaryStore, calculatePayrollForEmployee } from '@/lib/store/salary-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SalaryPanel, PayrollStatusBadge, SalaryEmptyState } from './salary-shared'
import { toast } from 'sonner'

type WizardStage = 'closed' | 'period' | 'employees' | 'attendance' | 'earnings' | 'deductions' | 'adjustments' | 'exceptions' | 'approve' | 'processing' | 'success'

const STAGES: Array<{ value: WizardStage; label: string }> = [
  { value: 'period', label: 'Period' },
  { value: 'employees', label: 'Employees' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'earnings', label: 'Earnings' },
  { value: 'deductions', label: 'Deductions' },
  { value: 'adjustments', label: 'Adjustments' },
  { value: 'exceptions', label: 'Exceptions' },
  { value: 'approve', label: 'Approve' },
]

export function SalaryPayrollSection({ data }: { data: ReturnType<typeof useSalaryData> }) {
  const { currentPeriod } = data
  const [period, setPeriod] = useState(currentPeriod)
  const [wizardStage, setWizardStage] = useState<WizardStage>('closed')

  // Build previous/current/next periods
  const periodOptions = useMemo(() => {
    const now = new Date()
    const months: string[] = []
    for (let i = -1; i <= 1; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      months.push(d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }))
    }
    return months
  }, [])
  const currentPeriodIdx = periodOptions.indexOf(period)
  const goToPrev = () => { if (currentPeriodIdx > 0) setPeriod(periodOptions[currentPeriodIdx - 1]) }
  const goToNext = () => { if (currentPeriodIdx < periodOptions.length - 1) setPeriod(periodOptions[currentPeriodIdx + 1]) }

  // Get payroll status for the selected period
  const selectedPeriod = data.periods.find((p) => p.period === period)
  const periodStatus = selectedPeriod?.status ?? 'Draft'

  // Calculate what the payroll would be for this period
  const calculatedRecords = data.employees.map((e) => {
    const structure = data.structures.find((s) => s.applicableTo === e.employeeType) ?? data.structures[0]
    const calc = calculatePayrollForEmployee(e, structure, data.adjustments)
    return { employee: e, ...calc }
  })

  const periodGross = calculatedRecords.reduce((s, r) => s + r.gross, 0)
  const periodDeductions = calculatedRecords.reduce((s, r) => s + r.totalDeductions, 0)
  const periodAdjustments = calculatedRecords.reduce((s, r) => s + r.totalAdjustments, 0)
  const periodNet = calculatedRecords.reduce((s, r) => s + r.netPay, 0)

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Period selector */}
      <SalaryPanel bodyClassName="p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToPrev} disabled={currentPeriodIdx <= 0} aria-label="Previous period">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[160px]">
              <p className="text-sm font-bold">{period}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Payroll Period</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToNext} disabled={currentPeriodIdx >= periodOptions.length - 1} aria-label="Next period">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <PayrollStatusBadge status={periodStatus} />
            {periodStatus === 'Draft' && (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white" onClick={() => setWizardStage('period')}>
                <Play className="h-3.5 w-3.5" /> Process Payroll
              </Button>
            )}
            {periodStatus === 'Calculated' && (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-sky-600 hover:bg-sky-700 text-white" onClick={() => { useSalaryStore.getState().approvePayroll(period, 'Principal'); toast.success('Payroll approved', { description: `${period} · ready for disbursement` }) }}>
                <ShieldCheck className="h-3.5 w-3.5" /> Approve Payroll
              </Button>
            )}
            {periodStatus === 'Approved' && (
              <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { const r = useSalaryStore.getState().disbursePayroll(period, 'Principal'); toast.success('Payroll disbursed', { description: `${r.paid} paid, ${r.failed} failed, ${r.pending} pending` }) }}>
                <Banknote className="h-3.5 w-3.5" /> Disburse
              </Button>
            )}
            {periodStatus === 'Paid' && (
              <>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => { useSalaryStore.getState().generatePayslips(period, 'Principal'); toast.success('Payslips generated', { description: `${data.employees.length} payslips for ${period}` }) }}>
                  <FileText className="h-3.5 w-3.5" /> Generate Payslips
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => { useSalaryStore.getState().lockPayroll(period, 'Principal'); toast.success('Payroll locked', { description: `${period} historical snapshot preserved` }) }}>
                  <Lock className="h-3.5 w-3.5" /> Lock Payroll
                </Button>
              </>
            )}
          </div>
        </div>
      </SalaryPanel>

      {/* Payroll table — totals are in the tfoot row, and the wizard's Approve stage shows the same 4 numbers, so we don't duplicate them as KPI cards here */}
      <SalaryPanel
        title="Payroll Records"
        subtitle={`${calculatedRecords.length} employees · ${period}`}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto max-h-[36rem]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Employee</th>
                <th className="text-left px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden md:table-cell">Designation</th>
                <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Gross</th>
                <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden sm:table-cell">Deductions</th>
                <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground hidden lg:table-cell">Adjustments</th>
                <th className="text-right px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Net Pay</th>
                <th className="text-center px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {calculatedRecords.map((r, i) => (
                <tr key={r.employee.id} className="border-t border-border/30 hover:bg-muted/20 even:bg-muted/10">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-semibold',
                        r.employee.employeeType === 'Teaching' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                        r.employee.employeeType === 'Administration' ? 'bg-gradient-to-br from-sky-500 to-blue-600' :
                        r.employee.employeeType === 'Finance' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                        'bg-gradient-to-br from-violet-500 to-purple-600',
                      )}>
                        {r.employee.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[11px] truncate">{r.employee.name}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{r.employee.employeeId} · {r.employee.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground hidden md:table-cell text-[11px]">{r.employee.designation}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{formatINR(r.gross, true)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-rose-600 hidden sm:table-cell">{formatINR(r.totalDeductions, true)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-amber-600 hidden lg:table-cell">{r.totalAdjustments > 0 ? `+${formatINR(r.totalAdjustments, true)}` : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-emerald-600">{formatINR(r.netPay, true)}</td>
                  <td className="px-3 py-2 text-center"><PayrollStatusBadge status={periodStatus} /></td>
                </tr>
              ))}
              {calculatedRecords.length === 0 && (
                <tr><td colSpan={7} className="py-12"><SalaryEmptyState icon={<Users className="h-6 w-6" />} title="No employees" description="No eligible employees for payroll." /></td></tr>
              )}
            </tbody>
            {calculatedRecords.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40 font-bold">
                  <td className="px-3 py-2 text-[11px]" colSpan={2}>Total ({calculatedRecords.length})</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatINR(periodGross, true)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-rose-600 hidden sm:table-cell">{formatINR(periodDeductions, true)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-amber-600 hidden lg:table-cell">{formatINR(periodAdjustments, true)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-600">{formatINR(periodNet, true)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SalaryPanel>

      {/* Process Payroll Wizard */}
      <AnimatePresence>
        {wizardStage !== 'closed' && (
          <ProcessPayrollWizard
            stage={wizardStage}
            setStage={setWizardStage}
            period={period}
            onClose={() => setWizardStage('closed')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Process Payroll Wizard ─────────────────────────────────────────

function ProcessPayrollWizard({ stage, setStage, period, onClose }: {
  stage: WizardStage
  setStage: (s: WizardStage) => void
  period: string
  onClose: () => void
}) {
  const data = useSalaryData()
  const preparePayroll = useSalaryStore((s) => s.preparePayroll)
  const approvePayroll = useSalaryStore((s) => s.approvePayroll)
  const disbursePayroll = useSalaryStore((s) => s.disbursePayroll)
  const generatePayslips = useSalaryStore((s) => s.generatePayslips)

  const stageIdx = STAGES.findIndex((s) => s.value === stage)
  const calculatedRecords = data.employees.map((e) => {
    const structure = data.structures.find((s) => s.applicableTo === e.employeeType) ?? data.structures[0]
    const calc = calculatePayrollForEmployee(e, structure, data.adjustments)
    return { employee: e, ...calc }
  })

  const totalGross = calculatedRecords.reduce((s, r) => s + r.gross, 0)
  const totalDeductions = calculatedRecords.reduce((s, r) => s + r.totalDeductions, 0)
  const totalAdjustments = calculatedRecords.reduce((s, r) => s + r.totalAdjustments, 0)
  const totalNet = calculatedRecords.reduce((s, r) => s + r.netPay, 0)

  const handleApprove = () => {
    setStage('processing')
    setTimeout(() => {
      preparePayroll(period, 'Principal')
      approvePayroll(period, 'Principal')
      disbursePayroll(period, 'Principal')
      generatePayslips(period, 'Principal')
      setStage('success')
    }, 2200)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border bg-gradient-to-br from-emerald-500/5 to-transparent flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">Process Payroll · {period}</h2>
            <p className="text-[11px] text-muted-foreground">Stage {stageIdx + 1} of {STAGES.length} — {STAGES[stageIdx]?.label}</p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose} disabled={stage === 'processing'}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stepper */}
        {stage !== 'processing' && stage !== 'success' && (
          <div className="px-5 py-3 border-b border-border/60 bg-muted/20 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              {STAGES.map((s, i) => (
                <div key={s.value} className="flex items-center gap-1">
                  <button
                    onClick={() => i <= stageIdx && setStage(s.value)}
                    disabled={i > stageIdx}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap',
                      i === stageIdx ? 'bg-primary text-primary-foreground' :
                      i < stageIdx ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 cursor-pointer' :
                      'text-muted-foreground/50 cursor-not-allowed',
                    )}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold">
                      {i < stageIdx ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                  {i < STAGES.length - 1 && <span className="text-muted-foreground/40">→</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {stage === 'period' && (
              <WizardBody key="period" title="Select Payroll Period" description="Confirm the payroll period you want to process.">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <p className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-300">Selected Period</p>
                    <p className="text-base font-bold mt-1">{period}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Status: Draft</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Eligible Employees</p>
                    <p className="text-base font-bold mt-1 tabular-nums">{data.employees.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Active + On Leave</p>
                  </div>
                </div>
              </WizardBody>
            )}
            {stage === 'employees' && (
              <WizardBody key="employees" title="Review Eligible Employees" description={`${data.employees.length} employees will be included in this payroll.`}>
                <div className="space-y-1 max-h-[280px] overflow-y-auto">
                  {data.employees.slice(0, 12).map((e) => (
                    <div key={e.id} className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
                      <div className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-semibold',
                        e.employeeType === 'Teaching' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                        e.employeeType === 'Administration' ? 'bg-gradient-to-br from-sky-500 to-blue-600' :
                        'bg-gradient-to-br from-violet-500 to-purple-600',
                      )}>
                        {e.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{e.name}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{e.employeeId} · {e.designation} · {e.department}</p>
                      </div>
                      <span className="text-[10px] font-semibold tabular-nums">{formatINR(e.salary, true)}</span>
                    </div>
                  ))}
                  {data.employees.length > 12 && (
                    <p className="text-[10px] text-muted-foreground text-center py-2">+ {data.employees.length - 12} more employees</p>
                  )}
                </div>
              </WizardBody>
            )}
            {stage === 'attendance' && (
              <WizardBody key="attendance" title="Attendance & Leave Impact" description="LOP reduces earnings proportionally; attendance is read from the Attendance module.">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/30 p-2.5 text-center">
                    <p className="text-[9px] uppercase text-muted-foreground">Working Days</p>
                    <p className="text-base font-bold tabular-nums mt-0.5">30</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 text-center">
                    <p className="text-[9px] uppercase text-muted-foreground">Avg Attendance</p>
                    <p className="text-base font-bold tabular-nums text-emerald-600 mt-0.5">96%</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-2.5 text-center">
                    <p className="text-[9px] uppercase text-muted-foreground">LOP Days</p>
                    <p className="text-base font-bold tabular-nums text-amber-600 mt-0.5">~1</p>
                  </div>
                </div>
              </WizardBody>
            )}
            {stage === 'earnings' && (
              <WizardBody key="earnings" title="Review Earnings" description="Earnings breakdown for this payroll period.">
                <div className="space-y-1">
                  {calculatedRecords[0]?.earnings.map((e) => (
                    <div key={e.name} className="flex justify-between text-[11px] rounded-md px-2 py-1.5 bg-muted/20">
                      <span className="font-medium">{e.name}</span>
                      <span className="tabular-nums font-semibold">{formatINR(e.amount * data.employees.length, true)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px] rounded-md px-2 py-1.5 bg-emerald-500/10 border-t border-emerald-500/30">
                    <span className="font-bold">Total Gross Earnings</span>
                    <span className="tabular-nums font-bold text-emerald-600">{formatINR(totalGross, true)}</span>
                  </div>
                </div>
              </WizardBody>
            )}
            {stage === 'deductions' && (
              <WizardBody key="deductions" title="Review Deductions" description="Deductions breakdown for this payroll period.">
                <div className="space-y-1">
                  {calculatedRecords[0]?.deductions.map((d) => (
                    <div key={d.name} className="flex justify-between text-[11px] rounded-md px-2 py-1.5 bg-muted/20">
                      <span className="font-medium">{d.name}</span>
                      <span className="tabular-nums font-semibold text-rose-600">{formatINR(d.amount * data.employees.length, true)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px] rounded-md px-2 py-1.5 bg-rose-500/10 border-t border-rose-500/30">
                    <span className="font-bold">Total Deductions</span>
                    <span className="tabular-nums font-bold text-rose-600">{formatINR(totalDeductions, true)}</span>
                  </div>
                </div>
              </WizardBody>
            )}
            {stage === 'adjustments' && (
              <WizardBody key="adjustments" title="Review Adjustments" description="Approved bonuses, reimbursements, and advance recoveries.">
                <div className="space-y-1">
                  {data.adjustments.filter((a) => a.status === 'Approved').map((a) => (
                    <div key={a.id} className="flex justify-between text-[11px] rounded-md px-2 py-1.5 bg-muted/20">
                      <div>
                        <p className="font-medium">{a.employeeName}</p>
                        <p className="text-[9px] text-muted-foreground">{a.type} · {a.reason}</p>
                      </div>
                      <span className="tabular-nums font-semibold text-amber-600">+{formatINR(a.amount, true)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px] rounded-md px-2 py-1.5 bg-amber-500/10 border-t border-amber-500/30">
                    <span className="font-bold">Total Adjustments</span>
                    <span className="tabular-nums font-bold text-amber-600">{formatINR(totalAdjustments, true)}</span>
                  </div>
                </div>
              </WizardBody>
            )}
            {stage === 'exceptions' && (
              <WizardBody key="exceptions" title="Review Exceptions" description="Items that may need attention before payroll approval.">
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                  {data.analytics.exceptions.length > 0 ? data.analytics.exceptions.map((ex, i) => (
                    <div key={i} className={cn(
                      'flex items-start gap-2 rounded-md border px-2.5 py-2',
                      ex.severity === 'critical' ? 'border-rose-500/30 bg-rose-500/5' :
                      ex.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/5' :
                      'border-sky-500/30 bg-sky-500/5',
                    )}>
                      <AlertCircle className={cn(
                        'h-3.5 w-3.5 shrink-0 mt-0.5',
                        ex.severity === 'critical' ? 'text-rose-600' :
                        ex.severity === 'warning' ? 'text-amber-600' : 'text-sky-600',
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium">{ex.employeeName}</p>
                        <p className="text-[10px] text-muted-foreground">{ex.description}</p>
                      </div>
                    </div>
                  )) : (
                    <SalaryEmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="No exceptions" description="All employees are ready for payroll." />
                  )}
                </div>
              </WizardBody>
            )}
            {stage === 'approve' && (
              <WizardBody key="approve" title="Approve Payroll" description="Final review before disbursement.">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Employees</span>
                    <span className="font-bold tabular-nums">{data.employees.length}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Gross Earnings</span>
                    <span className="font-bold tabular-nums">{formatINR(totalGross, true)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Deductions</span>
                    <span className="font-bold tabular-nums text-rose-600">-{formatINR(totalDeductions, true)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Adjustments</span>
                    <span className="font-bold tabular-nums text-amber-600">+{formatINR(totalAdjustments, true)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/30">
                    <span className="font-bold">Net Payable</span>
                    <span className="font-bold tabular-nums text-emerald-600">{formatINR(totalNet, true)}</span>
                  </div>
                </div>
              </WizardBody>
            )}
            {stage === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-500/20 border-t-emerald-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold mt-4">Processing Payroll…</p>
                <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">{formatINR(totalNet, true)} to {data.employees.length} employees</p>
                <p className="text-[10px] text-muted-foreground/60 mt-3 flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> Do not close this window
                </p>
              </motion.div>
            )}
            {stage === 'success' && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 py-2">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="flex flex-col items-center text-center py-3"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg mb-2">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <p className="font-display text-base font-bold text-emerald-700 dark:text-emerald-400">Payroll Processed</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{period} · {data.employees.length} employees · {formatINR(totalNet, true)}</p>
                </motion.div>
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5 flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-muted-foreground">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">Payroll completed</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
          {stage === 'processing' || stage === 'success' ? (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => stageIdx > 0 ? setStage(STAGES[stageIdx - 1].value) : onClose()}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              {stage === 'approve' ? (
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white" onClick={handleApprove}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Approve & Disburse
                </Button>
              ) : (
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setStage(STAGES[Math.min(stageIdx + 1, STAGES.length - 1)].value)}>
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function WizardBody({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="space-y-3"
    >
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      {children}
    </motion.div>
  )
}
