'use client'

/**
 * SalaryHistorySection — frozen completed payroll periods.
 *
 * - Period selector
 * - Frozen snapshot (employees, gross, deductions, net)
 * - Audit trail of all payroll actions
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  History, ShieldCheck, CheckCircle2, Banknote, Lock, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSalaryData } from '@/lib/store/salary-store'
import { formatINR, formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SalaryPanel, SalaryStat, PayrollStatusBadge, SalaryEmptyState } from './salary-shared'
import { toast } from 'sonner'

export function SalaryHistorySection({ data }: { data: ReturnType<typeof useSalaryData> }) {
  const { periods, audit } = data
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(periods[0]?.period ?? null)

  const selected = periods.find((p) => p.period === selectedPeriod)

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Periods list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {periods.map((p, i) => (
          <motion.button
            key={p.period}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => setSelectedPeriod(p.period)}
            className={cn(
              'rounded-lg border p-3 text-left transition-all',
              selectedPeriod === p.period ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold">{p.period}</p>
              <PayrollStatusBadge status={p.status} />
            </div>
            <p className="text-lg font-bold tabular-nums">{formatINR(p.totalNetPay, true)}</p>
            <p className="text-[9px] text-muted-foreground">{p.employeeCount} employees · disbursed {formatDate(p.disbursedAt ?? '')}</p>
          </motion.button>
        ))}
      </div>

      {/* Selected period snapshot */}
      {selected && (
        <div className="space-y-3">
          <SalaryPanel
            title={`${selected.period} Payroll Snapshot`}
            subtitle={`${selected.employeeCount} employees · ${formatDate(selected.preparedAt ?? '')}`}
            action={<Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => toast.success('Export queued', { description: `${selected.period}-payroll.csv` })}>
              <Download className="h-3 w-3" /> Export
            </Button>}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SalaryStat label="Gross Earnings" value={formatINR(selected.totalGross, true)} accent="emerald" />
              <SalaryStat label="Deductions" value={formatINR(selected.totalDeductions, true)} accent="rose" />
              <SalaryStat label="Adjustments" value={formatINR(selected.totalAdjustments, true)} accent="amber" />
              <SalaryStat label="Net Paid" value={formatINR(selected.totalNetPay, true)} accent="emerald" />
            </div>
          </SalaryPanel>

          {/* Approval trail */}
          <SalaryPanel title="Approval Trail" subtitle="who did what">
            <div className="space-y-1.5">
              {[
                { label: 'Prepared', by: selected.preparedBy, at: selected.preparedAt, icon: <History className="h-3 w-3" />, accent: 'bg-violet-500/10 text-violet-600' },
                { label: 'Approved', by: selected.approvedBy, at: selected.approvedAt, icon: <ShieldCheck className="h-3 w-3" />, accent: 'bg-sky-500/10 text-sky-600' },
                { label: 'Disbursed', by: selected.disbursedBy, at: selected.disbursedAt, icon: <Banknote className="h-3 w-3" />, accent: 'bg-emerald-500/10 text-emerald-600' },
                { label: 'Locked', by: 'Principal', at: selected.lockedAt, icon: <Lock className="h-3 w-3" />, accent: 'bg-muted text-muted-foreground' },
              ].map((step, i) => step.at && (
                <div key={i} className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
                  <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', step.accent)}>
                    {step.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium">{step.label} by {step.by}</p>
                    <p className="text-[9px] text-muted-foreground">{formatRelativeTime(step.at)} · {formatDate(step.at)}</p>
                  </div>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                </div>
              ))}
            </div>
          </SalaryPanel>
        </div>
      )}

      {/* Audit log */}
      <SalaryPanel title="Activity Log">
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
          {audit.slice(0, 15).map((a) => (
            <div key={a.id} className="flex items-start gap-2 rounded-md border border-border/40 px-2 py-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-600">
                <ShieldCheck className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium">{a.description}</p>
                <p className="text-[9px] text-muted-foreground">{formatRelativeTime(a.timestamp)} · by {a.actor}</p>
              </div>
            </div>
          ))}
          {audit.length === 0 && (
            <SalaryEmptyState icon={<History className="h-5 w-5" />} title="No activity yet" description="Payroll actions will be logged here." />
          )}
        </div>
      </SalaryPanel>
    </div>
  )
}
