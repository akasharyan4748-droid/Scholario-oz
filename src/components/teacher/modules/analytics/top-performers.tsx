'use client'

import { motion } from 'framer-motion'
import { Award, Target } from 'lucide-react'
import { GlassCard, SectionHeading, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { cn } from '@/lib/utils'
import { classToppers } from '@/lib/mock/academics'

export function TopPerformers() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <SectionHeading
        title="Top Performers"
        subtitle="Class 2-A · UT3"
        icon={<Award className="h-5 w-5" />}
        className="mb-4"
      />
      <div className="space-y-2.5">
        {classToppers.slice(0, 5).map((t, i) => (
          <motion.div
            key={t.rank}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3"
          >
            <div className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
              i === 0 ? 'bg-amber-400/20 text-amber-600' : i === 1 ? 'bg-slate-300/30 text-slate-600' : i === 2 ? 'bg-orange-400/20 text-orange-600' : 'bg-muted text-muted-foreground'
            )}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : t.rank}
            </div>
            <GradientAvatar name={t.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">Roll #{t.rollNo}</p>
            </div>
            <span className="font-display font-bold text-sm text-emerald-600">{t.percentage}%</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
          <Target className="h-3 w-3" /> Class Targets
        </p>
        <div className="space-y-2">
          {[
            { label: 'Class Avg ≥ 85%', current: 88, target: 85, color: 'oklch(0.55 0.14 162)' },
            { label: 'Attendance ≥ 95%', current: 95.4, target: 95, color: 'oklch(0.65 0.16 75)' },
            { label: 'Pass Rate = 100%', current: 94, target: 100, color: 'oklch(0.62 0.2 25)' },
          ].map((t, i) => (
            <div key={i}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">{t.label}</span>
                <span className="font-semibold">{t.current}/{t.target}</span>
              </div>
              <ProgressBar value={t.current} max={t.target} color={t.color} height={5} />
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
