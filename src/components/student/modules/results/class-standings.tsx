'use client'

/**
 * results/class-standings — CLASS STANDINGS (§15, gen 2 — demoted).
 *
 * Personal progress outranks comparison: the leaderboard is now a
 * secondary, collapsed-by-default section. Collapsed it answers one
 * question ("where do I stand?") with a single derived line; expanded it
 * reveals the minimal permitted list — rank, display name, percentage —
 * never another student's subject marks or particulars (§41). Rendered
 * only when School Settings explicitly allow standings.
 */

import { useState } from 'react'
import { ChevronDown, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtPct, type ClassStanding } from '@/lib/store/student-results-store'

interface ClassStandingsProps {
  standings: ClassStanding[]
}

export function ClassStandings({ standings }: ClassStandingsProps) {
  const [open, setOpen] = useState(false)
  const top = standings.slice(0, 5)
  if (top.length === 0) return null

  const mine = standings.find((s) => s.isMe)
  const topPct = mine ? Math.max(1, Math.round((mine.rank / standings.length) * 100)) : null

  return (
    <section aria-label="Class standings" className="rounded-xl border border-border/70 bg-muted/15">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/75">Class Standings</span>
          {mine && (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              You&apos;re <span className="font-semibold text-foreground">#{mine.rank} of {standings.length}</span>
              {topPct != null && topPct <= 50 ? ` · top ${topPct}%` : ''} of the class
            </span>
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="border-t border-border/60 px-3.5 pb-3 pt-2.5">
          <div className="space-y-0.5">
            {top.map((s) => (
              <div
                key={s.studentId}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors',
                  s.isMe ? 'bg-primary/[0.07]' : 'hover:bg-muted/40',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                    s.rank === 1 && 'bg-amber-400/20 text-amber-600 dark:text-amber-400',
                    s.rank === 2 && 'bg-slate-400/20 text-slate-600 dark:text-slate-300',
                    s.rank === 3 && 'bg-orange-400/20 text-orange-600 dark:text-orange-400',
                    s.rank > 3 && 'bg-muted text-muted-foreground',
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
          <p className="mt-2.5 text-[10px] text-muted-foreground/70">
            Overall standings only — as configured by your school.
          </p>
        </div>
      )}
    </section>
  )
}
