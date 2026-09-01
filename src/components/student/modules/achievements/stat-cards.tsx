'use client'

import { motion } from 'framer-motion'
import { Trophy, Flame, Medal, Coins } from 'lucide-react'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { playerStats } from '@/lib/mock/gamification'
import { cn } from '@/lib/utils'

export function StatCards() {
  const stats = [
    { label: 'Current Rank', value: playerStats.rank, suffix: '', icon: <Trophy className="h-5 w-5" />, accent: 'amber' as const, sub: `of ${playerStats.totalStudents} students` },
    { label: 'Badges Earned', value: playerStats.badgesEarned, suffix: `/${playerStats.badgesTotal}`, icon: <Medal className="h-5 w-5" />, accent: 'violet' as const, sub: '50% complete' },
    { label: 'Day Streak', value: playerStats.streak, suffix: ' 🔥', icon: <Flame className="h-5 w-5" />, accent: 'rose' as const, sub: `best: ${playerStats.longestStreak} days` },
    { label: 'Scholar Coins', value: playerStats.coins, icon: <Coins className="h-5 w-5" />, accent: 'amber' as const, sub: 'redeem for rewards' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((k, i) => (
        <motion.div
          key={k.label}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: i * 0.06 }}
          whileHover={{ y: -4 }}
          className="glass rounded-2xl p-4 sm:p-5 shadow-premium hover:shadow-premium-lg transition-shadow"
        >
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl mb-3',
            k.accent === 'amber' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            k.accent === 'violet' && 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
            k.accent === 'rose' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          )}>
            {k.icon}
          </div>
          <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
          <p className="font-display text-2xl font-bold tracking-tight mt-1">
            <AnimatedCounter value={k.value} suffix={k.suffix} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</p>
        </motion.div>
      ))}
    </div>
  )
}
