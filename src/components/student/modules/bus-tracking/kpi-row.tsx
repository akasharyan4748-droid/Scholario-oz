'use client'

import { Clock, Gauge, MapPin, CheckCircle2 } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { myBusRoute, myBusStops, busStats } from '@/lib/mock/bus-tracking'

interface Props {
  eta: number
  speed: number
  stopsToGo: number
  currentStopIdx: number
}

export function KpiRow({ eta, speed, stopsToGo, currentStopIdx }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Arriving In" value={Math.ceil(eta)} suffix=" min" icon={<Clock className="h-5 w-5" />} accent="violet" trendLabel={`at ${myBusRoute.pickupTime}`} delay={0} />
      <KpiCard label="Current Speed" value={Math.round(speed)} suffix=" km/h" icon={<Gauge className="h-5 w-5" />} accent="cyan" trendLabel="within limit" delay={0.05} />
      <KpiCard label="Stops to Go" value={Math.max(0, stopsToGo)} icon={<MapPin className="h-5 w-5" />} accent="amber" trendLabel={`stop ${currentStopIdx + 2} of ${myBusStops.length}`} delay={0.1} />
      <KpiCard label="On-Time Rate" value={busStats.onTimeRate} suffix="%" icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" trendLabel="this month" delay={0.15} />
    </div>
  )
}
