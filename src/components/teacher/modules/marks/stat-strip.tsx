'use client'

/**
 * marks/stat-strip — four live mini-KPI tiles derived from the current
 * drafts: Entered x/N · Class average · Highest · Pass count.
 *
 * Visual recipe follows the hub-stat-cards system ("My Attendance"
 * benchmark): rounded-xl border p-3 sm:p-4 · tinted 500/5 background ·
 * hover border 500/40 · tiny uppercase label · bare icon top-right ·
 * font-display tabular-nums value. Derived tiles show an em-dash while
 * nothing is entered.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { Award, CheckCircle2, ClipboardEdit, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAverage, type MarksStats } from './shared'

type StatTone = 'slate' | 'emerald' | 'amber' | 'sky'

const TONES: Record<StatTone, { text: string; bg: string; border: string }> = {
  slate: {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-muted/40',
    border: 'border-border hover:border-muted-foreground/30',
  },
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-border hover:border-emerald-500/40',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-border hover:border-amber-500/40',
  },
  sky: {
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/5',
    border: 'border-border hover:border-sky-500/40',
  },
}

interface StatTile {
  key: string
  label: string
  value: string
  context: string
  icon: typeof TrendingUp
  tone: StatTone
}

export function StatStrip({
  stats,
  maxMarks,
  passMarks,
  loading,
}: {
  stats: MarksStats | null
  maxMarks: number
  passMarks: number
  loading?: boolean
}) {
  const reduce = useReducedMotion()

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-busy="true" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-muted/20 p-3 animate-pulse sm:p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="h-2.5 w-16 rounded bg-muted" />
              <div className="h-3.5 w-3.5 rounded bg-muted" />
            </div>
            <div className="mt-0.5 h-7 w-16 rounded bg-muted" />
            <div className="mt-2 h-2.5 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  const tiles: StatTile[] = [
    {
      key: 'entered',
      label: 'Entered',
      value: `${stats.entered}/${stats.total}`,
      context: `${stats.total} students`,
      icon: ClipboardEdit,
      tone: 'slate',
    },
    {
      key: 'average',
      label: 'Class average',
      value: formatAverage(stats.average) ?? '—',
      context: `out of ${maxMarks}`,
      icon: TrendingUp,
      tone: 'emerald',
    },
    {
      key: 'highest',
      label: 'Highest',
      value: stats.highest != null ? String(stats.highest) : '—',
      context: `out of ${maxMarks}`,
      icon: Award,
      tone: 'amber',
    },
    {
      key: 'pass',
      label: 'Pass count',
      value: stats.passCount != null ? String(stats.passCount) : '—',
      context: `≥ ${passMarks} to pass`,
      icon: CheckCircle2,
      tone: 'sky',
    },
  ]


  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((tile, i) => {
        const tone = TONES[tile.tone]
        const Icon = tile.icon
        const dashed = tile.value === '—'
        return (
          <motion.div
            key={tile.key}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={cn('rounded-xl border p-3 sm:p-4', tone.bg, tone.border)}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {tile.label}
              </span>
              <Icon className={cn('h-3.5 w-3.5 shrink-0', tone.text)} aria-hidden="true" />
            </div>
            <p
              className={cn(
                'font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl',
                dashed ? 'text-muted-foreground' : tone.text,
              )}
            >
              {tile.value}
            </p>
            <p className="mt-1 truncate text-[10px] text-muted-foreground">{tile.context}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
