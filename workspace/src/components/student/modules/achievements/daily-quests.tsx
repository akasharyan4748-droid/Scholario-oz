'use client'

import { motion } from 'framer-motion'
import { Target, Flame } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { dailyQuests, playerStats } from '@/lib/mock/gamification'
import { cn } from '@/lib/utils'

export function DailyQuests() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-500" /> Daily Quests
          <span className="ml-auto text-[11px] font-normal text-muted-foreground">Resets in 6h 24m</span>
        </h3>
        <div className="space-y-3">
          {dailyQuests.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                q.done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card/40'
              )}
            >
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                q.done ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
              )}>
                {q.done ? '✓' : <Target className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', q.done && 'line-through text-muted-foreground')}>{q.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <ProgressBar value={q.progress} max={q.total} color={q.done ? 'oklch(0.6 0.14 162)' : 'var(--primary)'} height={5} />
                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{q.progress}/{q.total}</span>
                </div>
              </div>
              <span className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                q.done ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
              )}>+{q.xp} XP</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-3 py-2.5">
          <span className="text-xs font-medium">Today's XP earned</span>
          <span className="font-display font-bold text-violet-600 dark:text-violet-400">+130 XP</span>
        </div>
      </GlassCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Flame className="h-4 w-4 text-rose-500" /> Streak Calendar
        </h3>
        <div className="mb-4 flex items-center justify-center">
          <div className="text-center">
            <p className="font-display text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-rose-500 to-orange-500">
              {playerStats.streak}
            </p>
            <p className="text-xs text-muted-foreground mt-1">days streak 🔥</p>
          </div>
        </div>
        {/* Mini streak grid - last 28 days */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }).map((_, i) => {
            const active = i >= 28 - playerStats.streak
            const intensity = active ? (Math.sin(i * 0.7) + 1) / 2 : 0
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.015 }}
                className="aspect-square rounded-md"
                style={{
                  background: active
                    ? `oklch(0.6 ${0.12 + intensity * 0.1} ${25 + intensity * 10})`
                    : 'var(--muted)',
                  opacity: active ? 0.6 + intensity * 0.4 : 1,
                }}
                title={active ? 'Active day' : 'No activity'}
              />
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>4 weeks ago</span>
          <span className="flex items-center gap-1">
            <span className="text-rose-500 font-semibold">{playerStats.longestStreak}</span> day best
          </span>
          <span>Today</span>
        </div>
      </GlassCard>
    </div>
  )
}
