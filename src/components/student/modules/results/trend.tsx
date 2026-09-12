'use client'

/**
 * results/trend — PERFORMANCE TREND (§11, gen 2 — interactive).
 *
 * A refined academic trend visualization in the Student's green primary:
 * soft area fill, crisp line, clear points — and every point is a REAL
 * control. Tapping (or keyboard-focusing) an assessment point reveals its
 * facts: assessment, percentage, grade and the true change from the
 * previous point. The y-domain adapts to the real marks band so honest
 * differences stay readable; values are the full unrounded percentages
 * from the canonical results. With < 2 published assessments the section
 * explains itself instead of inventing history (§44).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { fmtPct, type TrendPoint } from '@/lib/store/student-results-store'

interface TrendProps {
  points: TrendPoint[]
}

export function Trend({ points }: TrendProps) {
  const n = points.length
  // Latest point opens selected (the student's most recent story).
  const [selectedIdx, setSelectedIdx] = useState(n > 0 ? n - 1 : -1)

  // Adaptive y-domain: the real band ± padding, clamped to 0–100.
  const values = points.map((p) => p.pct)
  const lo = Math.max(0, Math.floor(Math.min(...values) - 8))
  const hi = Math.min(100, Math.ceil(Math.max(...values) + 6))
  const span = Math.max(10, hi - lo)
  const yOf = (v: number) => ((hi - v) / span) * 100
  const xAt = (i: number) => (n > 1 ? 5 + (i / (n - 1)) * 90 : 50)

  const linePath =
    n > 1 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yOf(p.pct).toFixed(2)}`).join(' ') : ''
  const areaPath = n > 1 ? `${linePath} L ${(5 + 90).toFixed(2)} 100 L 5 100 Z` : ''
  const gridLines = [0.25, 0.5, 0.75].map((f) => Math.round(lo + span * f))

  const selected = selectedIdx >= 0 && selectedIdx < n ? points[selectedIdx] : null
  const prevOfSelected = selected && selectedIdx > 0 ? points[selectedIdx - 1] : null
  const delta = selected && prevOfSelected ? selected.pct - prevOfSelected.pct : null

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="text-sm font-bold tracking-tight text-foreground">Performance Trend</h3>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
          All assessments
        </span>
      </div>

      {n < 2 ? (
        <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
          <TrendingUp className="mb-2 h-5 w-5 text-muted-foreground/40" aria-hidden />
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            {n === 1
              ? 'Your trend will appear after more assessments are published.'
              : 'Your performance trend will appear after more assessments are published.'}
          </p>
        </div>
      ) : (
        <>
          {/* Chart — every point is an interactive control */}
          <div
            className="relative mx-1 h-44 sm:h-48"
            role="img"
            aria-label={`Performance trend: ${points.map((p) => `${p.fullLabel} ${fmtPct(p.pct)}%`).join(', ')}`}
          >
            {gridLines.map((v) => (
              <div key={v} className="absolute inset-x-0 border-t border-dashed border-border/70" style={{ bottom: `${yOf(v)}%` }} aria-hidden>
                <span className="absolute -top-2 left-0 text-[9px] tabular-nums text-muted-foreground/60">{v}</span>
              </div>
            ))}
            <div className="absolute inset-x-0 border-t border-border" style={{ bottom: `${yOf(lo)}%` }} aria-hidden />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="resTrendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              {areaPath && <path d={areaPath} fill="url(#resTrendArea)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={2.5}
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
                  key={p.assessmentId}
                  className="absolute"
                  style={{ left: `${xAt(i)}%`, bottom: `${yOf(p.pct)}%`, transform: 'translate(-50%, 50%)' }}
                >
                  {/* Generous invisible hit area → comfortable tap target */}
                  <button
                    type="button"
                    onClick={() => setSelectedIdx(i)}
                    aria-pressed={isSel}
                    aria-label={`${p.fullLabel}: ${fmtPct(p.pct)} percent, grade ${p.grade}`}
                    className="group flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className={cn(
                        'block rounded-full bg-emerald-500 ring-[3px] ring-background transition-all',
                        isSel ? 'h-3.5 w-3.5 shadow-sm ring-emerald-500/25' : 'h-2.5 w-2.5 group-hover:h-3 group-hover:w-3',
                      )}
                    />
                  </button>
                  <span
                    className={cn(
                      'pointer-events-none absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold tabular-nums transition-colors',
                      isSel ? 'text-emerald-600' : 'text-foreground/60',
                    )}
                  >
                    {fmtPct(p.pct)}%
                  </span>
                </div>
              )
            })}
          </div>

          {/* X labels — aligned with the points */}
          <div className="relative mx-1 mt-2 h-7">
            {points.map((p, i) => (
              <button
                key={p.assessmentId}
                type="button"
                onClick={() => setSelectedIdx(i)}
                aria-pressed={i === selectedIdx}
                className={cn(
                  'absolute -translate-x-1/2 cursor-pointer whitespace-nowrap rounded px-1 text-[10px] font-medium tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  i === selectedIdx ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80',
                )}
                style={{ left: `${xAt(i)}%` }}
              >
                {p.label}
                <span className={cn('mt-0.5 block text-center text-[9px]', i === selectedIdx ? 'text-muted-foreground' : 'text-muted-foreground/60')}>
                  {p.grade}
                </span>
              </button>
            ))}
          </div>

          {/* ── Selected point detail — the assessment's facts (§11) ── */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.assessmentId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2.5"
                aria-live="polite"
              >
                <p className="text-xs font-semibold text-foreground">{selected.fullLabel}</p>
                <p className="text-xs font-bold tabular-nums text-emerald-600">{fmtPct(selected.pct)}%</p>
                <p className="text-xs font-medium text-muted-foreground">Grade {selected.grade}</p>
                {delta != null && Math.abs(delta) >= 0.05 && (
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
                    {fmtPct(Math.abs(delta))}% from previous
                  </span>
                )}
                {delta != null && Math.abs(delta) < 0.05 && (
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
    </GlassCard>
  )
}
