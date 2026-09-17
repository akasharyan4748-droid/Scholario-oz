'use client'

/**
 * analytics/trend-charts — the three analytical charts. Each card answers
 * one question and shows an honest empty state (never a zero-filled
 * chart) when the class has no data for it yet:
 *
 *   • PerformanceTrendCard  — "How is this class performing over time?"
 *     One point per graded assessment (chronological, real exam start
 *     dates as labels). Needs ≥ 2 graded assessments to draw a line.
 *   • SubjectAveragesCard   — "Which subjects are strongest this
 *     assessment?" Horizontal bars, percentage of each subject's real
 *     maxMarks, from the latest graded assessment.
 *   • AttendanceTrendCard   — "How has attendance moved?" Weekly rate,
 *     each label is the real Monday of that week.
 */

import type { LucideIcon } from 'lucide-react'
import { CalendarCheck, LineChart as LineChartIcon, BookOpen } from 'lucide-react'
import { ChartCard, AreaTrend, BarTrend } from '@/components/shared/charts'
import { cn } from '@/lib/utils'
import type { ClassAnalytics } from './types'

const GREEN = 'oklch(0.55 0.14 162)'
const CYAN = 'oklch(0.7 0.15 200)'
const AMBER = 'oklch(0.65 0.16 75)'

/** Honest in-card empty state — icon, one line, one hint. */
function ChartEmpty({
  icon: Icon,
  title,
  hint,
  className,
}: {
  icon: LucideIcon
  title: string
  hint?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center',
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ─── 1. Performance over time ─────────────────────────────────────────

export function PerformanceTrendCard({ a, className }: { a: ClassAnalytics; className?: string }) {
  const trend = a.examTrend
  const hasLine = trend.length >= 2
  const single = trend.length === 1 ? trend[0] : null

  return (
    <ChartCard
      title="Performance Trend"
      subtitle={`Class average per graded assessment · ${a.label}`}
      className={className}
      height={216}
    >
      {hasLine ? (
        <AreaTrend
          data={trend.map((p) => ({ name: p.dateLabel, value: p.avgPct }))}
          xKey="name"
          yKey="value"
          color={GREEN}
          height={216}
        />
      ) : single ? (
        <ChartEmpty
          icon={LineChartIcon}
          title={`${single.name} (${single.dateLabel}) — class averaged ${single.avgPct}%`}
          hint="One assessment graded so far. The trend line appears once a second assessment has marks."
        />
      ) : (
        <ChartEmpty
          icon={LineChartIcon}
          title="No exam marks entered yet"
          hint="Each graded assessment adds a point to this trend."
        />
      )}
    </ChartCard>
  )
}

// ─── 2. Subject averages (latest graded assessment) ───────────────────

export function SubjectAveragesCard({ a, className }: { a: ClassAnalytics; className?: string }) {
  const subjects = a.subjectAverages
  // HorizontalBarChart rows are 36px + 8px padding — size the card to
  // the real list so a single subject never floats in a giant box.
  const height = subjects.length > 0 ? Math.max(120, subjects.length * 36 + 8) : 180

  return (
    <ChartCard
      title="Subject Averages"
      subtitle={
        a.latestAssessment
          ? `${a.latestAssessment.name} (${a.latestAssessment.dateLabel}) · % of max marks`
          : 'Percentage of each subject’s max marks'
      }
      className={className}
      height={height}
    >
      {subjects.length > 0 ? (
        <BarTrend
          data={subjects.map((s) => ({ subject: s.subject, pct: s.pct }))}
          xKey="subject"
          yKey="pct"
          color={AMBER}
          horizontal
          height={height}
          labelFormat={(v) => `${v}%`}
        />
      ) : (
        <ChartEmpty
          icon={BookOpen}
          title="No subject averages yet"
          hint={
            a.latestAssessment
              ? 'No configurable marks were entered for this assessment.'
              : 'Averages appear once marks are entered for an assessment.'
          }
        />
      )}
    </ChartCard>
  )
}

// ─── 3. Attendance over time (weekly) ─────────────────────────────────

export function AttendanceTrendCard({ a, className }: { a: ClassAnalytics; className?: string }) {
  const weeks = a.attendance.weeklyTrend
  const hasLine = weeks.length >= 2

  return (
    <ChartCard
      title="Attendance Trend"
      subtitle={`Weekly rate · week beginning Monday · ${a.label}`}
      className={className}
      height={216}
    >
      {hasLine ? (
        <AreaTrend
          data={weeks.map((w) => ({ name: w.label, value: w.value }))}
          xKey="name"
          yKey="value"
          color={CYAN}
          height={216}
        />
      ) : a.attendance.total > 0 ? (
        <ChartEmpty
          icon={CalendarCheck}
          title={`${a.attendance.pct ?? 0}% overall attendance`}
          hint={`Only ${a.attendance.total} recorded ${a.attendance.total === 1 ? 'entry' : 'entries'} so far — the weekly trend builds as more days are marked.`}
        />
      ) : (
        <ChartEmpty
          icon={CalendarCheck}
          title="No attendance recorded yet"
          hint="Weekly attendance appears once days are marked for this class."
        />
      )}
    </ChartCard>
  )
}
