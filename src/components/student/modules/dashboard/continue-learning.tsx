'use client'

/**
 * ContinueLearning (SD-3 · PHASE 9) — the dashboard's ONE learning
 * surface. It does NOT recreate the Learning module: it surfaces the
 * last opened, unfinished authorized material from the server aggregate
 * and hands the student over to Learning. No streaks, no fabricated
 * progress — only the real material + when it was opened.
 */

import { motion } from 'framer-motion'
import { BookOpen, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DashboardData } from './types'

export function ContinueLearning({ data, onNavigate }: {
  data: DashboardData
  onNavigate: (key: string) => void
}) {
  const card = data.learning.continueLearning
  if (!card) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Continue learning"
      className="flex flex-col gap-3 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.05] to-transparent p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <BookOpen className="h-4.5 w-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Continue Learning
          </p>
          <p className="truncate text-sm font-semibold">{card.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {card.subjectName ?? 'Learning'}
            {card.lastOpenedAt
              ? ` · opened ${new Date(card.lastOpenedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : ''}
          </p>
        </div>
      </div>
      <Button size="sm" onClick={() => onNavigate('learning')} className="h-8 shrink-0 gap-1.5">
        Continue <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </motion.section>
  )
}
