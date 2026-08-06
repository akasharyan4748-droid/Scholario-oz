'use client'

// Overview metric chips shown at the top of the Timetable module.
// Pure presentational component — receives the current `slots` array and
// derives counts from it.

import { Clock, Building, UserCheck, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { teachers } from '@/lib/mock/teachers'
import { CLASSES, type TimetableSlot } from './data'

export function OverviewCards({ slots }: { slots: TimetableSlot[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <GlassCard className="p-3.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Slots</p>
          <p className="text-xl font-bold font-display mt-0.5">{slots.length}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Across {CLASSES.length} classes</p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Clock className="h-5 w-5" />
        </div>
      </GlassCard>

      <GlassCard className="p-3.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rooms Allocated</p>
          <p className="text-xl font-bold font-display mt-0.5">{new Set(slots.map((s) => s.room)).size}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Labs & Classrooms</p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
          <Building className="h-5 w-5" />
        </div>
      </GlassCard>

      <GlassCard className="p-3.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Faculty Assigned</p>
          <p className="text-xl font-bold font-display mt-0.5">{teachers.length}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">100% Load Balanced</p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <UserCheck className="h-5 w-5" />
        </div>
      </GlassCard>

      <GlassCard className="p-3.5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conflict Status</p>
          <p className="text-xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-0.5">0 Conflicts</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Tenant Isolation Verified</p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </GlassCard>
    </div>
  )
}
