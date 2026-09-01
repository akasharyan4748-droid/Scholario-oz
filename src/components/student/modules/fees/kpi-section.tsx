'use client'

import {
  FileText, CheckCircle2, AlertCircle, Receipt,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { formatINR } from '@/lib/format'
import { myTransactions } from './data'

interface KpiSectionProps {
  totalFee: number
  totalPaid: number
  totalPending: number
  paidPct: number
}

export function KpiSection({ totalFee, totalPaid, totalPending, paidPct }: KpiSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Total Fees"
        value={totalFee}
        format={(n) => formatINR(n)}
        icon={<FileText className="h-5 w-5" />}
        trendLabel="Annual fee 2024-25"
        accent="violet"
        delay={0}
      />
      <KpiCard
        label="Paid"
        value={totalPaid}
        format={(n) => formatINR(n)}
        icon={<CheckCircle2 className="h-5 w-5" />}
        trend={paidPct}
        trendLabel={`${paidPct}% completed`}
        accent="emerald"
        delay={0.05}
      />
      <KpiCard
        label="Outstanding"
        value={totalPending}
        format={(n) => formatINR(n)}
        icon={<AlertCircle className="h-5 w-5" />}
        trendLabel="Due by 15 Dec 2024"
        accent="rose"
        delay={0.1}
      />
      <KpiCard
        label="Transactions"
        value={myTransactions.length}
        icon={<Receipt className="h-5 w-5" />}
        trendLabel="All successful"
        accent="cyan"
        delay={0.15}
      />
    </div>
  )
}
