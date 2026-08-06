import { cn } from '@/lib/utils'
import { STATUS_TABS, type ActiveTab } from './types'

interface StatusTabsProps {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  statusCounts: Record<string, number>
}

// Status filter tabs
export function StatusTabs({ activeTab, setActiveTab, statusCounts }: StatusTabsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b">
      {STATUS_TABS.map((tab) => {
        const count = statusCounts[tab.key] || 0
        const isActive = activeTab === tab.key
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/60'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
            <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-bold', isActive ? 'bg-primary-foreground/20' : 'bg-muted')}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
