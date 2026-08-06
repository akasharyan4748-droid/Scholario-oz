'use client'

import { Search, FileCheck } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CATEGORIES, FILTERS, type Filter } from './data'

export function FilterBar({
  search, setSearch, filter, setFilter, totalDocs,
}: {
  search: string
  setSearch: (s: string) => void
  filter: Filter
  setFilter: (f: Filter) => void
  totalDocs: number
}) {
  return (
    <>
      {/* Search + filter chips */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name…"
            className="pl-9 h-10"
            aria-label="Search documents"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = f === filter
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  active
                    ? 'border-transparent bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {f}
                {f === 'All' && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                      active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {CATEGORIES.reduce((n, c) => n + c.docs.length, 0)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{totalDocs}</span>{' '}
          {totalDocs === 1 ? 'document' : 'documents'} available
          {search && <span className="text-muted-foreground"> · matching “{search}”</span>}
        </p>
      </div>

      {/* Empty state */}
      {totalDocs === 0 && (
        <GlassCard className="p-10 flex flex-col items-center justify-center text-center" hover={false}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <FileCheck className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-base font-semibold">No documents found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Try a different search term or switch the category filter to see more forms.
          </p>
        </GlassCard>
      )}
    </>
  )
}
