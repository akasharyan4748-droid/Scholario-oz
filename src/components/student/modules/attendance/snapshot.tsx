'use client'

/**
 * attendance/snapshot — the "How am I doing?" hero (§20, gen 2, final
 * colour refinement).
 *
 * A mostly NEUTRAL warm surface (the zone reads as paper, not as green)
 * where colour carries meaning only:
 *   · the percentage + its arc stay EMERALD — the one primary positive
 *     metric (present/confirmed is green in the workspace philosophy)
 *   · the performance label follows the school's thresholds (Excellent
 *     emerald / Good sky / Needs Attention rose)
 *   · the four counted statuses follow as soft tinted fact tiles — each
 *     one meaningful colour (present emerald, late amber, absent rose,
 *     leave cyan), never decoration (§29)
 *   · policy appears as ONE compact chip (§27 — "95%+ Excellent", never
 *     the full sentence)
 *   · today closes the card: the fastest answer a student needs
 *
 * Every number derives from the canonical records via computeStats.
 */

import { CheckCircle2, Clock, Plane, Sun, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/shared/ui'
import type { AttendanceStats, StudentAttendanceRecord } from '@/lib/store/student-attendance-store'
import { statusToken, type DayKind } from './status-tokens'

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

/** Compact progress arc — emerald: attendance's primary positive metric. */
function ProgressArc({ percent }: { percent: number }) {
  const size = 68
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

/** The four counted statuses as soft tinted fact tiles (§20/§29). */
const FACTS: {
  kind: 'present' | 'late' | 'absent' | 'leave'
  icon: typeof CheckCircle2
  surface: string
  text: string
}[] = [
  { kind: 'present', icon: CheckCircle2, surface: 'border-emerald-500/25 bg-emerald-500/[0.08]', text: 'text-emerald-700' },
  { kind: 'late', icon: Clock, surface: 'border-amber-500/30 bg-amber-500/[0.09]', text: 'text-amber-700' },
  { kind: 'absent', icon: XCircle, surface: 'border-rose-500/25 bg-rose-500/[0.07]', text: 'text-rose-700' },
  { kind: 'leave', icon: Plane, surface: 'border-cyan-500/25 bg-cyan-500/[0.08]', text: 'text-cyan-700' },
]

export function Snapshot({ stats, windowLabel, thresholds, today }: SnapshotProps) {
  // Performance label — ONLY from the school's configured policy (§27).
  const label =
    thresholds && stats.total > 0
      ? stats.percent >= thresholds.excellent
        ? 'Excellent'
        : stats.percent < thresholds.needsAttention
          ? 'Needs Attention'
          : 'Good'
      : null

  const todayToken = statusToken(today.kind)
  const TodayIcon = today.record ? todayToken.icon : today.kind === 'weekend' ? Sun : todayToken.icon

  return (
    <GlassCard hover={false} className="on-card overflow-hidden p-0">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(250px,0.9fr)_1.35fr]">
        {/* ── The percentage — dominant, emerald, with its arc ───────── */}
        <div className="bg-amber-500/[0.04] p-5 sm:p-6 lg:border-r lg:border-border/70">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Overall · {windowLabel}
          </p>
          <div className="mt-2.5 flex items-center gap-4 sm:gap-5">
            <ProgressArc percent={stats.percent} />
            <div className="min-w-0">
              <p className="text-[2.9rem] font-bold leading-none tabular-nums tracking-tight text-primary sm:text-5xl">
                {stats.percent}
                <span className="ml-0.5 text-2xl font-semibold text-primary/55">%</span>
              </p>
              {label && (
                <span
                  className={cn(
                    'mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                    label === 'Excellent' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
                    label === 'Good' && 'border-sky-500/30 bg-sky-500/10 text-sky-700',
                    label === 'Needs Attention' && 'border-rose-500/30 bg-rose-500/10 text-rose-700',
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      label === 'Excellent' ? 'bg-emerald-500' : label === 'Good' ? 'bg-sky-500' : 'bg-rose-500',
                    )}
                    aria-hidden
                  />
                  {label}
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {stats.attended} of {stats.total} recorded school day{stats.total === 1 ? '' : 's'} attended
          </p>
          {/* Policy — one compact contextual chip, never the sentence (§27) */}
          {thresholds && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden />
                {thresholds.excellent}%+ Excellent
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" aria-hidden />
                School threshold · {thresholds.needsAttention}%
              </span>
            </div>
          )}
        </div>

        {/* ── The counted statuses — soft tinted fact tiles ───────────── */}
        <div className="grid grid-cols-2 items-stretch gap-2.5 p-5 sm:grid-cols-4 sm:p-6 lg:grid-cols-2 xl:grid-cols-4">
          {FACTS.map((f) => {
            const value = stats[f.kind]
            const Icon = f.icon
            return (
              <div key={f.kind} className={cn('flex flex-col justify-between rounded-xl border px-3.5 py-3', f.surface)}>
                <div className="flex items-center justify-between gap-1.5">
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', f.text)} aria-hidden />
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusToken(f.kind).dot)} aria-hidden />
                </div>
                <p className={cn('mt-2.5 text-2xl font-bold leading-none tabular-nums tracking-tight', f.text)}>{value}</p>
                <p className="mt-1 text-[11px] font-semibold text-foreground/70">{statusToken(f.kind).label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Today — the fastest answer (§50) ── */}
      <div className="mt-0 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/70 bg-muted/[0.15] px-5 py-3.5">
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
