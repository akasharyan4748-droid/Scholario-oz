'use client'

/**
 * premium-charts — Unified premium chart visualization system for SCHOLARIO.
 *
 * One reusable chart system used across ALL modules:
 *   - DonutChart       : animated categorical distribution (rounded segments, hover, center content)
 *   - RadialProgress   : single-value progress ring (capacity, collection rate, attendance)
 *   - AreaTrendChart   : smooth area/line trend (monthly revenue, collection, payroll)
 *   - GroupedBarChart  : grouped bar comparison (quarterly, class-wise)
 *   - HorizontalBarChart: category breakdown bars
 *
 * All charts use:
 *   - SVG geometry with strokeDasharray/strokeDashoffset for donut segments
 *   - Framer Motion for smooth entrance animation (staggered segments)
 *   - Interactive hover (segment highlight + center content update + legend sync)
 *   - Rounded stroke caps for premium feel
 *   - Theme-aware (uses Tailwind CSS variables, works in dark/light)
 *   - Responsive (scales within container)
 *
 * Edge cases handled:
 *   - Empty data → empty state
 *   - Zero total → no segments rendered
 *   - Single category → full ring
 *   - Small segments (<5%) → grouped into "Other"
 *   - Negative values → treated as 0
 *   - Duplicate labels → rendered as-is (caller's responsibility)
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useId, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────

export interface DonutDatum {
  name: string
  value: number
  color: string
}

export interface DonutChartProps {
  data: DonutDatum[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
  formatValue?: (n: number) => string
  showLegend?: boolean
  showPercentInLegend?: boolean
  gapDegrees?: number
  className?: string
}

export interface RadialProgressProps {
  value: number
  max?: number
  size?: number
  thickness?: number
  color?: string
  trackColor?: string
  label?: string
  suffix?: string
  formatValue?: (n: number) => string
  className?: string
}

export interface AreaTrendDatum {
  label: string
  primary: number
  secondary?: number
}

// Flexible data type for backward compatibility with existing data shapes
type FlexibleData = Array<Record<string, any>>

export interface AreaTrendChartProps {
  data: Array<Record<string, any>>
  height?: number
  formatValue?: (n: number) => string
  primaryColor?: string
  secondaryColor?: string
  primaryLabel?: string
  secondaryLabel?: string
  labelKey?: string
  primaryKey?: string
  secondaryKey?: string
  className?: string
}

export interface GroupedBarDatum {
  label: string
  primary: number
  secondary?: number
}

export interface GroupedBarChartProps {
  data: Array<Record<string, any>>
  height?: number
  formatValue?: (n: number) => string
  primaryColor?: string
  secondaryColor?: string
  primaryLabel?: string
  secondaryLabel?: string
  labelKey?: string
  primaryKey?: string
  secondaryKey?: string
  className?: string
}

export interface HBarDatum {
  label: string
  value: number
  color?: string
  secondary?: number
}

export interface HorizontalBarChartProps {
  data: HBarDatum[]
  height?: number
  formatValue?: (n: number) => string
  showSecondary?: boolean
  className?: string
}

// ─── DonutChart ──────────────────────────────────────────────────────

export function DonutChart({
  data,
  size = 160,
  thickness = 18,
  centerLabel,
  centerValue,
  formatValue = (n) => n.toLocaleString('en-IN'),
  showLegend = true,
  showPercentInLegend = true,
  gapDegrees = 2,
  className,
}: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const uid = useId().replace(/:/g, '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [actualSize, setActualSize] = useState(size)

  // Responsive: use smaller size on narrow containers
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? size
      setActualSize(Math.min(size, Math.max(100, width - 40)))
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [size])

  // Group small segments (<5%) into "Other"
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0)
  const groupedData = useMemo(() => {
    if (total === 0 || data.length === 0) return data
    const threshold = 0.05
    const major = data.filter((d) => d.value / total >= threshold)
    const minor = data.filter((d) => d.value / total < threshold)
    if (minor.length <= 1) return data
    return [...major, { name: 'Other', value: minor.reduce((s, d) => s + d.value, 0), color: 'oklch(0.6 0.01 250)' }]
  }, [data, total])

  const r = (actualSize - thickness) / 2
  const cx = actualSize / 2
  const cy = actualSize / 2
  const circumference = 2 * Math.PI * r
  const gapFraction = gapDegrees / 360
  const gapLength = circumference * gapFraction

  // Compute segment geometry
  const segments = useMemo(() => {
    if (total === 0) return []
    let acc = 0
    return groupedData.map((d, i) => {
      const pct = Math.max(0, d.value) / total
      const arcLength = circumference * pct
      // Add gaps between segments (but not for single segment)
      const dashArray = groupedData.length > 1
        ? `${Math.max(0, arcLength - gapLength)} ${circumference - Math.max(0, arcLength - gapLength)}`
        : `${arcLength} ${circumference - arcLength}`
      const dashOffset = -acc
      acc += arcLength
      return { ...d, pct, dashArray, dashOffset, index: i }
    })
  }, [groupedData, total, circumference, gapLength])

  // Empty state
  if (data.length === 0 || total === 0) {
    return (
      <div ref={containerRef} className={cn('flex flex-col items-center justify-center py-8', className)}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30 text-muted-foreground/40">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <p className="text-xs text-muted-foreground mt-2">No data</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('flex items-center gap-4', className)}>
      {/* Donut SVG */}
      <div className="relative shrink-0" style={{ width: actualSize, height: actualSize }}>
        <svg viewBox={`0 0 ${actualSize} ${actualSize}`} className="w-full h-full -rotate-90">
          {/* Background ring */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="currentColor"
            className="text-muted/20"
            strokeWidth={thickness}
          />
          {/* Segments */}
          {segments.map((s) => {
            const isHovered = hover === s.index
            return (
              <motion.circle
                key={s.name}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={isHovered ? thickness + 4 : thickness}
                strokeDasharray={s.dashArray}
                strokeDashoffset={s.dashOffset}
                strokeLinecap="round"
                className="cursor-pointer transition-[stroke-width] duration-200"
                onMouseEnter={() => setHover(s.index)}
                onMouseLeave={() => setHover(null)}
                initial={{ strokeDashoffset: circumference, opacity: 0 }}
                animate={{
                  strokeDashoffset: s.dashOffset,
                  opacity: 1,
                }}
                transition={{
                  strokeDashoffset: { duration: 1, ease: [0.22, 1, 0.36, 1], delay: s.index * 0.06 },
                  opacity: { duration: 0.3, delay: s.index * 0.06 },
                }}
                style={{
                  filter: isHovered ? `drop-shadow(0 0 6px ${s.color}40)` : 'none',
                }}
              />
            )
          })}
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {hover !== null ? (
              <motion.div
                key={`hover-${hover}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="text-center"
              >
                <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[80px]">{groupedData[hover].name}</p>
                <p className="text-sm font-bold tabular-nums">{formatValue(groupedData[hover].value)}</p>
                <p className="text-[9px] text-muted-foreground tabular-nums">{((groupedData[hover].value / total) * 100).toFixed(1)}%</p>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="text-center"
              >
                {centerValue && <p className="text-base font-bold tabular-nums">{centerValue}</p>}
                {centerLabel && <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{centerLabel}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex-1 space-y-1 min-w-0">
          {groupedData.map((d, i) => (
            <button
              key={d.name}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                'w-full flex items-center gap-2 px-1.5 py-0.5 rounded-md transition-colors',
                hover === i && 'bg-muted/50',
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform"
                style={{
                  background: d.color,
                  transform: hover === i ? 'scale(1.3)' : 'scale(1)',
                }}
              />
              <span className="text-[10px] font-medium truncate flex-1 text-left">{d.name}</span>
              {showPercentInLegend && (
                <span className="text-[9px] tabular-nums text-muted-foreground w-8 text-right">
                  {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
                </span>
              )}
              <span className="text-[9px] tabular-nums text-muted-foreground whitespace-nowrap">
                {formatValue(d.value)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── RadialProgress ─────────────────────────────────────────────────

export function RadialProgress({
  value,
  max = 100,
  size = 120,
  thickness = 10,
  color = 'oklch(0.55 0.14 162)',
  trackColor,
  label,
  suffix = '%',
  formatValue = (n) => `${Math.round(n)}${suffix}`,
  className,
}: RadialProgressProps) {
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.min(1, Math.max(0, value / max))
  const dashOffset = circumference * (1 - pct)

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={trackColor ?? 'currentColor'}
          className={trackColor ? '' : 'text-muted/20'}
          strokeWidth={thickness}
        />
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
          transition={{ delay: 0.3, duration: 0.2 }}
          className="text-lg font-bold tabular-nums"
        >
          {formatValue(value)}
        </motion.p>
        {label && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5"
          >
            {label}
          </motion.p>
        )}
      </div>
    </div>
  )
}

// ─── AreaTrendChart ──────────────────────────────────────────────────

export function AreaTrendChart({
  data,
  height = 140,
  formatValue = (n) => n.toLocaleString('en-IN'),
  primaryColor = 'oklch(0.55 0.14 162)',
  secondaryColor = 'oklch(0.62 0.2 25)',
  primaryLabel,
  secondaryLabel,
  labelKey = 'label',
  primaryKey = 'primary',
  secondaryKey = 'secondary',
  className,
}: AreaTrendChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const uid = useId().replace(/:/g, '')
  const w = 100
  const h = height
  const pad = 10

  const maxVal = Math.max(...data.flatMap((d) => [d[primaryKey] ?? 0, d[secondaryKey] ?? 0]), 1)

  // Build smooth Catmull-Rom bezier path
  const smoothPath = (pts: { x: number; y: number }[]) => {
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

  const primaryPoints = data.map((d, i) => ({
    x: pad + (i / Math.max(1, data.length - 1)) * (w - 2 * pad),
    y: h - pad - ((d[primaryKey] ?? 0) / maxVal) * (h - 2 * pad),
  }))
  const secondaryPoints = data.map((d, i) => ({
    x: pad + (i / Math.max(1, data.length - 1)) * (w - 2 * pad),
    y: h - pad - ((d[secondaryKey] ?? 0) / maxVal) * (h - 2 * pad),
  }))

  const primaryPath = useMemo(() => smoothPath(primaryPoints), [primaryPoints])
  const secondaryPath = useMemo(() => smoothPath(secondaryPoints), [secondaryPoints])
  const primaryArea = useMemo(() => primaryPath ? `${primaryPath} L ${primaryPoints[primaryPoints.length - 1].x.toFixed(2)},${h - pad} L ${primaryPoints[0].x.toFixed(2)},${h - pad} Z` : '', [primaryPath, primaryPoints, h, pad])
  const secondaryArea = useMemo(() => secondaryPath ? `${secondaryPath} L ${secondaryPoints[secondaryPoints.length - 1].x.toFixed(2)},${h - pad} L ${secondaryPoints[0].x.toFixed(2)},${h - pad} Z` : '', [secondaryPath, secondaryPoints, h, pad])

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id={`${uid}-p`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.25" />
            <stop offset="60%" stopColor={primaryColor} stopOpacity="0.05" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
          {data.some((d) => d[secondaryKey] !== undefined) && (
            <linearGradient id={`${uid}-s`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
            </linearGradient>
          )}
        </defs>
        {/* Secondary area + line (drawn first) */}
        {data.some((d) => d[secondaryKey] !== undefined) && (
          <>
            <motion.path d={secondaryArea} fill={`url(#${uid}-s)`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }} />
            <motion.path d={secondaryPath} fill="none" stroke={secondaryColor} strokeWidth={1.4}
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeInOut' }} />
          </>
        )}
        {/* Primary area + line */}
        <motion.path d={primaryArea} fill={`url(#${uid}-p)`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} />
        <motion.path d={primaryPath} fill="none" stroke={primaryColor} strokeWidth={1.8}
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }} />
        {/* Hover interaction zones + dots */}
        {primaryPoints.map((p, i) => (
          <g key={i}>
            <rect x={p.x - 5} y={0} width={10} height={h} fill="transparent"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            <circle cx={p.x} cy={p.y} r={hover === i ? 3 : 0} fill={primaryColor} stroke="white" strokeWidth={1}
              style={{ opacity: hover === i ? 1 : 0 }} className="transition-all" />
            {data[i].secondary !== undefined && (
              <circle cx={p.x} cy={secondaryPoints[i].y} r={hover === i ? 2.5 : 0} fill={secondaryColor} stroke="white" strokeWidth={1}
                style={{ opacity: hover === i ? 1 : 0 }} className="transition-all" />
            )}
            {hover === i && (
              <line x1={p.x} y1={Math.min(p.y, secondaryPoints[i]?.y ?? h)} x2={p.x} y2={h - pad}
                stroke={primaryColor} strokeWidth={0.3} strokeDasharray="1 1" opacity={0.4} />
            )}
          </g>
        ))}
      </svg>
      {/* X-axis labels */}
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[9px] text-muted-foreground/60 pointer-events-none font-medium">
        {data.map((d, i) => (
          <span key={i} className={hover === i ? 'text-foreground' : ''}>{d[labelKey]}</span>
        ))}
      </div>
      {/* Tooltip */}
      {hover !== null && (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 pointer-events-none rounded-md bg-popover border border-border shadow-lg px-2.5 py-1.5 text-[10px] -translate-x-1/2 min-w-[100px]"
          style={{ left: `${(primaryPoints[hover].x / w) * 100}%`, top: -4 }}
        >
          <p className="font-semibold text-foreground">{data[hover][labelKey]}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-2 w-2 rounded-full" style={{ background: primaryColor }} />
            <span className="text-muted-foreground">{primaryLabel ?? 'Primary'}</span>
            <span className="ml-auto tabular-nums font-bold" style={{ color: primaryColor }}>{formatValue(data[hover][primaryKey] ?? 0)}</span>
          </div>
          {data[hover][secondaryKey] !== undefined && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full" style={{ background: secondaryColor }} />
              <span className="text-muted-foreground">{secondaryLabel ?? 'Secondary'}</span>
              <span className="ml-auto tabular-nums font-bold" style={{ color: secondaryColor }}>{formatValue(data[hover][secondaryKey] ?? 0)}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ─── GroupedBarChart ─────────────────────────────────────────────────

export function GroupedBarChart({
  data,
  height = 160,
  formatValue = (n) => n.toLocaleString('en-IN'),
  primaryColor = 'oklch(0.55 0.14 162)',
  secondaryColor = 'oklch(0.62 0.2 25)',
  primaryLabel = 'Primary',
  secondaryLabel = 'Secondary',
  labelKey = 'label',
  primaryKey = 'primary',
  secondaryKey = 'secondary',
  className,
}: GroupedBarChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.flatMap((d) => [d[primaryKey] ?? 0, d[secondaryKey] ?? 0]), 1)

  return (
    <div className={className} style={{ height }}>
      <div className="flex items-end gap-3 h-[calc(100%-20px)]">
        {data.map((d, i) => {
          const pH = ((d[primaryKey] ?? 0) / max) * 100
          const sH = d[secondaryKey] !== undefined ? (d[secondaryKey] / max) * 100 : 0
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 h-full"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="flex items-end gap-1 w-full h-full justify-center">
                <motion.div
                  className="w-1/2 max-w-[20px] rounded-t-md"
                  style={{ background: primaryColor }}
                  initial={{ height: 0 }}
                  animate={{ height: `${pH}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                />
                {d.secondary !== undefined && (
                  <motion.div
                    className="w-1/2 max-w-[20px] rounded-t-md"
                    style={{ background: secondaryColor }}
                    initial={{ height: 0 }}
                    animate={{ height: `${sH}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 + 0.05 }}
                  />
                )}
              </div>
              <span className={cn('text-[10px] font-medium', hover === i ? 'text-foreground' : 'text-muted-foreground')}>
                {d[labelKey]}
              </span>
            </div>
          )
        })}
      </div>
      {hover !== null && (
        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground mt-1">
          <span>{data[hover].label}:</span>
          <span className="font-semibold tabular-nums" style={{ color: primaryColor }}>{primaryLabel} {formatValue(data[hover][primaryKey] ?? 0)}</span>
          {data[hover][secondaryKey] !== undefined && (
            <span className="font-semibold tabular-nums" style={{ color: secondaryColor }}>{secondaryLabel} {formatValue(data[hover][secondaryKey] ?? 0)}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── HorizontalBarChart ─────────────────────────────────────────────

export function HorizontalBarChart({
  data,
  height,
  formatValue = (n) => n.toLocaleString('en-IN'),
  showSecondary,
  className,
}: HorizontalBarChartProps) {
  const max = Math.max(...data.flatMap((d) => [d.value, d.secondary ?? 0]), 1)
  const computedHeight = height ?? data.length * 36 + 8

  return (
    <div className={cn('space-y-2', className)} style={{ minHeight: computedHeight }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        const secondaryPct = d.secondary !== undefined ? (d.secondary / max) * 100 : 0
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium truncate">{d[labelKey]}</span>
              <div className="flex items-center gap-2 tabular-nums">
                {showSecondary && d.secondary !== undefined && (
                  <span className="text-muted-foreground text-[10px]">{formatValue(d.secondary)}</span>
                )}
                <span className="font-bold">{formatValue(d.value)}</span>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: d.color ?? 'oklch(0.55 0.14 162)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
              />
              {showSecondary && d.secondary !== undefined && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full opacity-30"
                  style={{ background: 'oklch(0.6 0.01 250)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${secondaryPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 + 0.1 }}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── ProgressBar (compact utility) ───────────────────────────────────

export function ProgressBar({ value, max = 100, color, className }: { value: number; max?: number; color?: string; className?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className={cn('h-2 rounded-full bg-muted/30 overflow-hidden', className)}>
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
