'use client'

import { Shield, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { busStats } from '@/lib/mock/bus-tracking'
import { toast } from 'sonner'

export function SafetyCard() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-emerald-500" /> Safety & Stats
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total trips this month</span>
          <span className="font-display font-bold">{busStats.daysThisMonth}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">On-time arrival</span>
          <span className="font-display font-bold text-emerald-600">{busStats.onTimeRate}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total distance</span>
          <span className="font-display font-bold">{busStats.totalDistance} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Avg pickup</span>
          <span className="font-display font-bold tabular-nums">{busStats.avgPickupTime}</span>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3">
            <Shield className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">All safety checks passed</p>
              <p className="text-[10px] text-muted-foreground">GPS active · Speed governor OK · Fire extinguisher ✓</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => toast.success('SOS alert', { description: 'Emergency alert sent to school + parent' })}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-rose-500/30 bg-rose-500/5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors"
        >
          <AlertCircle className="h-4 w-4" /> Send SOS Alert
        </button>
      </div>
    </GlassCard>
  )
}
