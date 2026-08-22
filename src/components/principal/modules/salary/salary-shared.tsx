'use client'

/**
 * salary-shared — Shared primitives for the Salary & Payroll workspace.
 *
 * - SalaryTab type
 * - SalaryKpiCard (soft tinted backgrounds, Students & Classes style)
 * - SalaryPanel (rounded card container)
 * - SalaryStat (compact stat block)
 * - SalaryStatusBadge (with dot indicator)
 * - SalaryEmptyState
 * - Helpers for department/type accents
 */

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PayrollStatus, EmployeeStatus, AdjustmentStatus } from '@/lib/store/salary-store'

// ─── Tab type ────────────────────────────────────────────────────────

export type SalaryTab =
  | 'overview'
  | 'payroll'
  | 'employees'
  | 'structures'
  | 'adjustments'
  | 'payslips'
  | 'history'
  | 'reports'

// ─── Status accents ──────────────────────────────────────────────────

export function payrollStatusAccent(status: PayrollStatus): string {
  switch (status) {
    case 'Paid': case 'Locked': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'Approved': return 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
    case 'Calculated': return 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
    case 'Needs Review': case 'On Hold': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    case 'Processing': return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
    case 'Failed': case 'Cancelled': return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
    case 'Draft': default: return 'bg-muted text-muted-foreground'
  }
}

export function employeeStatusAccent(status: EmployeeStatus): string {
  switch (status) {
    case 'Active': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'On Leave': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    case 'Suspended': case 'Resigned': return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
    case 'Retired': case 'Inactive': return 'bg-muted text-muted-foreground'
  }
}

export function adjustmentStatusAccent(status: AdjustmentStatus): string {
  switch (status) {
    case 'Approved': case 'Paid': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'Pending': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    case 'Rejected': return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
  }
}

// ─── Department colors ───────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  'Administration': 'oklch(0.55 0.14 162)',
  'Science': 'oklch(0.55 0.14 162)',
  'Mathematics': 'oklch(0.65 0.16 75)',
  'Languages': 'oklch(0.6 0.18 300)',
  'Social Sciences': 'oklch(0.7 0.15 200)',
  'Computer Science': 'oklch(0.55 0.16 250)',
  'Commerce': 'oklch(0.6 0.15 60)',
  'Arts & Sports': 'oklch(0.62 0.2 25)',
  'Finance': 'oklch(0.7 0.15 200)',
  'Transport': 'oklch(0.6 0.18 140)',
  'Support': 'oklch(0.65 0.14 250)',
}

export function deptColor(dept: string): string {
  return DEPT_COLORS[dept] ?? 'oklch(0.6 0.01 250)'
}

// ─── SalaryKpiCard ───────────────────────────────────────────────────

interface KpiProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent: 'emerald' | 'rose' | 'amber' | 'sky' | 'violet' | 'cyan'
  onClick?: () => void
  delay?: number
}

const ACCENT_MAP: Record<KpiProps['accent'], { bg: string; ring: string; hover: string; cardBg: string; cardBorder: string }> = {
  emerald: { bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500/20', hover: 'hover:shadow-emerald-500/20', cardBg: 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]', cardBorder: 'border-emerald-500/20' },
  rose: { bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300', ring: 'ring-rose-500/20', hover: 'hover:shadow-rose-500/20', cardBg: 'bg-rose-500/[0.04] dark:bg-rose-500/[0.06]', cardBorder: 'border-rose-500/20' },
  amber: { bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', ring: 'ring-amber-500/20', hover: 'hover:shadow-amber-500/20', cardBg: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06]', cardBorder: 'border-amber-500/20' },
  sky: { bg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300', ring: 'ring-sky-500/20', hover: 'hover:shadow-sky-500/20', cardBg: 'bg-sky-500/[0.04] dark:bg-sky-500/[0.06]', cardBorder: 'border-sky-500/20' },
  violet: { bg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300', ring: 'ring-violet-500/20', hover: 'hover:shadow-violet-500/20', cardBg: 'bg-violet-500/[0.04] dark:bg-violet-500/[0.06]', cardBorder: 'border-violet-500/20' },
  cyan: { bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300', ring: 'ring-cyan-500/20', hover: 'hover:shadow-cyan-500/20', cardBg: 'bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06]', cardBorder: 'border-cyan-500/20' },
}

export function SalaryKpiCard({ icon, label, value, sub, accent, onClick, delay = 0 }: KpiProps) {
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
        a.cardBg, a.cardBorder,
        onClick && `cursor-pointer hover:shadow-md ${a.hover} hover:-translate-y-0.5`,
        onClick && 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      )}
    >
      <div className={cn('absolute -top-6 -right-6 h-16 w-16 rounded-full blur-2xl opacity-30', a.bg)} aria-hidden />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">{label}</p>
          <p className="font-display text-xl sm:text-2xl font-bold tabular-nums mt-1.5 leading-none">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{sub}</p>}
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1', a.bg, a.ring)}>
          {icon}
        </span>
      </div>
      {onClick && (
        <ArrowRight className="absolute bottom-2 right-2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.button>
  )
}

// ─── SalaryPanel ─────────────────────────────────────────────────────

interface PanelProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function SalaryPanel({ title, subtitle, action, children, className, bodyClassName }: PanelProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/20">
          <div className="min-w-0">
            {title && <p className="text-xs font-semibold tracking-tight">{title}</p>}
            {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-3', bodyClassName)}>{children}</div>
    </div>
  )
}

// ─── SalaryStat ──────────────────────────────────────────────────────

interface StatProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'default' | 'emerald' | 'rose' | 'amber'
  className?: string
}

export function SalaryStat({ label, value, sub, accent = 'default', className }: StatProps) {
  const accentMap = {
    default: '',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
  }
  return (
    <div className={cn('rounded-lg bg-muted/30 px-2.5 py-1.5', className)}>
      <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">{label}</p>
      <p className={cn('text-sm font-bold tabular-nums mt-0.5', accentMap[accent])}>{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

// ─── Status badges ───────────────────────────────────────────────────

export function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap', payrollStatusAccent(status))}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap', employeeStatusAccent(status))}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

export function AdjustmentStatusBadge({ status }: { status: AdjustmentStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap', adjustmentStatusAccent(status))}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

// ─── SalaryEmptyState ────────────────────────────────────────────────

export function SalaryEmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
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

// ─── Reduced motion styles ────────────────────────────────────────────

export const SALARY_GLOBAL_STYLES = `
@media (prefers-reduced-motion: reduce) {
  .salary-shell * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
