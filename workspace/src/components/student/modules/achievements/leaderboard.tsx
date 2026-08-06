'use client'

import { motion } from 'framer-motion'
import { Crown, Zap, Star, ChevronUp, Minus } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { AreaTrend, RadialGauge } from '@/components/shared/charts'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { leaderboard, xpHistory } from '@/lib/mock/gamification'
import { cn } from '@/lib/utils'

interface Props {
  xpPct: number
}

export function LeaderboardSection({ xpPct }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Leaderboard */}
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" /> Class Leaderboard
          </h3>
          <StatusBadge status="Updated daily" variant="success" dot />
        </div>
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {leaderboard.map((entry, i) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                entry.isCurrentUser
                  ? 'bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 ring-1 ring-violet-500/30'
                  : 'hover:bg-accent/50'
              )}
            >
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                entry.rank === 1 && 'bg-amber-400/20 text-amber-600',
                entry.rank === 2 && 'bg-slate-300/30 text-slate-600 dark:text-slate-300',
                entry.rank === 3 && 'bg-orange-400/20 text-orange-600',
                entry.rank > 3 && 'bg-muted text-muted-foreground'
              )}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
              </div>
              <GradientAvatar name={entry.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium truncate', entry.isCurrentUser && 'text-violet-600 dark:text-violet-400')}>
                    {entry.name}{entry.isCurrentUser && ' (You)'}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">Roll #{entry.rollNo} · {entry.badges} badges</p>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                {entry.trend === 'up' && <ChevronUp className="h-3 w-3 text-emerald-500" />}
                {entry.trend === 'down' && <ChevronUp className="h-3 w-3 text-rose-500 rotate-180" />}
                {entry.trend === 'same' && <Minus className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-sm font-bold tabular-nums">{entry.xp.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-muted-foreground">XP · Lv {entry.level}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* XP trend + level gauge */}
      <div className="space-y-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Weekly XP
          </h3>
          <AreaTrend data={xpHistory} xKey="week" yKey="xp" color="oklch(0.65 0.16 75)" height={160} gradientId="xpGrad" />
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-amber-500/10 py-2">
              <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">
                <AnimatedCounter value={3620} />
              </p>
              <p className="text-[10px] text-muted-foreground">Total XP</p>
            </div>
            <div className="rounded-xl bg-violet-500/10 py-2">
              <p className="font-display text-lg font-bold text-violet-600 dark:text-violet-400">
                <AnimatedCounter value={640} />
              </p>
              <p className="text-[10px] text-muted-foreground">Best Week</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5 flex flex-col items-center">
          <h3 className="font-semibold text-sm mb-2 self-start flex items-center gap-2">
            <Star className="h-4 w-4 text-violet-500" /> Level Progress
          </h3>
          <RadialGauge value={Math.round(xpPct)} label="to next level" size={150} color="oklch(0.6 0.2 300)" />
        </GlassCard>
      </div>
    </div>
  )
}
