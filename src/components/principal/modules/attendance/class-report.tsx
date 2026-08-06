'use client'

// Class-wise attendance report table — top 10 classes by rate, with
// present/absent/late counts, mini progress bar, and status badge.

import { Download, FileSpreadsheet } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { attendanceOverview } from '@/lib/mock/attendance'
import { classTotalForIndex } from './data'

export function ClassReport({ onExport }: { onExport: () => void }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Class-wise Attendance Report
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Today's attendance by class · sorted by rate</p>
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-3 w-3" /> Export CSV
        </Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Class</TableHead>
              <TableHead className="text-xs">Total</TableHead>
              <TableHead className="text-xs">Present</TableHead>
              <TableHead className="text-xs">Absent</TableHead>
              <TableHead className="text-xs">Late</TableHead>
              <TableHead className="text-xs w-32">Rate</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceOverview.byClass.slice(0, 10).map((row, i) => {
              const total = classTotalForIndex(i)
              const presentCount = Math.round(total * row.rate / 100)
              const absentCount = total - presentCount - 2
              const lateCount = 2
              const pct = Math.round(row.rate)
              const variant = pct >= 95 ? 'success' : pct >= 90 ? 'info' : pct >= 85 ? 'warning' : 'danger'
              return (
                <TableRow key={row.class}>
                  <TableCell className="text-xs font-medium">{row.class}</TableCell>
                  <TableCell className="text-xs font-mono">{total}</TableCell>
                  <TableCell className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{presentCount}</TableCell>
                  <TableCell className="text-xs font-mono text-rose-600 dark:text-rose-400">{absentCount}</TableCell>
                  <TableCell className="text-xs font-mono text-amber-600 dark:text-amber-400">{lateCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={pct} color={pct >= 95 ? 'oklch(0.65 0.16 162)' : pct >= 90 ? 'oklch(0.6 0.18 75)' : pct >= 85 ? 'oklch(0.7 0.15 75)' : 'oklch(0.62 0.2 25)'} height={6} />
                      <span className="text-[10px] font-semibold w-8 text-right">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={pct >= 95 ? 'Excellent' : pct >= 90 ? 'Good' : pct >= 85 ? 'Average' : 'At Risk'} variant={variant} dot /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
