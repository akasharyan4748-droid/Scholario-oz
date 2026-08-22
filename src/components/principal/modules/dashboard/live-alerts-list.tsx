'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  snoozeOptions, alertColorMap, type LiveAlertWithIcon,
} from './data'

export interface LiveAlertsListProps {
  alerts: LiveAlertWithIcon[]
  filtered: LiveAlertWithIcon[]
  severityFilter: 'all' | 'critical' | 'high' | 'info' | 'low'
  dismissedCount: number
  snoozeMenuFor: string | null
  setSnoozeMenuFor: (id: string | null) => void
  onResolve: (id: string) => void
  onSnooze: (id: string, minutes: number) => void
  onRestore: () => void
  onAlertClick: (alert: LiveAlertWithIcon) => void
  onClearFilter: () => void
}

/**
 * LiveAlertsList — the scrollable alert feed + empty states.
 *
 * Visual language aligned to Academics (DASH-1):
 *   - flat rows: `rounded-md px-2.5 py-2` (NOT the boxed `rounded-xl p-3 border` from before)
 *   - hover: `bg-muted/40` (subtle), no scale or ring animation
 *   - small `h-7 w-7` icon tile (was already canonical)
 *   - snooze/resolve buttons appear on hover (h-6 w-6 ghost buttons)
 *   - "New" indicator kept as a small violet dot — no ring-ping animation
 *   - max-h-72 with custom-scrollbar
 */
export function LiveAlertsList({
  alerts, filtered, severityFilter, dismissedCount, snoozeMenuFor,
  setSnoozeMenuFor, onResolve, onSnooze, onRestore, onAlertClick, onClearFilter,
}: LiveAlertsListProps) {
  return (
    <div className="relative space-y-1 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
      {alerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
            <Check className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">All clear</p>
          <p className="text-xs text-muted-foreground mt-1">No active alerts — everything is running smoothly.</p>
          {dismissedCount > 0 && (
            <button onClick={onRestore} className="mt-3 text-xs font-semibold text-primary hover:underline">
              Restore {dismissedCount} dismissed alert{dismissedCount > 1 ? 's' : ''}
            </button>
          )}
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-6 text-center"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
            <Megaphone className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold text-foreground">No {severityFilter} alerts</p>
          <p className="text-[11px] text-muted-foreground mt-1">Try a different filter or clear the filter.</p>
          <button onClick={onClearFilter} className="mt-2 text-xs font-semibold text-primary hover:underline">
            Show all alerts
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.map((alert) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => onAlertClick(alert)}
              className={cn(
                'group flex items-center gap-2.5 rounded-md px-2.5 py-2 cursor-pointer hover:bg-muted/40 transition-colors relative',
                alert.isNew && 'bg-violet-500/5',
              )}
            >
              {/* New indicator: small violet dot, no ping */}
              {alert.isNew && (
                <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-violet-500" />
              )}
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', alertColorMap[alert.color])}>
                {alert.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground truncate">{alert.title}</p>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">{alert.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{alert.desc}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 relative">
                {/* Snooze dropdown */}
                <button
                  onClick={(e) => { e.stopPropagation(); setSnoozeMenuFor(snoozeMenuFor === alert.id ? null : alert.id) }}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 transition-colors',
                    snoozeMenuFor === alert.id ? 'opacity-100 bg-amber-500/15' : 'opacity-0 group-hover:opacity-100'
                  )}
                  title="Snooze alert"
                >
                  <Clock className="h-3.5 w-3.5" />
                </button>
                <AnimatePresence>
                  {snoozeMenuFor === alert.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setSnoozeMenuFor(null) }} />
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-7 z-50 w-44 rounded-md border border-border bg-popover shadow-md p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Snooze for…</p>
                        {snoozeOptions.map((opt) => (
                          <button
                            key={opt.minutes}
                            onClick={() => onSnooze(alert.id, opt.minutes)}
                            className="w-full flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent transition-colors text-left"
                          >
                            <div>
                              <p className="font-medium text-foreground">{opt.label}</p>
                              <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                            </div>
                            <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
                {/* Resolve button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onResolve(alert.id) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                  title="Mark as resolved"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}
