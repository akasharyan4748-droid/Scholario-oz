'use client'

/**
 * AchievementCard — the compact record row (Overview's recent strip and
 * full list). Metadata per spec §10: title, category, date, awarded-by,
 * scope, certificate availability ONLY when a certificateId exists.
 * Self-reported records render with a dashed neutral border + neutral
 * glyph + tag so they never look official.
 */

import { motion } from 'framer-motion'
import { ChevronRight, FileText, UserRound } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { GrowthAchievement } from '@/lib/store/student-growth-store'
import { awardedByLabel, CATEGORY_META, CategoryChip, ScopeChip, SelfTag, InPortfolioMark } from './shared'

interface AchievementCardProps {
  achievement: GrowthAchievement
  onOpen: (achievement: GrowthAchievement) => void
  index?: number
}

export function AchievementCard({ achievement, onOpen, index = 0 }: AchievementCardProps) {
  const self = achievement.source === 'self'
  const meta = CATEGORY_META[achievement.category]
  const Glyph = self ? UserRound : meta.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.2 }}
    >
      <GlassCard hover={false} className={cn('on-card p-3 sm:p-3.5', self && 'border-dashed')}>
        <button
          type="button"
          onClick={() => onOpen(achievement)}
          className="flex w-full items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View achievement: ${achievement.title}`}
        >
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11',
              self ? 'bg-muted/50 text-muted-foreground' : meta.tile,
            )}
            aria-hidden
          >
            <Glyph className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-foreground">{achievement.title}</span>
              {self && <SelfTag />}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <CategoryChip category={achievement.category} />
              <ScopeChip scope={achievement.scope} />
              {achievement.certificateId && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/[0.07] px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                  <FileText className="h-3 w-3 shrink-0" aria-hidden />
                  Certificate
                </span>
              )}
              {achievement.inPortfolio && <InPortfolioMark />}
            </span>
            <span className="mt-1 block truncate text-[11px] text-muted-foreground">
              {formatDate(achievement.dateISO)} · {awardedByLabel(achievement)}
            </span>
          </span>
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground sm:h-9 sm:w-9"
            aria-hidden
          >
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      </GlassCard>
    </motion.div>
  )
}
