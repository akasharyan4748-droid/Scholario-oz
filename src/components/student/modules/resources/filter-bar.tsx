'use client'

/**
 * FilterBar — compact discovery controls (spec §11, §51).
 *
 * ONE contextual search ("Search your resources…") + subject chips and
 * type chips DERIVED from the resources actually in the store (with the
 * subjectColor dot, never colour alone) + "Saved" / "Unfinished" toggle
 * chips + an honest filtered count. No huge filter panels; no hardcoded
 * subject/type constants (the old data.tsx lists are gone).
 */

import { Bookmark, CircleDot, Search } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import type { ResourceType } from '@/lib/store/student-learning-store'
import { TYPE_META } from './type-meta'

interface FilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  subjectFilter: string | null
  onSubjectFilterChange: (v: string | null) => void
  typeFilter: ResourceType | null
  onTypeFilterChange: (v: ResourceType | null) => void
  savedOnly: boolean
  onSavedOnlyChange: (v: boolean) => void
  unfinishedOnly: boolean
  onUnfinishedOnlyChange: (v: boolean) => void
  subjects: Array<{ subject: string; count: number }>
  types: ResourceType[]
  resultCount: number
  totalCount: number
}

function Chip({ active, onClick, children, ariaLabel }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:min-h-9',
        active
          ? 'bg-primary text-primary-foreground shadow-xs'
          : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function FilterBar({
  search,
  onSearchChange,
  subjectFilter,
  onSubjectFilterChange,
  typeFilter,
  onTypeFilterChange,
  savedOnly,
  onSavedOnlyChange,
  unfinishedOnly,
  onUnfinishedOnlyChange,
  subjects,
  types,
  resultCount,
  totalCount,
}: FilterBarProps) {
  const anyFilter =
    search.trim() !== '' ||
    subjectFilter !== null ||
    typeFilter !== null ||
    savedOnly ||
    unfinishedOnly

  return (
    <GlassCard hover={false} className="on-card space-y-3 p-3 sm:p-4">
      {/* The one search (§51 — contextual, compact) */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search your resources…"
          aria-label="Search your resources"
          className="h-11 w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 sm:h-10"
        />
      </div>

      {/* Subjects — derived from the store, dot + label */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={subjectFilter === null} onClick={() => onSubjectFilterChange(null)}>
          All subjects
        </Chip>
        {subjects.map(({ subject, count }) => (
          <Chip
            key={subject}
            active={subjectFilter === subject}
            onClick={() => onSubjectFilterChange(subjectFilter === subject ? null : subject)}
            ariaLabel={`Filter to ${subject} — ${count} resources`}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', subjectColor(subject).dot)} aria-hidden />
            {subject}
            <span className="tabular-nums opacity-60">{count}</span>
          </Chip>
        ))}
      </div>

      {/* Types + saved / unfinished toggles */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={typeFilter === null} onClick={() => onTypeFilterChange(null)}>
          All types
        </Chip>
        {types.map((t) => {
          const Icon = TYPE_META[t].icon
          return (
            <Chip
              key={t}
              active={typeFilter === t}
              onClick={() => onTypeFilterChange(typeFilter === t ? null : t)}
            >
              <Icon className="h-3 w-3" aria-hidden />
              {TYPE_META[t].label}
            </Chip>
          )
        })}
        <span className="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden />
        <Chip
          active={savedOnly}
          onClick={() => onSavedOnlyChange(!savedOnly)}
          ariaLabel="Show only saved resources"
        >
          <Bookmark className="h-3 w-3" aria-hidden />
          Saved
        </Chip>
        <Chip
          active={unfinishedOnly}
          onClick={() => onUnfinishedOnlyChange(!unfinishedOnly)}
          ariaLabel="Show only unfinished resources"
        >
          <CircleDot className="h-3 w-3" aria-hidden />
          Unfinished
        </Chip>
      </div>

      {anyFilter && (
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {resultCount} of {totalCount} resources shown
        </p>
      )}
    </GlassCard>
  )
}
