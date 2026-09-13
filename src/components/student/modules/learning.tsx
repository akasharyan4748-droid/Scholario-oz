'use client'

/**
 * LearningModule — Learning Hub + Flashcards + Study Planner + Peer Study
 * Groups consolidated into ONE "Learning" destination. Each tab keeps its
 * full existing module (resources library, spaced repetition, planner,
 * study groups) — consolidation of navigation, not of functionality.
 *
 * The Learning Hub tab receives the tab `select` function as `goToTab` so
 * it can deep-navigate cross-tab (Today's Focus → planner / flashcards)
 * without any page round-trip.
 */

import { LearningResourcesModule } from './resources'
import { FlashcardsModule } from './flashcards'
import { StudyPlannerModule } from './study-planner'
import { PeerCollaborationModule } from './peer-collab'
import { ModuleTabBar, ModuleTabPanel, useModuleTab } from './shared-tabs'

const TABS = [
  { key: 'resources', label: 'Learning Hub' },
  { key: 'flashcards', label: 'Flashcards' },
  { key: 'planner', label: 'Study Planner' },
  { key: 'peer', label: 'Study Groups' },
]

export function LearningModule({ initialTab, onTabChange }: {
  initialTab?: string
  onTabChange?: (tab: string) => void
}) {
  const [tab, select] = useModuleTab(initialTab, 'resources', onTabChange)
  return (
    <div className="space-y-5">
      <ModuleTabBar tabs={TABS} active={tab} onSelect={select} ariaLabel="Learning sections" />
      <ModuleTabPanel tabKey={tab}>
        {tab === 'resources' && <LearningResourcesModule goToTab={select} />}
        {tab === 'flashcards' && <FlashcardsModule goToTab={select} />}
        {tab === 'planner' && <StudyPlannerModule />}
        {tab === 'peer' && <PeerCollaborationModule />}
      </ModuleTabPanel>
    </div>
  )
}
