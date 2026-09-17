'use client'

/**
 * ClassworkModule — Homework + Assignments consolidated into ONE learning
 * destination (fewer modules, same working functionality: submit flows,
 * live counters, filters). Deep links still land on the right tab.
 */

import { HomeworkModule } from './homework'
import { AssignmentsModule } from './assignments'
import { ModuleTabBar, ModuleTabPanel, useModuleTab } from './shared-tabs'

const TABS = [
  { key: 'homework', label: 'Homework' },
  { key: 'assignments', label: 'Assignments' },
]

export function ClassworkModule({ initialTab, onTabChange }: {
  initialTab?: string
  onTabChange?: (tab: string) => void
}) {
  const [tab, select] = useModuleTab(initialTab, 'homework', onTabChange)
  return (
    <div className="space-y-5">
      <ModuleTabBar tabs={TABS} active={tab} onSelect={select} ariaLabel="Classwork sections" />
      <ModuleTabPanel tabKey={tab}>
        {tab === 'homework' ? <HomeworkModule /> : <AssignmentsModule />}
      </ModuleTabPanel>
    </div>
  )
}
