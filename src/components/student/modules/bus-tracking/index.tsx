'use client'

import { useState, useEffect } from 'react'
import { Bus, Sun, X, Route as RouteIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/ui'
import { myBusRoute, myBusStops } from '@/lib/mock/bus-tracking'
import { useTransportStore } from '@/lib/store/transport-store'
import { cn } from '@/lib/utils'
import { KpiRow } from './kpi-row'
import { LiveMap } from './live-map'
import { BusDetails } from './bus-details'
import { StopsTimeline } from './stops-timeline'
import { TripHistory } from './trip-history'
import { SafetyCard } from './safety-card'

/** Canonical demo student (the same id the sibling student modules key on). */
const STUDENT_ID = 'STU-58'

function formatEffectiveDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function BusTrackingModule() {
  const [trip, setTrip] = useState<'pickup' | 'drop'>('pickup')
  const [eta, setEta] = useState(myBusRoute.etaMinutes)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(myBusRoute.currentSpeed)
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0)
  const [trackingPaused, setTrackingPaused] = useState(false)

  const routeChange = useTransportStore((s) => s.routeChange)
  const dismissRouteChange = useTransportStore((s) => s.dismissRouteChange)
  // The store field is global — only the affected student sees their banner.
  const myRouteChange = routeChange?.studentId === STUDENT_ID ? routeChange : null

  // T4-C — honest live-data behaviour: while the tab is hidden BOTH clocks
  // stop (the simulation AND the freshness ticker) and the UI says
  // "Tracking paused". No fake updates behind the user's back.
  useEffect(() => {
    const sync = () => setTrackingPaused(document.visibilityState === 'hidden')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  // Simulate live updates — the freshness counter resets on every tick.
  useEffect(() => {
    if (trackingPaused) return
    const sim = setInterval(() => {
      setEta((e) => Math.max(1, e - 0.1))
      setSpeed((s) => Math.max(20, Math.min(45, s + (Math.random() - 0.5) * 4)))
      setProgress((p) => Math.min(100, p + 0.3))
      setSecondsSinceUpdate(0)
    }, 1500)
    const ticker = setInterval(() => setSecondsSinceUpdate((s) => s + 1), 1000)
    return () => {
      clearInterval(sim)
      clearInterval(ticker)
    }
  }, [trackingPaused])

  // `progress` is tracked for future UI surface (live progress bar overlay);
  // referenced here to silence the unused-var warning while preserving the
  // tick behaviour.
  void progress

  const currentStopIdx = myBusStops.findIndex((s) => s.status === 'current')
  const myStopIdx = myBusStops.findIndex((s) => s.name.includes('Your Stop'))
  const stopsToGo = myStopIdx - currentStopIdx

  return (
    <div className="space-y-5">
      {/* T4-E — real route-change notice (recorded when the office changes
          THIS student's route). Renders nothing while null: no fabricated
          changes. */}
      <AnimatePresence initial={false}>
        {myRouteChange && (
          <motion.div
            key="route-change-notice"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="status"
            className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5"
          >
            <RouteIcon className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-xs text-amber-700 dark:text-amber-400">
              Route updated · now {myRouteChange.newRouteName} · effective{' '}
              {formatEffectiveDate(myRouteChange.effectiveDate)}
              {myRouteChange.stop ? ` · New stop: ${myRouteChange.stop}` : ''}
            </p>
            <button
              onClick={dismissRouteChange}
              aria-label="Dismiss route change notice"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* T4-A — trip context selector (compact segmented control) + T4-C
          live freshness. Same vehicle either way; the KPI row keeps working. */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div
          className="inline-flex overflow-hidden rounded-lg border border-border bg-card p-0.5 shadow-2xs"
          role="tablist"
          aria-label="Trip"
        >
          <button
            role="tab"
            aria-selected={trip === 'pickup'}
            onClick={() => setTrip('pickup')}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-all',
              trip === 'pickup'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Bus className="h-3.5 w-3.5" aria-hidden /> Morning Pickup
          </button>
          <button
            role="tab"
            aria-selected={trip === 'drop'}
            onClick={() => setTrip('drop')}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-all',
              trip === 'drop'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Sun className="h-3.5 w-3.5" aria-hidden /> Afternoon Drop-off
          </button>
        </div>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {trackingPaused ? 'Tracking paused' : `Last updated ${secondsSinceUpdate}s ago`}
        </p>
      </div>

      {/* LR-1 — compact context line, no giant module title (Transport
          stays otherwise untouched: it is a strong module by design). */}
      <p className="truncate text-xs text-muted-foreground">
        {trip === 'pickup'
          ? `Live tracking · ${myBusRoute.routeNo} · ${myBusRoute.routeName} · Pickup ${myBusRoute.pickupTime}`
          : `Drop-off trip · ${myBusRoute.routeNo} · ${myBusRoute.routeName} · starts after school · Drop-off ${myBusRoute.dropTime}`}
      </p>

      <KpiRow eta={eta} speed={speed} stopsToGo={stopsToGo} currentStopIdx={currentStopIdx} trip={trip} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Live map + bus info */}
        <GlassCard className="p-0 overflow-hidden lg:col-span-2">
          <LiveMap lastUpdatedSeconds={secondsSinceUpdate} paused={trackingPaused} />
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
