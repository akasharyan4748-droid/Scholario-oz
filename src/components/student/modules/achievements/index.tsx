'use client'

import { Trophy } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { badges, playerStats } from '@/lib/mock/gamification'
import { HeroPlayerCard } from './hero-card'
import { StatCards } from './stat-cards'
import { LeaderboardSection } from './leaderboard'
import { BadgeCollection } from './badge-collection'
import { DailyQuests } from './daily-quests'

export function AchievementsModule() {
  const xpPct = (playerStats.xp / playerStats.xpToNext) * 100
  const earnedBadges = badges.filter((b) => b.earned)

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Achievements & Leaderboard"
        subtitle="Track your progress, earn badges, and climb the ranks"
        icon={<Trophy className="h-5 w-5" />}
      />

      <HeroPlayerCard />

      <StatCards />

      <LeaderboardSection xpPct={xpPct} />

      <BadgeCollection earnedBadges={earnedBadges} />

      <DailyQuests />
    </div>
  )
}
