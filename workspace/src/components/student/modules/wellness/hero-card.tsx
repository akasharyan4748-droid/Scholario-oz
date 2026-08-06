'use client'

import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { wellnessStats } from '@/lib/mock/wellness'

export function WellnessHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-6 sm:p-8 text-white shadow-premium-lg"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur ring-4 ring-white/30">
              <span className="font-display text-3xl font-extrabold">{wellnessStats.wellnessScore}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold shadow-lg ring-2 ring-white/40">
              {wellnessStats.grade}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-rose-50 text-xs font-medium mb-1">
              <Award className="h-3.5 w-3.5 text-amber-300" /> Wellness Score · Grade {wellnessStats.grade}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">Feeling great, Aarav! 💪</h2>
            <p className="text-rose-50/90 text-sm mt-0.5">{wellnessStats.streak} day streak · Best: {wellnessStats.longestStreak} days</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
            <p className="text-2xl font-bold">{wellnessStats.badges.filter((b) => b.earned).length}/{wellnessStats.badges.length}</p>
            <p className="text-[11px] text-rose-50">Badges</p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
            <p className="text-2xl font-bold">{wellnessStats.streak} 🔥</p>
            <p className="text-[11px] text-rose-50">Day Streak</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
