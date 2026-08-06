'use client'

import { Wallet, Banknote, Scale, FileText } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { financeStats } from '@/lib/mock/finance-dashboard'
import { formatINR } from '@/lib/format'
import { A, E, R, V } from './data'

// KPI cards row — Cash on Hand, Total Assets, Liabilities, Net Worth.
// Each card has a sparkline sourced from the finance-dashboard mock.
export function KpiRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Cash on Hand"
        value={financeStats.cashOnHand}
        format={(n) => formatINR(n, true)}
        icon={<Banknote className="h-5 w-5" />}
        accent="emerald"
        trend={4.2}
        trendLabel="healthy reserves"
        delay={0}
        sparkline={financeStats.monthlyRevenue.slice(0, 8).map((m) => ({ name: m.month, v: m.revenue }))}
        sparkKey="v"
        sparkColor={E}
      />
      <KpiCard
        label="Total Assets"
        value={financeStats.totalAssets}
        format={(n) => formatINR(n, true)}
        icon={<Scale className="h-5 w-5" />}
        accent="violet"
        trend={8.4}
        trendLabel="incl. land & building"
        delay={0.05}
        sparkline={financeStats.quarterlyRevExp.map((q) => ({ name: q.quarter, v: q.revenue }))}
        sparkKey="v"
        sparkColor={V}
      />
      <KpiCard
        label="Liabilities"
        value={financeStats.totalLiabilities}
        format={(n) => formatINR(n, true)}
        icon={<FileText className="h-5 w-5" />}
        accent="rose"
        trend={-2.1}
        trendLabel="loan being repaid"
        delay={0.1}
        sparkline={financeStats.monthlyRevenue.slice(0, 8).map((m) => ({ name: m.month, v: m.expense }))}
        sparkKey="v"
        sparkColor={R}
      />
      <KpiCard
        label="Net Worth"
        value={financeStats.netWorth}
        format={(n) => formatINR(n, true)}
        icon={<Wallet className="h-5 w-5" />}
        accent="amber"
        trend={14.2}
        trendLabel="corpus + surplus"
        delay={0.15}
        sparkline={financeStats.quarterlySurplus.map((q) => ({ name: q.quarter, v: q.surplus }))}
        sparkKey="v"
        sparkColor={A}
      />
    </div>
  )
}
