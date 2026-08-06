'use client'

import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'

// Tab 2: Seat Capacity
export function SeatCapacityTab() {
  const store = useSchoolSettingsStore()
  const seatCapacity = store.admissionSettings.seatCapacity

  const handleSeatChange = (className: string, field: 'capacity' | 'enrolled', value: number) => {
    store.updateSeatCapacity(className, { [field]: Math.max(0, value) })
  }

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-2.5 font-bold bg-muted/50 text-muted-foreground uppercase text-[10px]">
          <div className="col-span-3">Class</div>
          <div className="col-span-3 text-center">Capacity</div>
          <div className="col-span-3 text-center">Enrolled</div>
          <div className="col-span-3 text-center">Available</div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {seatCapacity.map((c) => {
            const available = Math.max(0, c.capacity - c.enrolled)
            const fillRate = c.capacity > 0 ? (c.enrolled / c.capacity) * 100 : 0
            return (
              <div key={c.className} className="grid grid-cols-12 gap-2 p-2.5 items-center border-t border-border/50 text-xs hover:bg-muted/20">
                <div className="col-span-3 font-medium">{c.className}</div>
                <div className="col-span-3 flex justify-center">
                  <Input type="number" min={0} value={c.capacity} onChange={(e) => handleSeatChange(c.className, 'capacity', parseInt(e.target.value) || 0)} className="w-20 text-center h-7" />
                </div>
                <div className="col-span-3 flex justify-center">
                  <Input type="number" min={0} value={c.enrolled} onChange={(e) => handleSeatChange(c.className, 'enrolled', parseInt(e.target.value) || 0)} className="w-20 text-center h-7" />
                </div>
                <div className="col-span-3 flex justify-center items-center gap-2">
                  <span className={cn('font-bold tabular-nums', available === 0 ? 'text-rose-600' : fillRate >= 90 ? 'text-amber-600' : 'text-emerald-600')}>{available}</span>
                  <Badge variant="outline" className={cn('text-[9px]', fillRate >= 90 ? 'border-amber-500/30 text-amber-600' : 'border-emerald-500/30 text-emerald-600')}>
                    {Math.round(fillRate)}%
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
        <AlertTriangle className="h-3 w-3" /> Classes at ≥90% capacity trigger waitlist during admission.
      </p>
    </>
  )
}
