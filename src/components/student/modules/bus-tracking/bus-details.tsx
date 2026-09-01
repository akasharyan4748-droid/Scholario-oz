'use client'

import { Route, Navigation, MapPin, Fuel, Thermometer, PhoneCall } from 'lucide-react'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { myBusRoute } from '@/lib/mock/bus-tracking'
import { toast } from 'sonner'

export function BusDetails() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" /> {myBusRoute.routeNo} — {myBusRoute.routeName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Vehicle {myBusRoute.vehicleNo} · {myBusRoute.studentsOnboard}/{myBusRoute.capacity} onboard</p>
        </div>
        <StatusBadge status={myBusRoute.status} variant="success" dot />
      </div>

      {/* Trip metrics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
          <Navigation className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <p className="font-display text-sm font-bold">{myBusRoute.distanceCovered} km</p>
          <p className="text-[9px] text-muted-foreground">Covered</p>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
          <MapPin className="h-4 w-4 text-violet-500 mx-auto mb-1" />
          <p className="font-display text-sm font-bold">{myBusRoute.totalDistance} km</p>
          <p className="text-[9px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
          <Fuel className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="font-display text-sm font-bold">{myBusRoute.fuelLevel}%</p>
          <p className="text-[9px] text-muted-foreground">Fuel</p>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
          <Thermometer className="h-4 w-4 text-cyan-500 mx-auto mb-1" />
          <p className="font-display text-sm font-bold">{myBusRoute.temperature}°C</p>
          <p className="text-[9px] text-muted-foreground">Cabin</p>
        </div>
      </div>

      {/* Driver & attendant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
          <GradientAvatar name={myBusRoute.driverName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Driver</p>
            <p className="text-sm font-semibold truncate">{myBusRoute.driverName}</p>
            <p className="text-[11px] text-muted-foreground">{myBusRoute.driverPhone}</p>
          </div>
          <button onClick={() => toast.info('Calling driver')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
            <PhoneCall className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
          <GradientAvatar name={myBusRoute.attendant} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Attendant</p>
            <p className="text-sm font-semibold truncate">{myBusRoute.attendant}</p>
            <p className="text-[11px] text-muted-foreground">{myBusRoute.attendantPhone}</p>
          </div>
          <button onClick={() => toast.info('Calling attendant')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
            <PhoneCall className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
