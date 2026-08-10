'use client'

/**
 * StaffAttendanceTab — Brief §13-§15 (Phase 2).
 *
 * Staff attendance managed by Principal/Admin.
 *
 * Structure:
 *   - Staff summary (Present/Late/Absent/Leave counts)
 *   - Filters: date picker, department/role filter, search
 *   - Staff list table with status + check-in + marking controls
 *
 * Marking workflow (Brief §14): inline action buttons per row — Mark
 * Present / Mark Late / Mark Absent / Mark Leave. Fast, no modal.
 *
 * Date control (Brief §15): date picker that controls which day's staff
 * records are shown.
 */

import { useMemo, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Calendar, Search, Check, Clock, X, Coffee } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import {
  getStaffAttendanceForDate,
  getStaffAttendanceSummary,
  staffAttendance,
  type StaffAttendanceRecord,
  type AttendanceStatus,
} from '@/lib/mock/attendance'
import { formatNumber } from '@/lib/format'
import { ATTENDANCE_PALETTE } from './attendance-charts'

const STATUS_META: Record<AttendanceStatus, {
  label: string
  color: string
  bg: string
  text: string
  border: string
  icon: React.ReactNode
}> = {
  present: {
    label: 'Present',
    color: ATTENDANCE_PALETTE.present,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    icon: <Check className="h-3 w-3" />,
  },
  late: {
    label: 'Late',
    color: ATTENDANCE_PALETTE.late,
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
    icon: <Clock className="h-3 w-3" />,
  },
  absent: {
    label: 'Absent',
    color: ATTENDANCE_PALETTE.absent,
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/30',
    icon: <X className="h-3 w-3" />,
  },
  leave: {
    label: 'Leave',
    color: ATTENDANCE_PALETTE.leave,
    bg: 'bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/30',
    icon: <Coffee className="h-3 w-3" />,
  },
}

const ROLES: StaffAttendanceRecord['role'][] = [
  'Teacher', 'Coordinator', 'Admin Staff', 'Librarian', 'Lab Assistant',
]

export function StaffAttendanceTab() {
  const reduce = useReducedMotion()
  const [selectedDate, setSelectedDate] = useState('2025-12-10')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  // Local draft state — principal can mark attendance inline
  const [draft, setDraft] = useState<StaffAttendanceRecord[] | null>(null)

  // Load records for the selected date (deterministic per date)
  const records = useMemo(() => {
    if (selectedDate === '2025-12-10') {
      // Today — use the canonical seeded data
      return draft ?? staffAttendance
    }
    return getStaffAttendanceForDate(selectedDate)
  }, [selectedDate, draft])

  const summary = useMemo(() => getStaffAttendanceSummary(records), [records])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (roleFilter !== 'all' && r.role !== roleFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.name.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q) && !r.department.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [records, roleFilter, search])

  const handleMark = (id: string, status: AttendanceStatus) => {
    setDraft((prev) => {
      const base = prev ?? records
      return base.map((r) => {
        if (r.id !== id) return r
        // Brief §15: when marking absent/leave, clear check-in
        const checkIn = status === 'present'
          ? '08:30 AM'
          : status === 'late'
          ? '09:00 AM'
          : null
        return { ...r, status, checkIn }
      })
    })
  }

  const dateDisplay = useMemo(() => {
    if (!selectedDate) return 'Today'
    const d = new Date(selectedDate)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }, [selectedDate])

  return (
    <PageTransition className="space-y-4">
      {/* Compact summary row — Brief §13 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StaffSummaryCard
          label="Present"
          value={summary.present}
          total={summary.total}
          icon={<Check className="h-3.5 w-3.5" />}
          tone="emerald"
        />
        <StaffSummaryCard
          label="Late"
          value={summary.late}
          total={summary.total}
          icon={<Clock className="h-3.5 w-3.5" />}
          tone="amber"
        />
        <StaffSummaryCard
          label="Absent"
          value={summary.absent}
          total={summary.total}
          icon={<X className="h-3.5 w-3.5" />}
          tone="rose"
        />
        <StaffSummaryCard
          label="Leave"
          value={summary.leave}
          total={summary.total}
          icon={<Coffee className="h-3.5 w-3.5" />}
          tone="sky"
        />
      </div>

      {/* Filters + date picker */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date picker — Brief §15 */}
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={selectedDate}
              max="2025-12-22"
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setDraft(null) // reset draft when date changes
              }}
              className="h-8 pl-8 pr-2 text-xs w-[150px]"
            />
          </div>

          {/* Role filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff…"
              className="h-8 pl-8 pr-3 text-xs w-[200px]"
            />
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground">
          {dateDisplay} · {filtered.length} staff
        </span>
      </div>

      {/* Staff attendance table — Brief §13 + §14 */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur-sm z-10">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5">Name</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 hidden sm:table-cell">Role</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 hidden md:table-cell">Department</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 hidden sm:table-cell">Check-in</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 text-right">Mark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.map((r, i) => (
                <StaffRow
                  key={`${r.id}-${selectedDate}`}
                  record={r}
                  index={i}
                  reduce={reduce}
                  onMark={handleMark}
                />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                  No staff found matching filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </PageTransition>
  )
}

function StaffSummaryCard({
  label, value, total, icon, tone,
}: {
  label: string
  value: number
  total: number
  icon: React.ReactNode
  tone: 'emerald' | 'amber' | 'rose' | 'sky'
}) {
  const toneClasses = {
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-border hover:border-emerald-500/40' },
    amber:   { text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-500/5',    border: 'border-border hover:border-amber-500/40' },
    rose:    { text: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-500/5',     border: 'border-border hover:border-rose-500/40' },
    sky:     { text: 'text-sky-600 dark:text-sky-400',          bg: 'bg-sky-500/5',      border: 'border-border hover:border-sky-500/40' },
  }[tone]
  const pct = total > 0 ? +((value / total) * 100).toFixed(1) : 0
  return (
    <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${toneClasses.bg} ${toneClasses.border}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
        <span className={toneClasses.text}>{icon}</span>
      </div>
      <p className={`font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${toneClasses.text}`}>
        {formatNumber(value)}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">
        {pct}% of {total} staff
      </p>
    </div>
  )
}

function StaffRow({
  record, index, reduce, onMark,
}: {
  record: StaffAttendanceRecord
  index: number
  reduce: boolean | null
  onMark: (id: string, status: AttendanceStatus) => void
}) {
  const meta = STATUS_META[record.status]
  return (
    <motion.tr
      layout
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.25 }}
      className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors text-xs"
    >
      <TableCell className="py-2.5">
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{record.name}</p>
          <p className="text-[10px] text-muted-foreground font-mono tabular-nums sm:hidden">{record.role} · {record.department}</p>
        </div>
      </TableCell>
      <TableCell className="py-2.5 hidden sm:table-cell text-muted-foreground">{record.role}</TableCell>
      <TableCell className="py-2.5 hidden md:table-cell text-muted-foreground">{record.department}</TableCell>
      <TableCell className="py-2.5">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.border} ${meta.text}`}>
          {meta.icon}
          {meta.label}
        </span>
      </TableCell>
      <TableCell className="py-2.5 hidden sm:table-cell font-mono tabular-nums text-muted-foreground">
        {record.checkIn ?? '—'}
      </TableCell>
      <TableCell className="py-2.5">
        <div className="flex items-center justify-end gap-1">
          <MarkButton id={record.id} status="present" current={record.status} onMark={onMark} />
          <MarkButton id={record.id} status="late" current={record.status} onMark={onMark} />
          <MarkButton id={record.id} status="absent" current={record.status} onMark={onMark} />
          <MarkButton id={record.id} status="leave" current={record.status} onMark={onMark} />
        </div>
      </TableCell>
    </motion.tr>
  )
}

function MarkButton({
  id, status, current, onMark,
}: {
  id: string
  status: AttendanceStatus
  current: AttendanceStatus
  onMark: (id: string, status: AttendanceStatus) => void
}) {
  const meta = STATUS_META[status]
  const isActive = current === status
  return (
    <button
      onClick={() => onMark(id, status)}
      title={`Mark ${meta.label}`}
      aria-label={`Mark ${meta.label}`}
      aria-pressed={isActive}
      className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all ${
        isActive
          ? `${meta.bg} ${meta.border} ${meta.text}`
          : 'border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      {meta.icon}
    </button>
  )
}
