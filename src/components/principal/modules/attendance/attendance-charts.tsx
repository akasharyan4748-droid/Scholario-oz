'use client'

/**
 * attendance-charts — Attendance-specific premium chart components.
 *
 * These are scoped to the Attendance module so we don't disturb the shared
 * chart infrastructure used by other modules (Dashboard, Finance, etc.).
 *
 * Design principles (Brief sections 5–11, 15, 22):
 *  - Smooth line/area trends instead of giant bars
 *  - Compact ring with restrained palette
 *  - Compact ranking tracks instead of horizontal bar chart
 *  - Restrained tooltips — one consistent design
 *  - Subtle 400–700ms reveal animations; respects prefers-reduced-motion
 */

import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { formatNumber } from '@/lib/format'

/* ──────────────────────────────────────────────────────────
   Shared attendance palette — one consistent semantic system
   Brief section 23: green/teal/amber/rose. No rainbow.
   ────────────────────────────────────────────────────────── */
export const ATTENDANCE_PALETTE = {
  present: 'oklch(0.65 0.16 162)',  // emerald
  late:    'oklch(0.75 0.15 75)',   // amber
  absent:  'oklch(0.62 0.2 25)',    // rose
  leave:   'oklch(0.65 0.13 220)',  // blue-teal
  trend:   'oklch(0.6 0.14 200)',   // teal-blue (neutral info)
  monthly: 'oklch(0.55 0.14 162)',  // emerald (improvement signal)
} as const

/* ──────────────────────────────────────────────────────────
   AttendanceTooltip — one consistent tooltip for all charts
   Brief section 22: white/translucent, subtle shadow, small radius,
   clear label, strong value, minimal supporting info.
   ────────────────────────────────────────────────────────── */
interface AttendanceTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
  /** Suffix appended to the value (e.g. "%"). */
  valueSuffix?: string
  /** Label shown above value (e.g. "Attendance"). */
  valueLabel?: string
  /** Optional secondary lines: [{ label, value, color }]. */
  extra?: { label: string; value: string; color?: string }[]
}

export function AttendanceTooltip({
  active, payload, label, valueSuffix = '%', valueLabel = 'Attendance', extra,
}: AttendanceTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  const v = typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value
  const color = entry.color || ATTENDANCE_PALETTE.trend

  return (
    <div
      className="pointer-events-none rounded-lg border border-border bg-popover/95 backdrop-blur-md shadow-lg shadow-black/5 min-w-[140px]"
      role="tooltip"
    >
      {label != null && (
        <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
          {label}
        </div>
      )}
      <div className="px-2.5 py-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-muted-foreground truncate">{valueLabel}</span>
          </span>
          <span className="font-display font-bold tabular-nums">{v}{valueSuffix}</span>
        </div>
        {extra && extra.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-1">
            {extra.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-[10px]">
                <span className="flex items-center gap-1.5 min-w-0">
                  {e.color && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: e.color }} />}
                  <span className="text-muted-foreground truncate">{e.label}</span>
                </span>
                <span className="font-medium tabular-nums">{e.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   TrendLine — smooth line + subtle area fill for % trends
   Brief section 6 + 7: replaces giant BarTrend for weekly/monthly.
   ────────────────────────────────────────────────────────── */
interface TrendLineProps {
  data: any[]
  xKey: string
  yKey: string
  color?: string
  height?: number
  /** Domain for Y-axis (defaults to [80, 100] for attendance %). */
  yDomain?: [number, number] | 'auto'
  /** Optional average reference line value. */
  averageValue?: number
  /** Suffix for tooltip values (e.g. "%"). */
  valueSuffix?: string
}

export function TrendLine({
  data, xKey, yKey,
  color = ATTENDANCE_PALETTE.trend,
  height = 220,
  yDomain = [80, 100],
  averageValue,
  valueSuffix = '%',
}: TrendLineProps) {
  const uid = useId().replace(/:/g, '')
  const gid = `trend-${uid}`
  const reduce = useReducedMotion()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="60%" stopColor={color} stopOpacity={0.10} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} opacity={0.45} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          domain={yDomain === 'auto' ? ['auto', 'auto'] : yDomain}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v) => `${v}%`}
          tickCount={3}
        />
        <Tooltip
          content={<AttendanceTooltip valueSuffix={valueSuffix} />}
          cursor={{ stroke: color, strokeOpacity: 0.3, strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        {/* Average reference line */}
        {averageValue != null && (
          <Line
            type="monotone"
            dataKey={() => averageValue}
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
            name="__avg"
          />
        )}
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2.25}
          fill={`url(#${gid})`}
          isAnimationActive={!reduce}
          animationDuration={650}
          animationEasing="ease-out"
          activeDot={{
            r: 4,
            stroke: color,
            strokeWidth: 2,
            fill: 'var(--popover)',
          }}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ──────────────────────────────────────────────────────────
   CompactRing — refined segmented ring for Today's Breakdown
   Brief section 5: compact, center value focal, small aligned legend.
   ────────────────────────────────────────────────────────── */
interface CompactRingProps {
  data: { name: string; value: number; color: string }[]
  centerValue: string
  centerLabel?: string
  size?: number
}

export function CompactRing({
  data, centerValue, centerLabel, size = 160,
}: CompactRingProps) {
  // Recharts Pie with innerRadius to render a segmented ring.
  // We use small paddingAngle for clean separation.
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()

  // Pre-compute totals for legend
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChartForRing data={data} reduce={reduce} />
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
            {centerValue}
          </span>
          {centerLabel && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {centerLabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0
          return <RingLegendRow key={d.name} name={d.name} value={d.value} pct={pct} color={d.color} />
        })}
      </div>
    </div>
  )
}

/** Recharts Pie rendered directly — single chart per ring. */
function PieChartForRing({ data, reduce }: { data: any[]; reduce: boolean | null }) {
  return (
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        innerRadius="68%"
        outerRadius="100%"
        paddingAngle={2}
        cornerRadius={6}
        stroke="none"
        isAnimationActive={!reduce}
        animationDuration={650}
        animationEasing="ease-out"
      >
        {data.map((entry: any, i: number) => (
          <Cell key={i} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip content={<AttendanceTooltip valueSuffix="" valueLabel="Students" />} />
    </PieChart>
  )
}

function RingLegendRow({ name, value, pct, color }: {
  name: string
  value: number
  pct: number
  color: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-muted-foreground truncate">{name}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0 tabular-nums">
        <span className="font-display font-semibold text-foreground">{formatNumber(value)}</span>
        <span className="text-[10px] text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
      </span>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   RankingList — compact class-wise attendance ranking
   Brief section 8: thin elegant progress tracks, not giant bars.
   Each row: class name, %, thin progress track, status badge.
   ────────────────────────────────────────────────────────── */
interface RankingRow {
  name: string
  value: number
}
interface RankingListProps {
  data: RankingRow[]
  /** Max rows visible before "View all" CTA. Default 8. */
  maxRows?: number
  /** Threshold for "Excellent" status. Default 95. */
  excellentThreshold?: number
  /** Threshold for "Good" status. Default 90. */
  goodThreshold?: number
}

export function RankingList({
  data, maxRows = 8, excellentThreshold = 95, goodThreshold = 90,
}: RankingListProps) {
  const [expanded, setExpanded] = useState(false)
  const reduce = useReducedMotion()
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const visible = expanded ? sorted : sorted.slice(0, maxRows)
  const hidden = sorted.length - visible.length

  return (
    <div className="space-y-2.5">
      {visible.map((row, i) => {
        const pct = Math.round(row.value * 10) / 10
        const isExcellent = pct >= excellentThreshold
        const isGood = pct >= goodThreshold
        const color = isExcellent
          ? ATTENDANCE_PALETTE.present
          : isGood
          ? ATTENDANCE_PALETTE.late
          : ATTENDANCE_PALETTE.absent
        const status = isExcellent ? 'Excellent' : isGood ? 'Good' : 'Needs Attention'

        return (
          <motion.div
            key={row.name}
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
            className="group flex items-center gap-3"
          >
            <span className="text-xs font-mono text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
            <span className="text-xs font-medium text-foreground w-20 sm:w-24 truncate">{row.name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: Math.min(i * 0.04, 0.3) + 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
            <span className="text-xs font-display font-semibold tabular-nums text-foreground w-12 text-right">{pct}%</span>
            <span className={`text-[10px] font-medium w-20 sm:w-24 text-right ${
              isExcellent ? 'text-emerald-600 dark:text-emerald-400'
              : isGood ? 'text-amber-600 dark:text-amber-400'
              : 'text-rose-600 dark:text-rose-400'
            }`}>{status}</span>
          </motion.div>
        )
      })}
      {hidden > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-[11px] font-medium text-primary hover:underline underline-offset-2 transition-colors"
        >
          View all {sorted.length} classes
        </button>
      )}
      {expanded && sorted.length > maxRows && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Show top {maxRows}
        </button>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   InsightBadge — small derived trend insight
   Brief section 7: Stable / Improving / Declining from real data.
   ────────────────────────────────────────────────────────── */
export function deriveTrendInsight(values: number[]): {
  label: 'Improving' | 'Declining' | 'Stable'
  variant: 'success' | 'warning' | 'neutral'
  delta: number
} {
  if (values.length < 2) return { label: 'Stable', variant: 'neutral', delta: 0 }
  const first = values[0]
  const last = values[values.length - 1]
  const delta = +(last - first).toFixed(1)
  if (delta >= 0.5) return { label: 'Improving', variant: 'success', delta }
  if (delta <= -0.5) return { label: 'Declining', variant: 'warning', delta }
  return { label: 'Stable', variant: 'neutral', delta }
}

export function InsightBadge({ insight }: { insight: ReturnType<typeof deriveTrendInsight> }) {
  const cls = insight.variant === 'success'
    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
    : insight.variant === 'warning'
    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
    : 'bg-muted text-muted-foreground border-border'
  const arrow = insight.delta > 0 ? '↑' : insight.delta < 0 ? '↓' : '—'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      <span className="tabular-nums">{arrow} {Math.abs(insight.delta)}%</span>
      <span className="opacity-80">· {insight.label}</span>
    </span>
  )
}
