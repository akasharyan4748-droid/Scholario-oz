'use client'

// Payroll overview — KPI cards + trend/earnings-vs-deductions charts.

import { Wallet, Calculator, Gift, TrendingDown } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { StatusBadge } from '@/components/shared/ui'
import { salaryAnalytics } from '@/lib/mock/finance'
import { school } from '@/lib/mock/school'
import { formatINR } from '@/lib/format'
import { earningsVsDeduction } from './data'

export function SalaryOverview() {
  const netRatioPct = Math.round(
    (earningsVsDeduction[0].value / salaryAnalytics.totalMonthly) * 100
  )

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Monthly Payroll"
          value={salaryAnalytics.totalMonthly}
          format={(n) => formatINR(n, true)}
          icon={<Wallet className="h-5 w-5" />}
          trend={4.8}
          trendLabel={`${school.totalStaff} staff · monthly payroll`}
          accent="emerald"
          sparkline={salaryAnalytics.monthly.map((m) => ({ name: m.month, v: m.amount }))}
          sparkKey="v"
          delay={0}
        />
        <KpiCard
          label="Annual Payroll"
          value={salaryAnalytics.totalAnnual}
          format={(n) => formatINR(n, true)}
          icon={<Calculator className="h-5 w-5" />}
          trend={6.2}
          trendLabel="FY 2025-26 projection"
          accent="cyan"
          delay={0.05}
        />
        <KpiCard
          label="Bonus Given"
          value={salaryAnalytics.bonusGiven}
          format={(n) => formatINR(n, true)}
          icon={<Gift className="h-5 w-5" />}
          trend={12.0}
          trendLabel="Festive & performance bonus"
          accent="amber"
          delay={0.1}
        />
        <KpiCard
          label="Total Deductions"
          value={salaryAnalytics.deductionsTotal}
          format={(n) => formatINR(n, true)}
          icon={<TrendingDown className="h-5 w-5" />}
          trend={2.4}
          trendLabel="PF + Tax + Insurance"
          accent="rose"
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard
          title="Monthly Payroll Trend"
          subtitle="Total monthly disbursal · last 6 months"
          className="lg:col-span-2"
          action={<StatusBadge status="+4.8% MoM" variant="success" dot />}
        >
          <AreaTrend
            data={salaryAnalytics.monthly}
            xKey="month"
            yKey="amount"
            color="oklch(0.55 0.14 162)"
            height={280}
            gradientId="salGrad"
          />
        </ChartCard>

        <ChartCard title="Earnings vs Deductions" subtitle="Current month split">
          <Donut
            data={earningsVsDeduction}
            centerValue={`${netRatioPct}%`}
            centerLabel="Net ratio"
            height={280}
          />
        </ChartCard>
      </div>
    </>
  )
}
