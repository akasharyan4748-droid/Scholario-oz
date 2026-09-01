'use client'

import { motion } from 'framer-motion'
import { Sparkles, Star, Quote } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { selfEvaluation } from '@/lib/mock/reviews'
import { cn } from '@/lib/utils'

export function SelfEvalTab({ avgSelf, avgSupervisor }: { avgSelf: string; avgSupervisor: string }) {
  return (
    <motion.div key="se" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Self Rating Average</h3>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-display text-3xl font-bold text-amber-600">{avgSelf} <span className="text-sm text-muted-foreground font-normal">/ 5.0</span></p>
          <p className="text-xs text-muted-foreground mt-1">Across {selfEvaluation.length} criteria</p>
        </GlassCard>
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Supervisor Rating Average</h3>
            <Star className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="font-display text-3xl font-bold text-emerald-600">{avgSupervisor} <span className="text-sm text-muted-foreground font-normal">/ 5.0</span></p>
          <p className="text-xs text-muted-foreground mt-1">Dr. Ananya Iyer · Principal</p>
        </GlassCard>
      </div>

      {/* Evaluation table */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4">Evaluation Criteria</h3>
        <div className="space-y-2.5">
          {selfEvaluation.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card/40 p-3"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{item.category}</span>
                    <span className="text-[10px] text-muted-foreground">Weight: {item.weight}%</span>
                  </div>
                  <p className="text-sm font-medium mt-1">{item.criteria}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Self Rating</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={cn('h-3.5 w-3.5', idx < item.selfRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Supervisor Rating</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={cn('h-3.5 w-3.5', idx < item.supervisorRating ? 'fill-emerald-400 text-emerald-400' : 'text-muted-foreground/30')} />
                    ))}
                  </div>
                </div>
              </div>
              {item.comments && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/40 p-2">
                  <Quote className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground italic">{item.comments}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
