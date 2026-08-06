'use client'

import { motion } from 'framer-motion'
import { Smile, Target, Quote, BookHeart, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { weeklyReflections } from '@/lib/mock/diary'

// Reflections tab — weekly reflection cards (best moment / challenge / learned / gratitude)
export function ReflectionsTab() {
  return (
    <motion.div
      key="re"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {weeklyReflections.map((ref, i) => (
        <motion.div key={ref.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <GlassCard className="p-3 sm:p-4 lg:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">Weekly Reflection</p>
                <p className="text-[11px] text-muted-foreground">{ref.week}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1.5 flex items-center gap-1">
                  <Smile className="h-3 w-3" /> Best Moment
                </p>
                <p className="text-xs leading-relaxed">{ref.bestMoment}</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1.5 flex items-center gap-1">
                  <Target className="h-3 w-3" /> Challenge
                </p>
                <p className="text-xs leading-relaxed">{ref.challenge}</p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 mb-1.5 flex items-center gap-1">
                  <Quote className="h-3 w-3" /> What I Learned
                </p>
                <p className="text-xs leading-relaxed">{ref.learned}</p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 mb-1.5 flex items-center gap-1">
                  <BookHeart className="h-3 w-3" /> Gratitude
                </p>
                <p className="text-xs leading-relaxed">{ref.gratitude}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
