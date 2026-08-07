'use client'

import {
  Users, GraduationCap, CalendarCheck, Wallet, IndianRupee, Clock,
  UserPlus, FileText,
} from 'lucide-react'
import { studentStats } from '@/lib/mock/students'
import { attendanceOverview } from '@/lib/mock/attendance'
import { feeAnalytics, salaryAnalytics } from '@/lib/mock/finance'
import { exams } from '@/lib/mock/academics'
import { school } from '@/lib/mock/school'
import { formatINR } from '@/lib/format'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'

// Primary KPI strip — 8 cross-module stats as premium summary cards.
// Replaces the flat MetaStrip with cards matching the Admission module's
// design language (soft tinted bg, large value, small subtitle, hover lift).
export function KpiRow() {
  return (
    <SummaryCardGrid columns={4}>
      <SummaryCard label="Students" value={studentStats.total} sub="+2.4% vs last term" tone="emerald" icon={<Users className="h-4 w-4" />} delay={0} />
      <SummaryCard label="Teachers" value={school.totalTeachers} sub="+3 this month" tone="amber" icon={<GraduationCap className="h-4 w-4" />} delay={0.04} />
      <SummaryCard label="Attendance" value={attendanceOverview.today.rate} suffix="%" sub={`${attendanceOverview.today.present} present`} tone="cyan" icon={<CalendarCheck className="h-4 w-4" />} delay={0.08} />
      <SummaryCard label="Revenue (mo.)" value={formatINR(feeAnalytics.collectedThisMonth, true)} sub="+12.5% this month" tone="emerald" icon={<Wallet className="h-4 w-4" />} delay={0.12} />
      <SummaryCard label="Pending fees" value={formatINR(feeAnalytics.pendingDues, true)} sub={`${feeAnalytics.pendingCount} students`} tone="rose" icon={<IndianRupee className="h-4 w-4" />} delay={0.16} />
      <SummaryCard label="Salary due" value={formatINR(salaryAnalytics.totalMonthly, true)} sub={`${school.totalStaff} staff`} tone="violet" icon={<Clock className="h-4 w-4" />} delay={0.2} />
      <SummaryCard label="New admissions" value={studentStats.newThisMonth} sub="+18.4% this month" tone="amber" icon={<UserPlus className="h-4 w-4" />} delay={0.24} />
      <SummaryCard label="Upcoming exams" value={exams.filter((e) => e.status === 'Scheduled').length} sub="Pre-Board in 12d" tone="rose" icon={<FileText className="h-4 w-4" />} delay={0.28} />
    </SummaryCardGrid>
  )
}

// Secondary operational strip — kept compact (4 cards) for birthdays,
// buses, library, inventory. Same premium card language.
import { Cake, Bus, BookMarked, Package } from 'lucide-react'
import { libraryStats } from '@/lib/mock/operations'

export function SecondaryKpiRow() {
  return (
    <SummaryCardGrid columns={4}>
      <SummaryCard label="Today's birthdays" value={8} sub="3 in primary" tone="amber" icon={<Cake className="h-4 w-4" />} delay={0} />
      <SummaryCard label="Buses running" value="22" suffix="/24" sub="2 in maintenance" tone="emerald" icon={<Bus className="h-4 w-4" />} delay={0.04} />
      <SummaryCard label="Library issued" value={libraryStats.issued} sub={`${libraryStats.overdue} overdue`} tone={libraryStats.overdue > 0 ? 'rose' : 'violet'} icon={<BookMarked className="h-4 w-4" />} delay={0.08} />
      <SummaryCard label="Inventory alerts" value={14} sub="low stock" tone="rose" icon={<Package className="h-4 w-4" />} delay={0.12} />
    </SummaryCardGrid>
  )
}
