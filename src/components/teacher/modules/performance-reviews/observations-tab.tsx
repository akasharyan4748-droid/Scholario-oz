'use client'

import { motion } from 'framer-motion'
import {
  Star, Calendar, Eye, CheckCircle2, Circle, ThumbsUp, Lightbulb,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { observations } from '@/lib/mock/reviews'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ObservationsTab() {
  return (
    <motion.div key="ob" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
      {observations.map((obs, i) => (
        <motion.div key={obs.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <GlassCard className="p-3 sm:p-4 lg:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Class Observation · {obs.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{obs.className} · {obs.topic}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" /> {formatDate(obs.date)} · by {obs.observer} ({obs.observerRole})
                  </p>
                </div>
              </div>
              <StatusBadge status={obs.status} variant={obs.status === 'Completed' ? 'success' : 'info'} dot />
            </div>

            {obs.status === 'Completed' ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">Overall Rating:</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={cn('h-3.5 w-3.5', idx < obs.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> Strengths
                    </p>
                    <ul className="space-y-1.5">
                      {obs.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" /> Areas for Improvement
                    </p>
                    <ul className="space-y-1.5">
                      {obs.improvements.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs">
                          <Circle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5 fill-amber-300" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">Observation scheduled for {formatDate(obs.date)}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">Be prepared with your lesson plan</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
