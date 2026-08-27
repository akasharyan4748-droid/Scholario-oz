'use client'

import { motion } from 'framer-motion'
import { Activity, CheckCircle2, TrendingUp } from 'lucide-react'
import { ProgressBar } from '@/components/shared/charts'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import type { WellnessMetric } from '@/lib/mock/wellness'
import { cn } from '@/lib/utils'

interface Props {
  metrics: WellnessMetric[]
  onIncrement: (id: string, delta: number) => void
}

export function MetricsGrid({ metrics, onIncrement }: Props) {
  return (
    <div>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" /> Today's Metrics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map((m, i) => {
          const isComplete = m.value >= m.target
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-4 shadow-premium hover:shadow-premium-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{m.icon}</span>
                {isComplete && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">{m.label}</p>
              <p className="font-display text-xl font-bold mt-0.5">
                <AnimatedCounter value={m.value} />/<span className="text-sm text-muted-foreground font-normal">{m.target}</span>
              </p>
              <p className="text-[9px] text-muted-foreground">{m.unit}</p>
              <div className="mt-2">
                <ProgressBar value={m.value} max={m.target} color={m.color} height={4} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={cn('text-[9px] flex items-center gap-0.5', m.trend >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  <TrendingUp className={cn('h-2.5 w-2.5', m.trend < 0 && 'rotate-180')} />
                  {Math.abs(m.trend)}%
                </span>
                {(m.id === 'WM01' || m.id === 'WM06') && (
                  <button
                    onClick={() => onIncrement(m.id, m.id === 'WM01' ? 1 : 5)}
                    className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
                  >+</button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
