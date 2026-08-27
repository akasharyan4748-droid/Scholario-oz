'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/ui'
import { moodCheckIns } from '@/lib/mock/wellness'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { moodConfig } from './data'

interface Props {
  onCloseCheckIn: () => void
}

export function MoodTab({ onCloseCheckIn }: Props) {
  return (
    <motion.div key="mo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {(Object.keys(moodConfig) as Array<keyof typeof moodConfig>).map((m, i) => {
          const cfg = moodConfig[m]
          return (
            <motion.button
              key={m}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { toast.success('Mood logged!', { description: `Feeling ${cfg.label} ${cfg.emoji}` }); onCloseCheckIn() }}
              className={cn('flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card/40 p-4 hover:border-primary/40 hover:bg-accent transition-all')}
            >
              <span className="text-3xl">{cfg.emoji}</span>
              <span className="text-[11px] font-medium">{cfg.label}</span>
            </motion.button>
          )
        })}
      </div>

      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4">Recent Check-ins</h3>
        <div className="space-y-2.5">
          {moodCheckIns.map((c, i) => {
            const cfg = moodConfig[c.mood]
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
              >
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl', cfg.bg)}>
                  {cfg.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{cfg.label}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {c.note && <p className="text-[11px] text-muted-foreground mt-0.5">{c.note}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-sm font-bold text-primary">{c.energy}%</p>
                  <p className="text-[9px] text-muted-foreground">energy</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}
