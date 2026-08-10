'use client'

/**
 * StudentWorkspace — primary surface for the Attendance module.
 *
 * Brief section 4: refined compact KPI cards with primary number + contextual
 *   info + subtle visual indicator (no oversized cards, no bright color blocks).
 *
 * Brief section 18: keep just `All Classes` filter + `Export` action (only
 *   controls that provide real value).
 *
 * Brief section 19: existing Export toast logic preserved (no break).
 */

import { useState } from 'react'
import { Download, Filter, CalendarCheck, UserCheck, UserX, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { attendanceOverview } from '@/lib/mock/attendance'
import { classList } from '@/lib/mock/school'
import { formatNumber } from '@/lib/format'
import { toast } from 'sonner'
import { ModuleHeader } from '../shared/module-header'
import { OverviewCharts } from './overview-charts'
import { AttendanceHeatmap } from './heatmap'
import { ClassReport } from './class-report'
import { AttendanceInsights } from './insights'

export function StudentWorkspace() {
  const [classFilter, setClassFilter] = useState('all')
  const [selectedDay, setSelectedDay] = useState<number | null>(10)

  const todaysRate = attendanceOverview.today.rate
  const present = attendanceOverview.today.present
  const absent = attendanceOverview.today.absent + attendanceOverview.today.leave
  const late = attendanceOverview.today.late

  const handleExport = () => {
    toast.success('Attendance report exported', {
      description: `December_2025_Attendance_Report.xlsx · ${formatNumber(attendanceOverview.today.total)} students`,
    })
  }

  // Brief section 4: derived contextual info — uses REAL weekTrend data
  const yesterdayRate = attendanceOverview.weekTrend[attendanceOverview.weekTrend.length - 2]?.rate ?? todaysRate
  const wowDelta = +(todaysRate - yesterdayRate).toFixed(1)
  const absentPct = +((absent / attendanceOverview.today.total) * 100).toFixed(1)
  const latePct = +((late / attendanceOverview.today.total) * 100).toFixed(1)

  return (
    <PageTransition className="space-y-4">
      <ModuleHeader
        meta={[`December 2025`]}
        actions={
          <>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs hidden sm:flex">
                <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classList.map((c) => {
                  const id = typeof c === 'string' ? c : c.id
                  const name = typeof c === 'string' ? c : c.name
                  return <SelectItem key={id} value={id}>{name}</SelectItem>
                })}
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" size="sm" className="h-8 text-xs">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </>
        }
      />

      {/* Brief 4: refined compact KPI cards */}
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
          indicatorValue={`of ${formatNumber(attendanceOverview.today.total)} students`}
        />
        <RefinedKpi
          label="Absent + Leave"
          value={formatNumber(absent)}
          icon={<UserX className="h-3.5 w-3.5" />}
          tone="rose"
          indicatorValue={`${absentPct}% of students`}
        />
        <RefinedKpi
          label="Late Arrivals"
          value={formatNumber(late)}
          icon={<Clock className="h-3.5 w-3.5" />}
          tone="amber"
          indicatorValue={`${latePct}% · within 15 min window`}
        />
      </div>

      <OverviewCharts todaysRate={todaysRate} />
      <AttendanceHeatmap selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
      <ClassReport onExport={handleExport} />
      <AttendanceInsights />
    </PageTransition>
  )
}

/* ──────────────────────────────────────────────────────────
   RefinedKpi — compact KPI card with contextual indicator
   Brief 4: primary number + small contextual info + subtle visual indicator
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
  /** Optional directional indicator (up/down arrow). */
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
        <span>{indicatorValue}</span>
      </div>
    </div>
  )
}
