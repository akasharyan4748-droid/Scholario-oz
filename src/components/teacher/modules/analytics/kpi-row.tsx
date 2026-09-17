'use client'

/**
 * analytics/kpi-row — the four summary cards, every value derived from
 * the API payload:
 *
 *   • Class Average        — mean of the students' normalized averages
 *                            in the latest graded assessment.
 *   • Attendance Rate      — (present + late) / recorded entries.
 *   • Assessment Completion— marks entered vs expected (configured
 *                            subjects × enrolled students) for the
 *                            current grading cycle.
 *   • Needing Attention    — students flagged by the documented
 *                            thresholds (≥15 pts below the class
 *                            average, or attendance < 75%).
 *
 * No fabricated trends — the `trend` prop is never used; the context
 * line under each value states what the number derives from.
 */

import {
  AlertTriangle,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import type { ClassAnalytics } from './types'

export function KpiRow({ a }: { a: ClassAnalytics }) {
  const avgContext = a.latestAssessment
    ? `${a.latestAssessment.name} · ${a.gradedStudents} of ${a.studentCount} students graded`
    : 'No exam marks entered yet'

  const attendanceContext =
    a.attendance.total > 0
      ? `${a.attendance.present} present · ${a.attendance.late} late · ${a.attendance.absent} absent`
      : 'No attendance recorded yet'

  const completionContext = a.assessmentCompletion
    ? a.assessmentCompletion.expected > 0
      ? `${a.assessmentCompletion.entered} of ${a.assessmentCompletion.expected} marks entered · ${a.assessmentCompletion.examName}`
      : `${a.assessmentCompletion.examName} · no students enrolled`
    : 'No assessment configured for this class'

  const attentionContext = `${a.needingAttention.length} of ${a.studentCount} students · ≥15 pts below average or <75% attendance`

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <KpiCard
        label="Class Average"
        value={a.classAveragePct ?? 0}
        suffix={a.classAveragePct != null ? '%' : undefined}
        decimals={a.classAveragePct != null ? 1 : undefined}
        format={a.classAveragePct == null ? () => '—' : undefined}
        icon={<TrendingUp className="h-5 w-5" />}
        accent="emerald"
        trendLabel={avgContext}
        delay={0}
      />
      <KpiCard
        label="Attendance Rate"
        value={a.attendance.pct ?? 0}
        suffix={a.attendance.pct != null ? '%' : undefined}
        decimals={a.attendance.pct != null ? 1 : undefined}
        format={a.attendance.pct == null ? () => '—' : undefined}
        icon={<CalendarCheck className="h-5 w-5" />}
        accent="cyan"
        trendLabel={attendanceContext}
        delay={0.05}
      />
      <KpiCard
        label="Assessment Completion"
        value={a.assessmentCompletion?.pct ?? 0}
        suffix={a.assessmentCompletion?.pct != null ? '%' : undefined}
        decimals={a.assessmentCompletion?.pct != null ? 1 : undefined}
        format={a.assessmentCompletion?.pct == null ? () => '—' : undefined}
        icon={<ClipboardCheck className="h-5 w-5" />}
        accent="violet"
        trendLabel={completionContext}
        delay={0.1}
      />
      <KpiCard
        label="Needing Attention"
        value={a.needingAttention.length}
        icon={<AlertTriangle className="h-5 w-5" />}
        accent="rose"
        trendLabel={attentionContext}
        delay={0.15}
      />
    </div>
  )
}
