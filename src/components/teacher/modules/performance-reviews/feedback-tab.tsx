'use client'

import { motion } from 'framer-motion'
import {
  ThumbsUp, Lightbulb, Target,
} from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { feedback } from '@/lib/mock/reviews'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const typeConfig = {
  Appreciation: { color: 'from-emerald-500 to-teal-600', icon: <ThumbsUp className="h-4 w-4" />, bg: 'bg-emerald-500/5 border-emerald-500/20' },
  Constructive: { color: 'from-amber-500 to-orange-600', icon: <Lightbulb className="h-4 w-4" />, bg: 'bg-amber-500/5 border-amber-500/20' },
  Goal: { color: 'from-violet-500 to-purple-600', icon: <Target className="h-4 w-4" />, bg: 'bg-violet-500/5 border-violet-500/20' },
}

export function FeedbackTab() {
  return (
    <motion.div key="fb" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
      {feedback.map((f, i) => {
        const cfg = typeConfig[f.type]
        return (
          <motion.div key={f.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard className={cn('p-5 border', cfg.bg)}>
              <div className="flex items-start gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', cfg.color)}>
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <GradientAvatar name={f.from} size="sm" />
                    <p className="text-sm font-semibold">{f.from}</p>
                    <span className="text-[11px] text-muted-foreground">{f.fromRole}</span>
                    <span className={cn('ml-auto rounded-md px-2 py-0.5 text-[10px] font-semibold', cfg.bg)}>{f.type}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2">{formatDate(f.date)}</p>
                  <p className="text-sm leading-relaxed">{f.message}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
