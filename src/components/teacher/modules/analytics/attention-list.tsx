'use client'

/**
 * analytics/attention-list — Students Needing Attention, a clean LIST
 * (not a chart). The API flags a student when (documented thresholds):
 *   • the latest-assessment average is ≥ 15 percentage points below
 *     the class average, or
 *   • attendance is below 75% (with at least 5 recorded entries).
 *
 * Each row shows the student, their attendance rate, the concrete
 * reasons they were flagged and a View Student action that opens the
 * student directory (onNavigate('students')).
 */

import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  CalendarX,
  CheckCircle2,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { AttentionReason, ClassAnalytics } from './types'

const REASON_CONFIG: Record<AttentionReason['kind'], { icon: LucideIcon; tone: string }> = {
  performance: {
    icon: TrendingDown,
    tone: 'text-rose-600 dark:text-rose-400',
  },
  attendance: {
    icon: CalendarX,
    tone: 'text-amber-600 dark:text-amber-400',
  },
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
          ≥ 15 pts below the class average, or attendance below 75%
        </p>
      </div>

      {flagged.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
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
          {flagged.map((s, i) => (
            <motion.div
              key={s.studentId}
              role="listitem"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.25 }}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
            >
              {/* student identity */}
              <div className="flex min-w-0 items-center gap-3 sm:w-56 sm:shrink-0 lg:w-64">
                <GradientAvatar name={s.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Roll #{s.rollNo ?? '—'} · {a.label}
                  </p>
                </div>
              </div>

              {/* concrete reasons */}
              <div className="min-w-0 flex-1 space-y-1">
                {s.reasons.map((r, idx) => {
                  const cfg = REASON_CONFIG[r.kind]
                  const Icon = cfg.icon
                  return (
                    <p
                      key={idx}
                      className={cn('flex items-start gap-1.5 text-[11px] leading-snug', cfg.tone)}
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 break-words">{r.text}</span>
                    </p>
                  )
                })}
              </div>

              {/* attendance + action */}
              <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Attendance
                  </p>
                  <p
                    className={cn(
                      'font-display text-sm font-bold tabular-nums',
                      s.attendancePct != null && s.attendancePct < 75
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-foreground',
                    )}
                  >
                    {s.attendancePct != null ? `${s.attendancePct}%` : '—'}
                  </p>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('students')}
                    className="flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    aria-label={`View ${s.name} in the student directory`}
                  >
                    View Student
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
