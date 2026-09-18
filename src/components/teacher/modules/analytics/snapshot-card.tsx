'use client'

/**
 * analytics/snapshot-card — the PERFORMANCE SNAPSHOT, shown ONLY while
 * exactly one assessment has been graded. Instead of a fake
 * one-point "trend", it states what the single assessment actually
 * says (assessment name, real start date, class average, students
 * graded) and carries the compact subject rows for it. A subtle muted
 * line explains when a real trend will appear.
 *
 * Everything derives from the API payload; the date label comes from
 * the exam's real start date (dateLabelFull, e.g. "9 Sept 2026").
 *
 * Once a second assessment is graded, the composition swaps this card
 * for the real Performance Trend chart and the subject rows move to
 * the standalone Subject Performance section.
 */

import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { SubjectRow } from './subject-performance'
import type { ClassAnalytics } from './types'

export function PerformanceSnapshotCard({
  a,
  className,
}: {
  a: ClassAnalytics
  className?: string
}) {
  const latest = a.latestAssessment
  // Defensive only — the card is rendered solely when examTrend has
  // exactly one graded assessment, which always implies a latest.
  if (latest == null) return null

  return (
    <GlassCard hover={false} className={cn('p-4 sm:p-5', className)}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Performance Snapshot
      </h3>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
        <p className="text-sm font-semibold text-foreground">{latest.name}</p>
        <p className="text-xs text-muted-foreground">{latest.dateLabelFull}</p>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Class average
          </p>
          <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-foreground">
            {a.classAveragePct != null ? `${a.classAveragePct}%` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Students graded
          </p>
          <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-foreground">
            {a.gradedStudents} / {a.studentCount}
          </p>
        </div>
      </div>

      {a.subjectAverages.length > 0 && (
        <div className="mt-4 space-y-3.5 border-t border-border pt-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Subject performance
          </p>
          {a.subjectAverages.map((s) => (
            <SubjectRow key={s.subject} s={s} total={a.studentCount} />
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Performance trend will appear after additional assessments are graded.
      </p>
    </GlassCard>
  )
}
