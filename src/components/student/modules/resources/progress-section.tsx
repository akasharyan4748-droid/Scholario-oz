'use client'

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar, Donut } from '@/components/shared/charts'
import { studyProgress, resources } from '@/lib/mock/resources'

interface ProgressSectionProps {
  completedCount: number
}

export function ProgressSection({ completedCount }: ProgressSectionProps) {
  const completionRate = Math.round((completedCount / resources.length) * 100)

  const progressDonut = [
    { name: 'Completed', value: completedCount, color: 'oklch(0.55 0.14 162)' },
    { name: 'In Progress', value: 4, color: 'oklch(0.65 0.16 75)' },
    { name: 'Not Started', value: resources.length - completedCount - 4, color: 'oklch(0.85 0.01 160)' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Subject-wise Progress
        </h3>
        <div className="space-y-3">
          {studyProgress.map((s, i) => {
            const pct = Math.round((s.completed / s.total) * 100)
            return (
              <motion.div
                key={s.subject}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium">{s.subject}</span>
                  <span className="text-muted-foreground tabular-nums">{s.completed}/{s.total} · {pct}%</span>
                </div>
                <ProgressBar value={s.completed} max={s.total} color={s.color} height={7} />
              </motion.div>
            )
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-3 sm:p-4 lg:p-5 flex flex-col items-center">
        <h3 className="font-semibold text-sm mb-3 self-start">Overall Completion</h3>
        <Donut data={progressDonut} centerValue={`${completionRate}%`} centerLabel="completed" height={180} />
        <div className="mt-3 w-full space-y-1.5">
          {progressDonut.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                {d.name}
              </span>
              <span className="font-semibold">{d.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
