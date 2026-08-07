'use client'

import { motion } from 'framer-motion'
import { Search, Shield, Users, CalendarDays, UserCheck, Wallet } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { departments } from '@/lib/mock/school'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TeacherRecord } from '@/lib/store/teachers-store'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
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
  relievedCount?: number
  onOpenProfile: (t: TeacherRecord) => void
}

/**
 * Faculty Directory tab — premium summary cards + inline filter bar + minimal teacher cards.
 */
export function DirectoryTab({
  filteredTeachers, search, setSearch, dept, setDept, statusFilter, setStatusFilter,
  totalTeachers, activeTeachersCount, onLeaveCount, avgAttendance, totalSalary,
  relievedCount, onOpenProfile,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Premium summary cards — Admission-style */}
      <SummaryCardGrid columns={4}>
        <SummaryCard label="Total Teachers" value={totalTeachers} sub={`${activeTeachersCount} active`} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0} />
        <SummaryCard label="On Leave Today" value={onLeaveCount} sub="Substitutes ready" tone="amber" icon={<CalendarDays className="h-4 w-4" />} delay={0.05} />
        <SummaryCard label="Avg Attendance" value={avgAttendance} suffix="%" sub="Last 30 days" tone="cyan" icon={<UserCheck className="h-4 w-4" />} delay={0.1} />
        <SummaryCard label="Monthly Payroll" value={formatINR(totalSalary, true)} sub="Bank transfer" tone="violet" icon={<Wallet className="h-4 w-4" />} delay={0.15} />
      </SummaryCardGrid>

      {/* Inline filter row */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, ID, designation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Active</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
              <SelectItem value="Probation">Probation</SelectItem>
              <SelectItem value="archived">Archived / Relieved</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs py-1.5 px-3 h-9 flex items-center">
            {filteredTeachers.length}
          </Badge>
        </div>
      </div>

      {/* Teacher grid — minimal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredTeachers.map((t, i) => {
          const pendingPosCount = t.positions.filter((p) => p.status === 'Pending Acceptance').length
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.2) }}
              whileHover={{ y: -2 }}
              onClick={() => onOpenProfile(t)}
              className="cursor-pointer rounded-lg border border-border/60 bg-card p-4 hover:border-emerald-500/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={cn('relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white font-semibold text-sm', gradientFor(t.id))}>
                  {t.avatar}
                  <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                    t.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.designation}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] py-0 px-1.5">
                      {t.department}
                    </Badge>
                    {pendingPosCount > 0 && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[9px] py-0 px-1.5">
                        {pendingPosCount} pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {t.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {t.subjects.slice(0, 3).map((s) => (
                    <span key={s} className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground">Exp</p>
                  <p className="font-medium text-foreground">{t.totalExperience}y</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Att.</p>
                  <p className={cn('font-medium', t.attendance >= 95 ? 'text-emerald-600' : 'text-amber-600')}>
                    {t.attendance}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Salary</p>
                  <p className="font-medium text-foreground">{formatINR(t.salary, true)}</p>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                <span className="font-mono text-muted-foreground">{t.employeeId}</span>
                {t.positions.filter((p) => p.status === 'Active').slice(0, 1).map((p) => (
                  <span key={p.id} className="inline-flex items-center text-emerald-700 dark:text-emerald-300 font-medium">
                    <Shield className="h-2.5 w-2.5 mr-1" /> {p.positionTitle}
                  </span>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

