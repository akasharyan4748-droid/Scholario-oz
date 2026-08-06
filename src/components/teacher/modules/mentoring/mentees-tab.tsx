'use client'

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { mentees, type Mentee } from '@/lib/mock/mentoring'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { moodConfig } from './data'

// Mentees tab — grid of mentee cards. Each card opens the detail dialog
// via `onSelect`.
export function MenteesTab({ onSelect }: { onSelect: (m: Mentee) => void }) {
  return (
    <motion.div key="me" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {mentees.map((m, i) => {
        const cfg = moodConfig[m.mood]
        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="cursor-pointer"
            onClick={() => onSelect(m)}
          >
            <GlassCard className="p-3 sm:p-4 lg:p-5 h-full hover:shadow-premium-lg transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <GradientAvatar name={m.name} initials={m.avatar} size="md" />
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">Roll #{m.rollNo}</p>
                  </div>
                </div>
                <span className={cn('flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold', cfg.color)}>
                  {cfg.emoji} {cfg.label}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Growth Progress</span>
                  <span className="font-semibold">{m.progress}%</span>
                </div>
                <ProgressBar value={m.progress} color={m.progress >= 80 ? 'oklch(0.55 0.14 162)' : m.progress >= 60 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'} height={5} />
              </div>

              {/* Strengths */}
              <div className="mb-2">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">Strengths</p>
                <div className="flex flex-wrap gap-1">
                  {m.strengths.slice(0, 2).map((s) => (
                    <span key={s} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">{s}</span>
                  ))}
                </div>
              </div>

              {/* Areas */}
              <div className="mb-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 mb-1">Focus Areas</p>
                <div className="flex flex-wrap gap-1">
                  {m.areas.slice(0, 2).map((a) => (
                    <span key={a} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600">{a}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border text-[10px] text-muted-foreground">
                <span>Last: {formatDate(m.lastSession)}</span>
                {m.nextSession && <span className="text-primary font-medium">Next: {formatDate(m.nextSession)}</span>}
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
