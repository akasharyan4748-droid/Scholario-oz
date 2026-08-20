'use client'

/**
 * fees-charts — Small, premium, information-dense charts for Fee Management.
 *
 * All charts use the same underlying analytics data — no decorative visuals.
 *
 * - MiniAreaChart   — collection trend (small line/area)
 * - MiniDonut       — fee head distribution / payment mode mix
 * - MiniRadial      — collection rate donut with center number
 * - MiniBars        — class-wise / aging bars
 * - Sparkline       — inline trend
 *
 * Premium visual language:
 *   - subtle borders
 *   - rounded containers
 *   - smooth animation
 *   - hover tooltips
 *   - hover interactions
 */

import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/format'

// ─── MiniAreaChart (collection trend) ───────────────────────────────

interface AreaProps {
  data: Array<{ month: string; collected: number; pending?: number }>
  height?: number
  format?: (n: number) => string
}

export function MiniAreaChart({ data, height = 120, format = (n) => formatINR(n, true) }: AreaProps) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.collected), 1)
  const w = 100
  const h = height
  const pad = 8
  const points = data.map((d, i) => ({
    x: pad + (i / Math.max(1, data.length - 1)) * (w - 2 * pad),
    y: h - pad - (d.collected / max) * (h - 2 * pad),
    d,
  }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const areaPath = `${path} L${points[points.length - 1].x.toFixed(2)},${h - pad} L${points[0].x.toFixed(2)},${h - pad} Z`
  const uid = 'area' + Math.random().toString(36).slice(2, 7)

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.14 162)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="oklch(0.55 0.14 162)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-stroke`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.55 0.14 162)" />
            <stop offset="100%" stopColor="oklch(0.6 0.16 200)" />
          </linearGradient>
        </defs>
        {/* horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={pad} x2={w - pad} y1={pad + (h - 2 * pad) * p} y2={pad + (h - 2 * pad) * p}
            stroke="currentColor" className="text-muted-foreground/10" strokeWidth={0.2} strokeDasharray="0.5 0.5" />
        ))}
        <motion.path
          d={areaPath}
          fill={`url(#${uid}-fill)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke={`url(#${uid}-stroke)`}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        {/* hover dots */}
        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - 4} y={0} width={8} height={h} fill="transparent"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            />
            <circle
              cx={p.x} cy={p.y} r={hover === i ? 2 : 1.2}
              fill={hover === i ? 'oklch(0.55 0.14 162)' : 'white'}
              stroke="oklch(0.55 0.14 162)" strokeWidth={1}
              className="transition-all"
            />
          </g>
        ))}
      </svg>
      {/* x-axis labels */}
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[8px] text-muted-foreground/60 pointer-events-none">
        {data.map((d, i) => (
          <span key={i}>{d.month}</span>
        ))}
      </div>
      {/* tooltip */}
      {hover !== null && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 pointer-events-none rounded-md bg-popover border border-border shadow-md px-2 py-1 text-[10px] -translate-x-1/2"
          style={{ left: `${(points[hover].x / w) * 100}%`, top: 0 }}
        >
          <p className="font-semibold">{data[hover].month}</p>
          <p className="text-emerald-600 tabular-nums">{format(data[hover].collected)}</p>
        </motion.div>
      )}
    </div>
  )
}

// ─── MiniDonut ──────────────────────────────────────────────────────

interface DonutProps {
  data: Array<{ name: string; value: number; color: string }>
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
  onSelect?: (name: string) => void
}

export function MiniDonut({ data, size = 140, thickness = 16, centerLabel, centerValue, onSelect }: DonutProps) {
  const [hover, setHover] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  // Compute segment offsets via cumulative reduce — the accumulator is the running offset.
  const segmentData = useMemo(() => {
    const computed = data.map((d, i) => ({
      ...d,
      pct: total > 0 ? d.value / total : 0,
      index: i,
    }))
    // Prefix sums of dashArray (cumulative offset)
    const offsets = computed.map((c) => circumference * c.pct)
    const cumulative: number[] = []
    let acc = 0
    for (const o of offsets) { cumulative.push(acc); acc += o }
    return computed.map((c, i) => ({
      ...c,
      dashArray: circumference * c.pct,
      dashOffset: circumference - cumulative[i],
    }))
  }, [data, total, circumference])

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth={thickness} />
          {segmentData.map((s) => (
            <motion.circle
              key={s.name}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === s.index || selected === s.index ? thickness + 3 : thickness}
              strokeDasharray={s.dashArray}
              strokeDashoffset={-s.dashOffset + circumference}
              strokeLinecap="butt"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHover(s.index)}
              onMouseLeave={() => setHover(null)}
              onClick={() => { setSelected(selected === s.index ? null : s.index); onSelect?.(s.name) }}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: -s.dashOffset + circumference }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: s.index * 0.05 }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hover !== null ? (
            <>
              <p className="text-[10px] text-muted-foreground font-medium">{data[hover].name}</p>
              <p className="text-sm font-bold tabular-nums">{formatINR(data[hover].value, true)}</p>
              <p className="text-[9px] text-muted-foreground">{((data[hover].value / total) * 100).toFixed(1)}%</p>
            </>
          ) : (
            <>
              {centerValue && <p className="text-base font-bold tabular-nums">{centerValue}</p>}
              {centerLabel && <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{centerLabel}</p>}
            </>
          )}
        </div>
      </div>
      {/* Legend */}
      <div className="flex-1 space-y-1 min-w-0">
        {data.map((d, i) => (
          <button
            key={d.name}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => { setSelected(selected === i ? null : i); onSelect?.(d.name) }}
            className={cn('w-full flex items-center gap-2 px-1.5 py-0.5 rounded-md transition-colors', selected === i && 'bg-muted/60')}
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-[10px] font-medium truncate flex-1 text-left">{d.name}</span>
            <span className="text-[10px] tabular-nums text-muted-foreground">{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── MiniRadial (single-value progress) ─────────────────────────────

interface RadialProps {
  value: number
  max?: number
  size?: number
  thickness?: number
  color?: string
  label?: string
  suffix?: string
}

export function MiniRadial({ value, max = 100, size = 120, thickness = 10, color = 'oklch(0.55 0.14 162)', label, suffix = '%' }: RadialProps) {
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  const dashOffset = circumference * (1 - pct)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth={thickness} />
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg font-bold tabular-nums"
        >
          {Math.round(value)}{suffix}
        </motion.p>
        {label && <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>}
      </div>
    </div>
  )
}

// ─── MiniBars (class-wise / aging) ──────────────────────────────────

interface BarsProps {
  data: Array<{ label: string; value: number; secondary?: number; color?: string }>
  format?: (n: number) => string
  height?: number
  showSecondary?: boolean
}

export function MiniBars({ data, format = (n) => formatINR(n, true), height = 100, showSecondary }: BarsProps) {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.secondary ?? 0)), 1)
  return (
    <div className="space-y-1.5" style={{ minHeight: height }}>
      {data.map((d, i) => (
        <div key={i} className="space-y-0.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground font-medium truncate">{d.label}</span>
            <span className="tabular-nums font-semibold">{format(d.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/40 overflow-hidden relative">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: d.color ?? 'oklch(0.55 0.14 162)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
            />
            {showSecondary && d.secondary !== undefined && (
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/30"
                initial={{ width: 0 }}
                animate={{ width: `${(d.secondary / max) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 + 0.1 }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Sparkline ──────────────────────────────────────────────────────

export function Sparkline({ data, color = 'oklch(0.55 0.14 162)', height = 24, width = 60 }: { data: number[]; color?: string; height?: number; width?: number }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
