'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { streamOptions } from '@/lib/mock/career'
import { cn } from '@/lib/utils'

export function StreamsTab() {
  return (
    <motion.div key="st" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {streamOptions.map((s, i) => (
        <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <GlassCard className="p-3 sm:p-4 lg:p-5 h-full">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl', s.gradient)}>
                  {s.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">{s.name}</p>
                  <span className="text-[10px] text-muted-foreground">Suitability: {s.suitability}%</span>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <ProgressBar value={s.suitability} color="oklch(0.6 0.2 300)" height={6} />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{s.description}</p>

            <div className="mb-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Subjects</p>
              <div className="flex flex-wrap gap-1">
                {s.subjects.map((sub) => (
                  <span key={sub} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">{sub}</span>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Career Options</p>
              <div className="flex flex-wrap gap-1">
                {s.careers.map((c) => (
                  <span key={c} className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">{c}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                <p className="text-[9px] font-semibold uppercase text-emerald-600 mb-1">Pros</p>
                <ul className="space-y-0.5">
                  {s.pros.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-1 text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 shrink-0 mt-0.5" /> {p}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2">
                <p className="text-[9px] font-semibold uppercase text-rose-600 mb-1">Cons</p>
                <ul className="space-y-0.5">
                  {s.cons.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-1 text-[10px]"><X className="h-2.5 w-2.5 text-rose-500 shrink-0 mt-0.5" /> {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
