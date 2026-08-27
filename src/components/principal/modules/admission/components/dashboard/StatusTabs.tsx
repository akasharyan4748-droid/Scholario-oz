import { SegmentedTabs } from '../../../shared/segmented-tabs'
import { STATUS_TABS, type ActiveTab } from './types'

interface StatusTabsProps {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  statusCounts: Record<string, number>
}

export function StatusTabs({ activeTab, setActiveTab, statusCounts }: StatusTabsProps) {
  return (
    <SegmentedTabs
      tabs={STATUS_TABS.map((tab) => ({
        value: tab.key,
        label: tab.label,
        icon: (() => { const Icon = tab.icon; return <Icon className="h-3.5 w-3.5" /> })(),
        badge: statusCounts[tab.key] || 0,
      }))}
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as ActiveTab)}
    />
  )
}
