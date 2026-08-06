'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Star, CheckCircle2 } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { sessionLogs } from '@/lib/mock/mentoring'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { moodEmojiMap } from './data'

// Session Logs tab — list of past mentoring sessions with rating + action
// items.
export function SessionsTab() {
  return (
    <motion.div key="se" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
      {sessionLogs.map((s, i) => (
        <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
          <GlassCard className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <GradientAvatar name={s.mentee} initials={s.mentee.split(' ').map((n) => n[0]).join('')} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{s.mentee}</p>
                  <span className="text-[11px] text-muted-foreground">{s.topic}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {formatDate(s.date)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {s.duration}</span>
                  <span className="flex items-center gap-1">
                    Mood: {moodEmojiMap[s.moodBefore] ?? '🙂'} → {moodEmojiMap[s.moodAfter] ?? '🙂'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.summary}</p>
                <div className="mt-2">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Action Items</p>
                  <div className="flex flex-wrap gap-1">
                    {s.actionItems.map((a, idx) => (
                      <span key={idx} className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <CheckCircle2 className="h-2.5 w-2.5" /> {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-0.5 justify-end">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className={cn('h-3 w-3', idx < s.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">session rating</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
