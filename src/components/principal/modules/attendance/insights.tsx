'use client'

/**
 * AttendanceInsights — Best/Needs/Average cards + Live Class Snapshot.
 *
 * Brief §11 (Phase 2): Live Class Snapshot behavior is context-aware:
 *   - All Classes selected → LIVE CLASS OVERVIEW (top 4-6 class summaries)
 *   - Specific class selected → LIVE CLASS SNAPSHOT for that class's roster
 *
 * Brief §12: snapshot shows real-time status counts at the top, then grid.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { TrendingUp, UserX, CalendarCheck, UserCheck, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import {
  classSections,
  attendanceOverview,
  type ClassSection,
} from '@/lib/mock/attendance'
import { classList, school } from '@/lib/mock/school'
import { formatNumber } from '@/lib/format'
import { ATTENDANCE_PALETTE } from './attendance-charts'
import { STATUS_META } from './attendance-status'

export function AttendanceInsights({
  classFilter,
  onViewAllClasses,
}: {
  classFilter: string
  onViewAllClasses?: () => void
}) {
  return (
    <>
      {/* Three compact insight cards (Brief §12 — Phase 1 preserved) */}
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

      {/* Live Class Snapshot — context-aware (Brief §11) */}
      {classFilter === 'all' ? (
        <LiveClassOverview sections={classSections} onViewAll={onViewAllClasses} />
      ) : (
        <LiveClassRoster section={classSections.find((c) => c.id === classFilter) ?? null} />
      )}
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
        <p className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">{value}</p>
        <span className="font-display text-sm font-bold tabular-nums shrink-0" style={{ color }}>{rate}%</span>
      </div>
      <p className="text-[10px] text-muted-foreground mb-2 truncate">{sub}</p>
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
   LiveClassOverview — Brief §11: when "All Classes" is selected
   show top 4-6 class summaries, then "View all classes →" CTA.
   ────────────────────────────────────────────────────────── */
function LiveClassOverview({
  sections, onViewAll,
}: {
  sections: ClassSection[]
  onViewAll?: () => void
}) {
  const reduce = useReducedMotion()
  // Sort by rate desc, show top 6
  const topSections = [...sections].sort((a, b) => b.rate - a.rate).slice(0, 6)

  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary shrink-0" />
            Live Class Overview
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            Top {topSections.length} classes by attendance rate · {sections.length} total
          </p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[11px] font-semibold text-primary hover:underline underline-offset-2 flex items-center gap-1 transition-colors"
          >
            View all classes
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {topSections.map((s, i) => (
          <motion.div
            key={s.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.3 }}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.teacher}</p>
              </div>
              <span className="font-display text-sm font-bold tabular-nums" style={{
                color: s.rate >= 95 ? ATTENDANCE_PALETTE.present
                  : s.rate >= 90 ? ATTENDANCE_PALETTE.late
                  : ATTENDANCE_PALETTE.absent,
              }}>
                {s.rate}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted/60 overflow-hidden mb-2">
              <motion.div
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${s.rate}%` }}
                transition={{ duration: 0.6, delay: Math.min(i * 0.05, 0.3) + 0.1 }}
                className="h-full rounded-full"
                style={{
                  background: s.rate >= 95 ? ATTENDANCE_PALETTE.present
                    : s.rate >= 90 ? ATTENDANCE_PALETTE.late
                    : ATTENDANCE_PALETTE.absent,
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span><span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{s.present}</span> present</span>
              <span className="text-muted-foreground/40">·</span>
              <span><span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{s.late}</span> late</span>
              <span className="text-muted-foreground/40">·</span>
              <span><span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">{s.absent}</span> absent</span>
              <span className="text-muted-foreground/40">·</span>
              <span><span className="font-semibold text-sky-600 dark:text-sky-400 tabular-nums">{s.leave}</span> leave</span>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ──────────────────────────────────────────────────────────
   LiveClassRoster — Brief §11: specific class selected → show
   that class's full roster in a compact grid.
   Brief §12: status counts at top, then student grid.
   ────────────────────────────────────────────────────────── */
function LiveClassRoster({ section }: { section: ClassSection | null }) {
  const reduce = useReducedMotion()

  if (!section) {
    return (
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <p className="text-xs text-muted-foreground text-center py-8">
          No roster available for this class.
        </p>
      </GlassCard>
    )
  }

  const rate = section.total > 0
    ? +((section.present / section.total) * 100).toFixed(1)
    : 0

  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary shrink-0" />
            Live Class Snapshot — {section.name}
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
            Today's roster · {section.total} students · {section.teacher} (Class Teacher)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-[10px]">
            <StatusPill label="Present" count={section.present} status="present" />
            <StatusPill label="Late" count={section.late} status="late" />
            <StatusPill label="Absent" count={section.absent} status="absent" />
            <StatusPill label="Leave" count={section.leave} status="leave" />
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold">
            {rate}% present
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-1.5 sm:gap-2">
        {section.roster.map((s, i) => {
          const meta = STATUS_META[s.status]
          return (
            <motion.div
              key={`${s.rollNo}-${i}`}
              initial={reduce ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.3 }}
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
  label, count, status,
}: {
  label: string
  count: number
  status: 'present' | 'late' | 'absent' | 'leave'
}) {
  const meta = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 ${meta.bg} ${meta.border} ${meta.text}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      <span className="font-medium">{label}</span>
      <span className="font-bold tabular-nums">{count}</span>
    </span>
  )
}
