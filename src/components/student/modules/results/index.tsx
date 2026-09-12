'use client'

/**
 * ResultsModule — Student "My Results" (COMPLETE REDESIGN).
 *
 * The student's complete academic record for the active session —
 * every number derives from the canonical `student-results-store`
 * (the same set staff publishes), graded through the SCHOOL'S
 * configured scale, privacy-gated by the school's result policy, and
 * identical across Hero / subjects / trend / history / report card
 * (§35: one source, one rounding rule).
 *
 * Reading rhythm (§41/§42): context → assessment selector → hero →
 * subject performance → personal progress & remark → trend & snapshot
 * → history & documents. Sections with insufficient real data collapse
 * entirely instead of showing empty boxes (§45).
 */

import { useMemo, useState } from 'react'
import { Award } from 'lucide-react'
import { GlassCard, PageTransition } from '@/components/shared/ui'
import {
  useMyResults,
  useStudentResultsStore,
  resultFor,
  totalsOf,
  gradeFor,
  type GradeBand,
} from '@/lib/store/student-results-store'
import { useAcademicSession } from '@/lib/academic-session'
import { AssessmentSelector } from './assessment-selector'
import { Hero } from './hero'
import { SubjectPerformance } from './subject-performance'
import { Comparison } from './comparison'
import { Trend } from './trend'
import { Snapshot } from './snapshot'
import { Remark } from './remark'
import { History } from './history'
import { ClassTop } from './class-top'
import { ReportCard } from './report-card'

export function ResultsModule() {
  const ctx = useMyResults()
  const session = useAcademicSession()
  const results = useStudentResultsStore((s) => s.results)
  const gradeScale = ctx.gradeScale as GradeBand[]

  // Selection — the LATEST published result opens by default; the
  // selector/history deep-switch without any page round-trip (§23).
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const effectiveId = selectedId ?? ctx.latest?.assessment.id ?? null

  const selectedIdx = useMemo(
    () => ctx.published.findIndex((a) => a.id === effectiveId),
    [ctx.published, effectiveId],
  )
  const selected = selectedIdx >= 0 ? ctx.published[selectedIdx] : null
  const selectedResult = useMemo(
    () => (selected ? resultFor(results, selected.id) : null),
    [results, selected],
  )

  const selectedTotals = selectedResult ? totalsOf(selectedResult) : null
  const selectedStandings = useMemo(
    () => (selected ? ctx.standings.get(selected.id) ?? [] : []),
    [ctx.standings, selected],
  )
  const myStanding = selectedStandings.find((s) => s.isMe) ?? null

  const previous = selectedIdx > 0 ? ctx.published[selectedIdx - 1] : null
  const previousResult = useMemo(
    () => (previous ? resultFor(results, previous.id) : null),
    [results, previous],
  )

  const identity = {
    name: ctx.student?.name ?? 'Aarav Sharma',
    admissionNo: ctx.student?.admissionNo ?? 'DSO2024058',
    classSection: `${ctx.className}-${ctx.section}`,
    rollNo: ctx.student?.rollNo ?? '18',
  }

  /* ── EMPTY STATE — nothing published for this session yet (§45) ── */
  if (!ctx.latest || !selected || !selectedResult || !selectedTotals) {
    return (
      <PageTransition>
        <div className="space-y-4 sm:space-y-5">
          <ContextHeader
            classLabel={`${ctx.className}-${ctx.section}`}
            section={ctx.section}
            sessionLabel={session.label}
            publishedCount={0}
            upcomingCount={ctx.upcoming.length}
          />
          <GlassCard hover={false} className="on-card px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Award className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm font-semibold">No published results yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {ctx.upcoming.length > 0
                ? `Your school hasn't published any results for ${session.label}. ${ctx.upcoming[0].name} results will appear here once published.`
                : `Your school hasn't published any results for ${session.label} — results appear here automatically once published.`}
            </p>
          </GlassCard>
        </div>
      </PageTransition>
    )
  }

  const showComparison = ctx.showComparison && previous != null && previousResult != null

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-5">
        <ContextHeader
          classLabel={`${ctx.className}-${ctx.section}`}
          section={ctx.section}
          sessionLabel={session.label}
          publishedCount={ctx.published.length}
          upcomingCount={ctx.upcoming.length}
        />

        {/* The one prominent control — which result am I reading? */}
        <AssessmentSelector
          published={ctx.published}
          upcoming={ctx.upcoming}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />

        {/* 1 — the selected result at a glance */}
        <Hero
          assessment={selected}
          totals={selectedTotals}
          grade={gradeFor(selectedTotals.pct, gradeScale)}
          rank={ctx.showRank ? (myStanding?.rank ?? null) : null}
          classSize={selectedStandings.length}
          isLatest={selected.id === ctx.latest.assessment.id}
        />

        {/* 2 — the core: subject-wise performance (remounts per assessment
            so an expanded subject never carries over between results) */}
        <SubjectPerformance
          key={selected.id}
          subjects={selectedResult.subjects}
          gradeFor={(pct) => gradeFor(pct, gradeScale)}
          assessmentName={selected.name}
        />

        {/* 3 — analytical: personal progress + the teacher's remark */}
        {showComparison && previous && previousResult ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Comparison
                current={selected}
                currentResult={selectedResult}
                previous={previous}
                previousResult={previousResult}
              />
            </div>
            <Remark remark={selectedResult.remark} />
          </div>
        ) : (
          <Remark remark={selectedResult.remark} />
        )}

        {/* 4 — analytical: the real trend + derived snapshot */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Trend points={ctx.trend} insight={ctx.insight} />
          </div>
          <Snapshot snapshot={ctx.snapshot} />
        </div>

        {/* 5 — history + documents (class standings only when permitted) */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <History
              published={ctx.published}
              upcoming={ctx.upcoming}
              results={results}
              gradeScale={gradeScale}
              selectedId={selected.id}
              onSelect={setSelectedId}
            />
          </div>
          <div className="space-y-4 sm:space-y-5">
            {ctx.showClassTop && <ClassTop standings={selectedStandings} assessmentName={selected.name} />}
            <ReportCard
              assessment={selected}
              result={selectedResult}
              gradeScale={gradeScale}
              standings={selectedStandings}
              showRank={ctx.showRank}
              reportCardConfig={ctx.reportCard}
              identity={identity}
            />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

/* ── Context header — establishes scope, never repeats the page title ── */

function ContextHeader({
  classLabel,
  section,
  sessionLabel,
  publishedCount,
  upcomingCount,
}: {
  classLabel: string
  section: string
  sessionLabel: string
  publishedCount: number
  upcomingCount: number
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">My Results</p>
      <h2 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
        {classLabel} <span className="font-medium text-muted-foreground">· Section {section}</span>
      </h2>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span>{sessionLabel}</span>
        <span aria-hidden className="text-border">•</span>
        <span>
          {publishedCount} published result{publishedCount === 1 ? '' : 's'}
          {upcomingCount > 0 ? ` · ${upcomingCount} upcoming` : ''}
        </span>
      </div>
    </div>
  )
}
