'use client'

import { Search, Filter } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { Resource } from '@/lib/mock/resources'
import { subjectFilters, typeFilters, typeConfig } from './data'

interface FilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  subjectFilter: string
  onSubjectFilterChange: (v: string) => void
  typeFilter: string
  onTypeFilterChange: (v: string) => void
}

export function FilterBar({
  search,
  onSearchChange,
  subjectFilter,
  onSubjectFilterChange,
  typeFilter,
  onTypeFilterChange,
}: FilterBarProps) {
  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search resources by title or description…"
            className="w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium"><Filter className="h-3 w-3" /> Subject:</span>
          {subjectFilters.map((s) => (
            <button
              key={s}
              onClick={() => onSubjectFilterChange(s)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                subjectFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">Type:</span>
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => onTypeFilterChange(t)}
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors',
                typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {t !== 'All' && typeConfig[t as Resource['type']].icon}
              {t}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
