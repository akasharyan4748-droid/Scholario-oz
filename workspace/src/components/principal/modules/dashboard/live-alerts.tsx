'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Megaphone } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { useLiveAlerts, getNextSimulatedAlert } from '@/lib/store/live-alerts-store'
import { toast } from 'sonner'
import {
  alertIcons, fallbackAlertIcon, type LiveAlertWithIcon,
} from './data'
import { LiveAlertsToolbar } from './live-alerts-toolbar'
import { LiveAlertsContent } from './live-alerts-content'

// Live Operations Alerts — the principal's real-time critical event feed.
// Holds the shared state (snooze menus, auto-alert countdown) + the action
// toolbar. The list itself + stats strip + filters live in
// `live-alerts-content.tsx`; the toolbar lives in `live-alerts-toolbar.tsx`
// so each file stays well under 300 lines.
export function LiveAlerts() {
  const {
    alerts: storeAlerts, dismissed, snoozed, severityFilter, activityLog,
    autoAlertsEnabled, toggleAutoAlerts, resolve, resolveAll, restore, reset,
    snooze, snoozeAll, unsnooze, addAlert, clearNewFlag, setSeverityFilter,
  } = useLiveAlerts()

  const [snoozeMenuFor, setSnoozeMenuFor] = useState<string | null>(null)
  const [snoozeAllMenuOpen, setSnoozeAllMenuOpen] = useState(false)

  // Hydrate alert objects with icon JSX (store keeps them serializable)
  const alerts: LiveAlertWithIcon[] = storeAlerts.map((a) => ({
    ...a,
    icon: alertIcons[a.id] ?? fallbackAlertIcon,
  }))

  const handleResolve = (id: string) => {
    const alert = alerts.find((a) => a.id === id)
    if (!alert) return
    resolve(id)
    toast.success('Alert resolved', { description: alert.title })
  }

  const handleResolveAll = () => {
    if (alerts.length === 0) return
    const count = alerts.length
    resolveAll()
    toast.success(`${count} alerts resolved`, { description: 'All active alerts have been dismissed' })
  }

  const handleSnooze = (id: string, minutes: number) => {
    const alert = alerts.find((a) => a.id === id)
    if (!alert) return
    snooze(id, minutes)
    setSnoozeMenuFor(null)
    const durLabel = minutes < 60 ? `${minutes} min` : minutes < 240 ? `${minutes / 60} hour` : `${minutes / 60} hours`
    toast.info(`Snoozed for ${durLabel}`, { description: alert.title })
  }

  const handleSnoozeAll = (minutes: number) => {
    if (alerts.length === 0) return
    const count = alerts.length
    snoozeAll(minutes)
    setSnoozeAllMenuOpen(false)
    const durLabel = minutes < 60 ? `${minutes} min` : minutes < 240 ? `${minutes / 60} hour` : `${minutes / 60} hours`
    toast.info(`${count} alerts snoozed for ${durLabel}`, { description: 'All active alerts have been snoozed' })
  }

  const handleSimulateNewAlert = () => {
    const newAlert = getNextSimulatedAlert()
    addAlert(newAlert)
    toast.success('New alert received!', { description: newAlert.title })
    // Clear the "isNew" flag after 5 seconds
    setTimeout(() => clearNewFlag(newAlert.id), 5000)
  }

  const handleUnsnooze = (id: string) => {
    const alert = snoozed.find((a) => a.id === id)
    if (!alert) return
    unsnooze(id)
    toast.success('Alert restored', { description: alert.title })
  }

  const handleRestore = () => {
    if (dismissed.length === 0) return
    restore()
    toast.info('All alerts restored', { description: `${dismissed.length} alert${dismissed.length > 1 ? 's' : ''} brought back` })
  }

  const handleAlertClick = (alert: LiveAlertWithIcon) => {
    toast.info('Navigating…', { description: `Opening ${alert.navKey} module for: ${alert.title}` })
  }

  const handleResetAll = () => {
    reset()
    setSeverityFilter('all')
    toast.info('Alerts reset', { description: 'All alerts restored to initial state' })
  }

  // Auto-arriving alerts with countdown
  const [countdown, setCountdown] = useState(30)
  useEffect(() => {
    if (!autoAlertsEnabled) {
      setCountdown(30)
      return
    }
    setCountdown(30)
    const tickInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const newAlert = getNextSimulatedAlert()
          addAlert(newAlert)
          toast.success('New alert received!', { description: newAlert.title })
          setTimeout(() => clearNewFlag(newAlert.id), 5000)
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(tickInterval)
  }, [autoAlertsEnabled, addAlert, clearNewFlag])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5 lg:p-6 border-l-4 border-l-rose-500">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-start gap-3.5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25"
            >
              <Megaphone className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold tracking-tight">Live Operations Alerts</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Live
                </span>
                {alerts.length > 0 && (
                  <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {alerts.length} active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time critical events requiring principal attention · click to investigate, resolve to dismiss
              </p>
            </div>
          </div>

          <LiveAlertsToolbar
            alertsLength={alerts.length}
            dismissedCount={dismissed.length}
            snoozedCount={snoozed.length}
            autoAlertsEnabled={autoAlertsEnabled}
            countdown={countdown}
            snoozeAllMenuOpen={snoozeAllMenuOpen}
            setSnoozeAllMenuOpen={setSnoozeAllMenuOpen}
            onResolveAll={handleResolveAll}
            onSnoozeAll={handleSnoozeAll}
            onSimulateNewAlert={handleSimulateNewAlert}
            onToggleAutoAlerts={toggleAutoAlerts}
            onResetAll={handleResetAll}
            onRestore={handleRestore}
          />
        </div>

        <LiveAlertsContent
          alerts={alerts}
          dismissed={dismissed}
          snoozed={snoozed}
          severityFilter={severityFilter}
          activityLog={activityLog}
          snoozeMenuFor={snoozeMenuFor}
          setSnoozeMenuFor={setSnoozeMenuFor}
          setSeverityFilter={setSeverityFilter}
          onResolve={handleResolve}
          onSnooze={handleSnooze}
          onUnsnooze={handleUnsnooze}
          onRestore={handleRestore}
          onAlertClick={handleAlertClick}
        />
      </GlassCard>
    </motion.div>
  )
}
