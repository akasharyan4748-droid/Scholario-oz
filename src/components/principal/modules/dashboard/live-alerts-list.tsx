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

// The scrollable alert feed + its empty states. Each alert row carries the
// "new" pulse, snooze dropdown, and resolve button.
export function LiveAlertsList({
  alerts, filtered, severityFilter, dismissedCount, snoozeMenuFor,
  setSnoozeMenuFor, onResolve, onSnooze, onRestore, onAlertClick, onClearFilter,
}: LiveAlertsListProps) {
  return (
    <div className="relative space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
      {alerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-10 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
            <Check className="h-7 w-7" />
          </div>
          <p className="font-display text-base font-bold text-foreground">All clear!</p>
          <p className="text-xs text-muted-foreground mt-1">No active alerts. Everything is running smoothly.</p>
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
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-2">
            <Megaphone className="h-6 w-6" />
          </div>
          <p className="font-semibold text-sm text-foreground">No {severityFilter} alerts</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different filter or clear the filter.</p>
          <button onClick={onClearFilter} className="mt-2 text-xs font-semibold text-primary hover:underline">
            Show all alerts
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.map((alert, i) => (
            <motion.div
              key={alert.id}
              layout
              initial={alert.isNew ? { opacity: 0, x: -12, scale: 0.9 } : { opacity: 0, x: -12 }}
              animate={alert.isNew ? { opacity: 1, x: 0, scale: [1, 1.02, 1] } : { opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
              transition={alert.isNew ? { duration: 0.5, times: [0, 0.5, 1] } : { delay: i * 0.04 }}
              className={cn(
                'group flex items-start gap-3 rounded-xl border p-3 hover:shadow-sm transition-all cursor-pointer relative',
                alertColorMap[alert.color],
                alert.isNew && 'ring-2 ring-violet-500/40 shadow-premium'
              )}
              onClick={() => onAlertClick(alert)}
            >
              {alert.isNew && (
                <span className="absolute -top-1.5 -left-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500" />
                </span>
              )}
              {alert.isNew && (
                <span className="absolute top-1.5 right-1.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  New
                </span>
              )}
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', alertColorMap[alert.color])}>
                {alert.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-xs text-foreground truncate">{alert.title}</p>
                  <span className="text-[9px] text-muted-foreground font-mono shrink-0">{alert.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{alert.desc}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 relative">
                {/* Snooze dropdown */}
                <button
                  onClick={(e) => { e.stopPropagation(); setSnoozeMenuFor(snoozeMenuFor === alert.id ? null : alert.id) }}
                  className={cn(
                    'transition-opacity flex h-6 w-6 items-center justify-center rounded-md bg-background/80 hover:bg-amber-500/15 text-amber-600 dark:text-amber-400',
                    snoozeMenuFor === alert.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                        className="absolute right-0 top-7 z-50 w-44 rounded-xl border border-border bg-card shadow-premium-lg p-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Snooze for…</p>
                        {snoozeOptions.map((opt) => (
                          <button
                            key={opt.minutes}
                            onClick={() => onSnooze(alert.id, opt.minutes)}
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
                {/* Resolve button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onResolve(alert.id) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-md bg-background/80 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
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
