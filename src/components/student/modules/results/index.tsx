'use client'

/**
 * ResultsModule — Student "My Results" (SECOND-GENERATION redesign).
 *
 * An academic narrative, not a dashboard stack (§6/§35):
 *
 *   My Results · Your academic performance · [AY 2026–27] [Class 2-A]
 *   ↓ assessment selector
 *   ↓ latest result hero (colour zones, distinct metrics)
 *   ↓ subject performance (rows on the page, Timetable colour system)
 *   ↓ performance trend (interactive points)
 *   ↓ academic insights (derived strip — what actually changed)
 *   ↓ teacher's feedback + result history (the timeline)
 *   ↓ official report card + class standings (secondary, permitted)
 *
 * Context is established ONCE (§5/§32 — non-negotiable): class, section
 * and academic year appear exactly here as quiet chips and nowhere else;
 * the sidebar already carries the student's identity. Every number
 * derives from the canonical `student-results-store` through the
 * school's configured scale and privacy policy. Sections with
 * insufficient data collapse entirely (§44).
 */

import { useMemo, useState } from 'react'
import { Award, CalendarRange, Users } from 'lucide-react'
import { GlassCard, PageTransition } from '@/components/shared/ui'
import {
  useMyResults,
  useStudentResultsStore,
  resultFor,
  totalsOf,
  gradeFor,
  pctOf,
  type GradeBand,
  type SubjectMark,
} from '@/lib/store/student-results-store'
import { useAcademicSession } from '@/lib/academic-session'
import { StudentPageHeader } from '../../shell/page-header'
import { AssessmentSelector } from './assessment-selector'
import { Hero } from './hero'
import { SubjectPerformance } from './subject-performance'
import { Trend } from './trend'
import { Insights, type SubjectMovement } from './insights'
import { Remark } from './remark'
import { History } from './history'
import { ClassStandings } from './class-standings'
import { ReportCard } from './report-card'

/* ── Insight derivations — selected assessment, its own previous ──── */

interface SelectedInsights {
  strongest: { subject: string; pct: number } | null
  needsAttention: { subject: string; pct: number } | null
  mostImproved: { subject: string; delta: number } | null
  movement: SubjectMovement[]
  overallDelta: number | null
}

/** Strongest / focus / improvement — computed from what's on screen. */
function insightsOf(subjects: SubjectMark[], previous: SubjectMark[] | null): SelectedInsights {
  if (subjects.length === 0) {
    return { strongest: null, needsAttention: null, mostImproved: null, movement: [], overallDelta: null }
  }
  const rows = subjects.map((s) => ({ subject: s.subject, pct: pctOf(s.obtained, s.maxMarks) }))
  const sorted = [...rows].sort((a, b) => b.pct - a.pct)
  const strongest = sorted[0] ?? null
  const needsAttention = sorted.length > 1 ? sorted[sorted.length - 1] : null

  let mostImproved: { subject: string; delta: number } | null = null
  let movement: SubjectMovement[] = []
  if (previous) {
    const prevBy = new Map(previous.map((s) => [s.subject, s]))
    movement = subjects
      .filter((s) => prevBy.has(s.subject))
      .map((s) => {
        const p = prevBy.get(s.subject)!
        return { subject: s.subject, from: pctOf(p.obtained, p.maxMarks), to: pctOf(s.obtained, s.maxMarks) }
      })
    for (const m of movement) {
      const delta = m.to - m.from
      if (!mostImproved || delta > mostImproved.delta) mostImproved = { subject: m.subject, delta }
    }
    if (mostImproved && mostImproved.delta <= 0) mostImproved = null
  }

  return { strongest, needsAttention, mostImproved, movement, overallDelta: null }
}

export function ResultsModule() {
  const ctx = useMyResults()
  const session = useAcademicSession()
  const results = useStudentResultsStore((s) => s.results)
  const gradeScale = ctx.gradeScale as GradeBand[]

  // Selection — the LATEST published result opens by default; the
  // selector/history deep-switch without any page round-trip.
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
  const previousTotals = previousResult ? totalsOf(previousResult) : null

  // Overall movement — selected vs its own previous published result.
  const overallDelta =
    selectedTotals && previousTotals ? selectedTotals.pct - previousTotals.pct : null

  // Snapshot-style insights about the SELECTED result (coherent scope).
  const insights = useMemo(
    () => insightsOf(selectedResult?.subjects ?? [], previousResult?.subjects ?? null),
    [selectedResult, previousResult],
  )

  const identity = {
    name: ctx.student?.name ?? 'Aarav Sharma',
    admissionNo: ctx.student?.admissionNo ?? 'DSO2024058',
    classSection: `${ctx.className}-${ctx.section}`,
    rollNo: ctx.student?.rollNo ?? '18',
  }

  /* ── EMPTY STATE — nothing published for this session yet (§44) ── */
  if (!ctx.latest || !selected || !selectedResult || !selectedTotals) {
    return (
      <PageTransition>
        <div className="space-y-6 sm:space-y-7">
          <StudentPageHeader
            title="My Results"
            subtitle="Your academic performance"
            chips={[
              { label: session.label, icon: CalendarRange, tone: 'primary' },
              { label: `${ctx.className}-${ctx.section}`, icon: Users },
            ]}
          />
          <GlassCard hover={false} className="on-card px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Award className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm font-semibold">No published results yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {ctx.upcoming.length > 0
                ? `${ctx.upcoming[0].name} is next — your results appear here automatically once the school publishes them.`
                : 'Your results appear here automatically once the school publishes them.'}
            </p>
          </GlassCard>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-7">
        {/* Scope, once — contextual chips, never repeated below (§5/§32) */}
        <StudentPageHeader
          title="My Results"
          subtitle="Your academic performance"
          chips={[
            { label: session.label, icon: CalendarRange, tone: 'primary', title: 'Active academic session' },
            { label: `${ctx.className}-${ctx.section}`, icon: Users, title: 'Your class and section' },
          ]}
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
          delta={ctx.showComparison ? overallDelta : null}
          previousName={previous?.name ?? null}
        />

        {/* 2 — the core: subject-wise performance (remounts per assessment
            so an expanded subject never carries over between results) */}
        <SubjectPerformance
          key={selected.id}
          subjects={selectedResult.subjects}
          gradeFor={(pct) => gradeFor(pct, gradeScale)}
        />

        {/* 3 — the real trend, interactive point by point */}
        <Trend points={ctx.trend} />

        {/* 4 — what actually changed (derived, respectful) */}
        <Insights
          snapshot={{
            strongest: insights.strongest,
            needsAttention: insights.needsAttention,
            mostImproved: insights.mostImproved,
          }}
          overallDelta={ctx.showComparison ? overallDelta : null}
          previousName={previous?.name ?? null}
          classPosition={ctx.showRank && myStanding ? { rank: myStanding.rank, classSize: selectedStandings.length } : null}
          movement={ctx.showComparison ? insights.movement : []}
        />

        {/* 5 — the human voice + the academic timeline */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Remark remark={selectedResult.remark} />
          </div>
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
        </div>

        {/* 6 — the official document + standings (secondary, permitted) */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
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
          <div className="lg:col-span-1">
            {ctx.showClassTop && <ClassStandings standings={selectedStandings} />}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
