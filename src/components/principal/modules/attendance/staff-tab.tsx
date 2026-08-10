'use client'

/**
 * StaffAttendanceTab — Phase 3 redesign.
 *
 * Brief §1-§7 (Phase 3): semantic colors, count-up, Mark All Present,
 * Submit Attendance with unsaved-changes detection, improved action states.
 *
 * Universal status system (Brief §7): STATUS_META from ./attendance-status
 * is shared with student attendance + history.
 *
 * Workflow:
 *   KPI summary (count-up + colored icons)
 *   ↓
 *   filters (date picker FIXED via universal DatePicker, role, search)
 *   ↓
 *   Mark All Present action (with lightweight confirmation)
 *   ↓
 *   Staff table (rows with filled selected state)
 *   ↓
 *   Unsaved changes indicator + Submit Attendance button
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Search, Check, Clock, X, Coffee, CheckCheck, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import {
  getStaffAttendanceForDate,
  getStaffAttendanceSummary,
  staffAttendance,
  type StaffAttendanceRecord,
  type AttendanceStatus,
} from '@/lib/mock/attendance'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { toast } from 'sonner'
import { STATUS_META, STATUS_ORDER, StatusBadge } from './attendance-status'

const ROLES: StaffAttendanceRecord['role'][] = [
  'Teacher', 'Coordinator', 'Admin Staff', 'Librarian', 'Lab Assistant',
]

const TONE_CLASSES = {
  present: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-border hover:border-emerald-500/40' },
  late:    { text: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-500/5',    border: 'border-border hover:border-amber-500/40' },
  absent:  { text: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-500/5',     border: 'border-border hover:border-rose-500/40' },
  leave:   { text: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-500/5',      border: 'border-border hover:border-sky-500/40' },
} as const

export function StaffAttendanceTab() {
  const reduce = useReducedMotion()
  const [selectedDate, setSelectedDate] = useState('2025-12-10')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  /** Local draft state — principal can mark attendance inline (Brief §3, §5). */
  const [draft, setDraft] = useState<StaffAttendanceRecord[] | null>(null)
  /** Track the "submitted" state so we can show success + lock the submit button. */
  const [submitted, setSubmitted] = useState(false)
  /** Mark All Present confirmation dialog (Brief §28). */
  const [markAllConfirmOpen, setMarkAllConfirmOpen] = useState(false)
  /** Submitting state for the Submit button (Brief §4). */
  const [submitting, setSubmitting] = useState(false)
  /** Ref to scroll to the submit button on click (Brief §27). */
  const submitRef = useRef<HTMLDivElement>(null)

  // Load records for the selected date (deterministic per date).
  const baseRecords = useMemo(() => {
    if (selectedDate === '2025-12-10') return staffAttendance
    return getStaffAttendanceForDate(selectedDate)
  }, [selectedDate])

  // Reset draft + submitted state when date changes (Brief §15).
  useEffect(() => {
    setDraft(null)
    setSubmitted(false)
  }, [selectedDate])

  const records = draft ?? baseRecords
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

  // Brief §5: detect unsaved changes by comparing draft vs base records.
  const hasUnsavedChanges = useMemo(() => {
    if (!draft) return false
    if (draft.length !== baseRecords.length) return true
    return draft.some((r, i) => {
      const base = baseRecords[i]
      return base.status !== r.status || base.checkIn !== r.checkIn
    })
  }, [draft, baseRecords])

  // Brief §14: per-row marking. When marked absent/leave, clear check-in.
  const handleMark = (id: string, status: AttendanceStatus) => {
    setSubmitted(false) // any change invalidates prior submission
    setDraft((prev) => {
      const base = prev ?? baseRecords
      return base.map((r) => {
        if (r.id !== id) return r
        const checkIn = status === 'present'
          ? '08:30 AM'
          : status === 'late'
          ? '09:00 AM'
          : null
        return { ...r, status, checkIn }
      })
    })
  }

  // Brief §3 + §28: Mark All Present with lightweight confirmation.
  const handleMarkAllPresent = () => {
    setMarkAllConfirmOpen(false)
    setSubmitted(false)
    setDraft((prev) => {
      const base = prev ?? baseRecords
      return base.map((r) => ({ ...r, status: 'present' as AttendanceStatus, checkIn: '08:30 AM' }))
    })
    toast.success('All staff marked present', {
      description: 'Review and submit attendance to confirm.',
    })
  }

  // Brief §4: Submit Attendance — simulates submission (demo only).
  const handleSubmit = () => {
    if (!hasUnsavedChanges || submitting) return
    setSubmitting(true)
    // Simulate a network round-trip.
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      toast.success('Attendance submitted', {
        description: `${summary.present} present · ${summary.late} late · ${summary.absent} absent · ${summary.leave} leave`,
      })
    }, 800)
  }

  return (
    <PageTransition className="space-y-4">
      {/* Brief §2: Staff KPI cards with count-up + colored icon + tint */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_ORDER.map((status, i) => {
          const meta = STATUS_META[status]
          const Icon = meta.icon
          const value = summary[status]
          const tone = TONE_CLASSES[status]
          return (
            <motion.div
              key={status}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-xl border p-3 sm:p-4 transition-colors ${tone.bg} ${tone.border}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {meta.label}
                </span>
                <Icon className={`h-3.5 w-3.5 ${tone.text}`} />
              </div>
              <p className={`font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${tone.text}`}>
                <AnimatedCounter value={value} duration={0.7} />
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {summary.total > 0 ? ((value / summary.total) * 100).toFixed(1) : '0.0'}% of {summary.total} staff
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Brief §15: Filters — date picker FIXED (universal DatePicker) */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Universal DatePicker — replaces the broken Input[type=date] + absolute icon */}
          <DatePicker
            value={selectedDate}
            onChange={(v) => v && setSelectedDate(v)}
            compact
            className="w-[150px]"
          />

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

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff…"
              className="h-8 pl-8 pr-3 text-xs w-[200px]"
            />
          </div>

          {/* Brief §3: Mark All Present — soft action, not destructive */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setMarkAllConfirmOpen(true)}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all present
          </Button>
        </div>

        <span className="text-[10px] text-muted-foreground">
          {filtered.length} staff
        </span>
      </div>

      {/* Brief §13 + §14: Staff table */}
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

      {/* Brief §4 + §5 + §27: Submit bar */}
      <div ref={submitRef} className="flex items-center justify-between gap-3 flex-wrap pt-1">
        {/* Brief §5: Unsaved changes indicator */}
        <div className="flex items-center gap-2 text-xs">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.span
                key="submitted"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Attendance submitted
              </motion.span>
            ) : hasUnsavedChanges ? (
              <motion.span
                key="unsaved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Unsaved changes
              </motion.span>
            ) : (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-muted-foreground"
              >
                No pending changes
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Brief §4: Submit Attendance */}
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={!hasUnsavedChanges || submitting || submitted}
        >
          {submitting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Upload className="h-3.5 w-3.5" />
              </motion.span>
              Submitting…
            </>
          ) : submitted ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Submitted
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              Submit Attendance
            </>
          )}
        </Button>
      </div>

      {/* Brief §28: Mark All Present confirmation */}
      <AlertDialog open={markAllConfirmOpen} onOpenChange={setMarkAllConfirmOpen}>
        <AlertDialogContent className="max-w-sm p-0 gap-0">
          <AlertDialogHeader className="px-4 pt-4 pb-2">
            <AlertDialogTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCheck className="h-4 w-4 text-emerald-600" />
              Mark all staff as Present?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[10px]">
              This will overwrite the current attendance selections for all {baseRecords.length} staff members on this date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-4 py-3">
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleMarkAllPresent}
            >
              Mark all present
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
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
        <StatusBadge status={record.status} />
      </TableCell>
      <TableCell className="py-2.5 hidden sm:table-cell font-mono tabular-nums text-muted-foreground">
        {record.checkIn ?? '—'}
      </TableCell>
      <TableCell className="py-2.5">
        <div className="flex items-center justify-end gap-1">
          {STATUS_ORDER.map((status) => (
            <MarkButton
              key={status}
              id={record.id}
              status={status}
              current={record.status}
              onMark={onMark}
            />
          ))}
        </div>
      </TableCell>
    </motion.tr>
  )
}

/**
 * Brief §6: MarkButton with proper hover/press/selected states.
 * Selected state = filled semantic color (not just tiny icon change).
 */
function MarkButton({
  id, status, current, onMark,
}: {
  id: string
  status: AttendanceStatus
  current: AttendanceStatus
  onMark: (id: string, status: AttendanceStatus) => void
}) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  const isActive = current === status
  return (
    <button
      onClick={() => onMark(id, status)}
      title={`Mark ${meta.label}`}
      aria-label={`Mark ${meta.label}`}
      aria-pressed={isActive}
      className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all duration-150 ${
        isActive
          ? `${meta.bgFilled} border-transparent text-white shadow-sm`
          : `border-border bg-card text-muted-foreground hover:bg-muted/60 hover:${meta.text}`
      }`}
    >
      <Icon className="h-3 w-3" />
    </button>
  )
}
