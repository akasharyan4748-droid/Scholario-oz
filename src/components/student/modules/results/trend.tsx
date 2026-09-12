'use client'

/**
 * results/trend — MY PERFORMANCE TREND (§12/§13).
 *
 * Published assessments over time in the Student green primary accent
 * (colour = identity). The y-domain adapts to the real marks band so
 * honest differences stay readable — the plotted values themselves are
 * always the full, unrounded percentages from the canonical results.
 * The insight sentence is mathematically derived from the same points
 * (never motivational filler); with < 2 published assessments the
 * section explains itself instead of inventing history.
 */

import { TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { fmtPct, type TrendPoint } from '@/lib/store/student-results-store'

interface TrendProps {
  points: TrendPoint[]
  insight: string | null
}

export function Trend({ points, insight }: TrendProps) {
  const n = points.length

  // Adaptive y-domain: the real band ± padding, clamped to 0–100.
  const values = points.map((p) => p.pct)
  const lo = Math.max(0, Math.floor(Math.min(...values) - 8))
  const hi = Math.min(100, Math.ceil(Math.max(...values) + 6))
  const span = Math.max(10, hi - lo)
  const yOf = (v: number) => ((hi - v) / span) * 100
  const xAt = (i: number) => (n > 1 ? 4 + (i / (n - 1)) * 92 : 50)

  const linePath =
    n > 1 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yOf(p.pct).toFixed(2)}`).join(' ') : ''
  const areaPath = n > 1 ? `${linePath} L ${(4 + 92).toFixed(2)} 100 L 4 100 Z` : ''
  const gridLines = [0.25, 0.5, 0.75].map((f) => Math.round(lo + span * f))

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">My Performance Trend</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {n > 0 ? `Overall percentage · ${n} published assessment${n === 1 ? '' : 's'}` : 'Published assessments over time'}
          </p>
        </div>
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
          {/* Chart — role=img with the full series serialized for SRs */}
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

            {points.map((p, i) => (
              <div
                key={p.assessmentId}
                className="absolute"
                style={{ left: `${xAt(i)}%`, bottom: `${yOf(p.pct)}%`, transform: 'translate(-50%, 50%)' }}
                aria-hidden
              >
                <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-[3px] ring-background" />
                <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold tabular-nums text-foreground/75">
                  {fmtPct(p.pct)}%
                </span>
              </div>
            ))}
          </div>

          {/* X labels — aligned with the dots */}
          <div className="relative mx-1 mt-2.5 h-8">
            {points.map((p, i) => (
              <span
                key={p.assessmentId}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-medium tabular-nums text-muted-foreground"
                style={{ left: `${xAt(i)}%` }}
              >
                {p.label}
                <span className="mt-0.5 block text-center text-[9px] text-muted-foreground/60">{p.grade}</span>
              </span>
            ))}
          </div>
        </>
      )}

      {insight && (
        <div className="mt-3 flex items-center gap-2 border-t border-border/70 pt-3.5">
          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <p className="text-xs text-muted-foreground">{insight}</p>
        </div>
      )}
    </GlassCard>
  )
}
