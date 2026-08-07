'use client'

/**
 * SegmentedTabs — the universal tab navigation component for the entire ERP.
 *
 * Design language (adopted from the Teachers module):
 *   Container: inline-flex, h-9, p-1, gap-1, rounded-full, bg-muted/60
 *   Active:    bg-white (or bg-card in dark), shadow-sm, text-foreground, rounded-full
 *   Inactive:  text-muted-foreground, hover:text-foreground, transparent bg
 *   Transition: 200ms ease
 *
 * Supports optional badge counts per tab.
 *
 * Usage:
 *   <SegmentedTabs
 *     tabs={[{ value: 'directory', label: 'Directory', badge: 24 }]}
 *     value={activeTab}
 *     onValueChange={setActiveTab}
 *   />
 *
 * This is the SINGLE source of truth for segmented tab navigation.
 * Every module must import this component — no duplicate implementations.
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface SegmentedTab {
  value: string
  label: string
  icon?: ReactNode
  badge?: number | string
  disabled?: boolean
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function SegmentedTabs({
  tabs, value, onValueChange, className,
}: SegmentedTabsProps) {
  return (
    <div
      className={cn(
        'inline-flex h-9 p-1 gap-1 rounded-full bg-muted/60',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = value === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onValueChange(tab.value)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
              isActive
                ? 'bg-white dark:bg-white/10 shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              tab.disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  'ml-0.5 text-[10px] px-1.5 py-0',
                  isActive
                    ? 'bg-muted/80 text-muted-foreground'
                    : 'bg-muted/60 text-muted-foreground',
                )}
              >
                {tab.badge}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}
