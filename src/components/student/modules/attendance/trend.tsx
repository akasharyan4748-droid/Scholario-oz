'use client'

/**
 * attendance/trend — the "improving or declining?" answer (§14, §15).
 *
 * A custom, dependency-free area chart in the Timetable's visual language:
 * soft emerald area, crisp 2px line (non-scaling stroke), one dot + value
 * per recorded week. Points come EXCLUSIVELY from the canonical weekly
 * aggregation — weeks without records simply do not exist on this chart
 * (no synthetic history, no decorative line). The insight sentence is
 * derived from the same real aggregation, never motivational filler.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'

/** Inset so edge dots/labels never clip (chart maps x into 2%–98%). */
const X_MIN = 2
const X_SPAN = 96

export function Trend({ points }: { points: { name: string; v: number }[] }) {
  const n = points.length
  const xAt = (i: number) => (n > 1 ? X_MIN + (i / (n - 1)) * X_SPAN : 50)

  const linePath =
    n > 1 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${(100 - p.v).toFixed(2)}`).join(' ') : ''
  const areaPath = n > 1 ? `${linePath} L ${(X_MIN + X_SPAN).toFixed(2)} 100 L ${X_MIN} 100 Z` : ''

  // Insight — honest, from the last two real weeks only (§15).
  let insight: { icon: typeof TrendingUp; tone: string; text: string } | null = null
  if (n >= 2) {
    const last = points[n - 1].v
    const prev = points[n - 2].v
    const d = last - prev
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
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">Attendance Trend</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Weekly attendance rate · {n} week{n === 1 ? '' : 's'} of records
          </p>
        </div>
      </div>

      {n === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
          Not enough history for a trend yet.
        </div>
      ) : (
        <>
          {/* Chart — role=img: the trend is also fully serialized for SRs */}
          <div
            className="relative mx-1 h-44 sm:h-48"
            role="img"
            aria-label={`Weekly attendance trend: ${points.map((p) => `${p.name} ${p.v}%`).join(', ')}`}
          >
            {[25, 50, 75].map((v) => (
              <div key={v} className="absolute inset-x-0 border-t border-dashed border-border/70" style={{ bottom: `${v}%` }} aria-hidden />
            ))}
            <div className="absolute inset-x-0 bottom-0 border-t border-border" aria-hidden />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="attTrendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
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

            {points.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="absolute"
                style={{ left: `${xAt(i)}%`, bottom: `${p.v}%`, transform: 'translate(-50%, 50%)' }}
                aria-hidden
              >
                <span className="block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums text-foreground/70">
                  {p.v}%
                </span>
              </div>
            ))}
          </div>

          {/* X labels — aligned with the dots */}
          <div className="relative mx-1 mt-2.5 h-4">
            {points.map((p, i) => (
              <span
                key={`${p.name}-${i}`}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums text-muted-foreground"
                style={{ left: `${xAt(i)}%` }}
              >
                {p.name}
              </span>
            ))}
          </div>
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
