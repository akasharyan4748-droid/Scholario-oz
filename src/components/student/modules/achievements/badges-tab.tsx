'use client'

/**
 * BadgesTab — the badge grid. Rules are evaluated LIVE (badge-rules.ts)
 * against the real learning/attendance/results stores: earned state is
 * never stored, never faked. Unearned badges show their REAL progress
 * ("1 of 2 Science resources completed") or a factual note (rank).
 * No XP, no coins, no leaderboard, no daily quests.
 */

import { motion } from 'framer-motion'
import { BadgeCheck, Lock } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '@/components/student/shell/page-header'
import { cn } from '@/lib/utils'
import type { BadgeTier } from './badge-rules'
import type { EvaluatedBadge } from './badge-rules'

const TIER_META: Record<BadgeTier, { label: string; ring: string; labelChip: string }> = {
  common: {
    label: 'Common',
    ring: 'border-border',
    labelChip: 'border-border bg-muted/40 text-muted-foreground',
  },
  rare: {
    label: 'Rare',
    ring: 'border-violet-500/40',
    labelChip: 'border-violet-500/25 bg-violet-500/[0.07] text-violet-700 dark:text-violet-300',
  },
  epic: {
    label: 'Epic',
    ring: 'border-amber-500/45',
    labelChip: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300',
  },
}

export function BadgesTab({ badges }: { badges: EvaluatedBadge[] }) {
  const earnedCount = badges.filter((b) => b.result.earned).length

  return (
    <div className="space-y-3">
      <SectionLabel hint={`${earnedCount} of ${badges.length} earned`}>Badges</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge, i) => {
          const tier = TIER_META[badge.tier]
          const Icon = badge.icon
          const earned = badge.result.earned
          const progress = badge.result.progress
          const pct =
            progress && progress.goal > 0 ? Math.min(100, Math.round((progress.current / progress.goal) * 100)) : 0
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.25), duration: 0.2 }}
            >
              <GlassCard
                hover={false}
                className={cn('on-card flex h-full flex-col p-4', earned ? tier.ring : 'border-dashed')}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border',
                      earned
                        ? 'border-primary/30 bg-primary/[0.08] text-primary'
                        : 'border-border bg-muted/40 text-muted-foreground/60',
                    )}
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-sm font-semibold text-foreground">{badge.name}</h3>
                      <span className={cn('rounded-full border px-1.5 py-px text-[10px] font-medium', tier.labelChip)}>
                        {tier.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{badge.description}</p>
                  </div>
                </div>

                {earned ? (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {badge.result.earnedHint ?? 'Earned'}
                  </div>
                ) : (
                  <div className="mt-3 space-y-1.5">
                    {progress ? (
                      <>
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-label={`${badge.name} progress`}
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          {progress.current} of {progress.goal} {progress.unit}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {badge.result.note ?? 'Not earned yet'}
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
