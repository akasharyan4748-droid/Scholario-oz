'use client'

import { cn } from '@/lib/utils'
import { diaryTabs, type Tab } from './data'

// Reusable tab bar for switching between diary views
export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {diaryTabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
            tab === t.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground'
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}
