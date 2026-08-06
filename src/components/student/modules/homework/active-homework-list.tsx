'use client'

import { motion } from 'framer-motion'
import { Clock, BookOpen, Sparkles, Send, User, Calendar, CheckCircle2 } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { Homework } from '@/lib/mock/academics'
import { subjectColors } from './data'

interface ActiveHomeworkListProps {
  items: Homework[]
  submitted: Record<string, boolean>
  onSubmit: (id: string) => void
}

export function ActiveHomeworkList({ items, submitted, onSubmit }: ActiveHomeworkListProps) {
  return (
    <div>
      <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
        <Clock className="h-4.5 w-4.5 text-amber-500" /> Active Homework
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {items.map((h, i) => {
          const sc = subjectColors[h.subject] ?? subjectColors.English
          const isSubmitted = !!submitted[h.id]
          const dueDate = new Date(h.dueDate)
          const today = new Date('2024-11-27')
          const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassCard className="p-3 sm:p-4 lg:p-5" hover>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${sc.gradient} text-white shadow-md`}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{h.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.subject}</p>
                    </div>
                  </div>
                  {isSubmitted ? (
                    <StatusBadge status="Submitted" variant="success" dot />
                  ) : daysLeft < 0 ? (
                    <StatusBadge status="Overdue" variant="danger" dot />
                  ) : daysLeft === 0 ? (
                    <StatusBadge status="Due today" variant="warning" dot />
                  ) : (
                    <StatusBadge status={`${daysLeft}d left`} variant="info" dot />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{h.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg border border-border bg-card/40 p-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Teacher</p>
                    <p className="text-xs font-semibold mt-0.5">{h.assignedBy}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/40 p-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Due Date</p>
                    <p className="text-xs font-semibold mt-0.5">{formatDate(h.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>{h.submissions}/{h.total} classmates submitted</span>
                  </div>
                  {isSubmitted ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onSubmit(h.id)}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                    >
                      <Send className="h-3.5 w-3.5" /> Submit
                    </Button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
