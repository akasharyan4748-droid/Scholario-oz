'use client'

/**
 * analytics/attention-list — Students Needing Attention, a clean LIST
 * (not a chart). The API flags a student when (documented thresholds):
 *   • the latest-assessment average is ≥ 15 percentage points below
 *     the class average, or
 *   • attendance is below 75% (with at least 5 recorded entries).
 *
 * Each row shows the student, their roll number, their latest
 * performance %, their attendance %, the real threshold-based reason
 * (label chip + the numbers behind the flag) and a View Profile
 * action that opens the student directory (onNavigate('students')).
 */

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { ClassAnalytics } from './types'

const REASON_CHIP: Record<'performance' | 'attendance', string> = {
  performance: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  attendance: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export function AttentionList({
  a,
  onNavigate,
}: {
  a: ClassAnalytics
  onNavigate?: (key: string) => void
}) {
  const reduce = useReducedMotion()
  const flagged = a.needingAttention

  return (
    <GlassCard hover={false} className="overflow-hidden p-0">
      {/* header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Students Needing Attention
          </h3>
          <Badge variant="secondary" className="rounded-full px-2 text-[10px] font-semibold">
            {flagged.length}
          </Badge>
        </div>
        <p className="truncate text-[10px] text-muted-foreground">
          ≥ 15 pts below the class average, or attendance below 75% (min 5 records)
        </p>
      </div>

      {flagged.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
            <CheckCircle2
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          </div>
          <p className="text-sm font-medium text-foreground">
            No students currently need attention
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {a.studentCount} students reviewed against the latest assessment and attendance
            records. Students reappear here the moment they cross a threshold.
          </p>
        </div>
      ) : (
        <div
          className="max-h-[440px] divide-y divide-border/50 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          role="list"
          aria-label="Students needing attention"
        >
          {flagged.map((s, i) => {
            const perfFlagged = s.reasons.some((r) => r.kind === 'performance')
            const attFlagged = s.reasons.some((r) => r.kind === 'attendance')
            return (
              <motion.div
                key={s.studentId}
                role="listitem"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.25 }}
                className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center"
              >
                {/* student identity + roll */}
                <div className="flex min-w-0 items-center gap-3 lg:w-60 lg:shrink-0">
                  <GradientAvatar name={s.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">Roll #{s.rollNo ?? '—'}</p>
                  </div>
                </div>

                {/* performance + attendance */}
                <div className="flex shrink-0 gap-7">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Performance
                    </p>
                    <p
                      className={cn(
                        'font-display text-sm font-bold tabular-nums',
                        perfFlagged ? 'text-rose-600 dark:text-rose-400' : 'text-foreground',
                      )}
                    >
                      {s.avgPct != null ? `${s.avgPct}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Attendance
                    </p>
                    <p
                      className={cn(
                        'font-display text-sm font-bold tabular-nums',
                        attFlagged ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
                      )}
                    >
                      {s.attendancePct != null ? `${s.attendancePct}%` : '—'}
                    </p>
                  </div>
                </div>

                {/* real threshold-based reasons */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  {s.reasons.map((r, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          REASON_CHIP[r.kind],
                        )}
                      >
                        {r.label}
                      </span>
                      <span className="min-w-0 text-[11px] leading-snug text-muted-foreground">
                        {r.detail}
                      </span>
                    </div>
                  ))}
                </div>

                {/* action */}
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('students')}
                    className="flex h-8 shrink-0 items-center gap-1 self-start rounded-lg border border-border bg-card px-2.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:self-center"
                    aria-label={`View ${s.name}'s profile in the student directory`}
                  >
                    View Profile
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
