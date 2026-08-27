'use client'

import { motion } from 'framer-motion'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { GlassCard, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { behaviorStats, behaviorSummary } from '@/lib/mock/behavior'
import { cn } from '@/lib/utils'

export function LeaderboardTab() {
  return (
    <motion.div key="lb" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Conduct Leaderboard — Class 2-A</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top students by conduct score this term</p>
          </div>
          <StatusBadge status={`Class avg ${behaviorStats.avgClassConduct}/100`} variant="success" dot />
        </div>
        <div className="space-y-2">
          {behaviorSummary.map((s, i) => (
            <motion.div
              key={s.studentName}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                i === 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card/40 hover:bg-accent/40'
              )}
            >
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                i === 0 && 'bg-amber-400/20 text-amber-600',
                i === 1 && 'bg-slate-300/30 text-slate-600 dark:text-slate-300',
                i === 2 && 'bg-orange-400/20 text-orange-600',
                i > 2 && 'bg-muted text-muted-foreground'
              )}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : s.rank}
              </div>
              <GradientAvatar name={s.studentName} initials={s.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{s.studentName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">Roll #{s.rollNo}</span>
                  <div className="flex gap-1">
                    {s.badges.slice(0, 2).map((b, idx) => (
                      <span key={idx} className="rounded bg-muted px-1 py-0 text-[9px] font-medium">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Trend */}
              <div className="shrink-0">
                {s.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                {s.trend === 'down' && <TrendingDown className="h-4 w-4 text-rose-500" />}
                {s.trend === 'same' && <Minus className="h-4 w-4 text-muted-foreground" />}
              </div>
              {/* Stats */}
              <div className="shrink-0 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-display text-sm font-bold text-emerald-600">{s.positiveCount}</p>
                  <p className="text-[8px] text-muted-foreground">+ve</p>
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-amber-600">{s.concernCount}</p>
                  <p className="text-[8px] text-muted-foreground">concern</p>
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-rose-600">{s.incidentCount}</p>
                  <p className="text-[8px] text-muted-foreground">incident</p>
                </div>
              </div>
              {/* Conduct score */}
              <div className="shrink-0 text-right">
                <p className="font-display text-lg font-bold text-violet-600">{s.conductScore}</p>
                <p className="text-[9px] text-muted-foreground">conduct</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
