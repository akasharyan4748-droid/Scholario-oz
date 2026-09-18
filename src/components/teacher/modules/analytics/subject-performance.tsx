'use client'

/**
 * analytics/subject-performance — compact subject rows with thin
 * progress indicators (NO chart library — plain rows, matching the
 * Marks Entry density). Two consumers:
 *
 *   • SubjectRow (exported)   — one subject of the latest graded
 *     assessment: name, average %, "N of M students graded" context
 *     and a thin bar. Reused inside the single-assessment
 *     PERFORMANCE SNAPSHOT card.
 *   • SubjectPerformanceCard  — the standalone section shown once ≥2
 *     assessments are graded (with a single assessment the rows live
 *     inside the snapshot card instead — never both).
 *
 * Every number comes from the API's subjectAverages (real ExamMark /
 * ExamSubjectConfig data); the bar width is the honest percentage of
 * each subject's maxMarks.
 */

import { BookOpen } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { ClassAnalytics, SubjectAverage } from './types'

export function SubjectRow({
  s,
  total,
  className,
}: {
  s: SubjectAverage
  total: number
  className?: string
}) {
  const width = Math.max(0, Math.min(100, s.pct))
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-foreground">{s.subject}</p>
        <p className="shrink-0 font-display text-sm font-bold tabular-nums text-foreground">
          {s.pct}%
        </p>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {s.graded} of {total} students graded
      </p>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${s.subject} average`}
        aria-valuenow={s.pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export function SubjectPerformanceCard({
  a,
  className,
}: {
  a: ClassAnalytics
  className?: string
}) {
  const latest = a.latestAssessment
  const subjects = a.subjectAverages

  return (
    <GlassCard hover={false} className={cn('p-4 sm:p-5', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Subject Performance
        </h3>
        {latest && (
          <p className="text-[11px] text-muted-foreground">
            Latest graded: {latest.name} · {latest.dateLabel} · % of max marks
          </p>
        )}
      </div>

      {subjects.length > 0 ? (
        <div className="mt-3.5 space-y-4">
          {subjects.map((s) => (
            <SubjectRow key={s.subject} s={s} total={a.studentCount} />
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-col items-center justify-center px-6 py-8 text-center">
          <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
            <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">No subject averages yet</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Averages appear once marks are entered for an assessment.
          </p>
        </div>
      )}
    </GlassCard>
  )
}
