'use client'

import { useState, useEffect } from 'react'
import { Bus, MessageSquare } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/shared/ui'
import { myBusRoute, myBusStops } from '@/lib/mock/bus-tracking'
import { toast } from 'sonner'
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
      <SectionHeading
        title="My School Bus"
        subtitle="Live tracking for Route 4 · Sohna Road & Sector 49"
        icon={<Bus className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Alert sent', { description: 'Parent notified of your bus status' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20"
          >
            <MessageSquare className="h-3.5 w-3.5" /> Notify Parent
          </button>
        }
      />

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
