'use client'

// Analytics module entry point.
//
// `principal-panel.tsx` lazy-loads the named `AnalyticsModule` export from
// this path:
//   import('./modules/analytics').then((m) => ({ default: m.AnalyticsModule }))
//
// The module is split into one file per analytics tab + a shared `data.tsx`
// for derived mock datasets and the `TABS` array.

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Users, IndianRupee, GraduationCap, TrendingUp, CalendarCheck,
  UserPlus, Award, Wallet,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { SectionHeading, StatusBadge } from '@/components/shared/ui'
import { attendanceOverview } from '@/lib/mock/attendance'
import { feeAnalytics, revenueAnalytics } from '@/lib/mock/finance'
import { examAnalytics } from '@/lib/mock/academics'
import { studentStats } from '@/lib/mock/students'
import { school } from '@/lib/mock/school'
import { formatINR } from '@/lib/format'
import { TABS, type TabKey } from './data'
import { AttendanceAnalytics } from './attendance-analytics'
import { FeeAnalytics } from './fee-analytics'
import { PerformanceAnalytics } from './performance-analytics'
import { RevenueAnalytics } from './revenue-analytics'
import { TeacherAnalytics } from './teacher-analytics'
import { AdmissionAnalytics } from './admission-analytics'

export function AnalyticsModule() {
  const [tab, setTab] = useState<TabKey>('attendance')

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Analytics Dashboard"
        subtitle="Comprehensive insights across academics, finance & operations"
        icon={<BarChart3 className="h-5 w-5" />}
        action={<StatusBadge status="Live · Updated 2 min ago" variant="success" dot />}
      />

      {/* Top-level KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Avg Attendance" value={attendanceOverview.today.rate} suffix="%" decimals={1} icon={<CalendarCheck className="h-5 w-5" />} trend={0.8} accent="emerald" delay={0} />
        <KpiCard label="Collection Rate" value={feeAnalytics.collectionRate} suffix="%" decimals={1} icon={<IndianRupee className="h-5 w-5" />} trend={2.4} accent="amber" delay={0.05} />
        <KpiCard label="Pass Percentage" value={examAnalytics.passPercentage} suffix="%" decimals={1} icon={<Award className="h-5 w-5" />} trend={1.6} accent="violet" delay={0.1} />
        <KpiCard label="Net Surplus" value={revenueAnalytics.netSurplus} format={(n) => formatINR(n, true)} icon={<TrendingUp className="h-5 w-5" />} trend={18.2} accent="emerald" delay={0.15} />
        <KpiCard label="Total Teachers" value={school.totalTeachers} icon={<GraduationCap className="h-5 w-5" />} trendLabel={`${school.totalTeachers} active staff`} accent="cyan" delay={0.2} />
        <KpiCard label="New Admissions" value={studentStats.newThisMonth} icon={<UserPlus className="h-5 w-5" />} trend={18.4} accent="rose" delay={0.25} />
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-card/40 text-muted-foreground hover:bg-accent/40 hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {tab === 'attendance' && <AttendanceAnalytics />}
        {tab === 'fee' && <FeeAnalytics />}
        {tab === 'performance' && <PerformanceAnalytics />}
        {tab === 'revenue' && <RevenueAnalytics />}
        {tab === 'teacher' && <TeacherAnalytics />}
        {tab === 'admission' && <AdmissionAnalytics />}
      </motion.div>
    </div>
  )
}
