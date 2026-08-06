'use client'

/* ============================================================
   charts/legacy-bar.tsx
   Recharts-based premium bar charts.
   - BarTrend   : rounded gradient column / bar chart with
                  optional value labels, per-bar highlight & glow
   - GroupedBar : premium multi-series grouped columns for
                  side-by-side comparison (e.g. budget vs actual)
   ============================================================ */

import { useId } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { AXIS_TICK, formatAxisTick } from './colors'
import { PremiumTooltip, GlowFilter } from './utils'

/* ============================================================
   BarTrend — premium rounded gradient column / bar chart
   with optional value labels, per-bar highlight & stronger glow
   ============================================================ */
interface BarTrendProps {
  data: any[]
  xKey: string
  yKey: string
  color?: string
  height?: number
  horizontal?: boolean
  /** Show value labels above each bar */
  showLabels?: boolean
  /** Compact value formatter for labels (e.g. 12.8M). Defaults to smart K/M. */
  labelFormat?: (v: number) => string
}

export function BarTrend({
  data,
  xKey,
  yKey,
  color = 'oklch(0.55 0.14 162)',
  height = 240,
  horizontal,
  showLabels = false,
  labelFormat = formatAxisTick,
}: BarTrendProps) {
  const uid = useId().replace(/:/g, '')
  const gid = `bar-${uid}`
  const glowId = `bar-glow-${uid}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: showLabels && !horizontal ? 24 : 10, right: 14, left: horizontal ? 24 : -16, bottom: 0 }}>
        <defs>
          {horizontal ? (
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          ) : (
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="60%" stopColor={color} stopOpacity={0.78} />
              <stop offset="100%" stopColor={color} stopOpacity={0.3} />
            </linearGradient>
          )}
          <linearGradient id={`${gid}-hover`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.5} />
          </linearGradient>
          <GlowFilter id={glowId} intensity={4} />
        </defs>
        <CartesianGrid
          strokeDasharray="4 6"
          stroke="var(--border)"
          vertical={horizontal}
          horizontal={!horizontal}
          opacity={0.5}
        />
        {horizontal ? (
          <>
            <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={formatAxisTick} tickCount={5} />
            <YAxis type="category" dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} width={84} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={42} tickFormatter={formatAxisTick} tickCount={5} />
          </>
        )}
        <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.35, radius: 8 }} />
        <Bar
          dataKey={yKey}
          fill={`url(#${gid})`}
          radius={horizontal ? [0, 10, 10, 0] : [10, 10, 4, 4]}
          maxBarSize={48}
          isAnimationActive
          animationDuration={950}
          animationEasing="ease-out"
          label={showLabels ? ({ x, y, width, value }: any) => {
            const cx = x + width / 2
            return (
              <text x={cx} y={y - 8} textAnchor="middle" className="bar-value-label">
                {labelFormat(Number(value))}
              </text>
            )
          } : undefined}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#${gid})`} />
          ))}
        </Bar>
      </BarChart>
      <style jsx>{`
        .bar-value-label {
          font-size: 11px;
          font-weight: 600;
          fill: var(--foreground);
          font-variant-numeric: tabular-nums;
          opacity: 0.85;
        }
      `}</style>
    </ResponsiveContainer>
  )
}

/* ============================================================
   GroupedBar — premium multi-series grouped columns
   for side-by-side comparison (e.g. budget vs actual)
   ============================================================ */
interface GroupedBarProps {
  data: any[]
  xKey: string
  series: { key: string; name: string; color: string }[]
  height?: number
  showLabels?: boolean
  labelFormat?: (v: number) => string
}

export function GroupedBar({
  data,
  xKey,
  series,
  height = 260,
  showLabels = false,
  labelFormat = formatAxisTick,
}: GroupedBarProps) {
  const uid = useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: showLabels ? 28 : 12, right: 14, left: -16, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grp-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={1} />
              <stop offset="60%" stopColor={s.color} stopOpacity={0.78} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.3} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="4 6" stroke="var(--border)" vertical={false} opacity={0.5} />
        <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={42} tickFormatter={formatAxisTick} tickCount={5} />
        <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.35, radius: 8 }} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-muted-foreground">{value}</span>}
        />
        {series.map((s, idx) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={`url(#grp-${uid}-${s.key})`}
            radius={[8, 8, 3, 3]}
            maxBarSize={36}
            isAnimationActive
            animationDuration={950}
            animationEasing="ease-out"
            animationBegin={idx * 100}
            label={showLabels ? ({ x, y, width, value }: any) => {
              const cx = x + width / 2
              return (
                <text x={cx} y={y - 8} textAnchor="middle" className="grp-bar-label">
                  {labelFormat(Number(value))}
                </text>
              )
            } : undefined}
          />
        ))}
      </BarChart>
      <style jsx>{`
        .grp-bar-label {
          font-size: 10px;
          font-weight: 600;
          fill: var(--foreground);
          font-variant-numeric: tabular-nums;
          opacity: 0.75;
        }
      `}</style>
    </ResponsiveContainer>
  )
}
