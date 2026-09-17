'use client'

/**
 * TimelineTab — the growth history: achievements grouped by month
 * (timelineOf), newest month first, a subtle left rail with category
 * icons. This is the same data as the Overview list, read as a story.
 */

import { useMemo } from 'react'
import { History, UserRound } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useStudentGrowthStore, timelineOf } from '@/lib/store/student-growth-store'
import type { GrowthAchievement } from '@/lib/store/student-growth-store'
import { awardedByLabel, CATEGORY_META, GrowthEmptyState } from './shared'

interface TimelineTabProps {
  onOpen: (achievement: GrowthAchievement) => void
}

export function TimelineTab({ onOpen }: TimelineTabProps) {
  const achievements = useStudentGrowthStore((s) => s.achievements)
  const months = useMemo(() => timelineOf(achievements), [achievements])

  if (achievements.length === 0) {
    return (
      <GlassCard hover={false} className="on-card">
        <GrowthEmptyState
          icon={History}
          title="Your growth history will appear here."
          note="Each achievement lands on the month it happened."
        />
      </GlassCard>
    )
  }

  return (
    <div className="space-y-5">
      <SectionLabel hint={`${months.length} month${months.length === 1 ? '' : 's'}`}>Growth history</SectionLabel>
      {months.map((month) => (
        <section key={month.monthKey} className="space-y-2.5" aria-label={`Achievements in ${month.label}`}>
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/75">{month.label}</h3>
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {month.items.length} {month.items.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <GlassCard hover={false} className="on-card p-3 sm:p-4">
            <ol className="space-y-1">
              {month.items.map((a) => {
                const meta = CATEGORY_META[a.category]
                const Glyph = a.source === 'self' ? UserRound : meta.icon
                return (
                  <li key={a.id} className="relative pl-6">
                    {/* Subtle left rail: dot + connecting line */}
                    <span
                      className={cn(
                        'absolute left-1 top-[9px] h-2 w-2 rounded-full',
                        a.source === 'self' ? 'bg-muted-foreground/40' : meta.dot,
                      )}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => onOpen(a)}
                      className="flex w-full flex-col gap-0.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border/60 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`View achievement: ${a.title}`}
                    >
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Glyph
                          className={cn('h-3.5 w-3.5 shrink-0', a.source === 'self' ? 'text-muted-foreground' : meta.text)}
                          aria-hidden
                        />
                        <span className="text-[13px] font-semibold text-foreground">{a.title}</span>
                        {a.source === 'self' && (
                          <span className="rounded-full border border-dashed border-border px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                            You added this
                          </span>
                        )}
                      </span>
                      <span className="pl-[22px] text-[11px] text-muted-foreground">
                        {formatDate(a.dateISO)} · {awardedByLabel(a)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </GlassCard>
        </section>
      ))}
    </div>
  )
}
