'use client'

import { Wallet, Receipt, AlertCircle, Users } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { feeAnalytics } from '@/lib/mock/finance'
import { formatINR } from '@/lib/format'

// KPI cards row — Total Collected, Collected This Month, Pending Dues,
// Pending Count. All four cards have sparklines and trend deltas with
// staggered motion delays. Pure presentational, no state.
export function KpiRow() {
  const txnThisMonth = feeAnalytics.monthly[feeAnalytics.monthly.length - 1].collected
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Total Collected"
        value={feeAnalytics.totalCollected}
        format={(n) => formatINR(n, true)}
        icon={<Wallet className="h-5 w-5" />}
        trend={12.5}
        trendLabel="This academic year"
        accent="emerald"
        sparkline={feeAnalytics.monthly.map((m) => ({ name: m.month, v: m.collected }))}
        sparkKey="v"
        sparkColor="oklch(0.55 0.14 162)"
        delay={0}
      />
      <KpiCard
        label="Collected This Month"
        value={txnThisMonth}
        format={(n) => formatINR(n, true)}
        icon={<Receipt className="h-5 w-5" />}
        trend={8.4}
        trendLabel="vs last month"
        accent="amber"
        sparkline={feeAnalytics.monthly.slice(-4).map((m) => ({ name: m.month, v: m.collected }))}
        sparkKey="v"
        sparkColor="oklch(0.65 0.16 75)"
        delay={0.05}
      />
      <KpiCard
        label="Pending Dues"
        value={feeAnalytics.pendingDues}
        format={(n) => formatINR(n, true)}
        icon={<AlertCircle className="h-5 w-5" />}
        trend={-4.2}
        trendLabel={`${feeAnalytics.pendingCount} students`}
        accent="rose"
        sparkline={feeAnalytics.monthly.map((m) => ({ name: m.month, v: m.pending }))}
        sparkKey="v"
        sparkColor="oklch(0.62 0.2 25)"
        delay={0.1}
      />
      <KpiCard
        label="Pending Count"
        value={feeAnalytics.pendingCount}
        icon={<Users className="h-5 w-5" />}
        trend={-3.1}
        trendLabel="Active defaulter accounts"
        accent="violet"
        delay={0.15}
      />
    </div>
  )
}
