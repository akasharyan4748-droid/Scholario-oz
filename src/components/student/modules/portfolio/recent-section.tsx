'use client'

/**
 * RecentSection — compact last-3 timeline rows of the newest portfolio
 * items. Quiet furniture: date + kind dot + title (+ subject), one tap
 * opens the detail. Hidden entirely when there is no work.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PortfolioItem } from '@/lib/store/student-growth-store'
import { KIND_META } from './shared'

export function RecentSection({ items, onOpen }: {
  items: PortfolioItem[]
  onOpen: (id: string) => void
}) {
  const recent = useMemo(
    () =>
      [...items]
        .sort((a, b) => (a.dateISO < b.dateISO ? 1 : a.dateISO > b.dateISO ? -1 : 0))
        .slice(0, 3),
    [items],
  )

  if (recent.length === 0) return null

  return (
    <section aria-labelledby="portfolio-recent-label" className="space-y-3">
      <SectionLabel hint="latest 3">
        <span id="portfolio-recent-label">Recent</span>
      </SectionLabel>

      <GlassCard hover={false} className="on-card divide-y divide-border/60 p-0">
        {recent.map((item, i) => {
          const meta = KIND_META[item.kind]
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.2), duration: 0.2 }}
              aria-label={`View ${item.title}`}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
            >
              <span className="w-[86px] shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatDate(item.dateISO)}
              </span>
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">{item.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {meta.label}
                  {item.subject ? ` · ${item.subject}` : ''}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
            </motion.button>
          )
        })}
      </GlassCard>
    </section>
  )
}
