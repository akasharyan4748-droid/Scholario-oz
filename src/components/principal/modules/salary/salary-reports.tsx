'use client'

/**
 * SalaryReportsSection — financial analysis and exports.
 *
 * 11 report types:
 *   Monthly Summary · Department-wise · Salary Cost Analysis ·
 *   Earnings & Deductions · Tax Summary · PF Summary ·
 *   Bank Disbursement · Bonus Report · Reimbursement ·
 *   Payroll Register · Employee Summary
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileBarChart2, Download, Calendar, Users, IndianRupee, ShieldCheck,
  Banknote, Gift, Wallet, List, TrendingUp, PieChart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSalaryData, calculatePayrollForEmployee } from '@/lib/store/salary-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SalaryPanel, SalaryEmptyState } from './salary-shared'
import { toast } from 'sonner'

type ReportType =
  | 'monthly' | 'department' | 'cost' | 'earnings-deductions'
  | 'tax' | 'pf' | 'bank' | 'bonus' | 'reimbursement'
  | 'register' | 'employee'

interface ReportMeta {
  id: ReportType
  label: string
  description: string
  icon: React.ReactNode
  accent: string
}

const REPORTS: ReportMeta[] = [
  { id: 'monthly', label: 'Monthly Summary', description: 'Month-wise payroll summary', icon: <Calendar className="h-4 w-4" />, accent: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'department', label: 'Department-wise Payroll', description: 'Cost by department', icon: <Users className="h-4 w-4" />, accent: 'bg-sky-500/10 text-sky-600' },
  { id: 'cost', label: 'Salary Cost Analysis', description: 'Cost trends and analysis', icon: <TrendingUp className="h-4 w-4" />, accent: 'bg-amber-500/10 text-amber-600' },
  { id: 'earnings-deductions', label: 'Earnings & Deductions', description: 'Component-wise breakdown', icon: <PieChart className="h-4 w-4" />, accent: 'bg-violet-500/10 text-violet-600' },
  { id: 'tax', label: 'Tax Summary', description: 'TDS summary', icon: <IndianRupee className="h-4 w-4" />, accent: 'bg-rose-500/10 text-rose-600' },
  { id: 'pf', label: 'PF Summary', description: 'Provident Fund summary', icon: <ShieldCheck className="h-4 w-4" />, accent: 'bg-cyan-500/10 text-cyan-600' },
  { id: 'bank', label: 'Bank Disbursement Report', description: 'Bank-wise disbursement', icon: <Banknote className="h-4 w-4" />, accent: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'bonus', label: 'Bonus Report', description: 'All bonuses paid', icon: <Gift className="h-4 w-4" />, accent: 'bg-amber-500/10 text-amber-600' },
  { id: 'reimbursement', label: 'Reimbursement Report', description: 'Reimbursements paid', icon: <Wallet className="h-4 w-4" />, accent: 'bg-sky-500/10 text-sky-600' },
  { id: 'register', label: 'Payroll Register', description: 'Complete payroll log', icon: <List className="h-4 w-4" />, accent: 'bg-violet-500/10 text-violet-600' },
  { id: 'employee', label: 'Employee Summary', description: 'All employees with salary', icon: <Users className="h-4 w-4" />, accent: 'bg-emerald-500/10 text-emerald-600' },
]

export function SalaryReportsSection({ data }: { data: ReturnType<typeof useSalaryData> }) {
  const [activeReport, setActiveReport] = useState<ReportType>('monthly')
  const report = REPORTS.find((r) => r.id === activeReport)!

  const handleExportCSV = () => {
    const rd = getReportData(activeReport, data)
    if (!rd) {
      toast.error('Nothing to export', { description: 'This report has no rows yet.' })
      return
    }
    downloadCSV(`${report.label}.csv`, rd.headers, rd.rows, rd.totals)
    toast.success('Report exported', { description: `${report.label}.csv` })
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Report picker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {REPORTS.map((r, i) => (
          <motion.button
            key={r.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => setActiveReport(r.id)}
            className={cn(
              'group rounded-lg border p-2.5 text-left transition-all',
              activeReport === r.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-md mb-1.5', r.accent)}>
              {r.icon}
            </span>
            <p className="text-[11px] font-semibold leading-tight">{r.label}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Active report */}
      <SalaryPanel
        title={report.label}
        subtitle={report.description}
        action={<Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleExportCSV}>
          <Download className="h-3 w-3" /> Export CSV
        </Button>}
        bodyClassName="p-0"
      >
        <ReportBody type={activeReport} data={data} />
      </SalaryPanel>
    </div>
  )
}

function ReportBody({ type, data }: { type: ReportType; data: ReturnType<typeof useSalaryData> }) {
  const rd = useMemo(() => getReportData(type, data), [type, data])
  if (!rd) return <SalaryEmptyState icon={<FileBarChart2 className="h-6 w-6" />} title="Report not available" />
  return <ReportTable headers={rd.headers} rows={rd.rows} totals={rd.totals} />
}

// ─── Report data factory — single source of truth used by ReportBody (display) and the Export CSV button (download) ──

function getReportData(type: ReportType, data: ReturnType<typeof useSalaryData>): { headers: string[]; rows: string[][]; totals?: string[] } | null {
  const calculatedRecords = data.employees.map((e) => {
    const structure = data.structures.find((s) => s.applicableTo === e.employeeType) ?? data.structures[0]
    const calc = calculatePayrollForEmployee(e, structure, data.adjustments)
    return { employee: e, ...calc }
  })

  if (type === 'monthly') {
    return {
      headers: ['Month', 'Employees', 'Gross', 'Deductions', 'Net Paid'],
      rows: data.periods.map((p) => [p.period, String(p.employeeCount), formatINR(p.totalGross, true), formatINR(p.totalDeductions, true), formatINR(p.totalNetPay, true)]),
      totals: ['Total', String(data.periods.reduce((s, p) => s + p.employeeCount, 0)), formatINR(data.periods.reduce((s, p) => s + p.totalGross, 0), true), formatINR(data.periods.reduce((s, p) => s + p.totalDeductions, 0), true), formatINR(data.periods.reduce((s, p) => s + p.totalNetPay, 0), true)],
    }
  }

  if (type === 'department') {
    return {
      headers: ['Department', 'Employees', 'Payroll', 'Share'],
      rows: data.analytics.departmentWise.map((d) => [d.department, String(d.count), formatINR(d.payroll, true), `${((d.payroll / data.analytics.monthlyPayroll) * 100).toFixed(1)}%`]),
      totals: ['Total', String(data.analytics.employeeCount), formatINR(data.analytics.monthlyPayroll, true), '100%'],
    }
  }

  if (type === 'earnings-deductions') {
    const earnings = calculatedRecords[0]?.earnings ?? []
    const deductions = calculatedRecords[0]?.deductions ?? []
    return {
      headers: ['Component', 'Type', 'Total'],
      rows: [
        ...earnings.map((e) => [e.name, 'Earning', formatINR(e.amount * data.employees.length, true)]),
        ...deductions.map((d) => [d.name, 'Deduction', formatINR(d.amount * data.employees.length, true)]),
      ],
    }
  }

  if (type === 'employee') {
    return {
      headers: ['Employee', 'ID', 'Designation', 'Department', 'Gross', 'Net Pay'],
      rows: calculatedRecords.map((r) => [r.employee.name, r.employee.employeeId, r.employee.designation, r.employee.department, formatINR(r.gross, true), formatINR(r.netPay, true)]),
      totals: ['Total', String(calculatedRecords.length), '', '', formatINR(calculatedRecords.reduce((s, r) => s + r.gross, 0), true), formatINR(calculatedRecords.reduce((s, r) => s + r.netPay, 0), true)],
    }
  }

  if (type === 'bank') {
    const bankMap = new Map<string, { count: number; amount: number }>()
    calculatedRecords.forEach((r) => {
      const bank = r.employee.bankIfsc?.slice(0, 4) ?? 'Unknown'
      if (!bankMap.has(bank)) bankMap.set(bank, { count: 0, amount: 0 })
      const e = bankMap.get(bank)!
      e.count++
      e.amount += r.netPay
    })
    return {
      headers: ['Bank', 'Employees', 'Net Pay'],
      rows: Array.from(bankMap.entries()).map(([bank, v]) => [bank, String(v.count), formatINR(v.amount, true)]),
      totals: ['Total', String(calculatedRecords.length), formatINR(calculatedRecords.reduce((s, r) => s + r.netPay, 0), true)],
    }
  }

  if (type === 'bonus' || type === 'reimbursement') {
    const filtered = data.adjustments.filter((a) => type === 'bonus' ? a.type === 'Bonus' || a.type === 'Incentive' : a.type === 'Reimbursement')
    return {
      headers: ['Employee', 'Type', 'Amount', 'Reason', 'Period', 'Status'],
      rows: filtered.map((a) => [a.employeeName, a.type, formatINR(a.amount, true), a.reason, a.effectivePeriod, a.status]),
    }
  }

  if (type === 'register') {
    return {
      headers: ['Employee', 'ID', 'Designation', 'Gross', 'Deductions', 'Adjustments', 'Net Pay'],
      rows: calculatedRecords.map((r) => [r.employee.name, r.employee.employeeId, r.employee.designation, formatINR(r.gross, true), formatINR(r.totalDeductions, true), formatINR(r.totalAdjustments, true), formatINR(r.netPay, true)]),
    }
  }

  if (type === 'pf' || type === 'tax') {
    const componentName = type === 'pf' ? 'Provident Fund' : 'TDS'
    return {
      headers: ['Employee', 'ID', 'Designation', `${componentName} Deduction`],
      rows: calculatedRecords.map((r) => {
        const comp = r.deductions.find((d) => d.name.includes(componentName) || d.name.includes(type === 'pf' ? 'PF' : 'Tax')) ?? { name: componentName, amount: 0 }
        return [r.employee.name, r.employee.employeeId, r.employee.designation, formatINR(comp.amount)]
      }),
    }
  }

  if (type === 'cost') {
    return {
      headers: ['Month', 'Payroll Cost'],
      rows: data.analytics.monthly.map((m) => [m.month, formatINR(m.amount, true)]),
      totals: ['Total', formatINR(data.analytics.monthly.reduce((s, m) => s + m.amount, 0), true)],
    }
  }

  return null
}

// ─── CSV download helper — generates a CSV file from headers + rows + optional totals and triggers a browser download ──

function downloadCSV(filename: string, headers: string[], rows: string[][], totals?: string[]) {
  const allRows = [headers, ...rows]
  if (totals && rows.length > 0) allRows.push(totals)
  const csv = allRows
    .map((row) => row.map((cell) => {
      const needsQuote = /["\n,]/.test(cell)
      return needsQuote ? `"${cell.replace(/"/g, '""')}"` : cell
    }).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ReportTable({ headers, rows, totals }: { headers: string[]; rows: string[][]; totals?: string[] }) {
  return (
    <div className="overflow-x-auto max-h-[32rem]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={cn(
                'px-3 py-2 text-[9px] uppercase font-semibold text-muted-foreground',
                i === 0 ? 'text-left' : 'text-right',
              )}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border/30 hover:bg-muted/20 even:bg-muted/10">
              {row.map((cell, j) => (
                <td key={j} className={cn(
                  'px-3 py-2 text-[11px]',
                  j === 0 ? 'text-left font-medium' : 'text-right tabular-nums',
                )}>{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} className="py-8"><SalaryEmptyState icon={<FileBarChart2 className="h-6 w-6" />} title="No data" description="No records for this report." /></td></tr>
          )}
          {totals && rows.length > 0 && (
            <tr className="border-t-2 border-border bg-muted/40 font-bold">
              {totals.map((cell, j) => (
                <td key={j} className={cn(
                  'px-3 py-2 text-[11px]',
                  j === 0 ? 'text-left font-bold' : 'text-right tabular-nums font-bold',
                )}>{cell}</td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
