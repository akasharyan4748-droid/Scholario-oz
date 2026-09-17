'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Flame } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { wellnessGoals } from '@/lib/mock/wellness'
import { cn } from '@/lib/utils'
import { goalCategoryConfig } from './data'

export function GoalsTab() {
  return (
    <motion.div key="gl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {wellnessGoals.map((g, i) => {
        const cfg = goalCategoryConfig[g.category]
        const isAchieved = g.status === 'achieved'
        return (
          <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg', cfg.color)}>
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-tight">{g.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{g.target}</p>
                </div>
                {isAchieved ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground shrink-0">{g.category}</span>
                )}
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{g.progress}%</span>
                </div>
                <ProgressBar value={g.progress} color={isAchieved ? 'oklch(0.55 0.14 162)' : 'oklch(0.62 0.2 25)'} height={7} />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Flame className="h-3 w-3 text-rose-500" /> {g.streak} day streak
                </span>
                <StatusBadge status={g.status === 'achieved' ? 'Achieved' : g.status === 'on-track' ? 'On Track' : 'Behind'} variant={g.status === 'achieved' ? 'success' : g.status === 'on-track' ? 'info' : 'warning'} />
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
