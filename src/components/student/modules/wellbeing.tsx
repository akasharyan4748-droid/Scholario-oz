'use client'

/**
 * WellbeingModule — Digital Diary + Wellness consolidated into ONE
 * "My Wellbeing" destination (journal + mood/fitness tracking).
 */

import { DigitalDiaryModule } from './digital-diary'
import { WellnessModule } from './wellness'
import { ModuleTabBar, ModuleTabPanel, useModuleTab } from './shared-tabs'

const TABS = [
  { key: 'diary', label: 'My Diary' },
  { key: 'wellness', label: 'Wellness' },
]

export function WellbeingModule({ initialTab, onTabChange }: {
  initialTab?: string
  onTabChange?: (tab: string) => void
}) {
  const [tab, select] = useModuleTab(initialTab, 'diary', onTabChange)
  return (
    <div className="space-y-5">
      <ModuleTabBar tabs={TABS} active={tab} onSelect={select} ariaLabel="Wellbeing sections" />
      <ModuleTabPanel tabKey={tab}>
        {tab === 'diary' ? <DigitalDiaryModule /> : <WellnessModule />}
      </ModuleTabPanel>
    </div>
  )
}
