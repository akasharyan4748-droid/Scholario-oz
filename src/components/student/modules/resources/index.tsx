'use client'

/**
 * LearningResourcesModule — the LEARNING HUB (spec §7/§8/§66/§67).
 *
 * The student's learning command centre — action, context, progress and
 * discovery FIRST, statistics never (no KPI wall). Every number derives
 * from the canonical `student-learning-store` (+ student-results-store
 * for the weak-subject signal); nothing is hardcoded (§61). Structure:
 *
 *   Learning Hub · Your learning space
 *   ↓ CONTINUE LEARNING      — most recent unfinished resources
 *   ↓ TODAY'S FOCUS          — 3 real facts + cross-tab actions
 *   ↓ SUBJECTS               — subject cards → in-place subject drill-down
 *   ↓ RECOMMENDED FOR YOU    — real reasons from real signals
 *   ↓ RECENTLY STUDIED + SAVED — compact activity strips
 *   ↓ ALL RESOURCES          — contextual search + chips + discovery grid
 *
 * The hub is one connected surface: every action here (study, bookmark,
 * add to plan, revise weak areas) writes the same store the Flashcards
 * and Study Planner tabs read (§71 interconnected actions).
 */

import { useMemo, useState } from 'react'
import {
  useStudentLearningStore,
  continueLearningOf,
  dueStatsOf,
  minutesOn,
  recommendedOf,
  subjectStatsOf,
  tasksDueOn,
  type ResourceType,
} from '@/lib/store/student-learning-store'
import { pctOf, useMyResults } from '@/lib/store/student-results-store'
import { StudentPageHeader, SectionLabel } from '../../shell/page-header'
import { ContinueLearning } from './continue-learning'
import { TodaysFocus } from './todays-focus'
import { SubjectsSection } from './subjects-section'
import { Recommended } from './recommended'
import { RecentSaved } from './recent-saved'
import { ResourceGrid } from './resource-grid'
import { ResourceDetail } from './resource-detail'
import { FilterBar } from './filter-bar'
import { todayKey } from './actions'

interface LearningResourcesModuleProps {
  /** Cross-tab navigation inside the Learning module (planner / flashcards). */
  goToTab: (tab: string) => void
}

export function LearningResourcesModule({ goToTab }: LearningResourcesModuleProps) {
  // ── Canonical data — the only source of truth ──
  const resources = useStudentLearningStore((s) => s.resources)
  const progress = useStudentLearningStore((s) => s.progress)
  const bookmarks = useStudentLearningStore((s) => s.bookmarks)
  const cards = useStudentLearningStore((s) => s.cards)
  const tasks = useStudentLearningStore((s) => s.tasks)
  const sessions = useStudentLearningStore((s) => s.sessions)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<ResourceType | null>(null)
  const [savedOnly, setSavedOnly] = useState(false)
  const [unfinishedOnly, setUnfinishedOnly] = useState(false)

  // ── Results integration (§44) — the 2 weakest subjects of the LATEST
  //    published assessment, own marks only. Permission-safe, real. ──
  const latestResult = useMyResults().latest
  const weakSubjects = useMemo(() => {
    const subjects = latestResult?.result.subjects ?? []
    return subjects
      .map((s) => ({ subject: s.subject, pct: pctOf(s.obtained, s.maxMarks) }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 2)
      .map((x) => x.subject)
  }, [latestResult])

  // ── Hub derivations — selectors over the store, nothing invented ──
  const today = todayKey()
  const todaysTasks = useMemo(() => tasksDueOn(tasks, today), [tasks, today])
  const minutesToday = useMemo(() => minutesOn(sessions, today), [sessions, today])
  const cardsDue = useMemo(() => dueStatsOf(cards).due, [cards])
  const continueItems = useMemo(() => continueLearningOf(resources, progress), [resources, progress])
  const subjectStats = useMemo(() => subjectStatsOf(resources, progress, cards), [resources, progress, cards])
  const recommendedItems = useMemo(
    () => recommendedOf(resources, progress, bookmarks, weakSubjects, 3),
    [resources, progress, bookmarks, weakSubjects],
  )
  const recentItems = useMemo(
    () =>
      resources
        .map((r) => ({ resource: r, pct: progress[r.id]?.pct ?? 0, lastStudiedAt: progress[r.id]?.lastStudiedAt ?? null }))
        .filter((x) => x.lastStudiedAt !== null)
        .sort((a, b) => (a.lastStudiedAt! < b.lastStudiedAt! ? 1 : -1))
        .slice(0, 4)
        .map((x) => ({ resource: x.resource, pct: x.pct, lastStudiedAt: x.lastStudiedAt! })),
    [resources, progress],
  )
  const savedResources = useMemo(
    () => resources.filter((r) => bookmarks.includes(r.id)).slice(0, 4),
    [resources, bookmarks],
  )

  // ── Discovery filters — chips derived from real data (§11) ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return resources.filter((r) => {
      if (q && !`${r.title} ${r.subject} ${r.topic}`.toLowerCase().includes(q)) return false
      if (subjectFilter && r.subject !== subjectFilter) return false
      if (typeFilter && r.type !== typeFilter) return false
      if (savedOnly && !bookmarks.includes(r.id)) return false
      if (unfinishedOnly && (progress[r.id]?.pct ?? 0) >= 100) return false
      return true
    })
  }, [resources, bookmarks, progress, search, subjectFilter, typeFilter, savedOnly, unfinishedOnly])

  const subjectChips = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of resources) map.set(r.subject, (map.get(r.subject) ?? 0) + 1)
    return Array.from(map, ([subject, count]) => ({ subject, count }))
  }, [resources])
  const typeChips = useMemo(() => Array.from(new Set(resources.map((r) => r.type))), [resources])

  const openDetail = (id: string) => setSelectedId(id)

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Context once — no repeated class/session text (§4) */}
      <StudentPageHeader title="Learning Hub" subtitle="Your learning space" />

      <ContinueLearning items={continueItems} onOpen={openDetail} />

      <TodaysFocus
        tasksDue={todaysTasks}
        minutesToday={minutesToday}
        cardsDue={cardsDue}
        goToTab={goToTab}
      />

      <SubjectsSection
        stats={subjectStats}
        resources={resources}
        progress={progress}
        weakSubjects={weakSubjects}
        onOpen={openDetail}
      />

      <Recommended
        items={recommendedItems}
        progress={progress}
        bookmarks={bookmarks}
        weakSubjects={weakSubjects}
        onOpen={openDetail}
      />

      <RecentSaved recent={recentItems} saved={savedResources} savedTotal={bookmarks.length} onOpen={openDetail} />

      {/* Discovery — honest counts derived from the store */}
      <section className="space-y-3">
        <SectionLabel hint={`${resources.length} resources · ${subjectChips.length} subjects`}>
          All resources
        </SectionLabel>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          subjectFilter={subjectFilter}
          onSubjectFilterChange={setSubjectFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          savedOnly={savedOnly}
          onSavedOnlyChange={setSavedOnly}
          unfinishedOnly={unfinishedOnly}
          onUnfinishedOnlyChange={setUnfinishedOnly}
          subjects={subjectChips}
          types={typeChips}
          resultCount={filtered.length}
          totalCount={resources.length}
        />
        <ResourceGrid items={filtered} onOpen={openDetail} />
      </section>

      <ResourceDetail resourceId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
