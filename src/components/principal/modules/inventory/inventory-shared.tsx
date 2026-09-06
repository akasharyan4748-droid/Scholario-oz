'use client'

/**
 * inventory-shared — Shared primitives for the Inventory workspace.
 *
 * Visual language follows the Academics (Examinations + Attendance)
 * canonical pattern. The section container InvPanel is now a thin re-export
 * of the shared `Panel` (flat `rounded-xl border border-border bg-card`,
 * title rendered as `<h3 className="text-sm font-semibold">`, no separate
 * colored header strip with `border-b bg-muted/20`). Other primitives
 * remain module-specific:
 *   - InvKpiCard: neutral enterprise stat card (white surface, hairline
 *     border, muted icon chip) — colour appears only as functional warning
 *     accents, never as pastel card backgrounds.
 *   - InvPill: compact semantic pill
 *   - ItemStatusBadge: In Stock / Low Stock / Out of Stock (with dot)
 *   - MovementTypeBadge: Stock In / Stock Out / Adjustment / Damaged / Lost / Returned / Issued
 *   - InvEmptyState
 *   - INV_GLOBAL_STYLES (reduced-motion styles)
 *
 * NO indigo/blue. Emerald / amber / rose / cyan / violet only.
 */

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ItemStatus, MovementType } from '@/lib/store/inventory-store'
import { Panel } from '../shared/panel'

// ─── Tab type ────────────────────────────────────────────────────────

export type InvTab = 'items' | 'movements' | 'lowstock' | 'reports'

// ─── Accent map (icon-chip accents only — cards stay neutral) ────────
//
// Colour is functional: amber/rose mark warning states; emerald marks the
// primary value metric; everything else is neutral. Card surfaces are
// always white with a hairline border — no pastel backgrounds, no blur
// blobs, no lift-on-hover.

const ACCENT_MAP: Record<string, { icon: string; value?: string }> = {
  emerald: { icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20' },
  rose: { icon: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20', value: 'text-rose-600' },
  amber: { icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20', value: 'text-amber-600' },
  cyan: { icon: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-cyan-500/20' },
  violet: { icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20' },
  slate: { icon: 'bg-muted/60 text-muted-foreground ring-border' },
}

export type InvAccent = keyof typeof ACCENT_MAP

// ─── InvKpiCard (neutral enterprise stat card) ──────────────────────
// White surface + hairline border + muted icon chip. Colour appears only
// on the icon chip (and the value for warning states) — never as a card
// background. Deep-links keep hover affordances + a focus ring.

interface KpiProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent: InvAccent
  onClick?: () => void
  delay?: number
}

export function InvKpiCard({ icon, label, value, sub, accent, onClick, delay = 0 }: KpiProps) {
  const a = ACCENT_MAP[accent] ?? ACCENT_MAP.slate
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'group relative w-full text-left rounded-xl border border-border bg-card p-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:border-foreground/25 hover:shadow-sm',
        onClick && 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">{label}</p>
          <p className={cn('font-display text-xl sm:text-2xl font-bold tabular-nums mt-1.5 leading-none', a.value)}>{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{sub}</p>}
        </div>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1', a.icon)}>
          {icon}
        </span>
      </div>
      {onClick && (
        <ArrowRight className="absolute bottom-3 right-3 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.button>
  )
}

// ─── InvPanel (flat Academics section container) ─────────────────────
// Re-exports the shared `Panel` so all Inventory sub-pages render the
// same flat `rounded-xl border border-border bg-card` section container
// as the Examinations + Attendance modules. Existing callers using
// `<InvPanel title="..." subtitle="..." action={...} bodyClassName="p-0">`
// continue to work — the shared Panel signature is a superset of the
// original.

export const InvPanel = Panel

// ─── InvPill ─────────────────────────────────────────────────────────

export function InvPill({ children, accent, className }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap', accent, className)}>
      {children}
    </span>
  )
}

// ─── Status badges (with dot) ────────────────────────────────────────

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const map: Record<ItemStatus, string> = {
    'In Stock': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    'Low Stock': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    'Out of Stock': 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold', map[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

const MOVEMENT_MAP: Record<MovementType, string> = {
  'Stock In': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'Issued': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'Stock Out': 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'Adjustment': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  'Damaged': 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'Lost': 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'Returned': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}

export function MovementTypeBadge({ type }: { type: MovementType }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold', MOVEMENT_MAP[type])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {type}
    </span>
  )
}

// ─── InvEmptyState ───────────────────────────────────────────────────

export function InvEmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  )
}

// ─── Reduced-motion styles ──────────────────────────────────────────

export const INV_GLOBAL_STYLES = `
@media (prefers-reduced-motion: reduce) {
  .inventory-shell * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
