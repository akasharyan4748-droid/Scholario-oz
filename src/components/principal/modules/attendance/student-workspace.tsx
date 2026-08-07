'use client'

// Student attendance workspace — primary surface for the Attendance module.

import { useState } from 'react'
import { Download, Filter } from 'lucide-react'
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

  // Compact meta strip — replaces 4 oversized KpiCards
  const metaStats = [
    { label: "Today's rate", value: `${todaysRate.toFixed(1)}%`, hint: 'vs yesterday +0.8' },
    { label: 'Present', value: formatNumber(present), hint: `of ${formatNumber(attendanceOverview.today.total)}` },
    { label: 'Absent + leave', value: absent, hint: 'lower than weekly avg' },
    { label: 'Late arrivals', value: late, hint: 'within 15 min window' },
  ]

  const handleExport = () => {
    toast.success('Attendance report exported', {
      description: `December_2025_Attendance_Report.xlsx · ${formatNumber(attendanceOverview.today.total)} students`,
    })
  }

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

      {/* Compact meta strip — replaces 4 KpiCards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/60 rounded-lg overflow-hidden">
        {metaStats.map((s) => (
          <div key={s.label} className="bg-card px-4 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-lg font-semibold text-foreground tabular-nums leading-tight mt-0.5">{s.value}</p>
            {s.hint && <p className="text-[10px] text-muted-foreground mt-0.5">{s.hint}</p>}
          </div>
        ))}
      </div>

      <OverviewCharts todaysRate={todaysRate} />
      <AttendanceHeatmap selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
      <ClassReport onExport={handleExport} />
      <AttendanceInsights />
    </PageTransition>
  )
}
