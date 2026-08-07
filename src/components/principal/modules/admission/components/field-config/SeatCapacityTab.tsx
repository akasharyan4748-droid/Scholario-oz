'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { useDirtyState } from '@/components/principal/modules/shared/use-settings-dirty'

export function SeatCapacityTab() {
  const store = useSchoolSettingsStore()
  const seatCapacity = store.admissionSettings.seatCapacity

  // Draft state — full copy of seat capacity
  const initial = useMemo(
    () => seatCapacity.map((c) => ({ ...c })),
    [JSON.stringify(seatCapacity)]
  )
  const [draft, setDraft] = useState(initial)
  useEffect(() => { setDraft(initial) }, [initial])

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial]
  )

  const save = useCallback(async () => {
    // Apply each diff to the store
    draft.forEach((row) => {
      const orig = initial.find((r) => r.className === row.className)
      if (orig && (orig.capacity !== row.capacity || orig.enrolled !== row.enrolled)) {
        store.updateSeatCapacity(row.className, {
          capacity: row.capacity,
          enrolled: row.enrolled,
        })
      }
    })
  }, [draft, initial, store])

  const discard = useCallback(() => {
    setDraft(initial)
  }, [initial])

  useDirtyState('admission-seats', dirty, save, discard)

  const handleChange = (className: string, field: 'capacity' | 'enrolled', value: number) => {
    setDraft((prev) => prev.map((c) =>
      c.className === className ? { ...c, [field]: Math.max(0, value) } : c
    ))
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-muted/40 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <div className="col-span-4">Class</div>
          <div className="col-span-2 text-center">Capacity</div>
          <div className="col-span-2 text-center">Enrolled</div>
          <div className="col-span-2 text-center">Available</div>
          <div className="col-span-2 text-center">Fill</div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto divide-y divide-border/40">
          {draft.map((c) => {
            const available = Math.max(0, c.capacity - c.enrolled)
            const fillRate = c.capacity > 0 ? (c.enrolled / c.capacity) * 100 : 0
            const tight = fillRate >= 90
            const full = available === 0
            return (
              <div key={c.className} className="grid grid-cols-12 gap-2 px-5 py-3 items-center text-xs hover:bg-muted/20">
                <div className="col-span-4 font-medium text-foreground">{c.className}</div>
                <div className="col-span-2 flex justify-center">
                  <Input type="number" min={0} value={c.capacity}
                    onChange={(e) => handleChange(c.className, 'capacity', parseInt(e.target.value) || 0)}
                    className="w-16 text-center h-7 text-xs" />
                </div>
                <div className="col-span-2 flex justify-center">
                  <Input type="number" min={0} value={c.enrolled}
                    onChange={(e) => handleChange(c.className, 'enrolled', parseInt(e.target.value) || 0)}
                    className="w-16 text-center h-7 text-xs" />
                </div>
                <div className="col-span-2 text-center">
                  <span className={cn('font-semibold tabular-nums',
                    full ? 'text-rose-600' : tight ? 'text-amber-600' : 'text-emerald-600')}>
                    {available}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full transition-all',
                        full ? 'bg-rose-500' : tight ? 'bg-amber-500' : 'bg-emerald-500')}
                        style={{ width: `${Math.min(100, fillRate)}%` }} />
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

      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
        <AlertTriangle className="h-3 w-3 text-amber-500" />
        Classes at ≥90% capacity trigger waitlist during admission.
      </p>
    </div>
  )
}
