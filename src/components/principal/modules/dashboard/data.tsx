'use client'

/**
 * Dashboard shared data + types for the Live Operations Alerts panel.
 *
 * Cleaned up (DASH-1): removed dead `sparkline` array and `weeklyTrends` /
 * `WeeklyTrend` interface — neither was consumed by anything in the dashboard
 * module. Kept the alert icon map, snooze options, severity tokens and the
 * `LiveAlertWithIcon` type — all still consumed by the alert panel.
 */

import {
  ShieldAlert, UserPlus, Clock, IndianRupee,
  BookMarked, Package, Megaphone,
} from 'lucide-react'

// Live operations alerts — type for alerts hydrated with icon JSX
export interface LiveAlertWithIcon {
  id: string
  severity: 'critical' | 'high' | 'info' | 'low'
  icon: React.ReactNode
  title: string
  desc: string
  time: string
  color: string
  navKey: string
  isNew?: boolean
}

// Hydrate store alerts (serializable) with icon JSX at render time.
// The store keeps alert metadata only (no JSX) so it stays serializable;
// we attach the icon here in the component layer.
export const alertIcons: Record<string, React.ReactNode> = {
  a1: <ShieldAlert className="h-3.5 w-3.5" />,
  a2: <UserPlus className="h-3.5 w-3.5" />,
  a3: <Clock className="h-3.5 w-3.5" />,
  a4: <IndianRupee className="h-3.5 w-3.5" />,
  a5: <BookMarked className="h-3.5 w-3.5" />,
  a6: <Package className="h-3.5 w-3.5" />,
}

export const fallbackAlertIcon = <Megaphone className="h-3.5 w-3.5" />

// Snooze durations used in both the "Snooze All" and per-alert snooze menus
export interface SnoozeOption {
  label: string
  minutes: number
  desc: string
}

export const snoozeOptions: SnoozeOption[] = [
  { label: '15 minutes', minutes: 15, desc: 'Quick reminder' },
  { label: '1 hour', minutes: 60, desc: 'After next class' },
  { label: '4 hours', minutes: 240, desc: 'End of day' },
  { label: 'Until tomorrow', minutes: 1440, desc: '24 hours' },
]

// Severity filter color tokens — shared between the filter pills + stat strip
export const severityFilterColors: Record<string, string> = {
  all: 'bg-foreground/5 text-foreground',
  critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  info: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  low: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
}

// Per-color classes used when rendering each alert row
export const alertColorMap: Record<string, string> = {
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
}

// Severity filter values — typed for safe iteration across the filter strip
export const severityFilters = ['all', 'critical', 'high', 'info', 'low'] as const
export type SeverityFilterValue = (typeof severityFilters)[number]
