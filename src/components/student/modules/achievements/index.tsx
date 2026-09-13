'use client'

/**
 * AchievementsModule — the Achievements tab of "My Progress".
 *
 * A compact, honest growth surface: one overview strip of three inline
 * facts (N achievements · N badges earned · N milestones — every number
 * derived live from the growth store / badge rules), a lightweight
 * Overview · Timeline · Badges view switch, and a "+ Add" affordance
 * for self-reported accomplishments.
 *
 * NO XP, no coins, no leaderboard, no daily quests — the mock
 * gamification concepts are gone; badges are real rules over real
 * stores (badge-rules.ts).
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trophy, BadgeCheck, Milestone as MilestoneIcon } from 'lucide-react'
import { StudentPageHeader } from '@/components/student/shell/page-header'
import { cn } from '@/lib/utils'
import { useStudentGrowthStore, type GrowthAchievement } from '@/lib/store/student-growth-store'
import { useBadgeContext, evaluateBadges, BADGE_RULES } from './badge-rules'
import { OverviewTab } from './overview-tab'
import { TimelineTab } from './timeline-tab'
import { BadgesTab } from './badges-tab'
import { AchievementDetail } from './achievement-detail'
import { AddAchievementDialog } from './add-achievement-dialog'
import { FactChip } from './shared'

type View = 'overview' | 'timeline' | 'badges'

const VIEWS: Array<{ key: View; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'badges', label: 'Badges' },
]

export function AchievementsModule() {
  const achievements = useStudentGrowthStore((s) => s.achievements)
  const [view, setView] = useState<View>('overview')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  // Badges are LIVE rules over the real learning/attendance/results
  // stores — never stored earned flags.
  const badgeCtx = useBadgeContext()
  const badges = useMemo(() => evaluateBadges(BADGE_RULES, badgeCtx), [badgeCtx])
  const earnedBadges = badges.filter((b) => b.result.earned).length

  // Milestones = formal recognitions beyond the classroom (school /
  // inter-school scope) — derived, never a stored count.
  const milestones = achievements.filter((a) => a.scope !== 'class').length

  function openDetail(a: GrowthAchievement) {
    setDetailId(a.id)
  }

  return (
    <div className="space-y-5">
      <StudentPageHeader title="Achievements" subtitle="What you've earned this year" />

      {/* Overview strip — three inline facts + the self-report affordance */}
      <div className="flex flex-wrap items-center gap-2">
        <FactChip icon={Trophy}>
          {achievements.length} {achievements.length === 1 ? 'achievement' : 'achievements'}
        </FactChip>
        <FactChip icon={BadgeCheck}>{earnedBadges} badges earned</FactChip>
        <FactChip icon={MilestoneIcon}>
          {milestones} {milestones === 1 ? 'milestone' : 'milestones'}
        </FactChip>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="ml-auto inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add
        </button>
      </div>

      {/* Lightweight view switch */}
      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Achievements views">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
              view === v.key
                ? 'bg-primary/[0.09] text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <motion.div
        key={view}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {view === 'overview' && <OverviewTab onOpen={openDetail} />}
        {view === 'timeline' && <TimelineTab onOpen={openDetail} />}
        {view === 'badges' && <BadgesTab badges={badges} />}
      </motion.div>

      {/* Dialogs */}
      <AchievementDetail achievementId={detailId} onClose={() => setDetailId(null)} />
      <AddAchievementDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
