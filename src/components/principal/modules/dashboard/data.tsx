'use client'

import {
  CalendarCheck, IndianRupee, Clock, ShieldAlert, UserPlus,
  BookMarked, Package, Megaphone,
} from 'lucide-react'

// Sparkline data for the "Total Students" KpiCard (Apr → Sep enrolment trend)
export const sparkline = [
  { name: 'Apr', v: 1820 }, { name: 'May', v: 1828 }, { name: 'Jun', v: 1835 },
  { name: 'Jul', v: 1840 }, { name: 'Aug', v: 1836 }, { name: 'Sep', v: 1842 },
]

// Week-over-Week trends — 4 week snapshot for the Principal "Quick Stats" widget
export interface WeeklyTrend {
  label: string
  thisWeek: number
  lastWeek: number
  history: { w: string; v: number }[]
  color: string
  icon: React.ReactNode
  invertTrend: boolean // when true, a falling value is "good"
}

export const weeklyTrends: WeeklyTrend[] = [
  {
    label: 'Attendance Rate',
    thisWeek: 94.2,
    lastWeek: 92.8,
    history: [{ w: 'W1', v: 91 }, { w: 'W2', v: 92.8 }, { w: 'W3', v: 93.5 }, { w: 'W4', v: 94.2 }],
    color: 'oklch(0.6 0.14 162)',
    icon: <CalendarCheck className="h-3.5 w-3.5" />,
    invertTrend: false, // higher is better
  },
  {
    label: 'Fee Collected',
    thisWeek: 18.4,
    lastWeek: 16.1,
    history: [{ w: 'W1', v: 12.5 }, { w: 'W2', v: 16.1 }, { w: 'W3', v: 14.2 }, { w: 'W4', v: 18.4 }],
    color: 'oklch(0.65 0.16 75)',
    icon: <IndianRupee className="h-3.5 w-3.5" />,
    invertTrend: false,
  },
  // 'Homework Submitted' card removed — Homework module deferred from Wave 1.
  // Will be re-added when Homework is built as Teacher → Student → Parent ecosystem.
  {
    label: 'Late Arrivals',
    thisWeek: 7,
    lastWeek: 12,
    history: [{ w: 'W1', v: 14 }, { w: 'W2', v: 12 }, { w: 'W3', v: 9 }, { w: 'W4', v: 7 }],
    color: 'oklch(0.65 0.2 25)',
    icon: <Clock className="h-3.5 w-3.5" />,
    invertTrend: true, // lower is better — falling is good
  },
]

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
