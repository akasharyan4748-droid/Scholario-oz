'use client'

import type { Dispatch, SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Clock, Zap, Radio, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { snoozeOptions } from './data'

// Props for the Live Alerts action toolbar. The toolbar is split out of
// `live-alerts.tsx` so the main component stays under 300 lines.
export interface LiveAlertsToolbarProps {
  alertsLength: number
  dismissedCount: number
  snoozedCount: number
  autoAlertsEnabled: boolean
  countdown: number
  snoozeAllMenuOpen: boolean
  setSnoozeAllMenuOpen: Dispatch<SetStateAction<boolean>>
  onResolveAll: () => void
  onSnoozeAll: (minutes: number) => void
  onSimulateNewAlert: () => void
  onToggleAutoAlerts: () => void
  onResetAll: () => void
  onRestore: () => void
}

export function LiveAlertsToolbar({
  alertsLength, dismissedCount, snoozedCount, autoAlertsEnabled, countdown,
  snoozeAllMenuOpen, setSnoozeAllMenuOpen, onResolveAll, onSnoozeAll,
  onSimulateNewAlert, onToggleAutoAlerts, onResetAll, onRestore,
}: LiveAlertsToolbarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {alertsLength > 0 && (
        <>
          <button
            onClick={onResolveAll}
            className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            title="Resolve all active alerts"
          >
            <span className="flex items-center gap-1">
              <CheckCheck className="h-3.5 w-3.5" />
              Resolve All
            </span>
          </button>
          {/* Snooze All dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSnoozeAllMenuOpen((o) => !o)}
              className={cn(
                'rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors',
                snoozeAllMenuOpen && 'ring-2 ring-amber-500/30'
              )}
              title="Snooze all alerts"
            >
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Snooze All
              </span>
            </button>
            <AnimatePresence>
              {snoozeAllMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSnoozeAllMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-border bg-card shadow-premium-lg p-1.5"
                  >
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Snooze all for…</p>
                    {snoozeOptions.map((opt) => (
                      <button
                        key={opt.minutes}
                        onClick={() => onSnoozeAll(opt.minutes)}
                        className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-accent transition-colors text-left"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                        </div>
                        <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
      {/* Simulate New Alert — demo feature */}
      <button
        onClick={onSimulateNewAlert}
        className="shrink-0 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors"
        title="Simulate a new real-time alert"
      >
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5" />
          Simulate Alert
        </span>
      </button>
      {/* Auto-arriving alerts toggle with countdown */}
      <button
        onClick={onToggleAutoAlerts}
        className={cn(
          'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
          autoAlertsEnabled
            ? 'border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400'
            : 'border-border bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        title={autoAlertsEnabled ? `Auto-alerts ON — next in ${countdown}s. Click to stop.` : 'Enable auto-arriving alerts (every 30s)'}
      >
        <span className="flex items-center gap-1.5">
          <Radio className={cn('h-3.5 w-3.5', autoAlertsEnabled && 'animate-pulse')} />
          {autoAlertsEnabled ? (
            <span className="flex items-center gap-1">
              <span>Next in</span>
              <span className="font-mono font-bold tabular-nums">{countdown}s</span>
            </span>
          ) : (
            <span>Auto</span>
          )}
          {autoAlertsEnabled && (
            <span className="flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
            </span>
          )}
        </span>
      </button>
      {/* Reset All — restore alerts to initial state */}
      {(dismissedCount > 0 || snoozedCount > 0) && (
        <button
          onClick={onResetAll}
          className="shrink-0 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Reset all alerts to initial state"
        >
          <span className="flex items-center gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All
          </span>
        </button>
      )}
      {dismissedCount > 0 && (
        <button
          onClick={onRestore}
          className="shrink-0 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Restore dismissed alerts"
        >
          Restore ({dismissedCount})
        </button>
      )}
      <button
        onClick={() => alertsLength > 0 && toast.info('Opening alerts center', { description: 'Full alert history & filters' })}
        className="shrink-0 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
      >
        View All
      </button>
    </div>
  )
}
