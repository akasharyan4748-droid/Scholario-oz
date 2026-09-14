'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/shared/ui'
import { myBusRoute, myBusStops } from '@/lib/mock/bus-tracking'
import { KpiRow } from './kpi-row'
import { LiveMap } from './live-map'
import { BusDetails } from './bus-details'
import { StopsTimeline } from './stops-timeline'
import { TripHistory } from './trip-history'
import { SafetyCard } from './safety-card'

export function BusTrackingModule() {
  const [eta, setEta] = useState(myBusRoute.etaMinutes)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(myBusRoute.currentSpeed)

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setEta((e) => Math.max(1, e - 0.1))
      setSpeed((s) => Math.max(20, Math.min(45, s + (Math.random() - 0.5) * 4)))
      setProgress((p) => Math.min(100, p + 0.3))
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // `progress` is tracked for future UI surface (live progress bar overlay);
  // referenced here to silence the unused-var warning while preserving the
  // tick behaviour.
  void progress

  const currentStopIdx = myBusStops.findIndex((s) => s.status === 'current')
  const myStopIdx = myBusStops.findIndex((s) => s.name.includes('Your Stop'))
  const stopsToGo = myStopIdx - currentStopIdx

  return (
    <div className="space-y-5">
      {/* LR-1 — compact context line, no giant module title (Transport
          stays otherwise untouched: it is a strong module by design). */}
      <p className="truncate text-xs text-muted-foreground">
        Live tracking · Route 4 · Sohna Road & Sector 49
      </p>

      <KpiRow eta={eta} speed={speed} stopsToGo={stopsToGo} currentStopIdx={currentStopIdx} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Live map + bus info */}
        <GlassCard className="p-0 overflow-hidden lg:col-span-2">
          <LiveMap />
          <BusDetails />
        </GlassCard>

        <StopsTimeline />
      </div>

      {/* Trip history + safety */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <TripHistory />
        <SafetyCard />
      </div>
    </div>
  )
}
