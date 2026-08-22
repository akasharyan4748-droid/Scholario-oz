'use client'

/**
 * cert-shared — shared primitives for the Document Generation module.
 *
 * Visual language follows the rest of the SCHOLARIO Principal panel:
 * emerald/teal primary, rounded cards, soft tinted backgrounds, NO indigo.
 */

import { motion } from 'framer-motion'
import {
  FileText, GraduationCap, Award, CreditCard, Receipt, ScrollText,
  ClipboardList, ArrowRight, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocType, DocStatus, TemplateStyle } from '@/lib/store/certificates-store'

// ─── Doc-type metadata (icons + accents) ──────────────────────────────

export interface DocTypeMeta {
  label: DocType
  short: string
  icon: LucideIcon
  accent: 'emerald' | 'amber' | 'teal' | 'cyan' | 'rose' | 'violet' | 'slate'
  needsStudent: boolean
  needsExam?: boolean
  needsFeeTxn?: boolean
  description: string
}

export const DOC_TYPES: DocTypeMeta[] = [
  {
    label: 'Bonafide',
    short: 'Bonafide',
    icon: FileText,
    accent: 'emerald',
    needsStudent: true,
    description: 'Confirm student enrolment at the school.',
  },
  {
    label: 'Transfer',
    short: 'Transfer',
    icon: ScrollText,
    accent: 'amber',
    needsStudent: true,
    description: 'Issue transfer certificate (TC) on exit.',
  },
  {
    label: 'Character',
    short: 'Character',
    icon: Award,
    accent: 'violet',
    needsStudent: true,
    description: 'Attest good moral conduct of student.',
  },
  {
    label: 'ID Card',
    short: 'ID Card',
    icon: CreditCard,
    accent: 'cyan',
    needsStudent: true,
    description: 'Print student identity card for the year.',
  },
  {
    label: 'Fee Receipt',
    short: 'Fee Receipt',
    icon: Receipt,
    accent: 'teal',
    needsStudent: true,
    needsFeeTxn: true,
    description: 'Reprint official fee payment receipt.',
  },
  {
    label: 'Migration',
    short: 'Migration',
    icon: GraduationCap,
    accent: 'rose',
    needsStudent: true,
    description: 'Migration certificate for board/college.',
  },
  {
    label: 'Marksheet',
    short: 'Marksheet',
    icon: ClipboardList,
    accent: 'emerald',
    needsStudent: true,
    needsExam: true,
    description: 'Issue marks/report card from an examination.',
  },
]

export const DOC_TYPE_BY_LABEL: Record<DocType, DocTypeMeta> =
  DOC_TYPES.reduce((acc, d) => { acc[d.label] = d; return acc }, {} as Record<DocType, DocTypeMeta>)

// ─── Accent map (soft tinted) ─────────────────────────────────────────

const ACCENT_MAP: Record<string, { bg: string; ring: string; text: string; cardBg: string; cardBorder: string }> = {
  emerald: { bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', cardBg: 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06]', cardBorder: 'border-emerald-500/20' },
  teal: { bg: 'bg-teal-500/15 text-teal-700 dark:text-teal-300', ring: 'ring-teal-500/20', text: 'text-teal-700 dark:text-teal-300', cardBg: 'bg-teal-500/[0.04] dark:bg-teal-500/[0.06]', cardBorder: 'border-teal-500/20' },
  amber: { bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', ring: 'ring-amber-500/20', text: 'text-amber-700 dark:text-amber-300', cardBg: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06]', cardBorder: 'border-amber-500/20' },
  cyan: { bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300', ring: 'ring-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-300', cardBg: 'bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06]', cardBorder: 'border-cyan-500/20' },
  rose: { bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300', ring: 'ring-rose-500/20', text: 'text-rose-700 dark:text-rose-300', cardBg: 'bg-rose-500/[0.04] dark:bg-rose-500/[0.06]', cardBorder: 'border-rose-500/20' },
  violet: { bg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300', ring: 'ring-violet-500/20', text: 'text-violet-700 dark:text-violet-300', cardBg: 'bg-violet-500/[0.04] dark:bg-violet-500/[0.06]', cardBorder: 'border-violet-500/20' },
  slate: { bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300', ring: 'ring-slate-500/20', text: 'text-slate-700 dark:text-slate-300', cardBg: 'bg-slate-500/[0.04] dark:bg-slate-500/[0.06]', cardBorder: 'border-slate-500/20' },
}

export type CertAccent = keyof typeof ACCENT_MAP

export function accentClasses(accent: CertAccent) {
  return ACCENT_MAP[accent]
}

// ─── CertKpiCard (soft tinted KPI) ────────────────────────────────────

interface KpiProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent: CertAccent
  onClick?: () => void
  delay?: number
}

export function CertKpiCard({ icon, label, value, sub, accent, onClick, delay = 0 }: KpiProps) {
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
        onClick && `cursor-pointer hover:shadow-md hover:-translate-y-0.5`,
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

// ─── CertPanel (rounded card container) ───────────────────────────────

interface PanelProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}

export function CertPanel({ title, subtitle, action, children, className, bodyClassName }: PanelProps) {
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

// ─── Status badge ─────────────────────────────────────────────────────

export function DocStatusBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, string> = {
    'Generated': 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
    'Printed': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    'Downloaded': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    'Issued': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold', map[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  )
}

// ─── Style pill ─────────────────────────────────────────────────────────

export function StylePill({ style, accent }: { style: TemplateStyle; accent?: string }) {
  return (
    <span
      className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap')}
      style={accent ? { background: `${accent}15`, color: accent } : undefined}
    >
      {style}
    </span>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────

export function CertEmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
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

// ─── Print-only global styles (injected by the module shell) ──────────

export const CERT_PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  .print-area, .print-area * { visibility: visible !important; }
  .print-area {
    position: absolute !important;
    inset: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    box-shadow: none !important;
    border: none !important;
  }
  .no-print { display: none !important; }
  @page { margin: 12mm; }
}
@media (prefers-reduced-motion: reduce) {
  .cert-shell * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
