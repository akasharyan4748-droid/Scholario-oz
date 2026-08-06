'use client'

import { motion } from 'framer-motion'
import { ChevronRight, MessageCircle, ThumbsUp } from 'lucide-react'
import { GlassCard, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import type { QAItem } from '@/lib/mock/peer-collab'

interface Props {
  questions: QAItem[]
  onUpvote: (id: string) => void
}

export function QaTab({ questions, onUpvote }: Props) {
  return (
    <motion.div key="qa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
      {questions.map((q, i) => (
        <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
          <GlassCard className="p-3 sm:p-4 hover:shadow-premium transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
              <button onClick={(e) => { e.stopPropagation(); onUpvote(q.id) }} className="flex flex-col items-center gap-0.5 shrink-0 w-10 pt-1">
                <ThumbsUp className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                <span className="text-xs font-bold">{q.upvotes}</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600">{q.subject}</span>
                  {q.hasAcceptedAnswer && <StatusBadge status="Answered" variant="success" dot />}
                </div>
                <p className="text-sm font-semibold leading-snug">{q.question}</p>
                <div className="flex items-center gap-2 mt-2">
                  <GradientAvatar name={q.askedBy} initials={q.avatar} size="sm" />
                  <span className="text-[11px] text-muted-foreground">{q.askedBy}</span>
                  <span className="text-[10px] text-muted-foreground">· {q.askedOn}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  <span className="flex items-center gap-1 text-muted-foreground"><MessageCircle className="h-3 w-3" /> {q.answers} answers</span>
                  <div className="flex gap-1">
                    {q.tags.map((t) => (
                      <span key={t} className="rounded-full bg-muted px-1.5 py-0 text-[9px] font-medium text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
