'use client'

/**
 * analytics/kpi-row — the four summary cards, every value derived from
 * the API payload and rendered with the shared HubStatCards recipe
 * (the Marks Entry / "My Attendance" visual language: rounded-xl
 * border, tinted 500/5 background, bare icon top-right, tiny uppercase
 * label, font-display tabular-nums value, one context line):
 *
 *   • Class Average         — mean of the students' normalized
 *                             averages in the latest graded assessment.
 *   • Attendance            — (present + late) / recorded entries.
 *   • Assessment Completion — students graded / enrolled students on
 *                             the latest graded assessment (e.g. 4/11).
 *   • Needing Attention     — students flagged by the documented
 *                             thresholds (≥15 pts below the class
 *                             average, or attendance < 75% with at
 *                             least 5 records).
 *
 * No fabricated trends — the context line under each value states what
 * the number derives from.
 */

import {
  AlertTriangle,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
} from 'lucide-react'
import { HubStatCards, type HubStat } from '../shared/hub-stat-cards'
import type { ClassAnalytics } from './types'

export function KpiRow({ a }: { a: ClassAnalytics }) {
  const latest = a.latestAssessment

  const stats: HubStat[] = [
    {
      key: 'class-average',
      label: 'Class Average',
      value: a.classAveragePct != null ? `${a.classAveragePct.toFixed(1)}%` : null,
      context: latest
        ? `${latest.name} · ${a.gradedStudents} of ${a.studentCount} graded`
        : 'No exam marks entered yet',
      icon: TrendingUp,
      tone: 'emerald',
    },
    {
      key: 'attendance',
      label: 'Attendance',
      value: a.attendance.pct != null ? `${a.attendance.pct.toFixed(1)}%` : null,
      context:
        a.attendance.total > 0
          ? `${a.attendance.present} present · ${a.attendance.late} late · ${a.attendance.absent} absent`
          : 'No attendance recorded yet',
      icon: CalendarCheck,
      tone: 'sky',
    },
    {
      key: 'assessment-completion',
      label: 'Assessment Completion',
      value: `${a.gradedStudents}/${a.studentCount}`,
      context: latest
        ? `students graded · ${latest.name}`
        : a.assessmentCompletion
          ? `${a.assessmentCompletion.examName} · no marks entered yet`
          : 'No assessment configured for this class',
      icon: ClipboardCheck,
      tone: 'amber',
    },
    {
      key: 'needing-attention',
      label: 'Needing Attention',
      value: a.needingAttention.length,
      context: `${a.needingAttention.length} of ${a.studentCount} students · ≥15 pts below avg or <75% attendance`,
      icon: AlertTriangle,
      tone: 'rose',
    },
  ]

  return <HubStatCards stats={stats} />
}
