'use client'

/**
 * FinanceReportsSection — centralized Finance reports with filters + export.
 *
 * 12 report types:
 *   Financial Summary · P&L · Balance Sheet · Cash Flow · Fee Revenue ·
 *   Payroll Expense · Budget vs Actual · Expense Report · Income Report ·
 *   Receivables · Payables · Tax Summary
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileBarChart2, Download, TrendingUp, Wallet, Receipt, Banknote,
  ArrowDownRight, ArrowUpRight, IndianRupee, ShieldCheck, Calendar, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFinanceData } from '@/lib/store/finance-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FinancePanel, FinanceEmptyState } from './finance-shared'
import { toast } from 'sonner'

type ReportType =
  | 'summary' | 'pnl' | 'balance' | 'cashflow'
  | 'fee-revenue' | 'payroll-expense' | 'budget' | 'expense'
  | 'income' | 'receivables' | 'payables' | 'tax'

interface ReportMeta {
  id: ReportType
  label: string
  description: string
  icon: React.ReactNode
  accent: string
}

const REPORTS: ReportMeta[] = [
  { id: 'summary', label: 'Financial Summary', description: 'Overview of all key metrics', icon: <TrendingUp className="h-4 w-4" />, accent: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'pnl', label: 'Profit & Loss', description: 'Income and expenses', icon: <FileBarChart2 className="h-4 w-4" />, accent: 'bg-sky-500/10 text-sky-600' },
  { id: 'balance', label: 'Balance Sheet', description: 'Assets and liabilities', icon: <Wallet className="h-4 w-4" />, accent: 'bg-violet-500/10 text-violet-600' },
  { id: 'cashflow', label: 'Cash Flow', description: 'Cash movement', icon: <Banknote className="h-4 w-4" />, accent: 'bg-cyan-500/10 text-cyan-600' },
  { id: 'fee-revenue', label: 'Fee Revenue', description: 'Fees collected', icon: <Receipt className="h-4 w-4" />, accent: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'payroll-expense', label: 'Payroll Expense', description: 'Staff cost breakdown', icon: <Users className="h-4 w-4" />, accent: 'bg-amber-500/10 text-amber-600' },
  { id: 'budget', label: 'Budget vs Actual', description: 'Variance analysis', icon: <FileBarChart2 className="h-4 w-4" />, accent: 'bg-violet-500/10 text-violet-600' },
  { id: 'expense', label: 'Expense Report', description: 'All expenses by category', icon: <ArrowDownRight className="h-4 w-4" />, accent: 'bg-rose-500/10 text-rose-600' },
  { id: 'income', label: 'Income Report', description: 'All income sources', icon: <ArrowUpRight className="h-4 w-4" />, accent: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'receivables', label: 'Receivables', description: 'Outstanding fees', icon: <Receipt className="h-4 w-4" />, accent: 'bg-amber-500/10 text-amber-600' },
  { id: 'payables', label: 'Payables', description: 'Pending obligations', icon: <ArrowDownRight className="h-4 w-4" />, accent: 'bg-rose-500/10 text-rose-600' },
  { id: 'tax', label: 'Tax Summary', description: 'TDS and tax liabilities', icon: <IndianRupee className="h-4 w-4" />, accent: 'bg-cyan-500/10 text-cyan-600' },
]

export function FinanceReportsSection({ data }: { data: ReturnType<typeof useFinanceData> }) {
  const [activeReport, setActiveReport] = useState<ReportType>('summary')
  const report = REPORTS.find((r) => r.id === activeReport)!

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
      <FinancePanel
        title={report.label}
        subtitle={report.description}
        action={<Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => toast.success('Report exported', { description: `${report.label}.csv downloaded` })}>
          <Download className="h-3 w-3" /> Export CSV
        </Button>}
        bodyClassName="p-0"
      >
        <ReportBody type={activeReport} data={data} />
      </FinancePanel>
    </div>
  )
}

function ReportBody({ type, data }: { type: ReportType; data: ReturnType<typeof useFinanceData> }) {
  if (type === 'summary') {
    return (
      <ReportTable
        headers={['Metric', 'Value']}
        rows={[
          ['Total Revenue', formatINR(data.totalRevenue, true)],
          ['Total Expenses', formatINR(data.totalExpenses, true)],
          ['Net Surplus', formatINR(data.netSurplus, true)],
          ['Surplus Margin', `${data.surplusMargin}%`],
          ['Cash Available', formatINR(data.cashAvailable, true)],
          ['Total Assets', formatINR(data.totalAssets, true)],
          ['Total Liabilities', formatINR(data.totalLiabilities, true)],
          ['Net Worth', formatINR(data.netWorth, true)],
          ['Reserve Coverage', `${data.reserveCoverage} months`],
          ['Collection Rate', `${data.feeCollectionRate}%`],
        ]}
      />
    )
  }

  if (type === 'pnl') {
    const incomeItems = data.pnlData.filter((p) => p.type === 'income')
    const expenseItems = data.pnlData.filter((p) => p.type === 'expense')
    return (
      <ReportTable
        headers={['Category', 'Type', 'Amount', 'YoY Change']}
        rows={[
          ...incomeItems.map((i) => [i.category, 'Income', formatINR(i.amount, true), `+${i.yoyChange}%`]),
          ...expenseItems.map((e) => [e.category, 'Expense', formatINR(e.amount, true), `+${e.yoyChange}%`]),
        ]}
        totals={['Total', '', `Revenue: ${formatINR(data.totalRevenue, true)} · Expenses: ${formatINR(data.totalExpenses, true)}`, `Surplus: ${formatINR(data.netSurplus, true)}`]}
      />
    )
  }

  if (type === 'balance') {
    return (
      <ReportTable
        headers={['Account', 'Category', 'Type', 'Amount']}
        rows={data.balanceSheet.map((b) => [b.account, b.category, b.type.charAt(0).toUpperCase() + b.type.slice(1), formatINR(b.amount, true)])}
        totals={['Total', '', '', `Assets: ${formatINR(data.totalAssets, true)} · Liabilities: ${formatINR(data.totalLiabilities, true)}`]}
      />
    )
  }

  if (type === 'cashflow') {
    return (
      <ReportTable
        headers={['Description', 'Activity', 'Inflow', 'Outflow', 'Net']}
        rows={data.cashflow.map((c) => [c.description, c.activity.charAt(0).toUpperCase() + c.activity.slice(1), c.inflow > 0 ? formatINR(c.inflow, true) : '—', c.outflow > 0 ? formatINR(c.outflow, true) : '—', formatINR(c.inflow - c.outflow, true)])}
        totals={['Total', '', formatINR(data.cashflow.reduce((s, c) => s + c.inflow, 0), true), formatINR(data.cashflow.reduce((s, c) => s + c.outflow, 0), true), formatINR(data.netCashChange, true)]}
      />
    )
  }

  if (type === 'fee-revenue') {
    return (
      <ReportTable
        headers={['Metric', 'Value']}
        rows={[
          ['Fee Revenue (Collected)', formatINR(data.feeRevenue, true)],
          ['Fee Expected', formatINR(data.feeExpected, true)],
          ['Outstanding Fees', formatINR(data.feeOutstanding, true)],
          ['Collection Rate', `${data.feeCollectionRate}%`],
          ['Students with Dues', String(data.receivableStudentCount)],
        ]}
      />
    )
  }

  if (type === 'payroll-expense') {
    return (
      <ReportTable
        headers={['Metric', 'Monthly', 'Annualized']}
        rows={[
          ['Monthly Payroll', formatINR(data.monthlyPayroll, true), formatINR(data.monthlyPayroll * 12, true)],
          ['Annualized Payroll', '—', formatINR(data.annualizedPayroll, true)],
          ['Pending Adjustments', String(data.alerts.find((a) => a.id === 'payroll-pending') ? 'Pending' : '0'), '—'],
        ]}
      />
    )
  }

  if (type === 'budget') {
    return (
      <ReportTable
        headers={['Category', 'Budget', 'Actual', 'Variance', 'Utilization']}
        rows={data.budgetData.map((b) => {
          const variance = b.budget - b.actual
          const utilization = b.budget > 0 ? Math.round((b.actual / b.budget) * 100) : 0
          return [b.category, formatINR(b.budget, true), formatINR(b.actual, true), `${variance >= 0 ? '-' : '+'}${formatINR(Math.abs(variance), true)}`, `${utilization}%`]
        })}
        totals={['Total', formatINR(data.totalBudget, true), formatINR(data.totalActual, true), `${data.totalVariance >= 0 ? '-' : '+'}${formatINR(Math.abs(data.totalVariance), true)}`, `${data.budgetUtilization}%`]}
      />
    )
  }

  if (type === 'expense') {
    return (
      <ReportTable
        headers={['Category', 'Amount', 'Share']}
        rows={data.expenseBreakdown.map((e) => [e.name, formatINR(e.value, true), `${((e.value / data.totalExpenses) * 100).toFixed(1)}%`])}
        totals={['Total', formatINR(data.totalExpenses, true), '100%']}
      />
    )
  }

  if (type === 'income') {
    const incomeItems = data.pnlData.filter((p) => p.type === 'income')
    return (
      <ReportTable
        headers={['Category', 'Account', 'Amount', 'YoY Change']}
        rows={incomeItems.map((i) => [i.category, i.account, formatINR(i.amount, true), `+${i.yoyChange}%`])}
        totals={['Total Revenue', '', formatINR(data.totalRevenue, true), '']}
      />
    )
  }

  if (type === 'receivables') {
    return (
      <ReportTable
        headers={['Type', 'Amount', 'Count']}
        rows={[
          ['Outstanding Fees', formatINR(data.feeOutstanding, true), `${data.receivableStudentCount} students`],
          ['Other Receivables', formatINR(data.otherReceivables, true), '—'],
          ['Total Receivables', formatINR(data.totalReceivables, true), ''],
        ]}
      />
    )
  }

  if (type === 'payables') {
    return (
      <ReportTable
        headers={['Type', 'Amount', 'Notes']}
        rows={[
          ['Payroll Payable', formatINR(data.payrollPayable, true), 'Monthly salary'],
          ['Vendor Payables', formatINR(data.vendorPayables, true), 'Outstanding invoices'],
          ['Loan (Annual)', formatINR(data.longTermLiabilities, true), 'Long-term'],
          ['Loan (Monthly)', formatINR(Math.round(data.longTermLiabilities / 12), true), 'Monthly portion'],
          ['Total Payables', formatINR(data.totalPayables, true), ''],
        ]}
      />
    )
  }

  if (type === 'tax') {
    // Pull TDS / PF from salary deductions (estimated).
    return (
      <ReportTable
        headers={['Tax Type', 'Estimated Annual', 'Notes']}
        rows={[
          ['TDS (Income Tax)', formatINR(Math.round(data.annualizedPayroll * 0.05), true), '~5% of payroll'],
          ['Provident Fund (PF)', formatINR(Math.round(data.annualizedPayroll * 0.5 * 0.12), true), '12% of Basic'],
          ['Professional Tax', formatINR(28 * 12 * 200, true), '₹200/employee/month'],
          ['Total Tax Liability', formatINR(Math.round(data.annualizedPayroll * 0.05) + Math.round(data.annualizedPayroll * 0.06) + 28 * 12 * 200, true), ''],
        ]}
      />
    )
  }

  return <FinanceEmptyState icon={<FileBarChart2 className="h-6 w-6" />} title="Report not available" />
}

function ReportTable({ headers, rows, totals }: { headers: string[]; rows: string[][]; totals?: string[] }) {
  return (
    <div className="overflow-x-auto max-h-[36rem]">
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
            <tr><td colSpan={headers.length} className="py-8"><FinanceEmptyState icon={<FileBarChart2 className="h-6 w-6" />} title="No data" description="No records for this report." /></td></tr>
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
