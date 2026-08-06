'use client'

import { ChartCard, DualArea, Donut, BarTrend } from '@/components/shared/charts'
import { StatusBadge } from '@/components/shared/ui'
import { feeAnalytics } from '@/lib/mock/finance'
import { formatINR } from '@/lib/format'

// ChartsRow1 — Collection vs Pending dual area (lg:col-span-2) + Fee by
// Category donut with collection-rate center value. The YoY delta badge is
// computed from the first/last month of the monthly series.
export function ChartsRow1({ yoyDelta }: { yoyDelta: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      <ChartCard
        title="Collection vs Pending"
        subtitle="Monthly trend · last 9 months"
        className="lg:col-span-2"
        height={280}
        action={<StatusBadge status={`+${yoyDelta}M YoY`} variant="success" dot />}
      >
        <DualArea
          data={feeAnalytics.monthly}
          xKey="month"
          keys={[
            { key: 'collected', color: 'oklch(0.55 0.14 162)', name: 'Collected' },
            { key: 'pending', color: 'oklch(0.62 0.2 25)', name: 'Pending' },
          ]}
          height={280}
        />
      </ChartCard>

      <ChartCard
        title="Fee by Category"
        subtitle="Where the money flows"
        height={280}
        action={<StatusBadge status="5 streams" variant="info" />}
      >
        <Donut
          data={feeAnalytics.byCategory}
          centerValue={`${feeAnalytics.collectionRate}%`}
          centerLabel="Collection rate"
          height={280}
        />
      </ChartCard>
    </div>
  )
}

// ChartsRow2 — Monthly Collection BarTrend with showLabels and compact INR
// label format. Full-width card showing per-month inflow.
export function ChartsRow2() {
  return (
    <ChartCard
      title="Monthly Collection"
      subtitle="Per-month inflow · compact INR"
      height={240}
      action={<StatusBadge status="9 months" variant="neutral" />}
    >
      <BarTrend
        data={feeAnalytics.monthly}
        xKey="month"
        yKey="collected"
        color="oklch(0.55 0.14 162)"
        height={240}
        showLabels
        labelFormat={(v) => formatINR(v, true)}
      />
    </ChartCard>
  )
}
