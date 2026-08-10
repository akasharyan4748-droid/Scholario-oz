'use client'

/**
 * StudentWorkspace (Overview tab) — Brief §3-§12 (Phase 2).
 *
 * Brief §10: ALL metrics respect the classFilter — no school-wide numbers
 * shown when a specific class is selected.
 *
 * Brief §11: Live Class Snapshot behavior is context-aware — handled in
 * AttendanceInsights.
 */

import { useState, useMemo } from 'react'
import { Download, Filter, CalendarCheck, UserCheck, UserX, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  attendanceOverview,
  classSections,
  getClassSection,
  getAllSectionsToday,
  getClassWeeklyTrend,
  getClassMonthlyTrend,
  buildAttendanceExportFilename,
} from '@/lib/mock/attendance'
import { classList } from '@/lib/mock/school'
import { formatNumber } from '@/lib/format'
import { toast } from 'sonner'
import { ModuleHeader } from '../shared/module-header'
import { OverviewCharts } from './overview-charts'
import { AttendanceHeatmap } from './heatmap'
import { ClassReport } from './class-report'
import { AttendanceInsights } from './insights'

interface StudentWorkspaceProps {
  classFilter: string
  setClassFilter: (v: string) => void
  onExport: () => void
  onViewFullAttendance: (day: number) => void
}

export function StudentWorkspace({
  classFilter, setClassFilter, onExport, onViewFullAttendance,
}: StudentWorkspaceProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(10)

  // Brief §10: derive ALL metrics from classFilter
  const isAllClasses = classFilter === 'all'
  const section = getClassSection(classFilter)

  const { todaysRate, present, absent, late, leave, total } = useMemo(() => {
    if (isAllClasses || !section) {
      const all = getAllSectionsToday()
      return {
        todaysRate: all.rate,
        present: all.present,
        absent: all.absent,
        late: all.late,
        leave: all.leave,
        total: all.total,
      }
    }
    return {
      todaysRate: section.rate,
      present: section.present,
      absent: section.absent,
      late: section.late,
      leave: section.leave,
      total: section.total,
    }
  }, [isAllClasses, section])

  // Per-class weekly + monthly trends
  const weeklyTrend = useMemo(() => getClassWeeklyTrend(classFilter), [classFilter])
  const monthlyTrend = useMemo(() => getClassMonthlyTrend(classFilter), [classFilter])

  // KPI contextual info — derived from REAL data
  const yesterdayRate = weeklyTrend[weeklyTrend.length - 2]?.rate ?? todaysRate
  const wowDelta = +(todaysRate - yesterdayRate).toFixed(1)
  const absentPct = total > 0 ? +((absent / total) * 100).toFixed(1) : 0
  const latePct = total > 0 ? +((late / total) * 100).toFixed(1) : 0

  return (
    <PageTransition className="space-y-4">
      {/* Brief §9: compact filters + export */}
      <ModuleHeader
        meta={[`December 2025`, isAllClasses ? 'All Classes' : (section?.name ?? '')]}
        actions={
          <>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs hidden sm:flex">
                <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classSections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={onExport} variant="outline" size="sm" className="h-8 text-xs">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </>
        }
      />

      {/* Brief §4: refined compact KPI cards (filter-aware) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <RefinedKpi
          label="Today's Rate"
          value={`${todaysRate}%`}
          icon={<CalendarCheck className="h-3.5 w-3.5" />}
          tone="emerald"
          indicator={wowDelta >= 0 ? 'up' : 'down'}
          indicatorValue={`${Math.abs(wowDelta)}% vs yesterday`}
        />
        <RefinedKpi
          label="Present Today"
          value={formatNumber(present)}
          icon={<UserCheck className="h-3.5 w-3.5" />}
          tone="cyan"
          indicatorValue={`of ${formatNumber(total)} ${isAllClasses ? 'students' : 'in class'}`}
        />
        <RefinedKpi
          label="Absent + Leave"
          value={formatNumber(absent + leave)}
          icon={<UserX className="h-3.5 w-3.5" />}
          tone="rose"
          indicatorValue={`${absentPct}% of ${isAllClasses ? 'students' : 'class'}`}
        />
        <RefinedKpi
          label="Late Arrivals"
          value={formatNumber(late)}
          icon={<Clock className="h-3.5 w-3.5" />}
          tone="amber"
          indicatorValue={`${latePct}% · within 15 min window`}
        />
      </div>

      {/* Charts row — now filter-aware */}
      <OverviewCharts
        todaysRate={todaysRate}
        present={present}
        absent={absent}
        late={late}
        leave={leave}
        total={total}
        weeklyTrend={weeklyTrend}
        monthlyTrend={monthlyTrend}
      />

      <AttendanceHeatmap
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        onViewFullAttendance={onViewFullAttendance}
      />

      <ClassReport onExport={onExport} classFilter={classFilter} />

      <AttendanceInsights
        classFilter={classFilter}
        onViewAllClasses={() => {
          // Brief §11: View all classes → currently no full screen modal,
          // could navigate to a dedicated page later. For now, switch filter
          // back to all classes so all classes are visible.
          setClassFilter('all')
        }}
      />
    </PageTransition>
  )
}

/* ──────────────────────────────────────────────────────────
   RefinedKpi — compact KPI card with contextual indicator
   ────────────────────────────────────────────────────────── */
type KpiTone = 'emerald' | 'cyan' | 'rose' | 'amber'

const TONE_CLASSES: Record<KpiTone, { text: string; bg: string; border: string }> = {
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-border hover:border-emerald-500/40' },
  cyan:    { text: 'text-cyan-600 dark:text-cyan-400',       bg: 'bg-cyan-500/5',    border: 'border-border hover:border-cyan-500/40' },
  rose:    { text: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-500/5',     border: 'border-border hover:border-rose-500/40' },
  amber:   { text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-500/5',    border: 'border-border hover:border-amber-500/40' },
}

function RefinedKpi({
  label, value, icon, tone, indicator, indicatorValue,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: KpiTone
  indicator?: 'up' | 'down'
  indicatorValue: string
}) {
  const t = TONE_CLASSES[tone]
  return (
    <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${t.bg} ${t.border}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <p className={`font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${t.text}`}>
        {value}
      </p>
      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
        {indicator === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
        {indicator === 'down' && <ArrowDownRight className="h-3 w-3 text-rose-600 dark:text-rose-400" />}
        <span className="truncate">{indicatorValue}</span>
      </div>
    </div>
  )
}
