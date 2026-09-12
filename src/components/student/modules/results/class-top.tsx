'use client'

/**
 * results/class-top — CLASS TOP 5 (§16, privacy-gated).
 *
 * Appears ONLY when School Settings explicitly allow exposing class
 * standings (results.showClassTop). The list is minimal by policy —
 * rank, display name, percentage — never another student's subject
 * marks, attendance or personal particulars. Derived from the SAME
 * standings set that produced the student's own rank (§35).
 */

import { Crown } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { fmtPct, type ClassStanding } from '@/lib/store/student-results-store'

export function ClassTop({ standings, assessmentName }: { standings: ClassStanding[]; assessmentName: string }) {
  const top = standings.slice(0, 5)
  if (top.length === 0) return null

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-bold tracking-tight text-foreground">Class Top 5</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{assessmentName} · as permitted by school policy</p>
      </div>

      <div className="space-y-1">
        {top.map((s) => (
          <div
            key={s.studentId}
            className={cn(
              'flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors',
              s.isMe ? 'border border-primary/35 bg-primary/[0.07]' : 'hover:bg-muted/30'
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                s.rank === 1 && 'bg-amber-400/20 text-amber-600 dark:text-amber-400',
                s.rank === 2 && 'bg-slate-400/20 text-slate-600 dark:text-slate-300',
                s.rank === 3 && 'bg-orange-400/20 text-orange-600 dark:text-orange-400',
                s.rank > 3 && 'bg-muted text-muted-foreground'
              )}
              aria-hidden
            >
              {s.rank === 1 ? <Crown className="h-3 w-3" /> : s.rank}
            </span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground" aria-hidden>
              {s.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground/90">
              {s.isMe ? `${s.name} (You)` : s.name}
            </p>
            <span className="shrink-0 text-xs font-bold tabular-nums text-foreground">{fmtPct(s.percentage)}%</span>
          </div>
        ))}
      </div>

      <p className="mt-3 border-t border-border/60 pt-2.5 text-[10px] leading-relaxed text-muted-foreground/70">
        Only overall standings are shown, as configured by your school. Detailed marks of classmates are never displayed.
      </p>
    </GlassCard>
  )
}
