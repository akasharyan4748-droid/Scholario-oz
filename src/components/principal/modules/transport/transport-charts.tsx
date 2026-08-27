'use client'

import { BarChart3, Gauge } from 'lucide-react'
import { useTransportStore, useTransportData } from '@/lib/store/transport-store'
import { TptPanel, TptPill } from './transport-shared'
import { DonutChart, RadialProgress, HorizontalBarChart } from '@/components/shared/premium-charts'

export function RouteDistributionChart() {
  const data = useTransportData()
  const routes = useTransportStore((s) => s.routes)
  const { routeDistribution } = data.analytics
  const totalStudents = routeDistribution.reduce((s, d) => s + d.value, 0)

  const donutData = routeDistribution.map((d, i) => ({
    name: routes[i]?.name ?? d.name,
    value: d.value,
    color: d.color,
  }))

  return (
    <TptPanel
      title="Route Distribution"
      subtitle="students per route"
      action={<TptPill accent="bg-muted text-muted-foreground">{routeDistribution.length} routes</TptPill>}
    >
      <DonutChart
        data={donutData}
        centerLabel="Students"
        centerValue={String(totalStudents)}
        formatValue={(n) => n.toLocaleString('en-IN')}
        size={180}
        thickness={20}
      />
    </TptPanel>
  )
}

export function CapacityUtilizationChart() {
  const data = useTransportData()
  const routes = useTransportStore((s) => s.routes)
  const { capacityUtil } = data.analytics
  const avgUtil = capacityUtil.length > 0 ? Math.round(capacityUtil.reduce((s, c) => s + c.value, 0) / capacityUtil.length) : 0

  return (
    <TptPanel
      title="Capacity Utilization"
      subtitle="average utilization across all routes"
      action={<TptPill accent="bg-muted text-muted-foreground">{capacityUtil.length} routes</TptPill>}
    >
      <div className="flex items-center gap-6">
        <RadialProgress
          value={avgUtil}
          max={100}
          size={140}
          thickness={14}
          color={avgUtil > 90 ? 'oklch(0.62 0.2 25)' : avgUtil > 75 ? 'oklch(0.65 0.16 75)' : 'oklch(0.55 0.14 162)'}
          label="Avg Utilization"
          showTicks
          glow
        />
        <div className="flex-1 space-y-1.5">
          {capacityUtil.map((c, i) => {
            const route = routes[i]
            const isFull = c.value >= 100
            const isNear = c.value >= 85
            return (
              <div key={c.name} className="flex items-center gap-2 text-[10px]">
                <span className="w-28 shrink-0 truncate font-medium" title={route?.name}>{route?.name ?? c.name}</span>
                <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, c.value)}%`,
                      background: isFull ? 'oklch(0.62 0.2 25)' : isNear ? 'oklch(0.65 0.16 75)' : 'oklch(0.55 0.14 162)',
                    }}
                  />
                </div>
                <span className="w-16 text-right tabular-nums text-muted-foreground">
                  {c.enrolled}/{c.capacity}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </TptPanel>
  )
}

// Combined Transport Reports view (Route Distribution + Capacity Utilization)
export function TransportReports() {
  return (
    <div className="space-y-3">
      <RouteDistributionChart />
      <CapacityUtilizationChart />
    </div>
  )
}
