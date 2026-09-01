'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Flame, Zap } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { playerStats } from '@/lib/mock/gamification'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function StudyStreak() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5 lg:p-6">
        {/* Decorative warm gradient backdrop (matches streak fire theme) */}
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
          {/* Left: Streak flame + headline */}
          <div className="lg:col-span-5 flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 220 }}
              className="relative shrink-0"
            >
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 blur-md opacity-50 animate-pulse" />
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/30">
                <Flame className="h-9 w-9 sm:h-10 sm:w-10" />
              </div>
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Study Streak
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +4 this week
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight flex items-baseline gap-2">
                <AnimatedCounter value={playerStats.streak} />
                <span className="text-sm font-semibold text-muted-foreground">days 🔥</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Best: <span className="font-semibold text-rose-600 dark:text-rose-400">{playerStats.longestStreak} days</span>
                {' · '}keep going to break your record!
              </p>
            </div>
          </div>

          {/* Middle: Last 14 days mini-calendar */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-500" /> Last 14 days
              </p>
              <p className="text-[10px] text-muted-foreground">Each square = 1 day active</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 14 }).map((_, i) => {
                const isLast = i === 13
                const isActive = i >= 14 - playerStats.streak
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.04, type: 'spring', stiffness: 200 }}
                    whileHover={{ scale: 1.15 }}
                    className={cn(
                      'aspect-square rounded-md flex items-center justify-center text-[9px] font-bold',
                      isActive
                        ? isLast
                          ? 'bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-300/50'
                          : 'bg-gradient-to-br from-amber-400/80 to-orange-500/80 text-white'
                        : 'bg-muted/60 text-muted-foreground/40'
                    )}
                    title={isActive ? 'Active study day' : 'No activity'}
                  >
                    {isActive ? '🔥' : ''}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Right: Streak rewards + CTA */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-center">
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Next Reward</p>
              <p className="font-display text-lg font-bold mt-0.5">30 days</p>
              <p className="text-[10px] text-muted-foreground">+250 XP bonus</p>
            </div>
            <button
              onClick={() => toast.success('Streak secured for today!', { description: 'Come back tomorrow to extend your streak 🔥' })}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-[0.97] transition-all"
            >
              Claim Today
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
