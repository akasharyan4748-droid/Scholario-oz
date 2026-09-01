'use client'

/**
 * SalaryReportsSection — month summary, department totals, method split,
 * and a CSV export of the month's payments.
 */

import { useMemo, useState } from 'react'
import { Check, Clock, Download, Landmark, Users, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalaryStore, useSalaryData, periodOptions, periodLabel } from '@/lib/store/salary-store'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { SalaryPanel, CompactEmpty, moneyMy } from './salary-shared'

export function SalaryReportsSection() {
  const payments = useSalaryStore((s) => s.payments)
  const data = useSalaryData()
  const months = useMemo(() => periodOptions(6), [])
  const [month, setMonth] = useState(months[0])

  const monthPayments = useMemo(
    () => payments.filter((p) => p.periodKey === month && p.status !== 'Reversed'),
    [payments, month],
  )
  const confirmed = monthPayments.filter((p) => p.status === 'Confirmed')
  const pending = monthPayments.filter((p) => p.status === 'Pending Receipt')
  const notReceived = monthPayments.filter((p) => p.status === 'Not Received')

  const methods = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>()
    confirmed.forEach((p) => {
      const cur = map.get(p.method) ?? { count: 0, amount: 0 }
      map.set(p.method, { count: cur.count + 1, amount: cur.amount + p.amount })
    })
    return Array.from(map.entries()).map(([method, v]) => ({ method, ...v })).sort((a, b) => b.amount - a.amount)
  }, [confirmed])

  const confirmedTotal = confirmed.reduce((s, p) => s + p.amount, 0)
  const maxDept = Math.max(1, ...data.departmentTotals.map((d) => d.payable))

  const handleExport = () => {
    const header = 'Employee,Month,Amount,Date,Method,Reference,Status,Receipt\n'
    const body = monthPayments
      .map((p) => [
        `"${p.employeeName}"`, p.monthLabel, String(p.amount), p.date, p.method,
        p.reference ?? '', p.status, p.receiptNo ?? '',
      ].join(','))
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `salary-payments-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export ready', { description: `salary-payments-${month}.csv` })
  }

  return (
    <div className="space-y-4">
      {/* Month + export toolbar — the "Reports" tab already establishes
          context, so no page heading (UX-REFINE). */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[70]">
              {months.map((m) => <SelectItem key={m} value={m} className="text-xs">{periodLabel(m)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPIs for the selected month — Fee Management design language */}
      <SummaryCardGrid columns={4}>
        <SummaryCard icon={<Check className="h-4 w-4" />} label="Confirmed" value={moneyMy(confirmedTotal)} sub={`${confirmed.length} payments`} tone="emerald" delay={0} />
        <SummaryCard icon={<Clock className="h-4 w-4" />} label="Pending" value={moneyMy(pending.reduce((s, p) => s + p.amount, 0))} sub={`${pending.length} payments`} tone="amber" delay={0.05} />
        <SummaryCard icon={<X className="h-4 w-4" />} label="Not Received" value={moneyMy(notReceived.reduce((s, p) => s + p.amount, 0))} sub={`${notReceived.length} reports`} tone={notReceived.length ? 'rose' : 'slate'} delay={0.1} />
        <SummaryCard icon={<Users className="h-4 w-4" />} label="Staff" value={data.rows.length} sub={`${data.departmentTotals.length} departments`} tone="violet" delay={0.15} />
      </SummaryCardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department totals (current month) */}
        <SalaryPanel title="Payable by Department" subtitle={data.monthLabel}>
          <div className="space-y-2.5">
            {data.departmentTotals.map((d) => (
              <div key={d.dept}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{d.dept} <span className="text-muted-foreground">· {d.staff}</span></span>
                  <span className="tabular-nums text-muted-foreground">{moneyMy(d.payable)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', d.confirmed >= d.payable ? 'bg-emerald-500' : 'bg-sky-500/70')}
                    style={{ width: `${Math.max(3, (d.payable / maxDept) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SalaryPanel>

        {/* Method split (confirmed, selected month) */}
        <SalaryPanel title="Confirmed by Method" subtitle={periodLabel(month)}>
          {methods.length === 0 ? (
            <CompactEmpty icon={<Check className="h-3.5 w-3.5" />}>No confirmed payments this month</CompactEmpty>
          ) : (
            <div className="space-y-2.5">
              {methods.map((m) => (
                <div key={m.method} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Landmark className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{m.method} <span className="text-muted-foreground">· {m.count}</span></span>
                      <span className="tabular-nums font-semibold">{moneyMy(m.amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500/80" style={{ width: `${confirmedTotal > 0 ? Math.max(3, (m.amount / confirmedTotal) * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SalaryPanel>
      </div>
    </div>
  )
}
