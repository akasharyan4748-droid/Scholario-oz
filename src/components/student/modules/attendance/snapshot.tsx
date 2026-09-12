'use client'

/**
 * attendance/snapshot — the "How am I doing?" answer (brief §5–§7, §16, §24).
 *
 * One card, one hierarchy: the overall percentage is dominant (with a
 * subtle green progress arc — the STUDENT accent, never a "doing
 * well" wash), the four counted statuses sit beside it as quiet facts,
 * and today's status closes the card. No icon tiles, no repeated
 * percentage (§24) — every number derives from the canonical records via
 * computeStats, and the performance label comes from the SCHOOL'S
 * configured thresholds only.
 *
 * Colour = meaning (Student design system): the arc/ring carries the
 * green student identity; status colours stay semantic (green present,
 * amber late, rose absent, cyan leave).
 */

import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/shared/ui'
import type { AttendanceStats, StudentAttendanceRecord } from '@/lib/store/student-attendance-store'
import { COUNTED_STATUSES, statusToken, type DayKind } from './status-tokens'

export interface TodayStatus {
  kind: DayKind
  holidayName?: string
  record?: StudentAttendanceRecord
}

interface SnapshotProps {
  stats: AttendanceStats
  windowLabel: string
  thresholds: { excellent: number; needsAttention: number } | null
  today: TodayStatus
}

/** Subtle progress arc — green student accent, percent-proportional. */
function ProgressArc({ percent }: { percent: number }) {
  const size = 64
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const filled = Math.max(0, Math.min(100, percent)) / 100
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label={`Attendance progress: ${percent} percent`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-muted-foreground/15"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - filled)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  )
}

export function Snapshot({ stats, windowLabel, thresholds, today }: SnapshotProps) {
  // Performance label — ONLY from the school's configured policy (§7).
  const label =
    thresholds && stats.total > 0
      ? stats.percent >= thresholds.excellent
        ? 'Excellent'
        : stats.percent < thresholds.needsAttention
          ? 'Needs Attention'
          : 'Good'
      : null

  const todayToken = statusToken(today.kind)
  const TodayIcon = todayToken.icon

  return (
    <GlassCard hover={false} className="on-card p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-0">
        {/* ── Dominant: overall percentage + subtle green arc ─────────── */}
        <div className="lg:flex lg:min-w-[260px] lg:flex-col lg:justify-center lg:pr-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Overall · {windowLabel}
          </p>
          <div className="mt-2 flex items-center gap-4 sm:gap-5">
            <ProgressArc percent={stats.percent} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
                  {stats.percent}
                  <span className="ml-0.5 text-2xl font-semibold text-muted-foreground/70">%</span>
                </p>
                {label && (
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                      label === 'Excellent' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
                      label === 'Good' && 'border-sky-500/30 bg-sky-500/10 text-sky-700',
                      label === 'Needs Attention' && 'border-rose-500/30 bg-rose-500/10 text-rose-700',
                    )}
                  >
                    {label}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {stats.attended} of {stats.total} recorded school day{stats.total === 1 ? '' : 's'} attended
              </p>
            </div>
          </div>
          {thresholds && (
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/80">
              School policy: {thresholds.needsAttention}%+ required · {thresholds.excellent}%+ excellent
            </p>
          )}
        </div>

        {/* ── Quiet facts: the four counted statuses ── */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-border/70 lg:flex-1 lg:grid-cols-2 lg:border-l lg:pl-8">
          {COUNTED_STATUSES.map((s) => {
            const value = stats[s.kind]
            return (
              <div key={s.kind} className="flex items-center gap-2.5">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', s.dot)} aria-hidden />
                <div className="min-w-0">
                  <p className="text-xl font-bold tabular-nums leading-none text-foreground">{value}</p>
                  <p className={cn('mt-1 truncate text-[11px] font-medium', s.text)}>{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Today — the fastest answer (§46) ── */}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/70 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Today</span>
        <span
          className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', todayToken.chip)}
        >
          <TodayIcon className="h-3 w-3" aria-hidden />
          {today.record
            ? todayToken.label
            : today.kind === 'holiday'
              ? `${today.holidayName} — Holiday`
              : today.kind === 'weekend'
                ? 'Weekend — No School'
                : 'Not Recorded Yet'}
        </span>
        {today.record?.markedBy && (
          <span className="text-[11px] text-muted-foreground">Marked by {today.record.markedBy}</span>
        )}
      </div>
    </GlassCard>
  )
}
