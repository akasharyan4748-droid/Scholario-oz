'use client'

/**
 * transport-shared — Shared primitives for the Transport workspace.
 *
 * Design language follows LibPanel / LibKpiCard (Library) and InvPanel /
 * InvKpiCard (Inventory) so the Transport workspace matches the rest of
 * SCHOLARIO's operational modules:
 *   - TptPanel: rounded card container with optional header + action
 *   - TptKpiCard: soft tinted background KPI card (5 accents)
 *   - TptPill: compact semantic pill
 *   - RouteStatusBadge / VehicleStatusBadge / DriverStatusBadge /
 *     MaintenanceStatusBadge
 *   - GpsBadge (Active / Off)
 *   - TptEmptyState
 *   - Reduced-motion styles
 *
 * NO indigo/blue. Emerald / amber / rose / cyan / violet only.
 */

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  RouteStatus,
  VehicleStatus,
  MaintenanceStatus,
} from '@/lib/store/transport-store'

// ─── Tab type ────────────────────────────────────────────────────────

export type TptTab = 'routes' | 'vehicles' | 'users' | 'maintenance' | 'reports'

// ─── Accent map (soft tinted backgrounds) ────────────────────────────

const ACCENT_MAP: Record<
  string,
  { bg: string; ring: string; hover: string; cardBg: string; cardBorder: string }
> = {
  emerald: {
    bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500/20',
    hover: 'hover:shadow-emerald-500/20',
    cardBg: 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]',
    cardBorder: 'border-emerald-500/20',
  },
  rose: {
    bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    ring: 'ring-rose-500/20',
    hover: 'hover:shadow-rose-500/20',
    cardBg: 'bg-rose-500/[0.04] dark:bg-rose-500/[0.06]',
    cardBorder: 'border-rose-500/20',
  },
  amber: {
    bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-500/20',
    hover: 'hover:shadow-amber-500/20',
    cardBg: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06]',
    cardBorder: 'border-amber-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    ring: 'ring-cyan-500/20',
    hover: 'hover:shadow-cyan-500/20',
    cardBg: 'bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06]',
    cardBorder: 'border-cyan-500/20',
  },
  violet: {
    bg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    ring: 'ring-violet-500/20',
    hover: 'hover:shadow-violet-500/20',
    cardBg: 'bg-violet-500/[0.04] dark:bg-violet-500/[0.06]',
    cardBorder: 'border-violet-500/20',
  },
}

export type TptAccent = keyof typeof ACCENT_MAP

// ─── TptKpiCard (soft tinted KPI) ────────────────────────────────────

interface KpiProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent: TptAccent
  onClick?: () => void
  delay?: number
}

export function TptKpiCard({
  icon,
  label,
  value,
  sub,
  accent,
  onClick,
  delay = 0,
}: KpiProps) {
  const a = ACCENT_MAP[accent]
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'group relative w-full text-left rounded-xl border p-3.5 transition-all duration-200 overflow-hidden',
        a.cardBg,
        a.cardBorder,
        onClick && `cursor-pointer hover:shadow-md ${a.hover} hover:-translate-y-0.5`,
        onClick && 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
      )}
    >
      <div
        className={cn(
          'absolute -top-6 -right-6 h-16 w-16 rounded-full blur-2xl opacity-30',
          a.bg
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">
            {label}
          </p>
          <p className="font-display text-xl sm:text-2xl font-bold tabular-nums mt-1.5 leading-none">
            {value}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{sub}</p>}
        </div>
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
            a.bg,
            a.ring
          )}
        >
          {icon}
        </span>
      </div>
      {onClick && (
        <ArrowRight className="absolute bottom-2 right-2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.button>
  )
}

// ─── TptPanel (rounded card container) ───────────────────────────────

interface PanelProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function TptPanel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/20">
          <div className="min-w-0">
            {title && <p className="text-xs font-semibold tracking-tight">{title}</p>}
            {subtitle && (
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-3', bodyClassName)}>{children}</div>
    </div>
  )
}

// ─── TptPill ─────────────────────────────────────────────────────────

export function TptPill({
  children,
  accent,
  className,
}: {
  children: React.ReactNode
  accent?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap',
        accent,
        className
      )}
    >
      {children}
    </span>
  )
}

// ─── Status badges (with dot) ────────────────────────────────────────

const ROUTE_MAP: Record<RouteStatus, string> = {
  'On Route': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'At School': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  Maintenance: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Inactive: 'bg-muted text-muted-foreground',
}

export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold',
        ROUTE_MAP[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

const VEHICLE_MAP: Record<VehicleStatus, string> = {
  Active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Maintenance: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Inactive: 'bg-muted text-muted-foreground',
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold',
        VEHICLE_MAP[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

export function GpsBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-muted text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      Off
    </span>
  )
}

const MAINT_MAP: Record<MaintenanceStatus, string> = {
  Due: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Overdue: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  Scheduled: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  Completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold',
        MAINT_MAP[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

export function DriverStatusBadge({ status }: { status: 'Active' | 'On Leave' | 'Inactive' }) {
  const map: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    'On Leave': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    Inactive: 'bg-muted text-muted-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold',
        map[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

// ─── TptEmptyState ───────────────────────────────────────────────────

export function TptEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
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
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  )
}

// ─── Reduced-motion styles ──────────────────────────────────────────

export const TPT_GLOBAL_STYLES = `
@media (prefers-reduced-motion: reduce) {
  .transport-shell * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
