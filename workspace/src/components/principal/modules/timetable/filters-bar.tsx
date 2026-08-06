'use client'

// Filters bar: class dropdown, faculty dropdown, and day selector pills.
// Pure presentational component — receives current filter values + setters.

import { Filter } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { teachers } from '@/lib/mock/teachers'
import { cn } from '@/lib/utils'
import { CLASSES, DAYS, type DayType } from './data'

interface FiltersBarProps {
  selectedClass: string
  setSelectedClass: (v: string) => void
  selectedTeacher: string
  setSelectedTeacher: (v: string) => void
  selectedDay: DayType
  setSelectedDay: (d: DayType) => void
}

export function FiltersBar({
  selectedClass,
  setSelectedClass,
  selectedTeacher,
  setSelectedTeacher,
  selectedDay,
  setSelectedDay,
}: FiltersBarProps) {
  return (
    <GlassCard className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold text-foreground">Filter By:</span>
        </div>

        {/* Class Filter */}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Classes</option>
          {CLASSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Teacher Filter */}
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Faculty</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.name}>{t.name} ({t.department})</option>
          ))}
        </select>
      </div>

      {/* Day Selectors */}
      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl overflow-x-auto max-w-full">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              selectedDay === d
                ? 'bg-background text-primary shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>
    </GlassCard>
  )
}
