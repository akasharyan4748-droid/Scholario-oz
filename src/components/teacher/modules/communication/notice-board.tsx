'use client'

import { motion } from 'framer-motion'
import { Pin, Star, MessageSquare, Send } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { noticeBoard } from '@/lib/mock/operations'
import { formatDate } from '@/lib/format'
import { sampleTemplates } from './data'

interface NoticeBoardSectionProps {
  onOpenMessage: () => void
}

export function NoticeBoardSection({ onOpenMessage }: NoticeBoardSectionProps) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Pin className="h-4 w-4 text-amber-500" /> Notice Board
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Pinned notices for Class 2-A</p>
        </div>
      </div>
      <div className="space-y-3">
        {noticeBoard.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -2 }}
            className="relative rounded-xl border-l-4 bg-card/40 p-3 cursor-pointer"
            style={{ borderLeftColor: n.color }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{n.tag}</span>
              <span className="text-[10px] text-muted-foreground">{formatDate(n.date)}</span>
            </div>
            <p className="font-semibold text-sm leading-tight">{n.title}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-500" /> Quick Templates
        </p>
        <div className="space-y-1.5">
          {sampleTemplates.map((t) => (
            <button
              key={t.id}
              onClick={onOpenMessage}
              className="w-full flex items-center gap-2 rounded-lg border border-border bg-card/40 px-2.5 py-2 text-left text-xs hover:bg-accent/50 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-medium truncate flex-1">{t.name}</span>
              <Send className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
