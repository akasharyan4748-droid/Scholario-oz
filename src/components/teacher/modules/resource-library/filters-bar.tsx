'use client'

import { Search, Filter } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { type TeachingResource } from '@/lib/mock/teacher-resources'
import { typeConfig, subjectFilters } from './data'

export function FiltersBar({
  search, setSearch, subjectFilter, setSubjectFilter, typeFilter, setTypeFilter,
}: {
  search: string
  setSearch: (s: string) => void
  subjectFilter: string
  setSubjectFilter: (s: string) => void
  typeFilter: string
  setTypeFilter: (s: string) => void
}) {
  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by title or topic…"
            className="w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium"><Filter className="h-3 w-3" /> Subject:</span>
          {subjectFilters.map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s)}
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
          <span className="text-[11px] text-muted-foreground font-medium">Type:</span>
          {['All', ...Object.keys(typeConfig)].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {t !== 'All' && typeConfig[t as TeachingResource['type']].icon}
              {t}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
