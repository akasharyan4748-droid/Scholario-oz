'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Rocket } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { careerRoadmap } from '@/lib/mock/career'
import { cn } from '@/lib/utils'

export function RoadmapTab() {
  return (
    <motion.div key="rm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-violet-500" /> Your Career Roadmap
        </h3>
        <p className="text-xs text-muted-foreground mb-5">From discovery to your dream career — here's your journey</p>

        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-violet-500" />

          {careerRoadmap.map((m, i) => {
            const isCompleted = m.status === 'completed'
            const isCurrent = m.status === 'current'
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn('relative flex items-start gap-4 mb-6 last:mb-0', isCurrent && 'bg-amber-500/5 -mx-2 px-2 py-2 rounded-lg')}
              >
                <div className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-card',
                  isCompleted && 'bg-emerald-500 text-white',
                  isCurrent && 'bg-amber-500 text-white',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isCurrent ? (
                    <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <Circle className="h-5 w-5 fill-amber-300" />
                    </motion.span>
                  ) : <span className="font-display text-sm font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{m.milestone}</p>
                    {isCurrent && <StatusBadge status="You are here" variant="warning" dot />}
                    {isCompleted && <StatusBadge status="Done" variant="success" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.grade} · {m.age}</p>
                  <p className="text-xs mt-1.5 leading-relaxed">{m.action}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}
