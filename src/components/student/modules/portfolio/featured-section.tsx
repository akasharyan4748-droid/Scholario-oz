'use client'

/**
 * FeaturedSection — the strongest work, front and centre (spec §18).
 *
 * Up to 2 items (the store's toggleFeatured max-2 rule) as generous cards:
 * kind badge + subject accent via subjectColor(), the description, skills
 * and audience context at a glance. The whole card opens the detail view.
 * Violet is the showcase identity of this furniture — restrained tint, no
 * gradient walls.
 */

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SectionLabel } from '@/components/student/shell/page-header'
import type { PortfolioItem } from '@/lib/store/student-growth-store'
import { subjectColor } from '../timetable/subject-colors'
import { FeaturedMark, KindChip, KindTile, OriginChip, VisibilityChip } from './shared'

export function FeaturedSection({ items, onOpen }: {
  items: PortfolioItem[]
  onOpen: (id: string) => void
}) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby="portfolio-featured-label" className="space-y-3">
      <SectionLabel hint={`${items.length} of up to 2`}>
        <span id="portfolio-featured-label">Featured</span>
      </SectionLabel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item, i) => (
          <motion.button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.06, 0.25), duration: 0.25 }}
              aria-label={`View ${item.title}`}
              className="on-card flex w-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left text-slate-800 shadow-2xs transition-all hover:-translate-y-1 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
            >
              <span className="flex flex-wrap items-center gap-1.5">
                <KindChip kind={item.kind} />
                <FeaturedMark />
                <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
                  View
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </span>

              <span className="flex items-start gap-3">
                <KindTile kind={item.kind} subject={item.subject} className="h-12 w-12" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                    {item.title}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {item.subject && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full', subjectColor(item.subject).dot)} aria-hidden />
                        {item.subject}
                      </span>
                    )}
                    {item.subject && <span aria-hidden>·</span>}
                    <span>{formatDate(item.dateISO)}</span>
                  </span>
                </span>
              </span>

              {item.description && (
                <span className="block text-[13px] leading-relaxed text-foreground/85 line-clamp-3">
                  {item.description}
                </span>
              )}

              <span className="flex flex-wrap items-center gap-1.5">
                {item.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
                {item.skills.length > 3 && (
                  <span className="inline-flex items-center rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground/70">
                    +{item.skills.length - 3}
                  </span>
                )}
                <span className="mx-0.5 hidden h-4 w-px bg-border sm:block" aria-hidden />
                <VisibilityChip visibility={item.visibility} />
                {item.origin === 'self' && <OriginChip origin={item.origin} />}
              </span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
