'use client'

/**
 * results/hero — the selected result's headline (§7/§8, second generation,
 * final colour refinement).
 *
 * An academic record with a CONTROLLED MULTI-ACCENT personality — not a
 * green banner, not a gradient banner:
 *   · LEFT — a subtle WARM neutral academic surface (the zone reads as
 *     paper, not as colour) carrying the assessment with its own
 *     assessment-type crest (Unit Test sky · Mid Term violet · Final amber
 *     — the same type language as the history timeline)
 *   · RIGHT — neutral white, where each metric has its own meaning:
 *       percentage → emerald (THE primary metric, student green)
 *       marks     → neutral ink
 *       grade     → violet academic badge (attention grades stay semantic)
 *       rank      → amber medal, privacy-gated
 *   · one derived closing line (real delta / real band — never filler)
 *
 * Every value flows from the published result and the school's privacy
 * policy; rank disappears entirely when hidden (§15).
 */

import { Award, CalendarRange, CheckCircle2, FileCheck2, GraduationCap, Medal, TrendingDown, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { fmtPct, type AssessmentDef, type AssessmentTotals, type AssessmentType } from '@/lib/store/student-results-store'
import { heroGradeBadge } from './grade-tone'

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

/** 1 → 1st, 2 → 2nd, 3 → 3rd, 4 → 4th… (medal language, §14). */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

/** Factual, respectful band line — derived from the real percentage. */
function bandLine(pct: number): string {
  if (pct >= 90) return 'Strong performance across your subjects'
  if (pct >= 80) return 'A solid academic performance'
  if (pct >= 70) return 'A steady academic performance'
  if (pct >= 50) return 'Room to grow — keep practising'
  return 'A fresh assessment is a fresh chance'
}

/** Assessment-type crest — one icon + colour per assessment kind, shared language with the history timeline (§16). */
const TYPE_CREST: Record<AssessmentType, { icon: typeof GraduationCap; tile: string }> = {
  'Unit Test': {
    icon: FileCheck2,
    tile: 'border-sky-500/25 bg-sky-500/[0.08] text-sky-600 dark:text-sky-400',
  },
  'Mid Term': {
    icon: GraduationCap,
    tile: 'border-violet-500/25 bg-violet-500/[0.09] text-violet-600 dark:text-violet-400',
  },
  Final: {
    icon: Award,
    tile: 'border-amber-500/30 bg-amber-500/[0.10] text-amber-600 dark:text-amber-400',
  },
}

interface HeroProps {
  assessment: AssessmentDef
  totals: AssessmentTotals
  grade: string
  rank: number | null
  classSize: number
  isLatest: boolean
  /** Real overall delta vs the previous published assessment (if any). */
  delta: number | null
  previousName: string | null
}

export function Hero({ assessment, totals, grade, rank, classSize, isLatest, delta, previousName }: HeroProps) {
  const crest = TYPE_CREST[assessment.type] ?? TYPE_CREST['Unit Test']
  const CrestIcon = crest.icon
  const topPct = rank != null && classSize > 1 ? Math.max(1, Math.round((rank / classSize) * 100)) : null

  return (
    <GlassCard hover={false} className="on-card overflow-hidden p-0">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(230px,0.85fr)_1.35fr]">
        {/* ── Identity zone — warm academic paper, the assessment's own crest ── */}
        <div className="relative bg-amber-500/[0.04] p-5 sm:p-6 lg:border-r lg:border-border/70">
          <div className="flex items-center gap-3">
            <span
              className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', crest.tile)}
              aria-hidden
            >
              <CrestIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border/80 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {assessment.term} · {assessment.type}
                </span>
                {isLatest && (
                  <span className="rounded-full border border-primary/30 bg-primary/[0.09] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                    Latest
                  </span>
                )}
              </div>
              <h2 className="mt-1.5 truncate text-xl font-bold tracking-tight text-foreground sm:text-[1.35rem]">{assessment.name}</h2>
            </div>
          </div>
          <p className="mt-3.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
            {rangeLabel(assessment.conductedFrom, assessment.conductedTo)}
          </p>
          {assessment.publishDate && (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Published {fullDate(assessment.publishDate)}
            </p>
          )}
        </div>

        {/* ── Score zone — neutral white, each metric with its own colour meaning ── */}
        <div className="flex flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-x-10 gap-y-5 sm:gap-x-12">
            {/* Percentage — THE primary metric, student green */}
            <div className="min-w-[150px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Overall</p>
              <p className="mt-1 text-[2.9rem] font-bold leading-none tabular-nums tracking-tight text-primary sm:text-5xl">
                {fmtPct(totals.pct)}
                <span className="ml-0.5 text-2xl font-semibold text-primary/55">%</span>
              </p>
              <p className="mt-2 text-sm font-semibold tabular-nums text-foreground/85">
                {totals.obtained}
                <span className="font-normal text-muted-foreground"> / {totals.max} marks</span>
              </p>
            </div>

            {/* Grade — the violet academic badge (attention grades keep their warning tone) */}
            <div className="flex flex-col items-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Grade</p>
              <span
                className={cn(
                  'mt-1.5 inline-flex h-12 min-w-[3.4rem] items-center justify-center rounded-2xl border px-3 text-xl font-bold tracking-tight',
                  heroGradeBadge(grade),
                )}
              >
                {grade}
              </span>
            </div>

            {/* Rank — the medal treatment (only when permitted) */}
            {rank != null && (
              <div className="flex flex-col">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Class Rank</p>
                <span className="mt-1.5 flex items-center gap-2.5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/[0.14] ring-1 ring-amber-400/35"
                    aria-hidden
                  >
                    <Medal className="h-5 w-5 text-amber-600" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-2xl font-bold leading-none tabular-nums tracking-tight text-foreground">
                      {ordinal(rank)}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      of {classSize} student{classSize === 1 ? '' : 's'}
                      {topPct != null && topPct <= 50 ? ` · top ${topPct}%` : ''}
                    </span>
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* One derived closing line — real delta, real band, never filler */}
          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/60 pt-3.5">
            {delta != null && Math.abs(delta) >= 0.05 && previousName && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-bold tabular-nums',
                  delta > 0 ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
                {delta > 0 ? '+' : '−'}
                {fmtPct(Math.abs(delta))}%
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {delta != null && Math.abs(delta) >= 0.05 && previousName
                ? `${delta > 0 ? 'Improved from' : 'Down from'} ${previousName} · ${bandLine(totals.pct)}`
                : bandLine(totals.pct)}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
