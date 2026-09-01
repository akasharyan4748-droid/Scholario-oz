'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { goals } from '@/lib/mock/diary'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { goalCategoryConfig } from './data'

// Goals tab — list of personal/academic/habit goals with progress +/- buttons
export function GoalsTab({
  goalProgress,
  onUpdate,
}: {
  goalProgress: Record<string, number>
  onUpdate: (id: string, delta: number) => void
}) {
  return (
    <motion.div
      key="go"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {goals.map((goal, i) => {
          const progress = goalProgress[goal.id] ?? goal.progress
          const isComplete = progress >= 100
          const cfg = goalCategoryConfig[goal.category]
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg', cfg.color)}>
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-tight">{goal.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{goal.target}</p>
                  </div>
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground shrink-0">{goal.category}</span>
                  )}
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} color={isComplete ? 'oklch(0.55 0.14 162)' : 'oklch(0.6 0.2 300)'} height={7} />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> Due {formatDate(goal.deadline)}
                  </span>
                  {!isComplete && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onUpdate(goal.id, -10)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-xs hover:bg-accent transition-colors"
                      >−</button>
                      <button
                        onClick={() => onUpdate(goal.id, 10)}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                      >+</button>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
