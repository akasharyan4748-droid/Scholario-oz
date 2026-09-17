'use client'

/**
 * analytics/top-performers — a compact, honest leaderboard built from
 * the API's real rankings: students of the latest graded assessment,
 * ranked by their percentage-normalized average. No growth badges or
 * fabricated deltas — just what the entered marks say.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { Award } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { ClassAnalytics } from './types'

const RANK_STYLES = [
  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'bg-slate-400/15 text-slate-500 dark:text-slate-400',
  'bg-orange-500/15 text-orange-600 dark:text-orange-400',
]

export function TopPerformers({ a }: { a: ClassAnalytics }) {
  const reduce = useReducedMotion()
  const performers = a.topPerformers

  return (
    <GlassCard hover={false} className="flex flex-col p-3 sm:p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Top Performers
          </h3>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {a.latestAssessment
              ? `${a.latestAssessment.name} · ${a.gradedStudents} of ${a.studentCount} graded`
              : 'Latest graded assessment'}
          </p>
        </div>
        <Award className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
      </div>

      {performers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">No rankings yet</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Performers appear once marks are entered for an assessment.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {performers.map((s, i) => (
            <motion.div
              key={s.studentId}
              initial={reduce ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="flex items-center gap-2.5"
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  RANK_STYLES[i] ?? 'bg-muted text-muted-foreground',
                )}
                aria-label={`Rank ${i + 1}`}
              >
                {i + 1}
              </span>
              <GradientAvatar name={s.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  Roll #{s.rollNo ?? '—'} · {s.subjects} {s.subjects === 1 ? 'subject' : 'subjects'}
                </p>
              </div>
              <span className="shrink-0 font-display text-sm font-bold tabular-nums">
                {s.avgPct}%
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
