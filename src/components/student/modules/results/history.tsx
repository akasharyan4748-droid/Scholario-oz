'use client'

/**
 * results/history — RESULT HISTORY (§23/§27).
 *
 * Every assessment of the session in one clickable list: published
 * rows (newest first) navigate straight to that result — no separate
 * page round-trip — and upcoming rows state the student-facing
 * expectation ("Result pending") without exposing staff workflow (§4).
 */

import { ChevronRight, Clock3 } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { gradeColor } from '@/lib/format'
import {
  fmtPct,
  totalsOf,
  resultFor,
  type AssessmentDef,
  type AssessmentResult,
  type GradeBand,
  gradeFor,
} from '@/lib/store/student-results-store'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function shortDate(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
}

interface HistoryProps {
  published: AssessmentDef[]
  upcoming: AssessmentDef[]
  results: AssessmentResult[]
  gradeScale: GradeBand[]
  selectedId: string
  onSelect: (id: string) => void
}

export function History({ published, upcoming, results, gradeScale, selectedId, onSelect }: HistoryProps) {
  // Newest published first.
  const rows = [...published].reverse()

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-bold tracking-tight text-foreground">Result History</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">This academic session</p>
      </div>

      <div className="space-y-1.5">
        {rows.map((a) => {
          const r = resultFor(results, a.id)
          const t = r ? totalsOf(r) : null
          const grade = t ? gradeFor(t.pct, gradeScale) : null
          const isActive = a.id === selectedId
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-primary/40 bg-primary/[0.06]'
                  : 'border-border/60 hover:border-border hover:bg-muted/30'
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm', isActive ? 'font-bold text-foreground' : 'font-semibold text-foreground/90')}>
                  {a.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Published {shortDate(a.publishDate!)}</p>
              </div>
              {t && grade && (
                <>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">{fmtPct(t.pct)}%</span>
                  <span
                    className="shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: `${gradeColor(grade)}14`, color: gradeColor(grade), borderColor: `${gradeColor(grade)}35` }}
                  >
                    {grade}
                  </span>
                </>
              )}
              <ChevronRight
                className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground/50')}
                aria-hidden
              />
            </button>
          )
        })}

        {/* Upcoming — the student-facing pending state (§4/§27) */}
        {upcoming.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 px-3 py-2.5"
            aria-label={`${a.name}: result pending`}
          >
            <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-muted-foreground">{a.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                {a.expectedBy ? `Result expected after ${a.expectedBy}` : 'Result pending'}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Pending
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
