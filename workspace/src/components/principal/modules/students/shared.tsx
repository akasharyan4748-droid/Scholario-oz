'use client'

import { cn } from '@/lib/utils'

// Shared presentational components used across Students module tabs

export function StatTile({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
  const a: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
  }
  return (
    <div className="rounded-lg border border-border bg-card/40 p-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn('font-display text-lg font-bold mt-0.5', a[accent])}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 text-[11px] font-medium hover:bg-accent/40 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}

export function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 p-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
        <p className="text-xs font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

export function Metric({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-2.5 text-center">
      <div className={cn('inline-flex h-6 w-6 items-center justify-center rounded-lg mb-1', color)}>{icon}</div>
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className={cn('text-sm font-bold', color)}>{value}</p>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  )
}
