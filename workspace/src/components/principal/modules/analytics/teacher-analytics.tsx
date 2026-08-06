'use client'

import { motion } from 'framer-motion'
import { GraduationCap, CalendarCheck, Activity, Users } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ChartCard, BarTrend, Donut, ProgressBar } from '@/components/shared/charts'
import { teachers } from '@/lib/mock/teachers'
import { departments, school } from '@/lib/mock/school'
import { teacherAttendanceRank, teacherDeptDistribution } from './data'

export function TeacherAnalytics() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Teachers" value={school.totalTeachers} icon={<GraduationCap className="h-5 w-5" />} trend={1.2} accent="emerald" delay={0} />
        <KpiCard label="Avg Attendance" value={95.4} suffix="%" decimals={1} icon={<CalendarCheck className="h-5 w-5" />} trend={0.6} accent="cyan" delay={0.05} />
        <KpiCard label="Departments" value={7} icon={<Activity className="h-5 w-5" />} trendLabel="Active departments" accent="violet" delay={0.1} />
        <KpiCard label="On Leave" value={teachers.filter((t) => t.status === 'On Leave').length} icon={<Users className="h-5 w-5" />} trendLabel="Today" accent="amber" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Teacher Attendance Ranking" subtitle="Top 8 by attendance %" className="lg:col-span-2" height={300}>
          <BarTrend data={teacherAttendanceRank} xKey="name" yKey="value" color="oklch(0.65 0.16 75)" height={300} />
        </ChartCard>

        <ChartCard title="Department Distribution" subtitle="Teachers per department" height={300}>
          <Donut data={teacherDeptDistribution} centerValue={String(school.totalTeachers)} centerLabel="Teachers" height={300} />
        </ChartCard>
      </div>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4">Department Performance Overview</h3>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 font-medium">Teachers</th>
                <th className="px-3 py-2 font-medium">Avg Attendance</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Performance</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d, i) => {
                const perf = 78 + ((i * 13) % 18)
                const att = 93 + ((i * 7) % 6)
                return (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-medium">{d.name}</td>
                    <td className="px-3 py-2.5">{d.teachers}</td>
                    <td className="px-3 py-2.5">{att.toFixed(1)}%</td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={perf} color="oklch(0.6 0.18 300)" className="max-w-[100px]" height={6} />
                        <span className="text-xs text-muted-foreground">{perf}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={perf > 88 ? 'Excellent' : perf > 80 ? 'Good' : 'Average'} variant={perf > 88 ? 'success' : perf > 80 ? 'primary' : 'warning'} dot />
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
