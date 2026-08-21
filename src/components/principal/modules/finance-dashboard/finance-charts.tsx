'use client'

/**
 * finance-charts — Premium chart visualizations for the Finance Dashboard.
 *
 * - DualAreaChart   — Revenue vs Expenses smooth dual-line with area fill
 * - HorizontalBars  — Expense breakdown / budget comparison
 * - GroupedBars     — Quarterly revenue vs expenses
 * - CashFlowChart   — Monthly cash in/out smooth chart
 * - MiniDonut        — Clean donut with "Other" grouping (used sparingly)
 */

import { motion } from 'framer-motion'
import { useState, useMemo, useId } from 'react'
import { cn } from '@/lib/utils'
import { formatINR } from '@/lib/format'

// ─── DualAreaChart (Revenue vs Expenses) ────────────────────────────

interface DualAreaProps {
  data: Array<{ month: string; revenue: number; expense: number; surplus?: number }>
  height?: number
  format?: (n: number) => string
}

export function DualAreaChart({ data, height = 180, format = (n) => formatINR(n, true) }: DualAreaProps) {
  const [hover, setHover] = useState<number | null>(null)
  const uid = useId().replace(/:/g, '')

  const max = Math.max(...data.flatMap((d) => [d.revenue, d.expense]), 1)
  const w = 100
  const h = height
  const pad = 12

  const revPoints = data.map((d, i) => ({
    x: pad + (i / Math.max(1, data.length - 1)) * (w - 2 * pad),
    yRev: h - pad - (d.revenue / max) * (h - 2 * pad),
    yExp: h - pad - (d.expense / max) * (h - 2 * pad),
    d,
  }))

  // Build smooth Catmull-Rom → Bezier paths for revenue and expense.
  const smoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length < 2) return ''
    let path = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2]
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
    }
    return path
  }

  const revPath = useMemo(() => smoothPath(revPoints.map((p) => ({ x: p.x, y: p.yRev }))), [revPoints])
  const expPath = useMemo(() => smoothPath(revPoints.map((p) => ({ x: p.x, y: p.yExp }))), [revPoints])
  const revAreaPath = useMemo(() => revPath ? `${revPath} L ${revPoints[revPoints.length - 1].x.toFixed(2)},${h - pad} L ${revPoints[0].x.toFixed(2)},${h - pad} Z` : '', [revPath, revPoints, h, pad])
  const expAreaPath = useMemo(() => expPath ? `${expPath} L ${revPoints[revPoints.length - 1].x.toFixed(2)},${h - pad} L ${revPoints[0].x.toFixed(2)},${h - pad} Z` : '', [expPath, revPoints, h, pad])

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id={`${uid}-rev-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.14 162)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="oklch(0.55 0.14 162)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-exp-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.2 25)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="oklch(0.62 0.2 25)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* subtle baseline */}
        <line x1={pad} x2={w - pad} y1={pad + (h - 2 * pad) * 0.5} y2={pad + (h - 2 * pad) * 0.5}
          stroke="currentColor" className="text-muted-foreground/8" strokeWidth={0.2} strokeDasharray="1 1" />
        {/* Expense area + line (drawn first so revenue is on top) */}
        <motion.path d={expAreaPath} fill={`url(#${uid}-exp-fill)`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }} />
        <motion.path d={expPath} fill="none" stroke="oklch(0.62 0.2 25)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeInOut' }} />
        {/* Revenue area + line */}
        <motion.path d={revAreaPath} fill={`url(#${uid}-rev-fill)`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} />
        <motion.path d={revPath} fill="none" stroke="oklch(0.55 0.14 162)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />
        {/* Hover dots + interaction zones */}
        {revPoints.map((p, i) => (
          <g key={i}>
            <rect x={p.x - 5} y={0} width={10} height={h} fill="transparent"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            <circle cx={p.x} cy={p.yRev} r={hover === i ? 2.5 : 0} fill="oklch(0.55 0.14 162)" stroke="white" strokeWidth={1}
              style={{ opacity: hover === i ? 1 : 0 }} className="transition-all" />
            <circle cx={p.x} cy={p.yExp} r={hover === i ? 2.5 : 0} fill="oklch(0.62 0.2 25)" stroke="white" strokeWidth={1}
              style={{ opacity: hover === i ? 1 : 0 }} className="transition-all" />
            {hover === i && (
              <line x1={p.x} y1={Math.min(p.yRev, p.yExp)} x2={p.x} y2={h - pad} stroke="currentColor" className="text-muted-foreground/30" strokeWidth={0.3} strokeDasharray="1 1" />
            )}
          </g>
        ))}
      </svg>
      {/* x-axis labels */}
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[9px] text-muted-foreground/70 pointer-events-none font-medium">
        {data.map((d, i) => (
          <span key={i} className={hover === i ? 'text-foreground' : ''}>{d.month}</span>
        ))}
      </div>
      {/* tooltip */}
      {hover !== null && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 pointer-events-none rounded-md bg-popover border border-border shadow-md px-2.5 py-1.5 text-[10px] -translate-x-1/2 min-w-[110px]"
          style={{ left: `${(revPoints[hover].x / w) * 100}%`, top: -4 }}
        >
          <p className="font-semibold text-foreground">{data[hover].month}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.55 0.14 162)' }} />
            <span className="text-muted-foreground">Revenue</span>
            <span className="ml-auto tabular-nums font-bold text-emerald-600">{format(data[hover].revenue)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.62 0.2 25)' }} />
            <span className="text-muted-foreground">Expenses</span>
            <span className="ml-auto tabular-nums font-bold text-rose-600">{format(data[hover].expense)}</span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5 mt-0.5 border-t border-border/40">
            <span className="text-muted-foreground">Surplus</span>
            <span className="ml-auto tabular-nums font-bold">{format(data[hover].revenue - data[hover].expense)}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── HorizontalBars (Expense Breakdown / Budget vs Actual) ──────────

interface HBarProps {
  data: Array<{ label: string; value: number; secondary?: number; color?: string; secondaryColor?: string; secondaryLabel?: string }>
  format?: (n: number) => string
  height?: number
  showSecondary?: boolean
}

export function HorizontalBars({ data, format = (n) => formatINR(n, true), height, showSecondary }: HBarProps) {
  const max = Math.max(...data.flatMap((d) => [d.value, d.secondary ?? 0]), 1)
  const computedHeight = height ?? data.length * 36 + 8
  return (
    <div className="space-y-2" style={{ minHeight: computedHeight }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        const secondaryPct = d.secondary !== undefined ? (d.secondary / max) * 100 : 0
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium truncate">{d.label}</span>
              <div className="flex items-center gap-2 tabular-nums">
                {showSecondary && d.secondary !== undefined && (
                  <span className="text-muted-foreground text-[10px]">{format(d.secondary)}</span>
                )}
                <span className="font-bold">{format(d.value)}</span>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: d.color ?? 'oklch(0.55 0.14 162)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
              />
              {showSecondary && d.secondary !== undefined && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full opacity-40"
                  style={{ background: d.secondaryColor ?? 'oklch(0.6 0.01 250)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${secondaryPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 + 0.1 }}
                />
              )}
            </div>
            {showSecondary && d.secondaryLabel && (
              <p className="text-[9px] text-muted-foreground">{d.secondaryLabel}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── GroupedBars (Quarterly Revenue vs Expense) ─────────────────────

interface GroupedProps {
  data: Array<{ quarter: string; revenue: number; expense: number }>
  format?: (n: number) => string
  height?: number
}

export function GroupedBars({ data, format = (n) => formatINR(n, true), height = 160 }: GroupedProps) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.flatMap((d) => [d.revenue, d.expense]), 1)
  return (
    <div className="space-y-2" style={{ height }}>
      <div className="flex items-end gap-3 h-[calc(100%-20px)]">
        {data.map((d, i) => {
          const revH = (d.revenue / max) * 100
          const expH = (d.expense / max) * 100
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 h-full"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="flex items-end gap-1 w-full h-full justify-center">
                <motion.div
                  className="w-1/2 max-w-[18px] rounded-t bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
                  initial={{ height: 0 }}
                  animate={{ height: `${revH}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                  title={`Revenue: ${format(d.revenue)}`}
                />
                <motion.div
                  className="w-1/2 max-w-[18px] rounded-t bg-rose-500/80 hover:bg-rose-500 transition-colors"
                  initial={{ height: 0 }}
                  animate={{ height: `${expH}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 + 0.05 }}
                  title={`Expense: ${format(d.expense)}`}
                />
              </div>
              <span className={cn('text-[10px] font-medium', hover === i ? 'text-foreground' : 'text-muted-foreground')}>{d.quarter}</span>
            </div>
          )
        })}
      </div>
      {hover !== null && (
        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span>{data[hover].quarter}:</span>
          <span className="text-emerald-600 font-semibold tabular-nums">Rev {format(data[hover].revenue)}</span>
          <span className="text-rose-600 font-semibold tabular-nums">Exp {format(data[hover].expense)}</span>
          <span className="font-bold tabular-nums">Surplus {format(data[hover].revenue - data[hover].expense)}</span>
        </div>
      )}
    </div>
  )
}

// ─── MiniDonut (clean, with "Other" grouping) ───────────────────────

interface DonutProps {
  data: Array<{ name: string; value: number; color: string }>
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
}

export function FinanceDonut({ data, size = 140, thickness = 16, centerLabel, centerValue }: DonutProps) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  // Group segments <5% into "Other" to avoid rainbow wheel.
  const groupedData = useMemo(() => {
    if (total === 0) return data
    const threshold = 0.05
    const major = data.filter((d) => d.value / total >= threshold)
    const minor = data.filter((d) => d.value / total < threshold)
    if (minor.length <= 1) return data
    const otherValue = minor.reduce((s, d) => s + d.value, 0)
    return [...major, { name: 'Other', value: otherValue, color: 'oklch(0.6 0.01 250)' }]
  }, [data, total])

  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  const segmentData = useMemo(() => {
    const computed = groupedData.map((d, i) => ({
      ...d,
      pct: total > 0 ? d.value / total : 0,
      index: i,
    }))
    const offsets = computed.map((c) => circumference * c.pct)
    const cumulative: number[] = []
    let acc = 0
    for (const o of offsets) { cumulative.push(acc); acc += o }
    return computed.map((c, i) => ({
      ...c,
      dashArray: circumference * c.pct,
      dashOffset: circumference - cumulative[i],
    }))
  }, [groupedData, total, circumference])

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
              strokeWidth={hover === s.index ? thickness + 3 : thickness}
              strokeDasharray={s.dashArray}
              strokeDashoffset={-s.dashOffset + circumference}
              strokeLinecap="butt"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHover(s.index)}
              onMouseLeave={() => setHover(null)}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: -s.dashOffset + circumference }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: s.index * 0.05 }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hover !== null ? (
            <>
              <p className="text-[10px] text-muted-foreground font-medium">{groupedData[hover].name}</p>
              <p className="text-sm font-bold tabular-nums">{formatINR(groupedData[hover].value, true)}</p>
              <p className="text-[9px] text-muted-foreground">{((groupedData[hover].value / total) * 100).toFixed(1)}%</p>
            </>
          ) : (
            <>
              {centerValue && <p className="text-base font-bold tabular-nums">{centerValue}</p>}
              {centerLabel && <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{centerLabel}</p>}
            </>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        {groupedData.map((d, i) => (
          <button
            key={d.name}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="w-full flex items-center gap-2 px-1.5 py-0.5 rounded-md hover:bg-muted/30 transition-colors"
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-[10px] font-medium truncate flex-1 text-left">{d.name}</span>
            <span className="text-[9px] tabular-nums text-muted-foreground">{formatINR(d.value, true)}</span>
            <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── ProgressBar (budget utilization) ────────────────────────────────

export function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color ?? (pct > 90 ? 'oklch(0.62 0.2 25)' : pct > 75 ? 'oklch(0.65 0.16 75)' : 'oklch(0.55 0.14 162)') }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}
