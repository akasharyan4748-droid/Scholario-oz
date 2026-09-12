'use client'

/**
 * results/hero — the selected result's premium summary (§5/§6).
 *
 * An official academic record, not a marketing banner: one white card,
 * subtle border, soft green accents and excellent typography. The
 * composition follows the brief — assessment identity (left), overall
 * score (center), grade & rank (right) — with every value derived from
 * the published result and the school's configured privacy policy
 * (rank disappears entirely when the school hides it, §15).
 */

import { CalendarRange, CheckCircle2, Medal } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { fmtPct, type AssessmentDef, type AssessmentTotals } from '@/lib/store/student-results-store'

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function fullDate(iso: string): string {
  const m = Number(iso.slice(5, 7)) - 1
  return `${Number(iso.slice(8, 10))} ${MONTHS_FULL[m] ?? ''} ${iso.slice(0, 4)}`
}

function rangeLabel(from: string, to: string): string {
  const sameMonth = from.slice(0, 7) === to.slice(0, 7)
  const m1 = MONTHS_FULL[Number(from.slice(5, 7)) - 1]
  const day1 = Number(from.slice(8, 10))
  const day2 = Number(to.slice(8, 10))
  return sameMonth
    ? `${day1}–${day2} ${m1} ${to.slice(0, 4)}`
    : `${day1} ${m1} – ${day2} ${MONTHS_FULL[Number(to.slice(5, 7)) - 1]} ${to.slice(0, 4)}`
}

interface HeroProps {
  assessment: AssessmentDef
  totals: AssessmentTotals
  grade: string
  rank: number | null
  classSize: number
  isLatest: boolean
}

export function Hero({ assessment, totals, grade, rank, classSize, isLatest }: HeroProps) {
  return (
    <GlassCard hover={false} className="on-card overflow-hidden p-0">
      {/* A restrained institutional accent — one hairline, no banners */}
      <div className="h-[3px] w-full bg-gradient-to-r from-primary/70 via-primary/30 to-transparent" aria-hidden />

      <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-0">
        {/* ── Left: assessment identity ─────────────────────────────── */}
        <div className="lg:min-w-[240px] lg:flex-1 lg:pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {assessment.term} · {assessment.type}
            </span>
            {isLatest && (
              <span className="rounded-full border border-primary/30 bg-primary/[0.08] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                Latest
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{assessment.name}</h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
            Conducted {rangeLabel(assessment.conductedFrom, assessment.conductedTo)}
          </p>
          {assessment.publishDate && (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Published {fullDate(assessment.publishDate)}
            </p>
          )}
        </div>

        {/* ── Center: the overall score ─────────────────────────────── */}
        <div className="flex items-center gap-5 border-border/70 lg:border-x lg:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Overall</p>
            <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-primary sm:text-5xl">
              {fmtPct(totals.pct)}
              <span className="ml-0.5 text-2xl font-semibold text-primary/60">%</span>
            </p>
            <p className="mt-1.5 text-sm font-semibold tabular-nums text-foreground">
              {totals.obtained}
              <span className="font-normal text-muted-foreground"> / {totals.max} marks</span>
            </p>
          </div>
        </div>

        {/* ── Right: grade & rank (privacy-gated) ───────────────────── */}
        <div className="flex items-center gap-4 lg:min-w-[180px] lg:flex-1 lg:justify-end lg:pl-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Grade</p>
            <p
              className={cn(
                'mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-xl font-bold',
                'border-primary/25 bg-primary/[0.07] text-primary'
              )}
            >
              {grade}
            </p>
          </div>
          {rank != null && (
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Class Rank</p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-2xl font-bold tabular-nums text-foreground">
                <Medal className="h-5 w-5 text-amber-500" aria-hidden />#{rank}
                <span className="text-sm font-normal text-muted-foreground">of {classSize}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
