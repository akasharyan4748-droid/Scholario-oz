'use client'

import {
  Users, GraduationCap, CalendarCheck, Wallet, IndianRupee, Clock,
  UserPlus, FileText, Cake, Bus, BookMarked, Package,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { studentStats } from '@/lib/mock/students'
import { attendanceOverview } from '@/lib/mock/attendance'
import { feeAnalytics, salaryAnalytics } from '@/lib/mock/finance'
import { exams } from '@/lib/mock/academics'
import { school } from '@/lib/mock/school'
import { libraryStats } from '@/lib/mock/operations'
import { formatINR } from '@/lib/format'
import { sparkline } from './data'

// Primary KPI grid — 8 cross-module summary cards at the top of the dashboard.
// Each KpiCard is a separate component so this stays a thin composition layer.
export function KpiRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard label="Total Students" value={studentStats.total} icon={<Users className="h-5 w-5" />} trend={2.4} trendLabel="vs last term" accent="emerald" sparkline={sparkline} sparkKey="v" delay={0} />
      <KpiCard label="Total Teachers" value={school.totalTeachers} icon={<GraduationCap className="h-5 w-5" />} trend={1.2} trendLabel="3 joined this month" accent="amber" delay={0.05} />
      <KpiCard label="Today's Attendance" value={attendanceOverview.today.rate} suffix="%" decimals={1} icon={<CalendarCheck className="h-5 w-5" />} trend={0.8} trendLabel={`${attendanceOverview.today.present} present`} accent="cyan" delay={0.1} />
      <KpiCard label="Monthly Revenue" value={feeAnalytics.collectedThisMonth} format={(n) => formatINR(n, true)} icon={<Wallet className="h-5 w-5" />} trend={12.5} trendLabel="this month" accent="emerald" delay={0.15} />
      <KpiCard label="Pending Fees" value={feeAnalytics.pendingDues} format={(n) => formatINR(n, true)} icon={<IndianRupee className="h-5 w-5" />} trend={-4.2} trendLabel={`${feeAnalytics.pendingCount} students`} accent="rose" delay={0.2} />
      <KpiCard label="Salary Due" value={salaryAnalytics.totalMonthly} format={(n) => formatINR(n, true)} icon={<Clock className="h-5 w-5" />} trendLabel={`Payroll · ${school.totalStaff} staff`} accent="violet" delay={0.25} />
      <KpiCard label="New Admissions" value={studentStats.newThisMonth} icon={<UserPlus className="h-5 w-5" />} trend={18.4} trendLabel="this month" accent="amber" delay={0.3} />
      <KpiCard label="Upcoming Exams" value={exams.filter((e) => e.status === 'Scheduled').length} icon={<FileText className="h-5 w-5" />} trendLabel="Pre-Board in 12 days" accent="rose" delay={0.35} />
    </div>
  )
}

// Secondary KPI strip — the 4 smaller operational KPI cards (birthdays, bus
// status, library issued, inventory alerts) shown further down the dashboard.
export function SecondaryKpiRow() {
  const cards = [
    { label: "Today's Birthdays", value: 8, icon: <Cake className="h-5 w-5" />, accent: 'amber' as const, sub: '🎂 3 in primary' },
    { label: 'School Bus Status', value: 22, suffix: '/24', icon: <Bus className="h-5 w-5" />, accent: 'cyan' as const, sub: '2 in maintenance' },
    { label: 'Library Issued', value: libraryStats.issued, icon: <BookMarked className="h-5 w-5" />, accent: 'violet' as const, sub: `${libraryStats.overdue} overdue` },
    { label: 'Inventory Alerts', value: 14, icon: <Package className="h-5 w-5" />, accent: 'rose' as const, sub: 'Low stock items' },
  ]
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((k, i) => (
        <KpiCard key={k.label} {...k} trendLabel={k.sub} delay={i * 0.05} />
      ))}
    </div>
  )
}
