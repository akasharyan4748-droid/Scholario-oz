'use client'

/**
 * KpiRow — 4 primary actionable KPIs for the principal.
 *
 * Reduced from 8 → 4 per the DASH-A audit. The 4 actionable KPIs a principal
 * needs at a glance:
 *   1. Attendance (emerald) — today's school-wide attendance rate
 *   2. Pending fees (rose) — outstanding dues
 *   3. New admissions (sky) — applications submitted this month
 *   4. Upcoming exams (amber) — scheduled examinations
 *
 * Each card is clickable — clicking navigates to the relevant module:
 *   Attendance → attendance, Pending fees → fees,
 *   New admissions → admission, Upcoming exams → exams
 *
 * Removed (relocated): Students total, Teachers count, Revenue, Salary due —
 * these are passive status, not actionable, and now live on the WelcomeBanner
 * meta strip (Students / Teachers) or in their dedicated modules.
 *
 * Removed: `SecondaryKpiRow` (was dead code at lines 38-47).
 */

import {
  CalendarCheck, IndianRupee, UserPlus, FileText,
} from 'lucide-react'
import { attendanceOverview } from '@/lib/mock/attendance'
import { feeAnalytics } from '@/lib/mock/finance'
import { studentStats } from '@/lib/mock/students'
import { exams } from '@/lib/mock/academics'
import { formatINR } from '@/lib/format'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { admissionsMonthly } from '../analytics/data'

export interface KpiRowProps {
  onNavigate?: (module: string) => void
}

export function KpiRow({ onNavigate }: KpiRowProps) {
  return (
    <SummaryCardGrid columns={4}>
      <SummaryCard
        label="Attendance"
        value={attendanceOverview.today.rate}
        suffix="%"
        sub={`${attendanceOverview.today.present.toLocaleString('en-IN')} present`}
        tone="emerald"
        icon={<CalendarCheck className="h-4 w-4" />}
        delay={0}
        sparkline={attendanceOverview.weekTrend.map((d) => d.rate)}
        trend="up"
        onClick={onNavigate ? () => onNavigate('attendance') : undefined}
      />
      <SummaryCard
        label="Pending Fees"
        value={formatINR(feeAnalytics.pendingDues, true)}
        sub={`${feeAnalytics.pendingCount} students`}
        tone="rose"
        icon={<IndianRupee className="h-4 w-4" />}
        delay={0.04}
        sparkline={feeAnalytics.monthly.map((d) => d.pending)}
        trend="up"
        onClick={onNavigate ? () => onNavigate('fees') : undefined}
      />
      <SummaryCard
        label="New Admissions"
        value={studentStats.newThisMonth}
        sub="+18.4% this month"
        tone="sky"
        icon={<UserPlus className="h-4 w-4" />}
        delay={0.08}
        sparkline={admissionsMonthly.map((d) => d.value)}
        trend="up"
        onClick={onNavigate ? () => onNavigate('admission') : undefined}
      />
      <SummaryCard
        label="Upcoming Exams"
        value={exams.filter((e) => e.status === 'Scheduled').length}
        sub="Pre-Board in 12 days"
        tone="amber"
        icon={<FileText className="h-4 w-4" />}
        delay={0.12}
        trend="neutral"
        onClick={onNavigate ? () => onNavigate('exams') : undefined}
      />
    </SummaryCardGrid>
  )
}
