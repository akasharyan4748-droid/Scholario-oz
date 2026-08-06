'use client'

import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { wellnessStats } from '@/lib/mock/wellness'
import { cn } from '@/lib/utils'

export function BadgesRow() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Award className="h-4 w-4 text-amber-500" /> Wellness Badges
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {wellnessStats.badges.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={cn('flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all', b.earned ? 'border-amber-500/30 bg-amber-500/5' : 'border-dashed border-border bg-muted/30 opacity-60')}
          >
            <span className={cn('text-3xl', !b.earned && 'grayscale opacity-50')}>{b.icon}</span>
            <p className={cn('text-[10px] font-semibold leading-tight', b.earned ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>{b.name}</p>
            <p className="text-[8px] text-muted-foreground leading-tight">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
