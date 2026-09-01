'use client'

/**
 * SummaryCard — premium stat card with soft tinted background, large value,
 * small subtitle, smooth entrance + hover animations. Matches the design
 * language of the Admission module's KpiStat cards (Pending Review / Need
 * Correction / Approved / Enrolled) but with refined micro-interactions:
 *
 *   - Fade + slide-up entrance animation (staggered by `delay`)
 *   - Number count-up animation on first mount
 *   - Hover: lift + shadow + 1.01 scale
 *   - Optional onClick — becomes a button with focus ring
 *   - Tone-based accent (sky / amber / emerald / teal / rose / violet / cyan)
 *
 * Use this everywhere a stat card is needed. The shared tone palette
 * guarantees visual consistency across modules.
 */

import { useEffect, useRef, useState, useMemo, type ReactNode } from 'react'
import { motion, useReducedMotion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

export type SummaryTone = 'sky' | 'amber' | 'emerald' | 'teal' | 'rose' | 'violet' | 'cyan' | 'slate'

interface ToneStyles {
  text: string
  bg: string
  border: string
  hoverBorder: string
}

const TONES: Record<SummaryTone, ToneStyles> = {
  sky:     { text: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-500/5',     border: 'border-border', hoverBorder: 'hover:border-sky-500/40' },
  amber:   { text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-500/5',   border: 'border-border', hoverBorder: 'hover:border-amber-500/40' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-border', hoverBorder: 'hover:border-emerald-500/40' },
  teal:    { text: 'text-teal-600 dark:text-teal-400',       bg: 'bg-teal-500/5',    border: 'border-border', hoverBorder: 'hover:border-teal-500/40' },
  rose:    { text: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-500/5',    border: 'border-border', hoverBorder: 'hover:border-rose-500/40' },
  violet:  { text: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-500/5',  border: 'border-border', hoverBorder: 'hover:border-violet-500/40' },
  cyan:    { text: 'text-cyan-600 dark:text-cyan-400',       bg: 'bg-cyan-500/5',    border: 'border-border', hoverBorder: 'hover:border-cyan-500/40' },
  slate:   { text: 'text-slate-700 dark:text-slate-300',     bg: 'bg-slate-500/5',   border: 'border-border', hoverBorder: 'hover:border-slate-500/40' },
}

export interface SummaryCardProps {
  label: string
  /** numeric value (animated count-up) OR string value (no animation) */
  value: number | string
  /** optional suffix appended to numeric value (e.g. "%", "/24") */
  suffix?: string
  /** small helper text below the value */
  sub?: string
  /** optional icon rendered top-right */
  icon?: ReactNode
  /** tone drives bg/text/border colors */
  tone?: SummaryTone
  /** stagger delay in seconds for entrance animation */
  delay?: number
  /** when provided, card becomes a clickable button with focus ring */
  onClick?: () => void
  className?: string
  /** optional sparkline data (array of numbers) rendered as a thin smooth line at the bottom */
  sparkline?: number[]
  /** trend indicator: positive/negative/neutral — shows an arrow + colors the sub text */
  trend?: 'up' | 'down' | 'neutral'
}

export function SummaryCard({
  label, value, suffix, sub, icon, tone = 'slate', delay = 0, onClick, className, sparkline, trend,
}: SummaryCardProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  // Count-up animation only for numeric values
  const numericValue = typeof value === 'number' ? value : null
  const [displayValue, setDisplayValue] = useState<number>(0)

  useEffect(() => {
    if (numericValue === null || reduce || !inView) {
      if (numericValue !== null) setDisplayValue(numericValue)
      return
    }
    // Animate from 0 → numericValue over ~700ms with easeOut
    const duration = 700
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayValue(Math.round(numericValue * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [numericValue, reduce, inView])

  const toneStyles = TONES[tone]
  const formattedValue = numericValue !== null
    ? `${displayValue.toLocaleString()}${suffix ?? ''}`
    : `${value}${suffix ?? ''}`

  const baseClass = cn(
    'rounded-xl border p-4 transition-all duration-200',
    toneStyles.bg, toneStyles.border, toneStyles.hoverBorder,
    onClick && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
    className,
  )

  // Sparkline path (smooth Catmull-Rom bezier, thin, no fill)
  const sparklinePath = useMemo(() => {
    if (!sparkline || sparkline.length < 2) return ''
    const w = 100, h = 28, pad = 2
    const max = Math.max(...sparkline, 1)
    const min = Math.min(...sparkline, 0)
    const range = max - min || 1
    const pts = sparkline.map((v, i) => ({
      x: pad + (i / (sparkline.length - 1)) * (w - 2 * pad),
      y: h - pad - ((v - min) / range) * (h - 2 * pad),
    }))
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
  }, [sparkline])

  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-muted-foreground'
  const TrendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : null

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-tight break-words">
          {label}
        </span>
        {icon && <span className={cn('shrink-0', toneStyles.text)}>{icon}</span>}
      </div>
      <div className={cn('font-display text-2xl sm:text-3xl font-extrabold tabular-nums leading-tight', toneStyles.text)}>
        {formattedValue}
      </div>
      {sub && (
        <p className="text-[11px] mt-1 leading-tight break-words flex items-center gap-1">
          {TrendIcon && <span className={cn('font-bold', trendColor)}>{TrendIcon}</span>}
          <span className="text-muted-foreground">{sub}</span>
        </p>
      )}
      {sparklinePath && (
        <div className="mt-2 -mb-1">
          <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="w-full h-7 overflow-visible">
            <motion.path
              d={sparklinePath}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={toneStyles.text}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
        </div>
      )}
    </>
  )

  // Static (no hover animation) variant when reduce-motion is set
  if (reduce) {
    if (onClick) {
      return (
        <button ref={ref as any} onClick={onClick} className={baseClass}>
          {inner}
        </button>
      )
    }
    return <div ref={ref} className={baseClass}>{inner}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={onClick ? { y: -2, scale: 1.01 } : { y: -2, scale: 1.005 }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      {onClick ? (
        <button onClick={onClick} className={cn(baseClass, 'block w-full text-left')}>
          {inner}
        </button>
      ) : (
        <div className={baseClass}>{inner}</div>
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  SummaryCardGrid — convenience wrapper                              */
/*  Renders N cards in a responsive 2/4 grid with consistent gap.     */
/* ------------------------------------------------------------------ */

export function SummaryCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode
  columns?: 2 | 3 | 4 | 6
  className?: string
}) {
  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[columns]
  return (
    <div className={cn('grid gap-3 sm:gap-4', colClass, className)}>
      {children}
    </div>
  )
}
