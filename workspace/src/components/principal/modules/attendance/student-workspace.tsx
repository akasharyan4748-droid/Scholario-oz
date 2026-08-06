'use client'

// Student attendance workspace — the primary surface for the Attendance module.
// Holds the page heading, KPI strip, and composes the chart/heatmap/report/
// insights sections exported from sibling files.

import { useState } from 'react'
import { CalendarCheck, UserCheck, UserX, Clock, Download, Filter } from 'lucide-react'
import { SectionHeading, PageTransition } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { attendanceOverview } from '@/lib/mock/attendance'
import { classList } from '@/lib/mock/school'
import { formatNumber } from '@/lib/format'
import { toast } from 'sonner'
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

  return (
    <PageTransition className="space-y-6">
      <SectionHeading
        title="Attendance Analytics"
        subtitle="School-wide attendance insights · December 2025"
        icon={<CalendarCheck className="h-5 w-5" />}
        action={
          <div className="flex items-center gap-2">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[150px] hidden sm:flex">
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
            <Button onClick={handleExport} variant="outline" className="bg-card/40">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Today's Rate" value={todaysRate} suffix="%" decimals={1} icon={<CalendarCheck className="h-5 w-5" />} trend={0.8} trendLabel="vs yesterday" accent="emerald" delay={0} />
        <KpiCard label="Present Today" value={present} icon={<UserCheck className="h-5 w-5" />} trend={1.2} trendLabel={`${formatNumber(present)} of ${formatNumber(attendanceOverview.today.total)}`} accent="cyan" delay={0.05} />
        <KpiCard label="Absent + Leave" value={absent} icon={<UserX className="h-5 w-5" />} trend={-2.4} trendLabel="Lower than weekly avg" accent="rose" delay={0.1} />
        <KpiCard label="Late Arrivals" value={late} icon={<Clock className="h-5 w-5" />} trend={0.5} trendLabel="Within 15 min window" accent="amber" delay={0.15} />
      </div>

      <OverviewCharts todaysRate={todaysRate} />
      <AttendanceHeatmap selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
      <ClassReport onExport={handleExport} />
      <AttendanceInsights />
    </PageTransition>
  )
}
