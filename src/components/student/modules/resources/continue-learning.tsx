'use client'

/**
 * ContinueLearning — the "Continue where you left off" hero strip (spec §8).
 *
 * VIOLET = study focus / continue (REFINE-1 accent semantics). The hero is
 * the most recently studied unfinished resource (continueLearningOf), with
 * its real progress and a live Continue action; up to two more in-progress
 * resources sit beside it as compact jump-in rows. Every number comes from
 * the store — the strip disappears entirely when nothing is in progress
 * (§67: sections collapse when there is no data).
 */

import { motion } from 'framer-motion'
import { ChevronRight, PlayCircle } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { LearningResource } from '@/lib/store/student-learning-store'
import { TYPE_META, BTN_VIOLET } from './type-meta'

export interface ContinueItem {
  resource: LearningResource
  pct: number
  lastStudiedAt: string
}

interface ContinueLearningProps {
  items: ContinueItem[]
  onOpen: (id: string) => void
}

export function ContinueLearning({ items, onOpen }: ContinueLearningProps) {
  if (items.length === 0) return null

  const [hero, ...rest] = items
  const side = rest.slice(0, 2)
  const sc = subjectColor(hero.resource.subject)
  const HeroIcon = TYPE_META[hero.resource.type].icon

  return (
    <section className="space-y-3">
      <SectionLabel hint={`${items.length} in progress`}>Continue learning</SectionLabel>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* The one thing to pick up right now */}
        <GlassCard
          hover={false}
          className="on-card flex flex-col gap-4 p-4 sm:p-5 lg:col-span-2"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', sc.bg, sc.text)}>
              <HeroIcon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                <span className="truncate">
                  {hero.resource.subject} · {hero.resource.topic}
                </span>
              </p>
              <h3 className="mt-1 truncate text-base font-semibold leading-snug sm:text-lg">{hero.resource.title}</h3>
              <div className="mt-3 flex items-center gap-2.5">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={hero.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${hero.resource.title} progress`}
                >
                  <motion.div
                    className="h-full rounded-full bg-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${hero.pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums text-violet-600 dark:text-violet-400">{hero.pct}%</span>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{formatRelativeTime(hero.lastStudiedAt)}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => onOpen(hero.resource.id)} className={BTN_VIOLET}>
              <PlayCircle className="h-3.5 w-3.5" aria-hidden />
              Continue
            </button>
          </div>
        </GlassCard>

        {/* Next in-progress resources — compact jump-in rows */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {side.map((item) => {
            const Icon = TYPE_META[item.resource.type].icon
            const s = subjectColor(item.resource.subject)
            return (
              <GlassCard key={item.resource.id} hover={false} className="on-card p-0" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <button
                  type="button"
                  onClick={() => onOpen(item.resource.id)}
                  aria-label={`Continue ${item.resource.title} — ${item.pct}% done`}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-accent/40"
                >
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', s.bg, s.text)}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium leading-tight">{item.resource.title}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {item.resource.subject} · {item.pct}%
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </GlassCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
