'use client'

import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { playerStats } from '@/lib/mock/gamification'

export function HeroPlayerCard() {
  const xpPct = (playerStats.xp / playerStats.xpToNext) * 100
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-premium-lg"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-amber-300/20 blur-2xl" />
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Player info */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur text-2xl font-display font-bold ring-4 ring-white/30">
              AS
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold shadow-lg ring-2 ring-white/40">
              {playerStats.level}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-violet-100 text-xs font-medium mb-1">
              <Crown className="h-3.5 w-3.5 text-amber-300" />
              Level {playerStats.level} · Scholar
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{playerStats.name}</h2>
            <p className="text-violet-100/90 text-sm mt-0.5">Rank #{playerStats.rank} of {playerStats.totalStudents} · Class 2-A</p>
          </div>
        </div>

        {/* XP progress */}
        <div className="lg:w-80">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-violet-100 font-medium">Level {playerStats.level}</span>
            <span className="text-violet-100 tabular-nums">
              <AnimatedCounter value={playerStats.xp} /> / {playerStats.xpToNext.toLocaleString('en-IN')} XP
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/15 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 shadow-lg shadow-amber-500/30"
            />
          </div>
          <p className="text-violet-100/80 text-[11px] mt-1.5">{Math.round(playerStats.xpToNext - playerStats.xp)} XP to Level {playerStats.level + 1}</p>
        </div>
      </div>
    </motion.div>
  )
}
