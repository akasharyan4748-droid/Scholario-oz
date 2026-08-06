'use client'

import { IndianRupee, Clock } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { libraryStats } from '@/lib/mock/operations'
import { formatINR } from '@/lib/format'

export function FinesSummary() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600"><IndianRupee className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Total Pending Fines</p>
            <p className="font-display text-2xl font-bold">{formatINR(libraryStats.totalFines)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{libraryStats.overdue} books overdue across 4 students</p>
      </GlassCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><IndianRupee className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Collected This Month</p>
            <p className="font-display text-2xl font-bold">{formatINR(8400)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">From 12 students · Avg ₹700/student</p>
      </GlassCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Clock className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Days Overdue</p>
            <p className="font-display text-2xl font-bold">4.2 days</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Longest: 9 days · 1 book</p>
      </GlassCard>
    </div>
  )
}
