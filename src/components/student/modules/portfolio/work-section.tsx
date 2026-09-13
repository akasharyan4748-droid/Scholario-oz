'use client'

/**
 * WorkSection — MY WORK: the filterable grid of every portfolio item
 * (spec §18).
 *
 * Kind filter chips are DERIVED from the store (only kinds with ≥1 item
 * appear; "All" is the default) — never a hardcoded kind list. Each card
 * carries the compact metadata: title, kind + subject accent, date, up to
 * 3 skill chips (+N), visibility chip, featured state and a [View] action.
 * Grid: mobile stack / 2 cols from sm / 3 cols from lg.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PortfolioItem, PortfolioKind } from '@/lib/store/student-growth-store'
import { subjectColor } from '../timetable/subject-colors'
import { KIND_META, KIND_ORDER, KindChip, OriginChip, VisibilityChip } from './shared'

type KindFilter = 'all' | PortfolioKind

export function WorkSection({ items, onOpen }: {
  items: PortfolioItem[]
  onOpen: (id: string) => void
}) {
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')

  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0)),
    [items],
  )
  const kinds = useMemo(
    () => KIND_ORDER.filter((k) => items.some((i) => i.kind === k)),
    [items],
  )
  // A kind can disappear while its filter is selected (item removed in the
  // detail dialog) — fall back to All instead of showing an empty grid.
  const effective = kindFilter !== 'all' && kinds.includes(kindFilter) ? kindFilter : 'all'
  const filtered = effective === 'all' ? sorted : sorted.filter((i) => i.kind === effective)

  return (
    <section aria-labelledby="portfolio-work-label" className="space-y-3">
      <SectionLabel hint={effective === 'all' ? `${items.length} items` : `${filtered.length} of ${items.length}`}>
        <span id="portfolio-work-label">My work</span>
      </SectionLabel>

      {/* Kind filter — derived from the store, counts live */}
      <div role="tablist" aria-label="Filter portfolio by kind" className="flex flex-wrap gap-1.5">
        <button
          type="button"
          role="tab"
          aria-selected={effective === 'all'}
          onClick={() => setKindFilter('all')}
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9 sm:py-1.5',
            effective === 'all'
              ? 'border-primary/25 bg-primary/[0.08] text-primary'
              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          All
          <span className="tabular-nums opacity-60">{items.length}</span>
        </button>
        {kinds.map((kind) => {
          const meta = KIND_META[kind]
          const Icon = meta.icon
          const active = effective === kind
          const count = items.filter((i) => i.kind === kind).length
          return (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setKindFilter(active ? 'all' : kind)}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9 sm:py-1.5',
                active
                  ? 'border-primary/25 bg-primary/[0.08] text-primary'
                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {meta.plural}
              <span className="tabular-nums opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.2 }}
          >
            <GlassCard
              hover={false}
              className="on-card flex h-full flex-col gap-2.5 p-4 transition-all hover:-translate-y-0.5 hover:shadow-xs"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <KindChip kind={item.kind} />
                {item.featured && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                    title="Featured"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden />
                    <span className="sr-only">Featured</span>
                    Featured
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className="text-left text-sm font-semibold leading-snug text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-[4px]"
              >
                {item.title}
              </button>

              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {item.subject && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', subjectColor(item.subject).dot)} aria-hidden />
                    {item.subject}
                  </span>
                )}
                {item.subject && <span aria-hidden>·</span>}
                <span>{formatDate(item.dateISO)}</span>
              </p>

              {item.skills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
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
                </div>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                <VisibilityChip visibility={item.visibility} />
                {item.origin === 'self' && <OriginChip origin={item.origin} />}
                <button
                  type="button"
                  onClick={() => onOpen(item.id)}
                  className="ml-auto inline-flex h-11 items-center justify-center gap-0.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8"
                >
                  View
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
