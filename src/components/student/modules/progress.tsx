'use client'

/**
 * ProgressModule — Achievements + Portfolio + Career Explorer consolidated
 * into ONE "My Progress" destination (gamification, showcase, future
 * planning — one growth area instead of three sidebar entries).
 */

import { AchievementsModule } from './achievements'
import { PortfolioModule } from './portfolio'
import { CareerExplorerModule } from './career-explorer'
import { ModuleTabBar, ModuleTabPanel, useModuleTab } from './shared-tabs'

const TABS = [
  { key: 'achievements', label: 'Achievements' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'career', label: 'Careers' },
]

export function ProgressModule({ initialTab, onTabChange }: {
  initialTab?: string
  onTabChange?: (tab: string) => void
}) {
  const [tab, select] = useModuleTab(initialTab, 'achievements', onTabChange)
  return (
    <div className="space-y-5">
      <ModuleTabBar tabs={TABS} active={tab} onSelect={select} ariaLabel="Progress sections" />
      <ModuleTabPanel tabKey={tab}>
        {tab === 'achievements' && <AchievementsModule />}
        {tab === 'portfolio' && <PortfolioModule />}
        {tab === 'career' && <CareerExplorerModule />}
      </ModuleTabPanel>
    </div>
  )
}
