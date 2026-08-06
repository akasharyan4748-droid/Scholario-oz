'use client'

import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

export function SeatCapacityTab() {
  const store = useSchoolSettingsStore()
  const seatCapacity = store.admissionSettings.seatCapacity

  const handleSeatChange = (className: string, field: 'capacity' | 'enrolled', value: number) => {
    store.updateSeatCapacity(className, { [field]: Math.max(0, value) })
  }

  return (
    <div className="space-y-2">
      {/* Compact table — single line per class, minimal borders */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        {/* header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/40 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <div className="col-span-4">Class</div>
          <div className="col-span-2 text-center">Capacity</div>
          <div className="col-span-2 text-center">Enrolled</div>
          <div className="col-span-2 text-center">Available</div>
          <div className="col-span-2 text-center">Fill</div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {seatCapacity.map((c) => {
            const available = Math.max(0, c.capacity - c.enrolled)
            const fillRate = c.capacity > 0 ? (c.enrolled / c.capacity) * 100 : 0
            const tight = fillRate >= 90
            const full = available === 0
            return (
              <div
                key={c.className}
                className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-t border-border/40 text-xs hover:bg-muted/20"
              >
                <div className="col-span-4 font-medium text-foreground">{c.className}</div>
                <div className="col-span-2 flex justify-center">
                  <Input
                    type="number"
                    min={0}
                    value={c.capacity}
                    onChange={(e) => handleSeatChange(c.className, 'capacity', parseInt(e.target.value) || 0)}
                    className="w-16 text-center h-7 text-xs"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <Input
                    type="number"
                    min={0}
                    value={c.enrolled}
                    onChange={(e) => handleSeatChange(c.className, 'enrolled', parseInt(e.target.value) || 0)}
                    className="w-16 text-center h-7 text-xs"
                  />
                </div>
                <div className="col-span-2 text-center">
                  <span
                    className={cn(
                      'font-semibold tabular-nums',
                      full ? 'text-rose-600' : tight ? 'text-amber-600' : 'text-emerald-600'
                    )}
                  >
                    {available}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          full ? 'bg-rose-500' : tight ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${Math.min(100, fillRate)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right">
                      {Math.round(fillRate)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <AlertTriangle className="h-3 w-3 text-amber-500" />
        Classes at ≥90% capacity trigger waitlist during admission.
      </p>
    </div>
  )
}
