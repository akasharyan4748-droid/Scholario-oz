'use client'

/**
 * AttendanceHistoryTab — Brief §16-§20, §31-§32 (Phase 2).
 *
 * Authoritative record-management system for past attendance.
 *
 * Structure:
 *   - Filters: date range picker, class filter, status filter, search
 *   - History table: date / class / total / present / absent / late / leave / rate / status / view
 *   - Click View → opens detail dialog with that day+class breakdown
 *
 * Brief §19: Heatmap's "View full attendance →" CTA navigates here with
 *   pre-set date.
 *
 * Brief §18: export respects current filters (filename = date_class).
 */

import { useMemo, useState, useEffect } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Calendar, Search, ArrowLeft, Download, Eye } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  attendanceHistory,
  classSections,
  getHistoryForDateClass,
  buildAttendanceExportFilename,
  type AttendanceHistoryRecord,
} from '@/lib/mock/attendance'
import { formatNumber } from '@/lib/format'
import { toast } from 'sonner'
import { ATTENDANCE_PALETTE } from './attendance-charts'

const STATUS_VARIANT: Record<AttendanceHistoryRecord['status'], {
  cls: string; dot: string
}> = {
  'Excellent':       { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20', dot: 'bg-emerald-500' },
  'Good':            { cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20', dot: 'bg-sky-500' },
  'Needs Attention': { cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20', dot: 'bg-rose-500' },
}

interface AttendanceHistoryTabProps {
  /** When navigated from heatmap, pre-set date + class. */
  initialDate?: string
  initialClassId?: string
}

export function AttendanceHistoryTab({ initialDate, initialClassId }: AttendanceHistoryTabProps) {
  const reduce = useReducedMotion()
  const [fromDate, setFromDate] = useState<string>(initialDate ?? '2025-12-01')
  const [toDate, setToDate] = useState<string>(initialDate ?? '2025-12-22')
  const [classFilter, setClassFilter] = useState<string>(initialClassId ?? 'all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewRecord, setViewRecord] = useState<AttendanceHistoryRecord | null>(null)

  // Apply incoming initial props (e.g. from heatmap CTA)
  useEffect(() => {
    if (initialDate) {
      setFromDate(initialDate)
      setToDate(initialDate)
    }
    if (initialClassId) {
      setClassFilter(initialClassId)
    }
  }, [initialDate, initialClassId])

  // Filter records
  const filtered = useMemo(() => {
    return attendanceHistory.filter((r) => {
      if (fromDate && r.date < fromDate) return false
      if (toDate && r.date > toDate) return false
      if (classFilter !== 'all' && r.classId !== classFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.className.toLowerCase().includes(q) && !r.date.includes(q)) return false
      }
      return true
    })
  }, [fromDate, toDate, classFilter, statusFilter, search])

  const handleExport = () => {
    // Brief §18: filename respects current filters
    const datePart = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`
    const filename = buildAttendanceExportFilename(datePart, classFilter)
    toast.success('Attendance history exported', {
      description: `${filename}.csv · ${filtered.length} records`,
    })
  }

  return (
    <PageTransition className="space-y-4">
      {/* Filters — Brief §16 */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range — Brief §20 */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={fromDate}
                max={toDate || '2025-12-22'}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 pl-8 pr-2 text-xs w-[140px]"
              />
            </div>
            <span className="text-[10px] text-muted-foreground">to</span>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={toDate}
                min={fromDate || '2025-12-01'}
                max="2025-12-22"
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 pl-8 pr-2 text-xs w-[140px]"
              />
            </div>
          </div>

          {/* Class filter */}
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classSections.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Excellent">Excellent</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Needs Attention">Needs Attention</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-8 pl-8 pr-3 text-xs w-[160px]"
            />
          </div>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* History table — Brief §31 */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur-sm z-10">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5">Date</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5">Class</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 text-right">Total</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 text-right">Present</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 text-right">Absent</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 text-right">Late</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 text-right">Leave</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 w-24">Rate</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.slice(0, 100).map((r, i) => (
                <motion.tr
                  key={`${r.date}-${r.classId}`}
                  layout
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.2), duration: 0.25 }}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors text-xs cursor-pointer"
                  onClick={() => setViewRecord(r)}
                >
                  <TableCell className="py-2.5 font-mono tabular-nums">{formatDate(r.date)}</TableCell>
                  <TableCell className="py-2.5 font-medium text-foreground">{r.className}</TableCell>
                  <TableCell className="py-2.5 font-mono tabular-nums text-muted-foreground text-right">{r.total}</TableCell>
                  <TableCell className="py-2.5 font-mono tabular-nums text-emerald-600 dark:text-emerald-400 text-right">{r.present}</TableCell>
                  <TableCell className="py-2.5 font-mono tabular-nums text-rose-600 dark:text-rose-400 text-right">{r.absent}</TableCell>
                  <TableCell className="py-2.5 font-mono tabular-nums text-amber-600 dark:text-amber-400 text-right">{r.late}</TableCell>
                  <TableCell className="py-2.5 font-mono tabular-nums text-sky-600 dark:text-sky-400 text-right">{r.leave}</TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-muted/60 overflow-hidden">
                        <motion.div
                          initial={reduce ? false : { width: 0 }}
                          animate={{ width: `${r.rate}%` }}
                          transition={{ duration: 0.5, delay: Math.min(i * 0.01, 0.2) + 0.1 }}
                          className="h-full rounded-full"
                          style={{
                            background: r.rate >= 95 ? ATTENDANCE_PALETTE.present
                              : r.rate >= 90 ? ATTENDANCE_PALETTE.late
                              : ATTENDANCE_PALETTE.absent,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold tabular-nums w-9 text-right">{r.rate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewRecord(r) }}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                      title="View details"
                      aria-label="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                  No attendance records found matching filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 100 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Showing first 100 of {filtered.length} records · refine filters to narrow
        </p>
      )}

      {/* Detail dialog — Brief §17 + §32 */}
      <HistoryDetailDialog
        record={viewRecord}
        onClose={() => setViewRecord(null)}
        onExport={handleExport}
      />
    </PageTransition>
  )
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function StatusBadge({ status }: { status: AttendanceHistoryRecord['status'] }) {
  const v = STATUS_VARIANT[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${v.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
      {status}
    </span>
  )
}

function HistoryDetailDialog({
  record, onClose, onExport,
}: {
  record: AttendanceHistoryRecord | null
  onClose: () => void
  onExport: () => void
}) {
  const reduce = useReducedMotion()

  // Get school-wide rollup if record is for 'all'
  const displayRecord = useMemo(() => {
    if (!record) return null
    if (record.classId !== 'all') return record
    return getHistoryForDateClass(record.date, 'all')
  }, [record])

  if (!displayRecord) return null

  const [y, m, d] = displayRecord.date.split('-').map(Number)
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            Attendance Detail
          </DialogTitle>
          <DialogDescription className="text-[10px]">
            {dateLabel} · {displayRecord.className}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {/* Summary block */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[9px] uppercase tracking-wider font-semibold text-primary">Attendance Rate</p>
                <p className="font-display text-2xl font-bold tabular-nums text-primary">{displayRecord.rate}%</p>
              </div>
              <StatusBadge status={displayRecord.status} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <DetailStat label="Total Students" value={displayRecord.total} color="text-foreground" />
            <DetailStat label="Present" value={displayRecord.present} color="text-emerald-600 dark:text-emerald-400" />
            <DetailStat label="Late" value={displayRecord.late} color="text-amber-600 dark:text-amber-400" />
            <DetailStat label="Absent" value={displayRecord.absent} color="text-rose-600 dark:text-rose-400" />
            <DetailStat label="Leave" value={displayRecord.leave} color="text-sky-600 dark:text-sky-400" />
            <DetailStat label="Class Teacher" value={classSections.find((c) => c.id === displayRecord.classId)?.teacher ?? '—'} color="text-foreground" />
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClose}>
            <ArrowLeft className="h-3.5 w-3.5" /> Close
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { onExport(); onClose() }}
          >
            <Download className="h-3.5 w-3.5" /> Export Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <p className={`font-display text-base font-bold tabular-nums truncate ${color}`}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
    </div>
  )
}
