'use client'

/**
 * results/comparison — personal progress, not competition (§17).
 *
 * Compares the CURRENT selected assessment with the student's PREVIOUS
 * published assessment: one overall delta plus per-subject deltas. It
 * appears ONLY when the school's policy allows it (School Settings →
 * results.showComparison) and at least two published results exist.
 * Every delta is computed from the same canonical marks — no other
 * student's data is involved anywhere in this card.
 */

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { fmtPct, pctOf, type AssessmentDef, type AssessmentResult } from '@/lib/store/student-results-store'
import { subjectColor } from '../timetable/subject-colors'

interface ComparisonProps {
  current: AssessmentDef
  currentResult: AssessmentResult
  previous: AssessmentDef
  previousResult: AssessmentResult
}

function Delta({ delta }: { delta: number }) {
  const rounded = Math.round(delta * 10) / 10
  if (rounded > 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
        <ArrowUpRight className="h-3 w-3" aria-hidden />+{fmtPct(rounded)}%
      </span>
    )
  }
  if (rounded < -0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-rose-600 dark:text-rose-400">
        <ArrowDownRight className="h-3 w-3" aria-hidden />−{fmtPct(Math.abs(rounded))}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
      <Minus className="h-3 w-3" aria-hidden />{fmtPct(rounded)}%
    </span>
  )
}

export function Comparison({ current, currentResult, previous, previousResult }: ComparisonProps) {
  const prevBy = new Map(previousResult.subjects.map((s) => [s.subject, s]))

  const curObtained = currentResult.subjects.reduce((n, s) => n + s.obtained, 0)
  const curMax = currentResult.subjects.reduce((n, s) => n + s.maxMarks, 0)
  const prevObtained = previousResult.subjects.reduce((n, s) => n + s.obtained, 0)
  const prevMax = previousResult.subjects.reduce((n, s) => n + s.maxMarks, 0)
  const overallDelta = pctOf(curObtained, curMax) - pctOf(prevObtained, prevMax)

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">Personal Progress</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {current.name} compared with {previous.name}
          </p>
        </div>
      </div>

      {/* Overall */}
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground/70">Overall</p>
        <div className="flex items-center gap-2.5">
          <p className="text-sm tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{fmtPct(pctOf(prevObtained, prevMax))}%</span>
            <span className="mx-1.5 text-muted-foreground/50" aria-hidden>→</span>
            <span className="font-semibold text-foreground">{fmtPct(pctOf(curObtained, curMax))}%</span>
          </p>
          <Delta delta={overallDelta} />
        </div>
      </div>

      {/* Per-subject deltas — only subjects present in BOTH assessments */}
      <div className="space-y-0.5">
        {currentResult.subjects.map((s) => {
          const p = prevBy.get(s.subject)
          if (!p) return null
          const delta = pctOf(s.obtained, s.maxMarks) - pctOf(p.obtained, p.maxMarks)
          const color = subjectColor(s.subject)
          return (
            <div
              key={s.subject}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30"
            >
              <span className={cn('h-2 w-2 shrink-0 rounded-full', color.dot)} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground/85">{s.subject}</span>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {fmtPct(pctOf(p.obtained, p.maxMarks))}% <span className="text-muted-foreground/40" aria-hidden>→</span>{' '}
                <span className="font-semibold text-foreground/80">{fmtPct(pctOf(s.obtained, s.maxMarks))}%</span>
              </span>
              <Delta delta={delta} />
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
