'use client'

/**
 * Learning (L2D) — THE student academic hub (spec §3-§4): ONE destination
 * where the student studies. Internal tabs Overview | Flashcards | Planner
 * | Groups (spec §53 — concise labels, no "Learning Hub" verbosity). Every
 * tab is server-backed real data (spec §13): resources from the
 * server-authorized StudyMaterial repository, spaced-repetition state on
 * the server, planner tasks in the DB, moderated study groups. The shell
 * adds NO big module title — the workspace header is the WHERE-AM-I and
 * the Overview's search hero is the page's single identity (spec §6).
 */

import { LearningOverview } from './learning/overview'
import { FlashcardsTab } from './learning/flashcards'
import { PlannerTab } from './learning/planner'
import { GroupsTab } from './learning/groups'
import { ModuleTabBar, ModuleTabPanel, useModuleTab } from './shared-tabs'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'flashcards', label: 'Flashcards' },
  { key: 'planner', label: 'Planner' },
  { key: 'groups', label: 'Groups' },
]

export function LearningModule({ initialTab, onTabChange }: {
  initialTab?: string
  onTabChange?: (tab: string) => void
}) {
  const [tab, select] = useModuleTab(initialTab, 'overview', onTabChange)
  return (
    <div className="space-y-5">
      <ModuleTabBar tabs={TABS} active={tab} onSelect={select} ariaLabel="Learning sections" />
      <ModuleTabPanel tabKey={tab}>
        {tab === 'overview' && <LearningOverview onOpenTab={select} />}
        {tab === 'flashcards' && <FlashcardsTab />}
        {tab === 'planner' && <PlannerTab />}
        {tab === 'groups' && <GroupsTab />}
      </ModuleTabPanel>
    </div>
  )
}
