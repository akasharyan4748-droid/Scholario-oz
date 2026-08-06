'use client'

import {
  BarChart3, Scale, LineChart,
} from 'lucide-react'

// Tab id for the financial statement switcher.
export type Tab = 'pnl' | 'balance' | 'cashflow'

// Per-category oklch accent colors — emerald / amber / violet / rose / cyan.
// Single-letter names are preserved from the original monolithic module so
// downstream chart configs (sparkline colors, progress bars) match exactly.
export const E = 'oklch(0.55 0.14 162)'   // emerald
export const A = 'oklch(0.65 0.16 75)'    // amber
export const V = 'oklch(0.6 0.18 300)'    // violet
export const R = 'oklch(0.62 0.2 25)'     // rose
export const C = 'oklch(0.7 0.15 200)'    // cyan

// Shared easing curve for framer-motion transitions.
export const ease = [0.22, 1, 0.36, 1] as const

// Tab button config — used by both the tab strip renderer and the
// AnimatePresence switch statement in the main module.
export const statementTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'pnl', label: 'Profit & Loss', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'balance', label: 'Balance Sheet', icon: <Scale className="h-3.5 w-3.5" /> },
  { id: 'cashflow', label: 'Cash Flow', icon: <LineChart className="h-3.5 w-3.5" /> },
]
