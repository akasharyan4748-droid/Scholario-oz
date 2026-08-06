'use client'

// Department donut + payroll composition (earnings & deductions breakdown).

import { Percent } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ChartCard, Donut, ProgressBar } from '@/components/shared/charts'
import { salaryAnalytics } from '@/lib/mock/finance'
import { school } from '@/lib/mock/school'
import { formatINR } from '@/lib/format'
import { deptSplit, compositionEarnings, compositionDeductions } from './data'

export function PayrollComposition() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard title="Staff by Department" subtitle={`${school.totalTeachers + school.totalStaff} employees`}>
        <Donut data={deptSplit} centerValue={`${school.totalTeachers}`} centerLabel="Teachers" height={260} />
      </ChartCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" /> Payroll Composition
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Standard Indian school payslip structure (Dec 2025)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <CompositionColumn
            title="Earnings"
            titleClass="text-emerald-600 dark:text-emerald-400"
            rows={compositionEarnings}
            total={salaryAnalytics.totalMonthly}
          />
          <CompositionColumn
            title="Deductions"
            titleClass="text-rose-600 dark:text-rose-400"
            rows={compositionDeductions}
            total={salaryAnalytics.deductionsTotal}
          />
        </div>
      </GlassCard>
    </div>
  )
}

function CompositionColumn({
  title,
  titleClass,
  rows,
  total,
}: {
  title: string
  titleClass: string
  rows: { name: string; amt: number; color: string }[]
  total: number
}) {
  return (
    <div>
      <p className={`text-[11px] font-semibold mb-2 uppercase tracking-wide ${titleClass}`}>{title}</p>
      <div className="space-y-2">
        {rows.map((e) => {
          const pct = (e.amt / total) * 100
          return (
            <div key={e.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{e.name}</span>
                <span className="font-mono">{formatINR(e.amt, true)}</span>
              </div>
              <ProgressBar value={pct} color={e.color} height={5} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
