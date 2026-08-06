'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { collaborationStats } from '@/lib/mock/peer-collab'

export function HeroCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white shadow-premium-lg"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-violet-50/80 text-xs font-medium flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Peer Helper Badge
          </p>
          <h2 className="font-display text-2xl font-extrabold">You're a Super Helper! 🌟</h2>
          <p className="text-violet-50/70 text-sm mt-0.5">Ranked #3 most helpful in Class 2-A · {collaborationStats.streak} day streak</p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-2 text-center">
            <p className="font-display text-xl font-bold">{collaborationStats.resourcesShared}</p>
            <p className="text-[10px] text-violet-50">shared</p>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-2 text-center">
            <p className="font-display text-xl font-bold">{collaborationStats.totalDownloads}</p>
            <p className="text-[10px] text-violet-50">downloads</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
