'use client'

import { motion } from 'framer-motion'
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { GlassCard, SectionHeading, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { cn } from '@/lib/utils'
import { studentGrowth } from './data'

export function StudentGrowth() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
      <SectionHeading
        title="Student Growth"
        subtitle="Performance delta vs previous assessment"
        icon={<TrendingUp className="h-5 w-5" />}
        className="mb-4"
      />
      <div className="space-y-2.5">
        {studentGrowth.map((s, i) => {
          const delta = s.current - s.previous
          const isUp = delta > 0
          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <GradientAvatar name={s.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <ProgressBar value={s.current} color={s.current >= 85 ? 'oklch(0.55 0.14 162)' : s.current >= 75 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'} height={5} className="w-32" />
                  <span className="text-[11px] font-semibold">{s.current}%</span>
                </div>
              </div>
              <div className={cn(
                'flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold',
                isUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
              )}>
                {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(delta)}%
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block w-12 text-right">was {s.previous}%</span>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}
