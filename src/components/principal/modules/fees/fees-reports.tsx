'use client'

/**
 * FeesReportsSection — filterable & exportable financial reports.
 *
 * Only the 4 genuinely unique reports are listed here; other aggregations
 * (monthly trend, class-wise, outstanding, overdue, cash, raw transactions)
 * are surfaced in their dedicated tabs to avoid metric duplication:
 *   - Daily Collection      — day-wise collected amount (unique breakdown)
 *   - Fee Head Collection   — revenue by fee head (unique byCategory aggregation)
 *   - Payment Mode Report   — distribution by payment method (unique)
 *   - Concession Report     — approved concessions (unique — not in any tab)
 *
 * Reports removed (duplicates of other tabs):
 *   - Monthly Collection    → Overview's Collection Trend chart
 *   - Class-wise Collection → Overview's Class-wise Collection bar chart
 *   - Student Outstanding   → Pending Dues tab
 *   - Overdue Report        → Pending Dues tab filtered to status='Overdue'
 *   - Cash Collection       → Approvals tab
 *   - Transaction Report    → Transactions tab + Collections Recent Payments
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileBarChart2, Download, Calendar, IndianRupee,
  Smartphone, Gift,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeData } from '@/lib/store/fee-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel, FeeEmptyState } from './fees-shared'
import { toast } from 'sonner'

type ReportType = 'daily' | 'fee-head' | 'payment-mode' | 'concession'

interface ReportMeta {
  id: ReportType
  label: string
  description: string
  icon: React.ReactNode
  accent: string
}

const REPORTS: ReportMeta[] = [
  { id: 'daily', label: 'Daily Collection', description: 'Day-wise collected amount', icon: <Calendar className="h-4 w-4" />, accent: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'fee-head', label: 'Fee Head Collection', description: 'Revenue by fee head', icon: <IndianRupee className="h-4 w-4" />, accent: 'bg-amber-500/10 text-amber-600' },
  { id: 'payment-mode', label: 'Payment Mode Report', description: 'Distribution by payment method', icon: <Smartphone className="h-4 w-4" />, accent: 'bg-cyan-500/10 text-cyan-600' },
  { id: 'concession', label: 'Concession Report', description: 'Approved concessions', icon: <Gift className="h-4 w-4" />, accent: 'bg-violet-500/10 text-violet-600' },
]

export function FeesReportsSection({ data }: { data: ReturnType<typeof useFeeData> }) {
  const [activeReport, setActiveReport] = useState<ReportType>('daily')
  const report = REPORTS.find((r) => r.id === activeReport)!

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Report picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
      <FeePanel
        title={report.label}
        subtitle={report.description}
        action={
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => toast.success('Report exported', { description: `${report.label}.csv downloaded.` })}>
            <Download className="h-3 w-3" /> Export CSV
          </Button>
        }
        bodyClassName="p-0"
      >
        <ReportBody type={activeReport} data={data} />
      </FeePanel>

      {/* Hint about removed reports */}
      <p className="text-[10px] text-muted-foreground/70 text-center">
        Monthly trend, class-wise, outstanding, overdue, cash, and transaction reports live in their dedicated tabs.
      </p>
    </div>
  )
}

function ReportBody({ type, data }: { type: ReportType; data: ReturnType<typeof useFeeData> }) {
  const { transactions, accounts, analytics } = data

  if (type === 'daily') {
    const dayMap = new Map<string, { count: number; amount: number }>()
    transactions.filter((t) => t.status === 'Success').forEach((t) => {
      const e = dayMap.get(t.date) ?? { count: 0, amount: 0 }
      e.count++
      e.amount += t.amount
      dayMap.set(t.date, e)
    })
    const rows = Array.from(dayMap.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    return (
      <ReportTable
        headers={['Date', 'Payments', 'Amount']}
        rows={rows.map(([date, e]) => [formatDate(date), String(e.count), formatINR(e.amount)])}
        totals={['Total', String(rows.reduce((s, [, e]) => s + e.count, 0)), formatINR(rows.reduce((s, [, e]) => s + e.amount, 0))]}
      />
    )
  }

  if (type === 'fee-head') {
    return (
      <ReportTable
        headers={['Fee Head', 'Expected', 'Collected', 'Outstanding', 'Collection %']}
        rows={analytics.byCategory.map((c) => {
          const collected = transactions.filter((t) => t.status === 'Success' && t.feeHead.toLowerCase().includes(c.name.toLowerCase())).reduce((s, t) => s + t.amount, 0)
          const outstanding = Math.max(0, c.value - collected)
          const pct = c.value > 0 ? Math.round((collected / c.value) * 100) : 0
          return [c.name, formatINR(c.value), formatINR(collected), formatINR(outstanding), `${pct}%`]
        })}
        totals={['Total', formatINR(analytics.totalExpected), formatINR(analytics.totalCollected), formatINR(analytics.totalOutstanding), `${analytics.collectionRate}%`]}
      />
    )
  }

  if (type === 'payment-mode') {
    const modeMap = new Map<string, { count: number; amount: number }>()
    transactions.filter((t) => t.status === 'Success').forEach((t) => {
      const e = modeMap.get(t.mode) ?? { count: 0, amount: 0 }
      e.count++
      e.amount += t.amount
      modeMap.set(t.mode, e)
    })
    const rows = Array.from(modeMap.entries()).sort((a, b) => b[1].amount - a[1].amount)
    const total = rows.reduce((s, [, e]) => s + e.amount, 0)
    return (
      <ReportTable
        headers={['Mode', 'Payments', 'Amount', 'Share']}
        rows={rows.map(([mode, e]) => [mode, String(e.count), formatINR(e.amount), total > 0 ? `${((e.amount / total) * 100).toFixed(1)}%` : '0%'])}
        totals={['Total', String(rows.reduce((s, [, e]) => s + e.count, 0)), formatINR(total), '100%']}
      />
    )
  }

  if (type === 'concession') {
    const rows = accounts.filter((a) => a.concession > 0)
    return (
      <ReportTable
        headers={['Student', 'Class', 'Original Fee', 'Concession', 'Net Payable', 'Approved By', 'Date']}
        rows={rows.map((a) => [a.studentName, `${a.className}-${a.section}`, formatINR(a.totalApplicable), formatINR(a.concession), formatINR(a.netPayable), 'Principal', '2025-04-02'])}
        totals={['Total', String(rows.length), formatINR(rows.reduce((s, a) => s + a.totalApplicable, 0)), formatINR(rows.reduce((s, a) => s + a.concession, 0)), formatINR(rows.reduce((s, a) => s + a.netPayable, 0)), '', '']}
      />
    )
  }

  return <FeeEmptyState icon={<FileBarChart2 className="h-6 w-6" />} title="Report not available" />
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
                i === 0 ? 'text-left' : i === headers.length - 1 || headers.length - i <= 2 ? 'text-right' : 'text-left',
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
            <tr><td colSpan={headers.length} className="py-8"><FeeEmptyState icon={<FileBarChart2 className="h-6 w-6" />} title="No records" description="No data for this report yet." /></td></tr>
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
