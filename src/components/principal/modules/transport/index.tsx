'use client'

// Transport module entry point.
//
// `principal-panel.tsx` lazy-loads the named `TransportModule` export from
// this path:
//   import('./modules/transport').then((m) => ({ default: m.TransportModule }))
//
// The module is split into one file per feature (routes table, vehicles table,
// tracking sheet) + a `data.tsx` for derived chart datasets and the shared
// `TransportRoute` type. This index owns the page-level KPI strip + charts +
// the tracking Sheet state.

import { useState } from 'react'
import {
  Bus, Route as RouteIcon, Users, Wrench, Navigation,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { SectionHeading, StatusBadge } from '@/components/shared/ui'
import { ChartCard, BarTrend, Donut } from '@/components/shared/charts'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { transportStats } from '@/lib/mock/operations'
import { formatNumber } from '@/lib/format'
import { ROUTE_DISTRIBUTION, CAPACITY_UTIL, type TransportRoute } from './data'
import { RoutesTable } from './routes-table'
import { VehiclesTable } from './vehicles-table'
import { TrackingScreen } from './tracking-sheet'

export function TransportModule() {
  const [tracking, setTracking] = useState<TransportRoute | null>(null)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Transport Management"
        subtitle="24 vehicles · 16 routes · 1,248 students using transport"
        icon={<Bus className="h-5 w-5" />}
        action={
          <StatusBadge status={`${transportStats.onRoad} on road now`} variant="success" dot />
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total Vehicles" value={transportStats.totalVehicles} icon={<Bus className="h-5 w-5" />} trendLabel="6 buses + 18 mini" accent="emerald" delay={0} />
        <KpiCard label="Active Routes" value={transportStats.totalRoutes} icon={<RouteIcon className="h-5 w-5" />} trendLabel="6 active now" accent="cyan" delay={0.05} />
        <KpiCard label="Drivers" value={transportStats.totalDrivers} icon={<Users className="h-5 w-5" />} trendLabel="4 on standby" accent="amber" delay={0.1} />
        <KpiCard label="Transport Users" value={transportStats.studentsUsingTransport} icon={<Users className="h-5 w-5" />} trend={2.1} accent="violet" delay={0.15} />
        <KpiCard label="On Road" value={transportStats.onRoad} icon={<Navigation className="h-5 w-5" />} trendLabel="Live tracked" accent="emerald" delay={0.2} />
        <KpiCard label="In Maintenance" value={transportStats.inMaintenance} icon={<Wrench className="h-5 w-5" />} trendLabel="Back in 2 days" accent="rose" delay={0.25} />
      </div>

      {/* Routes table */}
      <RoutesTable onTrack={setTracking} />

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title="Route Distribution" subtitle="Students per route" height={300}>
          <Donut data={ROUTE_DISTRIBUTION} centerValue={formatNumber(transportStats.studentsUsingTransport)} centerLabel="Students" height={300} />
        </ChartCard>

        <ChartCard title="Capacity Utilization" subtitle="% filled per route" height={300}>
          <BarTrend data={CAPACITY_UTIL} xKey="name" yKey="value" color="oklch(0.6 0.18 300)" height={300} />
        </ChartCard>
      </div>

      {/* Vehicles table */}
      <VehiclesTable />

      {/* Tracking Sheet (showcase) */}
      <Sheet open={!!tracking} onOpenChange={(o) => !o && setTracking(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Live Bus Route Tracking</SheetTitle>
            <SheetDescription>Bus route details and live GPS tracking</SheetDescription>
          </SheetHeader>
          {tracking && <TrackingScreen route={tracking} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
