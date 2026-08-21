'use client'

/**
 * Workspace-shared primitives used across multiple exam workspace sections.
 *
 * Extracted from exam-workspace.tsx — these are the small UI helpers
 * (status pills, KPI cards, stat tiles, detail fields) plus the demo
 * `teacherForSubject` mapping used by the marks/grade sections.
 */

import { cn } from '@/lib/utils'

// Tab values are shared between the workspace orchestrator and the
// section components that take an `onNavigate` callback (Overview,
// ActionItemsWidget). Defining the type here keeps the orchestrator
// and the extracted sections in sync without circular imports.
export type Tab =
  | 'overview'
  | 'schedule'
  | 'marks'
  | 'attendance'
  | 'outcomes'
  | 'seating'
  | 'admit-cards'
  | 'grace'
  | 'grade'
  | 'audit'

export function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Draft: 'bg-muted text-muted-foreground border-border',
    Scheduled: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    Ongoing: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    Completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    Cancelled: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shadow-sm', cls[status] ?? 'bg-muted text-muted-foreground border-border')}>{status}</span>
}

export function ResultStatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    'Not Started': 'bg-muted/60 text-muted-foreground border-border',
    'Marks Entry': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    'Under Verification': 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    'Result Ready': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    'Result Declared': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shadow-sm', cls[status] ?? 'bg-muted text-muted-foreground border-border')}>{status}</span>
}

/** Map a subject name to a teacher for display (demo only). */
export function teacherForSubject(subjectName: string): string {
  const s = subjectName.toLowerCase()
  if (s.includes('math')) return 'Mr. Anil Sharma'
  if (s.includes('english')) return 'Ms. Priya Nair'
  if (s.includes('physics')) return 'Dr. Lakshmi Iyer'
  if (s.includes('chemistry')) return 'Mr. Venkat Naidu'
  if (s.includes('biology')) return 'Mrs. Anjali Desai'
  if (s.includes('social')) return 'Mr. Karthik Reddy'
  if (s.includes('hindi')) return 'Mrs. Meera Joshi'
  if (s.includes('commerce') || s.includes('account')) return 'Mr. Sandeep Gupta'
  return 'Mr. Rajesh Kumar'
}

export function Kpi({ label, value, sub, progress, icon, accent = 'default' }: { label: string; value: any; sub?: string; progress?: number; icon?: React.ReactNode; accent?: 'default' | 'sky' | 'violet' | 'emerald' | 'amber' }) {
  const accentMap = {
    default: { bg: 'bg-muted/40', text: 'text-muted-foreground', bar: 'bg-primary' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  }
  const a = accentMap[accent]
  return (
    <div className="rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</p>
        {icon && (
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', a.bg, a.text)}>
            {icon}
          </span>
        )}
      </div>
      <p className="font-display text-2xl font-bold tabular-nums mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-muted/60 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', a.bar)} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}

export function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className="text-xs font-medium truncate">{value}</p>
    </div>
  )
}

export function Stat({ label, value, pct }: { label: string; value: string; pct?: number }) {
  return (
    <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
      <p className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[11px] font-semibold text-foreground truncate">{value}</p>
      {pct !== undefined && (
        <div className="h-0.5 rounded-full bg-muted mt-1 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}
