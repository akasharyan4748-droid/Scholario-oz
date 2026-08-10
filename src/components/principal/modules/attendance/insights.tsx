'use client'

/**
 * AttendanceInsights — bottom-of-page highlight cards + Live Class Snapshot.
 *
 * Brief section 12: Best Performing / Needs Attention / School Average
 *   - compact, balanced, micro-progress (NOT oversized progress bars)
 *
 * Brief section 13: Live Class Snapshot
 *   - compact student tiles, easy scanning
 *   - subtle hover feedback
 *   - keep the existing status system (PRESENT / ABSENT / LATE / LEAVE)
 *   - use the real class2AAttendance roster (Brief section 29: no fabrication)
 */

import { motion, useReducedMotion } from 'framer-motion'
import { TrendingUp, UserX, CalendarCheck, UserCheck } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { class2AAttendance } from '@/lib/mock/attendance'
import { classList, school } from '@/lib/mock/school'
import { formatNumber } from '@/lib/format'
import { ATTENDANCE_PALETTE } from './attendance-charts'

const STATUS_META = {
  present: { label: 'Present', color: ATTENDANCE_PALETTE.present, bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/30' },
  late:    { label: 'Late',    color: ATTENDANCE_PALETTE.late,    bg: 'bg-amber-500/10',    text: 'text-amber-700 dark:text-amber-300',    border: 'border-amber-500/30' },
  absent:  { label: 'Absent',  color: ATTENDANCE_PALETTE.absent,  bg: 'bg-rose-500/10',     text: 'text-rose-700 dark:text-rose-300',     border: 'border-rose-500/30' },
  leave:   { label: 'Leave',   color: ATTENDANCE_PALETTE.leave,  bg: 'bg-sky-500/10',      text: 'text-sky-700 dark:text-sky-300',        border: 'border-sky-500/30' },
} as const

export function AttendanceInsights() {
  return (
    <>
      {/* Brief 12: three compact, balanced cards with micro-progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <InsightCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          title="Best Performing Class"
          value="Nursery"
          rate={96.8}
          color={ATTENDANCE_PALETTE.present}
          sub="96.8% · 48 students"
        />
        <InsightCard
          icon={<UserX className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
          title="Needs Attention"
          value="Class 12"
          rate={88.8}
          color={ATTENDANCE_PALETTE.absent}
          sub="88.8% · 86 students"
        />
        <InsightCard
          icon={<CalendarCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
          title="School Average"
          value="93.3%"
          rate={93.3}
          color={ATTENDANCE_PALETTE.late}
          sub={`${classList.length} classes · ${formatNumber(school.totalStudents)} students`}
        />
      </div>

      {/* Brief 13: Live Class Snapshot */}
      <LiveClassSnapshot />
    </>
  )
}

/* ──────────────────────────────────────────────────────────
   InsightCard — compact card with thin micro-progress
   ────────────────────────────────────────────────────────── */
function InsightCard({
  icon, title, value, rate, color, sub,
}: {
  icon: React.ReactNode
  title: string
  value: string
  rate: number
  color: string
  sub: string
}) {
  const reduce = useReducedMotion()
  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</h4>
      </div>
      <div className="flex items-end justify-between gap-2 mb-2.5">
        <p className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <span className="font-display text-sm font-bold tabular-nums" style={{ color }}>{rate}%</span>
      </div>
      <p className="text-[10px] text-muted-foreground mb-2">{sub}</p>
      {/* Micro-progress: 2px thin track, no shimmer */}
      <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </GlassCard>
  )
}

/* ──────────────────────────────────────────────────────────
   LiveClassSnapshot — compact student tiles
   Brief 13: keep PRESENT / ABSENT / LATE / LEAVE system
   ────────────────────────────────────────────────────────── */
function LiveClassSnapshot() {
  const reduce = useReducedMotion()

  // Compute live stats from real roster (Brief 29)
  const total = class2AAttendance.length
  const present = class2AAttendance.filter((s) => s.status === 'present').length
  const late = class2AAttendance.filter((s) => s.status === 'late').length
  const absent = class2AAttendance.filter((s) => s.status === 'absent').length
  const leave = class2AAttendance.filter((s) => s.status === 'leave').length
  const rate = Math.round((present / total) * 1000) / 10

  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary shrink-0" />
            Live Class Snapshot — Class 2-A
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            Today's roster · {total} students · Rohan Mehta (Class Teacher)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Compact status legend */}
          <div className="flex items-center gap-2 text-[10px]">
            <StatusPill label="Present" count={present} meta={STATUS_META.present} />
            <StatusPill label="Late" count={late} meta={STATUS_META.late} />
            <StatusPill label="Absent" count={absent} meta={STATUS_META.absent} />
            <StatusPill label="Leave" count={leave} meta={STATUS_META.leave} />
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold">
            {rate}% present
          </Badge>
        </div>
      </div>

      {/* Compact student tiles — 9 cols on lg, denser on smaller screens */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-1.5 sm:gap-2">
        {class2AAttendance.map((s, i) => {
          const meta = STATUS_META[s.status]
          return (
            <motion.div
              key={`${s.rollNo}-${i}`}
              initial={reduce ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.3 }}
              whileHover={!reduce ? { scale: 1.04, y: -1 } : undefined}
              title={`${s.name} · ${meta.label}`}
              className={`rounded-lg border p-1.5 text-center cursor-default transition-colors ${meta.bg} ${meta.border} ${meta.text}`}
            >
              <p className="text-[9px] font-mono opacity-70 tabular-nums">#{s.rollNo}</p>
              <p className="text-[10px] font-semibold truncate leading-tight mt-0.5">{s.name.split(' ')[0]}</p>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}

function StatusPill({
  label, count, meta,
}: {
  label: string
  count: number
  meta: { label: string; color: string; bg: string; text: string; border: string }
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 ${meta.bg} ${meta.border} ${meta.text}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      <span className="font-medium">{label}</span>
      <span className="font-bold tabular-nums">{count}</span>
    </span>
  )
}
