'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AlertSeverity = 'critical' | 'high' | 'info' | 'low'

export interface LiveAlert {
  id: string
  severity: AlertSeverity
  title: string
  desc: string
  time: string
  color: string
  navKey: string
  snoozed?: boolean
  snoozedUntil?: number // epoch ms
  isNew?: boolean // marks recently added alerts for pulse animation
}

export type SeverityFilter = 'all' | AlertSeverity

export interface ActivityEvent {
  hour: string // e.g. "8 AM"
  resolved: number
  snoozed: number
  new: number
}

interface LiveAlertState {
  alerts: LiveAlert[]
  dismissed: LiveAlert[]
  snoozed: LiveAlert[]
  /** QA-FIX-A: alertId → epoch ms when its snooze ends. Canonical snooze
   * clock — read by `unsnoozeExpired` so expired snoozes auto-return. */
  snoozedUntil: Record<string, number>
  severityFilter: SeverityFilter
  lastAddedId: string | null
  activityLog: ActivityEvent[]
  autoAlertsEnabled: boolean
  resolve: (id: string) => void
  resolveAll: () => void
  snooze: (id: string, minutes: number) => void
  snoozeAll: (minutes: number) => void
  /** Snooze the given alerts for a real duration in milliseconds. */
  snoozeAlerts: (ids: string[], durationMs: number) => void
  /** Return expired snoozes to the active list (compute-on-read sweeper). */
  unsnoozeExpired: (now?: number) => number
  restore: () => void
  unsnooze: (id: string) => void
  addAlert: (alert: LiveAlert) => void
  clearNewFlag: (id: string) => void
  toggleAutoAlerts: () => void
  reset: () => void
  setSeverityFilter: (filter: SeverityFilter) => void
  filteredAlerts: () => LiveAlert[]
  activeCount: () => number
}

// Initial activity log — simulated hourly alert activity for today (8 AM to now)
const initialActivityLog: ActivityEvent[] = [
  { hour: '8 AM', resolved: 2, snoozed: 1, new: 4 },
  { hour: '9 AM', resolved: 3, snoozed: 0, new: 5 },
  { hour: '10 AM', resolved: 1, snoozed: 2, new: 3 },
  { hour: '11 AM', resolved: 4, snoozed: 1, new: 6 },
  { hour: '12 PM', resolved: 2, snoozed: 0, new: 2 },
  { hour: '1 PM', resolved: 0, snoozed: 1, new: 1 },
  { hour: '2 PM', resolved: 3, snoozed: 2, new: 4 },
  { hour: 'Now', resolved: 0, snoozed: 0, new: 0 },
]

const initialAlerts: LiveAlert[] = [
  { id: 'a1', severity: 'critical', title: 'Bus TRP-201 delayed by 18 min', desc: 'Sector 14 traffic · 24 students affected', time: '2 min ago', color: 'rose', navKey: 'transport' },
  { id: 'a2', severity: 'high', title: '3 new admission applications submitted', desc: 'Grade 9 & 10 transfers · awaiting review', time: '12 min ago', color: 'amber', navKey: 'admission' },
  { id: 'a3', severity: 'high', title: 'Class 7-B teacher absent', desc: 'Mr. Suresh · substitute assigned: Ms. Kavita', time: '28 min ago', color: 'amber', navKey: 'teachers' },
  { id: 'a4', severity: 'info', title: '₹4.2L fees collected today', desc: '67 transactions · UPI 78%, Card 22%', time: '1 hr ago', color: 'emerald', navKey: 'fees' },
  { id: 'a5', severity: 'info', title: 'Library: 4 books overdue', desc: 'Class 10-A · auto-reminder sent', time: '2 hr ago', color: 'emerald', navKey: 'library' },
  { id: 'a6', severity: 'low', title: 'Inventory: Lab reagents low stock', desc: 'Chemistry lab · 3 items below threshold', time: '3 hr ago', color: 'cyan', navKey: 'inventory' },
]

// Pool of simulated real-time alerts for the "simulate new alert" feature
const simulatedAlertPool: Omit<LiveAlert, 'id' | 'time' | 'isNew'>[] = [
  { severity: 'high', title: 'Playground equipment damage reported', desc: 'Slide structure · maintenance team notified', color: 'amber', navKey: 'inventory' },
  { severity: 'info', title: 'PTM attendance confirmed: 142 parents', desc: '78% response rate · 4 slots remaining', color: 'emerald', navKey: 'communication' },
  { severity: 'critical', title: 'Water supply disruption in Block C', desc: 'Plumber dispatched · ETA 30 min', color: 'rose', navKey: 'inventory' },
  { severity: 'low', title: 'New hostel room allocation request', desc: 'Class 11 student · waiting approval', color: 'cyan', navKey: 'hostel' },
  { severity: 'info', title: 'Sports Day registrations crossed 300', desc: 'Track & field events filling fast', color: 'emerald', navKey: 'events' },
  { severity: 'high', title: '2 fee defaulters reminder bounced', desc: 'Invalid email addresses · phone fallback sent', color: 'amber', navKey: 'fees' },
]

let simIndex = 0

export function getNextSimulatedAlert(): LiveAlert {
  const base = simulatedAlertPool[simIndex % simulatedAlertPool.length]
  simIndex++
  return {
    ...base,
    id: `sim-${Date.now()}`,
    time: 'Just now',
    isNew: true,
  }
}

export const useLiveAlerts = create<LiveAlertState>()(
  persist(
    (set, get) => ({
      alerts: initialAlerts,
      dismissed: [],
      snoozed: [],
      snoozedUntil: {},
      severityFilter: 'all',
      lastAddedId: null,
      activityLog: initialActivityLog,
      autoAlertsEnabled: false,
      // Helper to bump the "Now" hour's activity count
      bumpActivity: (field: 'resolved' | 'snoozed' | 'new', count = 1) => {
        const state = get()
        const log = [...state.activityLog]
        const nowIdx = log.length - 1 // last entry is "Now"
        log[nowIdx] = { ...log[nowIdx], [field]: log[nowIdx][field] + count }
        set({ activityLog: log })
      },
      resolve: (id) => {
        const state = get()
        const alert = state.alerts.find((a) => a.id === id)
        if (!alert) return
        const log = [...state.activityLog]
        const nowIdx = log.length - 1
        log[nowIdx] = { ...log[nowIdx], resolved: log[nowIdx].resolved + 1 }
        set({
          alerts: state.alerts.filter((a) => a.id !== id),
          dismissed: [...state.dismissed, alert],
          activityLog: log,
        })
      },
      resolveAll: () => {
        const state = get()
        if (state.alerts.length === 0) return
        const count = state.alerts.length
        const log = [...state.activityLog]
        const nowIdx = log.length - 1
        log[nowIdx] = { ...log[nowIdx], resolved: log[nowIdx].resolved + count }
        set({
          alerts: [],
          dismissed: [...state.dismissed, ...state.alerts],
          activityLog: log,
        })
      },
      // QA-FIX-A: single real-duration snooze path. Minutes-based legacy
      // actions below delegate here with minutes × 60 000 ms.
      snoozeAlerts: (ids, durationMs) => {
        const state = get()
        const idSet = new Set(ids)
        const moving = state.alerts.filter((a) => idSet.has(a.id))
        if (moving.length === 0) return
        const until = Date.now() + durationMs
        const snoozedUntil = { ...state.snoozedUntil }
        for (const a of moving) snoozedUntil[a.id] = until
        const log = [...state.activityLog]
        const nowIdx = log.length - 1
        log[nowIdx] = { ...log[nowIdx], snoozed: log[nowIdx].snoozed + moving.length }
        set({
          alerts: state.alerts.filter((a) => !idSet.has(a.id)),
          snoozed: [...state.snoozed, ...moving.map((a) => ({ ...a, snoozed: true, snoozedUntil: until }))],
          snoozedUntil,
          activityLog: log,
        })
      },
      snooze: (id, minutes) => {
        get().snoozeAlerts([id], minutes * 60_000)
      },
      snoozeAll: (minutes) => {
        get().snoozeAlerts(get().alerts.map((a) => a.id), minutes * 60_000)
      },
      // Auto-unsnooze: moves snoozed alerts whose time has passed back to
      // the active list. Called on mount + a 30s interval by the panel so
      // snoozes are honoured in real time (compute-on-read semantics).
      unsnoozeExpired: (now) => {
        const t = now ?? Date.now()
        const state = get()
        if (state.snoozed.length === 0) return 0
        const expired = state.snoozed.filter((a) => !a.snoozedUntil || a.snoozedUntil <= t)
        if (expired.length === 0) return 0
        const expiredIds = new Set(expired.map((a) => a.id))
        const snoozedUntil = { ...state.snoozedUntil }
        for (const id of expiredIds) delete snoozedUntil[id]
        set({
          snoozed: state.snoozed.filter((a) => !expiredIds.has(a.id)),
          alerts: [...state.alerts, ...expired.map((a) => ({ ...a, snoozed: false, snoozedUntil: undefined }))],
          snoozedUntil,
        })
        return expired.length
      },
      unsnooze: (id) => {
        const state = get()
        const alert = state.snoozed.find((a) => a.id === id)
        if (!alert) return
        const snoozedUntil = { ...state.snoozedUntil }
        delete snoozedUntil[id]
        set({
          snoozed: state.snoozed.filter((a) => a.id !== id),
          alerts: [...state.alerts, { ...alert, snoozed: false, snoozedUntil: undefined }],
          snoozedUntil,
        })
      },
      restore: () => {
        const state = get()
        if (state.dismissed.length === 0) return
        set({
          alerts: [...state.alerts, ...state.dismissed],
          dismissed: [],
        })
      },
      addAlert: (alert) => {
        const state = get()
        const log = [...state.activityLog]
        const nowIdx = log.length - 1
        log[nowIdx] = { ...log[nowIdx], new: log[nowIdx].new + 1 }
        set({
          alerts: [alert, ...state.alerts],
          lastAddedId: alert.id,
          activityLog: log,
        })
      },
      clearNewFlag: (id) => {
        const state = get()
        set({
          alerts: state.alerts.map((a) => a.id === id ? { ...a, isNew: false } : a),
        })
      },
      toggleAutoAlerts: () => set((state) => ({ autoAlertsEnabled: !state.autoAlertsEnabled })),
      reset: () => set({ alerts: initialAlerts, dismissed: [], snoozed: [], snoozedUntil: {}, severityFilter: 'all', lastAddedId: null, activityLog: initialActivityLog, autoAlertsEnabled: false }),
      setSeverityFilter: (filter) => set({ severityFilter: filter }),
      filteredAlerts: () => {
        const state = get()
        if (state.severityFilter === 'all') return state.alerts
        return state.alerts.filter((a) => a.severity === state.severityFilter)
      },
      activeCount: () => get().alerts.length,
    }),
    {
      name: 'scholario-live-alerts',
      // Only persist the data arrays, not the filter, functions, or transient flags
      partialize: (state) => ({
        alerts: state.alerts.map((a) => ({ ...a, isNew: false })),
        dismissed: state.dismissed,
        snoozed: state.snoozed,
        snoozedUntil: state.snoozedUntil,
        activityLog: state.activityLog,
      }),
    }
  )
)
