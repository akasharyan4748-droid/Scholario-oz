'use client'

/**
 * attendance/trend — the "improving or declining?" curve (§25/§26, gen 2,
 * final colour refinement).
 *
 * The Attendance trend speaks EMERALD — present/confirmed is green in
 * the workspace philosophy, and the pairing with Results' violet trend
 * gives each module its own personality inside one shared design
 * system. Around the emerald line the chart stays disciplined:
 *   · the school's EXCELLENT threshold (95%) — a quiet neutral dashed
 *     reference line, labelled once on the axis
 *   · the school's MINIMUM threshold (85%) — an amber dashed reference
 *     line, the line that actually matters when a week dips
 * so the graph is informative without filling with green. Every marker
 * is a real control: tapping (or keyboard-focusing) a week reveals its
 * facts (week of · rate · change vs previous week) in a compact detail
 * strip. Points come EXCLUSIVELY from the canonical weekly aggregation —
 * weeks without records simply do not exist on this chart (no synthetic
 * history). The insight derives from the same real aggregation, with
 * semantic tone (green improved, rose dropped); with fewer than two
 * weeks the section shows an intentional empty state (§44).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'

/** Inset so edge dots/labels never clip (chart maps x into 4%–96%). */
const X_MIN = 4
const X_SPAN = 92

interface TrendProps {
  points: { name: string; v: number }[]
  /** The school's attendance policy — rendered as reference lines (null → none). */
  thresholds: { excellent: number; needsAttention: number } | null
}

export function Trend({ points, thresholds }: TrendProps) {
  const n = points.length
  const [selectedIdx, setSelectedIdx] = useState(n > 0 ? n - 1 : -1)
  const xAt = (i: number) => (n > 1 ? X_MIN + (i / (n - 1)) * X_SPAN : 50)

  const linePath =
    n > 1 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${(100 - p.v).toFixed(2)}`).join(' ') : ''
  const areaPath = n > 1 ? `${linePath} L ${(X_MIN + X_SPAN).toFixed(2)} 100 L ${X_MIN} 100 Z` : ''

  const selected = selectedIdx >= 0 && selectedIdx < n ? points[selectedIdx] : null
  const prev = selected && selectedIdx > 0 ? points[selectedIdx - 1] : null
  const delta = selected && prev ? selected.v - prev.v : null

  // Insight — honest, from the last two real weeks only (§26).
  let insight: { icon: typeof TrendingUp; tone: string; text: string } | null = null
  if (n >= 2) {
    const last = points[n - 1].v
    const before = points[n - 2].v
    const d = last - before
    if (d > 0) {
      insight = { icon: TrendingUp, tone: 'text-emerald-600', text: `Attendance improved by ${d}% this week — ${last}% of days attended.` }
    } else if (d < 0) {
      insight = { icon: TrendingDown, tone: 'text-rose-600', text: `Attendance dropped by ${Math.abs(d)}% this week compared to the previous week.` }
    } else {
      insight = { icon: Minus, tone: 'text-muted-foreground', text: 'Attendance is steady week over week.' }
    }
  } else if (n === 1) {
    insight = { icon: Minus, tone: 'text-muted-foreground', text: 'A week-by-week trend appears once at least two weeks are recorded.' }
  }

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          Attendance Trend
        </h3>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
          {n > 0 ? `Weekly rate · ${n} week${n === 1 ? '' : 's'}` : 'Weekly rate'}
        </span>
      </div>

      {n === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
          <TrendingUp className="mb-2 h-5 w-5 text-muted-foreground/40" aria-hidden />
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            More records are needed to show your trend.
          </p>
        </div>
      ) : (
        <>
          {/* Chart — role=img: the trend is also fully serialized for SRs */}
          <div
            className="relative mx-1 h-44 sm:h-48"
            role="img"
            aria-label={`Weekly attendance trend: ${points.map((p) => `${p.name} ${p.v}%`).join(', ')}${thresholds ? ` · school policy: excellent ${thresholds.excellent}%, minimum ${thresholds.needsAttention}%` : ''}`}
          >
            {[25, 50, 75].map((v) => (
              <div key={v} className="absolute inset-x-0 border-t border-dashed border-border/70" style={{ bottom: `${v}%` }} aria-hidden />
            ))}
            {/* School policy reference lines — neutral "excellent", amber "minimum" */}
            {thresholds && (
              <div
                className="absolute inset-x-0 border-t border-dashed border-muted-foreground/35"
                style={{ bottom: `${thresholds.excellent}%` }}
                aria-hidden
              >
                <span className="absolute -top-2 left-0 whitespace-nowrap text-[9px] font-medium tabular-nums text-muted-foreground/55">
                  {thresholds.excellent}% excellent
                </span>
              </div>
            )}
            {thresholds && (
              <div
                className="absolute inset-x-0 border-t border-dashed border-amber-500/50"
                style={{ bottom: `${thresholds.needsAttention}%` }}
                aria-hidden
              >
                <span className="absolute -top-2 left-0 whitespace-nowrap text-[9px] font-semibold tabular-nums text-amber-600/85">
                  {thresholds.needsAttention}% minimum
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 border-t border-border" aria-hidden />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="attTrendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              {areaPath && <path d={areaPath} fill="url(#attTrendArea)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {points.map((p, i) => {
              const isSel = i === selectedIdx
              return (
                <div
                  key={`${p.name}-${i}`}
                  className="absolute"
                  style={{ left: `${xAt(i)}%`, bottom: `${p.v}%`, transform: 'translate(-50%, 50%)' }}
                >
                  {/* Generous invisible hit area → comfortable tap target */}
                  <button
                    type="button"
                    onClick={() => setSelectedIdx(i)}
                    aria-pressed={isSel}
                    aria-label={`Week of ${p.name}: ${p.v} percent attendance`}
                    className="group flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className={cn(
                        'block rounded-full bg-emerald-500 ring-2 ring-background transition-all',
                        isSel ? 'h-3 w-3 shadow-sm ring-emerald-500/25' : 'h-2 w-2 group-hover:h-2.5 group-hover:w-2.5',
                      )}
                    />
                  </button>
                  <span
                    className={cn(
                      'pointer-events-none absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums transition-colors',
                      isSel ? 'text-emerald-600' : 'text-foreground/65',
                    )}
                  >
                    {p.v}%
                  </span>
                </div>
              )
            })}
          </div>

          {/* X labels — aligned with the markers, also interactive */}
          <div className="relative mx-1 mt-2 h-4">
            {points.map((p, i) => (
              <button
                key={`${p.name}-${i}`}
                type="button"
                onClick={() => setSelectedIdx(i)}
                aria-pressed={i === selectedIdx}
                className={cn(
                  'absolute -translate-x-1/2 cursor-pointer whitespace-nowrap rounded px-1 text-[10px] font-medium tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  i === selectedIdx ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80',
                )}
                style={{ left: `${xAt(i)}%` }}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* ── Selected week detail (§25 interactive markers) ── */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={`${selected.name}-${selectedIdx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5"
                aria-live="polite"
              >
                <p className="text-xs font-semibold text-foreground">Week of {selected.name}</p>
                <p className="text-xs font-bold tabular-nums text-emerald-600">{selected.v}%</p>
                {delta != null && delta !== 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums',
                      delta > 0
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-600',
                    )}
                  >
                    {delta > 0 ? (
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" aria-hidden />
                    )}
                    {delta > 0 ? '+' : '−'}
                    {Math.abs(delta)}% from previous week
                  </span>
                )}
                {delta === 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                    <Minus className="h-3 w-3" aria-hidden />
                    No change
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {insight && (
        <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3.5">
          <insight.icon className={cn('h-3.5 w-3.5 shrink-0', insight.tone)} aria-hidden />
          <p className="text-xs text-muted-foreground">{insight.text}</p>
        </div>
      )}
    </GlassCard>
  )
}
