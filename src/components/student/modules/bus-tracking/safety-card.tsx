'use client'

import { useEffect, useRef, useState } from 'react'
import { Shield, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { busStats } from '@/lib/mock/bus-tracking'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/** T4-D — armed state auto-reset and accidental double-tap guard. */
const SOS_ARM_RESET_MS = 6000
const SOS_DOUBLE_TAP_GUARD_MS = 500

export function SafetyCard() {
  const [armed, setArmed] = useState(false)
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const armedAt = useRef(0)

  const clearArmTimer = () => {
    if (armTimer.current) {
      clearTimeout(armTimer.current)
      armTimer.current = null
    }
  }

  // Cleanup on unmount so a pending auto-reset never fires on a dead card.
  useEffect(() => clearArmTimer, [])

  const resetArm = () => {
    clearArmTimer()
    setArmed(false)
  }

  const handleSos = () => {
    if (!armed) {
      // Step 1 — arm. A second, deliberate tap within the window sends.
      setArmed(true)
      armedAt.current = Date.now()
      clearArmTimer()
      armTimer.current = setTimeout(() => setArmed(false), SOS_ARM_RESET_MS)
      return
    }
    // Guard: ignore an accidental double-tap right after arming.
    if (Date.now() - armedAt.current < SOS_DOUBLE_TAP_GUARD_MS) return
    // Step 2 — send.
    resetArm()
    toast.success('SOS alert', { description: 'Emergency alert sent to school + parent' })
  }

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

        {/* T4-D — two-step SOS: first tap arms (filled rose + Confirm label
            + Cancel), a deliberate second tap sends. Auto-resets after 6s. */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSos}
            aria-label={armed ? 'Confirm SOS alert' : 'Send SOS alert'}
            className={cn(
              'flex min-h-9 flex-1 items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors',
              armed
                ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600'
                : 'border-rose-500/30 bg-rose-500/5 text-rose-600 hover:bg-rose-500/10',
            )}
          >
            <AlertCircle className="h-4 w-4" /> {armed ? 'Confirm SOS?' : 'Send SOS Alert'}
          </button>
          {armed && (
            <button
              onClick={resetArm}
              aria-label="Cancel SOS"
              className="min-h-9 shrink-0 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
