'use client'

import { BarTrend, ChartCard } from '@/components/shared/charts'
import { collaborationStats } from '@/lib/mock/peer-collab'

export function ActivityChart() {
  return (
    <ChartCard title="Weekly Collaboration Activity" subtitle="Posts, shares & answers per day">
      <BarTrend data={collaborationStats.weeklyActivity} xKey="day" yKey="posts" color="oklch(0.6 0.2 300)" height={180} />
    </ChartCard>
  )
}
