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

import { useEffect, useRef, useState, type ReactNode } from 'react'
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
}

export function SummaryCard({
  label, value, suffix, sub, icon, tone = 'slate', delay = 0, onClick, className,
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

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">
          {label}
        </span>
        {icon && <span className="text-muted-foreground/70 shrink-0">{icon}</span>}
      </div>
      <div className={cn('font-display text-2xl sm:text-3xl font-extrabold tabular-nums leading-tight', toneStyles.text)}>
        {formattedValue}
      </div>
      {sub && <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>}
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
  columns?: 2 | 3 | 4
  className?: string
}) {
  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns]
  return (
    <div className={cn('grid gap-3 sm:gap-4', colClass, className)}>
      {children}
    </div>
  )
}
