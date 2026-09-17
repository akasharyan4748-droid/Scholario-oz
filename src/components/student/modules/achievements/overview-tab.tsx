'use client'

/**
 * OverviewTab — RECENT ACHIEVEMENTS (latest 5, compact rows) →
 * CATEGORIES (real-count chip row that filters the list) →
 * ALL ACHIEVEMENTS (the full filtered list). Every count derives
 * from the growth store at render time.
 */

import { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { cn } from '@/lib/utils'
import { useStudentGrowthStore, categoriesOf } from '@/lib/store/student-growth-store'
import type { GrowthAchievement, GrowthCategory } from '@/lib/store/student-growth-store'
import { AchievementCard } from './achievement-card'
import { CATEGORY_META, GrowthEmptyState } from './shared'

interface OverviewTabProps {
  onOpen: (achievement: GrowthAchievement) => void
}

export function OverviewTab({ onOpen }: OverviewTabProps) {
  const achievements = useStudentGrowthStore((s) => s.achievements)
  const [filter, setFilter] = useState<GrowthCategory | 'all'>('all')

  const sorted = useMemo(
    () => [...achievements].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)),
    [achievements],
  )
  const recent = sorted.slice(0, 5)
  const presentCategories = useMemo(() => categoriesOf(achievements), [achievements])
  const filtered = useMemo(
    () => (filter === 'all' ? sorted : sorted.filter((a) => a.category === filter)),
    [sorted, filter],
  )

  if (achievements.length === 0) {
    return (
      <GlassCard hover={false} className="on-card">
        <GrowthEmptyState
          icon={Trophy}
          title="Your achievements will appear here."
          note="Awards your school records — and accomplishments you add yourself — will show up in this list."
        />
      </GlassCard>
    )
  }

  return (
    <div className="space-y-5">
      {/* RECENT ACHIEVEMENTS */}
      <section className="space-y-2.5" aria-labelledby="achievements-recent">
        <SectionLabel hint={`${recent.length} latest`}>Recent achievements</SectionLabel>
        <div className="space-y-2">
          {recent.map((a, i) => (
            <AchievementCard key={a.id} achievement={a} onOpen={onOpen} index={i} />
          ))}
        </div>
      </section>

      {/* CATEGORIES — real counts; tapping filters the list below */}
      <section className="space-y-2.5" aria-labelledby="achievements-categories">
        <SectionLabel hint="tap to filter">Categories</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={cn(
              'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors sm:min-h-0 sm:py-1.5',
              filter === 'all'
                ? 'border-primary/40 bg-primary/[0.08] text-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
            )}
          >
            All · {achievements.length}
          </button>
          {presentCategories.map((c) => {
            const meta = CATEGORY_META[c]
            const Icon = meta.icon
            const count = achievements.filter((a) => a.category === c).length
            const selected = filter === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(selected ? 'all' : c)}
                aria-pressed={selected}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors sm:min-h-0 sm:py-1.5',
                  selected
                    ? 'border-primary/40 bg-primary/[0.08] text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {meta.label} · {count}
              </button>
            )
          })}
        </div>
      </section>

      {/* ALL ACHIEVEMENTS */}
      <section className="space-y-2.5" aria-labelledby="achievements-all">
        <SectionLabel hint={`${filtered.length} of ${achievements.length}`}>
          {filter === 'all' ? 'All achievements' : `${CATEGORY_META[filter].label} achievements`}
        </SectionLabel>
        <div className="space-y-2">
          {filtered.length > 0 ? (
            filtered.map((a, i) => <AchievementCard key={a.id} achievement={a} onOpen={onOpen} index={i} />)
          ) : (
            <GlassCard hover={false} className="on-card">
              <GrowthEmptyState
                icon={CATEGORY_META[filter].icon}
                title={`Nothing in ${CATEGORY_META[filter].label.toLowerCase()} yet.`}
                note="This list fills up as your school records new awards."
              />
            </GlassCard>
          )}
        </div>
      </section>
    </div>
  )
}
