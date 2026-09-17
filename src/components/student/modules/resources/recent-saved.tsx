'use client'

/**
 * RecentSaved — two compact strips (spec §67 "RECENT / SAVED"):
 *   · Recently studied — last 4 resources by lastStudiedAt, with relative time
 *   · Saved — bookmarked resources (up to 4) with the bookmark mark
 * Rows open the resource detail. Short honest empty states (§57). The
 * whole section collapses when neither strip has data.
 */

import { motion } from 'framer-motion'
import { BookmarkCheck, CheckCircle2, ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { LearningResource } from '@/lib/store/student-learning-store'
import { TYPE_META } from './type-meta'

export interface RecentItem {
  resource: LearningResource
  pct: number
  lastStudiedAt: string
}

interface RecentSavedProps {
  recent: RecentItem[]
  saved: LearningResource[]
  savedTotal: number
  onOpen: (id: string) => void
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-3 py-6 text-center text-xs text-muted-foreground">{text}</p>
}

export function RecentSaved({ recent, saved, savedTotal, onOpen }: RecentSavedProps) {
  if (recent.length === 0 && saved.length === 0) return null

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <SectionLabel>Recently studied</SectionLabel>
        <GlassCard hover={false} className="on-card divide-y divide-border/60 p-0">
          {recent.length === 0 ? (
            <EmptyRow text="Nothing studied yet." />
          ) : (
            recent.map((x, i) => {
              const Icon = TYPE_META[x.resource.type].icon
              const sc = subjectColor(x.resource.subject)
              const completed = x.pct >= 100
              return (
                <motion.button
                  key={x.resource.id}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => onOpen(x.resource.id)}
                  aria-label={`Open ${x.resource.title}`}
                  className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium leading-tight">{x.resource.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                      {x.resource.subject}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {completed ? (
                      <span className="flex items-center justify-end gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        Completed
                      </span>
                    ) : (
                      <span className="block text-[11px] font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                        {x.pct}%
                      </span>
                    )}
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {formatRelativeTime(x.lastStudiedAt)}
                    </span>
                  </span>
                </motion.button>
              )
            })
          )}
        </GlassCard>
      </div>

      <div className="space-y-3">
        <SectionLabel hint={savedTotal > 0 ? `${savedTotal} saved` : undefined}>Saved</SectionLabel>
        <GlassCard hover={false} className="on-card divide-y divide-border/60 p-0">
          {saved.length === 0 ? (
            <EmptyRow text="Nothing saved yet." />
          ) : (
            saved.map((r, i) => {
              const sc = subjectColor(r.subject)
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => onOpen(r.id)}
                  aria-label={`Open saved resource ${r.title}`}
                  className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
                >
                  <BookmarkCheck className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium leading-tight">{r.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', sc.dot)} aria-hidden />
                      {r.subject} · {TYPE_META[r.type].label}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </motion.button>
              )
            })
          )}
        </GlassCard>
      </div>
    </section>
  )
}
