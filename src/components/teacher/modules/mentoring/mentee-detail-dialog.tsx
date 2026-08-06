'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Sparkles, Target } from 'lucide-react'
import { GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import type { Mentee } from '@/lib/mock/mentoring'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { moodConfig } from './data'

// Mentee detail modal. Renders nothing when `mentee` is null.
export function MenteeDetailDialog({ mentee, onClose }: { mentee: Mentee | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {mentee && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-2xl border border-border glass-strong shadow-premium-lg overflow-hidden"
          >
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
              <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"><X className="h-4 w-4" /></button>
              <div className="flex items-center gap-4">
                <GradientAvatar name={mentee.name} initials={mentee.avatar} size="xl" />
                <div>
                  <h2 className="font-display text-lg font-bold">{mentee.name}</h2>
                  <p className="text-amber-50/90 text-sm">Roll #{mentee.rollNo} · Class 2-A</p>
                  <span className={cn('mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold', moodConfig[mentee.mood].color)}>
                    {moodConfig[mentee.mood].emoji} {moodConfig[mentee.mood].label}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">Mentoring Notes</p>
                <p className="text-sm leading-relaxed rounded-xl border border-border bg-card/40 p-3">{mentee.notes}</p>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium">Growth Progress</span>
                  <span className="font-bold">{mentee.progress}%</span>
                </div>
                <ProgressBar value={mentee.progress} color="oklch(0.65 0.16 75)" height={7} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-1.5 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Strengths</p>
                  <div className="flex flex-wrap gap-1">
                    {mentee.strengths.map((s) => (
                      <span key={s} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1.5 flex items-center gap-1"><Target className="h-3 w-3" /> Focus Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {mentee.areas.map((a) => (
                      <span key={a} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-border">
                <div>
                  <p className="text-[10px] text-muted-foreground">Last Session</p>
                  <p className="text-sm font-semibold">{formatDate(mentee.lastSession)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Next Session</p>
                  <p className="text-sm font-semibold text-primary">{mentee.nextSession ? formatDate(mentee.nextSession) : 'Not scheduled'}</p>
                </div>
              </div>
              <button
                onClick={() => { toast.success('Session scheduled', { description: `Meeting with ${mentee.name}` }); onClose() }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-md"
              >
                <Calendar className="h-4 w-4" /> Schedule Next Session
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
