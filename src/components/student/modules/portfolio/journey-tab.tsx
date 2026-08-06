'use client'

import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { growthJourney } from '@/lib/mock/portfolio'

export function JourneyTab() {
  return (
    <motion.div key="jy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-violet-500" /> My Growth Journey
        </h3>
        <p className="text-xs text-muted-foreground mb-5">From Nursery to Class 2 — a story of progress</p>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-violet-500 via-purple-500 to-fuchsia-500" />

          {growthJourney.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex items-start gap-4 mb-6 last:mb-0"
            >
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md ring-4 ring-card">
                <span className="font-display text-xs font-bold">{i + 1}</span>
              </div>
              <div className="flex-1 rounded-xl border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm">{g.grade} <span className="text-muted-foreground font-normal">· {g.year}</span></p>
                  {g.rank && <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">Rank: {g.rank}</span>}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.highlight}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Overall Score</span>
                    <span className="font-semibold">{g.percentage || 0}%</span>
                  </div>
                  <ProgressBar value={g.percentage || 0} color="oklch(0.6 0.2 300)" height={5} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
