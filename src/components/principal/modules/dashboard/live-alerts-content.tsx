'use client'

import { motion } from 'framer-motion'
import { BarChart3, Clock, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  severityFilterColors, severityFilters, type LiveAlertWithIcon,
  type SeverityFilterValue,
} from './data'
import { LiveAlertsList } from './live-alerts-list'

// Shared store alert shape used for snoozed items (the store keeps these
// serializable — no JSX — so we use a lightweight type here).
interface SerializableAlert {
  id: string
  title: string
  severity: 'critical' | 'high' | 'info' | 'low'
}

interface ActivityLogEntry {
  hour: string
  resolved: number
  snoozed: number
  new: number
}

export interface LiveAlertsContentProps {
  alerts: LiveAlertWithIcon[]
  dismissed: SerializableAlert[]
  snoozed: SerializableAlert[]
  severityFilter: SeverityFilterValue
  activityLog: ActivityLogEntry[]
  snoozeMenuFor: string | null
  setSnoozeMenuFor: (id: string | null) => void
  setSeverityFilter: (filter: SeverityFilterValue) => void
  onResolve: (id: string) => void
  onSnooze: (id: string, minutes: number) => void
  onUnsnooze: (id: string) => void
  onRestore: () => void
  onAlertClick: (alert: LiveAlertWithIcon) => void
}

// LiveAlertsContent — the body of the Live Operations Alerts card. Renders the
// 4-button stats strip, the Today's Alert Activity mini bar chart, severity
// filter pills, the snoozed section, and finally the alert list (delegated to
// `live-alerts-list.tsx`).
export function LiveAlertsContent({
  alerts, dismissed, snoozed, severityFilter, activityLog, snoozeMenuFor,
  setSnoozeMenuFor, setSeverityFilter, onResolve, onSnooze, onUnsnooze,
  onRestore, onAlertClick,
}: LiveAlertsContentProps) {
  const filtered = severityFilter === 'all' ? alerts : alerts.filter((a) => a.severity === severityFilter)
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length

  const stats = [
    { label: 'Active', value: alerts.length, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/5', filter: 'all' as const, title: 'Show all active alerts' },
    { label: 'Snoozed', value: snoozed.length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/5', filter: null, title: `${snoozed.length} snoozed alerts` },
    { label: 'Resolved', value: dismissed.length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', filter: null, title: `${dismissed.length} resolved alerts` },
    { label: 'Critical', value: criticalCount, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', filter: 'critical' as const, title: 'Show critical alerts only' },
  ]

  return (
    <>
      {/* Alert statistics strip */}
      <div className="relative grid grid-cols-4 gap-2 mb-3">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => stat.filter && alerts.length > 0 && setSeverityFilter(stat.filter)}
            disabled={!stat.filter || alerts.length === 0}
            className={cn(
              'rounded-lg p-2 text-center transition-all',
              stat.bg,
              stat.filter && alerts.length > 0 ? 'hover:shadow-sm hover:scale-105 cursor-pointer' : 'cursor-default'
            )}
            title={stat.title}
          >
            <p className={cn('font-display text-lg font-bold leading-none', stat.color)}>{stat.value}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Today's Alert Activity — mini bar chart */}
      {activityLog.length > 0 && (
        <div className="relative rounded-xl border border-border bg-card/30 p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-rose-500" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Today's Alert Activity</p>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" />Resolved</span>
              <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-amber-500" />Snoozed</span>
              <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-rose-500" />New</span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-16">
            {activityLog.map((ev, i) => {
              const max = Math.max(...activityLog.map((e) => e.resolved + e.snoozed + e.new), 1)
              const total = ev.resolved + ev.snoozed + ev.new
              return (
                <div key={ev.hour} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  {/* Hover tooltip */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1.5 shadow-premium-lg text-[10px]">
                    <p className="font-bold text-foreground mb-0.5">{ev.hour} · {total} total</p>
                    <div className="space-y-0.5">
                      <p className="flex items-center gap-1 text-emerald-600"><span className="w-1.5 h-1.5 rounded-sm bg-emerald-500" />Resolved: {ev.resolved}</p>
                      <p className="flex items-center gap-1 text-amber-600"><span className="w-1.5 h-1.5 rounded-sm bg-amber-500" />Snoozed: {ev.snoozed}</p>
                      <p className="flex items-center gap-1 text-rose-600"><span className="w-1.5 h-1.5 rounded-sm bg-rose-500" />New: {ev.new}</p>
                    </div>
                  </div>
                  <div className="w-full flex flex-col-reverse gap-px justify-end" style={{ height: '48px' }}>
                    {ev.resolved > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(ev.resolved / max) * 48}px` }}
                        transition={{ delay: i * 0.03 }}
                        className="w-full rounded-sm bg-emerald-500/70 group-hover:bg-emerald-500 transition-colors"
                      />
                    )}
                    {ev.snoozed > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(ev.snoozed / max) * 48}px` }}
                        transition={{ delay: i * 0.03 + 0.05 }}
                        className="w-full rounded-sm bg-amber-500/70 group-hover:bg-amber-500 transition-colors"
                      />
                    )}
                    {ev.new > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(ev.new / max) * 48}px` }}
                        transition={{ delay: i * 0.03 + 0.1 }}
                        className="w-full rounded-sm bg-rose-500/70 group-hover:bg-rose-500 transition-colors"
                      />
                    )}
                  </div>
                  <span className={cn('text-[8px] font-mono', i === activityLog.length - 1 ? 'text-rose-500 font-bold' : 'text-muted-foreground/60')}>{ev.hour}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Severity filter pills */}
      {alerts.length > 0 && (
        <div className="relative flex flex-wrap items-center gap-1.5 mb-3">
          {severityFilters.map((filter) => {
            const count = filter === 'all' ? alerts.length : alerts.filter((a) => a.severity === filter).length
            if (filter !== 'all' && count === 0) return null
            const isActive = severityFilter === filter
            return (
              <button
                key={filter}
                onClick={() => setSeverityFilter(filter)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all',
                  isActive ? cn(severityFilterColors[filter], 'ring-2 ring-offset-1 ring-offset-background ring-current') : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                )}
              >
                {filter} {count > 0 && <span className="ml-0.5 opacity-70">{count}</span>}
              </button>
            )
          })}
          {/* Critical Only quick toggle */}
          {criticalCount > 0 && (
            <button
              onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
              className={cn(
                'ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all',
                severityFilter === 'critical'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
              )}
              title="Show only critical alerts"
            >
              <ShieldAlert className="h-3 w-3" />
              Critical Only
            </button>
          )}
        </div>
      )}

      {/* Snoozed alerts section */}
      {snoozed.length > 0 && (
        <div className="relative mb-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3 w-3" />
              Snoozed ({snoozed.length})
            </div>
          </div>
          <div className="space-y-1.5">
            {snoozed.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs rounded-md px-1.5 py-1 bg-background/50">
                <span className="font-medium truncate opacity-70">{s.title}</span>
                <button
                  onClick={() => onUnsnooze(s.id)}
                  className="shrink-0 ml-2 text-[10px] font-semibold text-primary hover:underline"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <LiveAlertsList
        alerts={alerts}
        filtered={filtered}
        severityFilter={severityFilter}
        dismissedCount={dismissed.length}
        snoozeMenuFor={snoozeMenuFor}
        setSnoozeMenuFor={setSnoozeMenuFor}
        onResolve={onResolve}
        onSnooze={onSnooze}
        onRestore={onRestore}
        onAlertClick={onAlertClick}
        onClearFilter={() => setSeverityFilter('all')}
      />
    </>
  )
}
