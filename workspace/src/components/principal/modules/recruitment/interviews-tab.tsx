'use client'

import { motion } from 'framer-motion'
import {
  Star, Calendar, Clock, Video, MapPin,
} from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { interviews } from '@/lib/mock/recruitment'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function InterviewsTab() {
  return (
    <motion.div key="iv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
      {interviews.map((iv, i) => (
        <motion.div key={iv.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
          <GlassCard className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <GradientAvatar name={iv.candidate} initials={iv.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{iv.candidate}</p>
                  <StatusBadge status={iv.status} variant={iv.status === 'Completed' ? 'success' : iv.status === 'Cancelled' ? 'danger' : 'info'} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{iv.position} · {iv.round}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {formatDate(iv.date)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {iv.time}</span>
                  <span className="flex items-center gap-1">{iv.mode === 'Video' ? <Video className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />} {iv.mode}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {iv.panel.map((p, idx) => (
                    <span key={idx} className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-medium">{p}</span>
                  ))}
                </div>
                {iv.feedback && (
                  <div className={cn('mt-2 rounded-lg border p-2.5', iv.rating && iv.rating >= 4 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5')}>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Feedback</span>
                      {iv.rating && (
                        <span className="flex items-center gap-0.5 ml-auto">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className={cn('h-2.5 w-2.5', idx < Math.round(iv.rating!) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="text-xs italic">"{iv.feedback}"</p>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
