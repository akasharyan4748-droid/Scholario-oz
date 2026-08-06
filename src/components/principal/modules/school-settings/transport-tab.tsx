'use client'

// Transport tab — read-only display of transport routes & fleet details
// (fare, vehicle no, driver contact, stops count). Backed by store.transport.routes.

import { Bus } from 'lucide-react'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { SettingsTab } from './shared'

export function TransportTab() {
  const store = useSchoolSettingsStore()

  return (
    <SettingsTab
      icon={Bus}
      title="Transport Routes & Fleet"
      description="Vehicle routes, driver contacts, and monthly transport fee structures."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {store.transport.routes.map((rt) => (
          <div key={rt.id} className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs">
            <p className="font-bold text-xs text-foreground">{rt.name}</p>
            <div className="text-[11px] space-y-1 text-muted-foreground border-t border-border/50 pt-2">
              <p>Fare: <strong className="text-emerald-700">₹{rt.fare} / month</strong></p>
              <p>Vehicle: {rt.vehicleNo}</p>
              <p>Driver: {rt.driverName} ({rt.driverPhone})</p>
              <p>Stops: {rt.stopsCount} designated stops</p>
            </div>
          </div>
        ))}
      </div>
    </SettingsTab>
  )
}
