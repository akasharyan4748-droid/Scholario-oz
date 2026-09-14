'use client'

/**
 * Shared tab bar for the consolidated Student modules (Classwork, Learning,
 * Notices, Progress) — one pill-tab pattern everywhere so the merged
 * modules feel like ONE product decision, not four ad-hoc wrappers.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ModuleTab {
  key: string
  label: string
}

export function ModuleTabBar({ tabs, active, onSelect, ariaLabel }: {
  tabs: ModuleTab[]
  active: string
  onSelect: (key: string) => void
  ariaLabel: string
}) {
  return (
    <div className="border-b border-border">
      <div className="flex gap-1 overflow-x-auto pb-2" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => onSelect(tab.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
              active === tab.key
                ? 'bg-white dark:bg-white/10 shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Tab state for a consolidated module. `initialTab` comes from deep links
 * (e.g. dashboard → "flashcards" → Learning module opens its Flashcards
 * tab); manual tab switches sync back so the panel can remember them.
 */
export function useModuleTab(initialTab: string | undefined, defaultTab: string, onTabChange?: (tab: string) => void) {
  const [tab, setTab] = useState(initialTab ?? defaultTab)
  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab])
  const select = (t: string) => {
    setTab(t)
    onTabChange?.(t)
  }
  return [tab, select] as const
}

/** Fades in the active tab's content (consistent across merged modules). */
export function ModuleTabPanel({ tabKey, children }: {
  tabKey: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  )
}
