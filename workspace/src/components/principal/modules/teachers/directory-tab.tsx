'use client'

import { motion } from 'framer-motion'
import {
  Users, UserCheck, Wallet, Search, CalendarDays,
  ChevronRight, Shield,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { departments } from '@/lib/mock/school'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TeacherRecord } from '@/lib/store/teachers-store'
import { gradientFor } from './shared'

interface Props {
  teachers: TeacherRecord[]
  filteredTeachers: TeacherRecord[]
  search: string
  setSearch: (v: string) => void
  dept: string
  setDept: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  totalTeachers: number
  activeTeachersCount: number
  onLeaveCount: number
  avgAttendance: number
  totalSalary: number
  onOpenProfile: (t: TeacherRecord) => void
}

/**
 * Faculty Directory tab — KPI cards + search/filter bar + teacher grid.
 */
export function DirectoryTab({
  teachers, filteredTeachers,
  search, setSearch, dept, setDept, statusFilter, setStatusFilter,
  totalTeachers, activeTeachersCount, onLeaveCount, avgAttendance, totalSalary,
  onOpenProfile,
}: Props) {
  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Teachers" value={totalTeachers} icon={<Users className="h-5 w-5" />} trend={1.2} trendLabel={`${activeTeachersCount} Active`} accent="emerald" delay={0} />
        <KpiCard label="On Leave Today" value={onLeaveCount} icon={<CalendarDays className="h-5 w-5" />} trendLabel="Substitutes ready" accent="amber" delay={0.05} />
        <KpiCard label="Avg Attendance" value={avgAttendance} suffix="%" icon={<UserCheck className="h-5 w-5" />} trend={0.6} trendLabel="Last 30 days" accent="cyan" delay={0.1} />
        <KpiCard label="Monthly Payroll" value={totalSalary} format={(n) => formatINR(n, true)} icon={<Wallet className="h-5 w-5" />} trend={2.1} trendLabel="Direct Bank Transfer" accent="violet" delay={0.15} />
      </div>

      {/* Filters Bar */}
      <GlassCard className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by teacher name, ID, designation, or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Probation">Probation</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs py-1.5 px-3">
              {filteredTeachers.length} faculty members
            </Badge>
          </div>
        </div>
      </GlassCard>

      {/* Teacher Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTeachers.map((t, i) => {
          const pendingPosCount = t.positions.filter((p) => p.status === 'Pending Acceptance').length

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              whileHover={{ y: -4 }}
              onClick={() => onOpenProfile(t)}
              className="cursor-pointer"
            >
              <GlassCard className="p-4 h-full flex flex-col justify-between relative overflow-hidden group">
                <div>
                  <div className="flex items-start gap-3">
                    <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientFor(t.id)} font-bold text-white shadow-md`}>
                      {t.avatar}
                      <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${t.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{t.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{t.designation}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0">
                          {t.department}
                        </Badge>
                        {pendingPosCount > 0 && (
                          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[9px] py-0">
                            {pendingPosCount} Pending Approval
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subjects & Positions Pills */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {t.subjects.slice(0, 3).map((s) => (
                      <span key={s} className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {s}
                      </span>
                    ))}
                    {t.positions.filter((p) => p.status === 'Active').slice(0, 2).map((p) => (
                      <span key={p.id} className="inline-flex items-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-medium">
                        <Shield className="h-2.5 w-2.5 mr-1" /> {p.positionTitle}
                      </span>
                    ))}
                  </div>

                  {/* Quick Details */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Exp</p>
                      <p className="font-semibold text-xs mt-0.5">{t.totalExperience} yrs</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Attendance</p>
                      <p className={cn('font-semibold text-xs mt-0.5', t.attendance >= 95 ? 'text-emerald-600' : 'text-amber-600')}>
                        {t.attendance}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Salary</p>
                      <p className="font-semibold text-xs mt-0.5">{formatINR(t.salary, true)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted-foreground">{t.employeeId}</span>
                  <span className="text-primary font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Profile & Actions <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
