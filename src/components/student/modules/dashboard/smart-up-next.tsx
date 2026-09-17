'use client'

/**
 * SmartUpNext — the student's REAL work queue (spec §13: no fabricated
 * urgency/progress/AI claims). Sources are all server-backed since L2D:
 *   · CONTINUE — the last opened, unfinished learning material
 *   · TASK     — the nearest incomplete study-planner task (due date)
 *   · REVIEW   — the flashcards that are actually due (server count)
 * Sections without real data disappear. The old mock-driven homework /
 * assignment entries are gone with Classwork (spec §1).
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, ListTodo, Sparkles, ArrowUpRight, Zap,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { apiFetch } from '../learning/api'
import type { LearningMaterialCard, StudyTaskItem } from '../learning/types'

interface SmartTask {
  priority: string
  priorityColor: string
  icon: React.ReactNode
  iconBg: string
  title: string
  desc: string
  action: string
  actionColor: string
  navKey: string
}

interface SmartUpNextProps {
  onNavigate: (key: string) => void
  continueLearning: LearningMaterialCard | null
  /** SS-1 — Settings → Study Preferences gates (default true). */
  showTaskReminder?: boolean
  showReviewReminder?: boolean
}

export function SmartUpNext({
  onNavigate,
  continueLearning,
  showTaskReminder = true,
  showReviewReminder = true,
}: SmartUpNextProps) {
  // Real planner tasks — the nearest incomplete one is the queue's anchor.
  const [nearestTask, setNearestTask] = useState<StudyTaskItem | null>(null)
  const [dueCount, setDueCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<{ tasks: StudyTaskItem[] }>('/api/student/study-tasks')
      .then((d) => {
        if (cancelled) return
        const incomplete = d.tasks
          .filter((t) => !t.completedAt)
          .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
        setNearestTask(incomplete[0] ?? null)
      })
      .catch(() => { /* the queue simply shows its other real items */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiFetch<{ dueTotal: number }>('/api/student/flashcards')
      .then((d) => { if (!cancelled) setDueCount(d.dueTotal) })
      .catch(() => { if (!cancelled) setDueCount(null) })
    return () => { cancelled = true }
  }, [])

  const tasks: SmartTask[] = []
  if (continueLearning) {
    tasks.push({
      priority: 'CONTINUE',
      priorityColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      icon: <BookOpen className="h-4 w-4" />,
      iconBg: 'from-violet-500 to-purple-600',
      title: continueLearning.title,
      desc: `${continueLearning.subjectName ?? 'Learning'} · pick up where you left off`,
      action: 'Continue',
      actionColor: 'text-violet-600 hover:bg-violet-500/10',
      navKey: 'learning',
    })
  }
  if (nearestTask && showTaskReminder) {
    tasks.push({
      priority: 'TASK',
      priorityColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      icon: <ListTodo className="h-4 w-4" />,
      iconBg: 'from-amber-500 to-orange-600',
      title: nearestTask.title,
      desc: nearestTask.dueDate
        ? `Due ${formatDate(nearestTask.dueDate)}${nearestTask.subjectName ? ` · ${nearestTask.subjectName}` : ''}`
        : nearestTask.subjectName ?? 'From your study planner',
      action: 'Open Planner',
      actionColor: 'text-amber-600 hover:bg-amber-500/10',
      navKey: 'planner',
    })
  }
  if (showReviewReminder && dueCount !== null && dueCount > 0) {
    tasks.push({
      priority: 'REVIEW',
      priorityColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      icon: <Sparkles className="h-4 w-4" />,
      iconBg: 'from-emerald-500 to-teal-600',
      title: `Flashcards — ${dueCount} card${dueCount === 1 ? '' : 's'} due`,
      desc: 'Across your decks · spaced repetition',
      action: 'Review',
      actionColor: 'text-emerald-600 hover:bg-emerald-500/10',
      navKey: 'flashcards',
    })
  }

  if (tasks.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5 lg:p-6 border-l-4 border-l-violet-500">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/25"
            >
              <Zap className="h-5 w-5" />
            </motion.div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold tracking-tight">Up Next</h3>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Your Queue
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                From your deadlines and study activity.
              </p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'relative mt-4 grid grid-cols-1 gap-3',
            tasks.length >= 3 ? 'md:grid-cols-3' : tasks.length === 2 ? 'md:grid-cols-2' : '',
          )}
        >
          {tasks.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              onClick={() => { toast.info('Opening…', { description: item.title }); onNavigate(item.navKey) }}
              className="group relative rounded-xl border border-border bg-card/50 p-3.5 hover:shadow-premium hover:border-violet-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', item.priorityColor)}>
                  {item.priority}
                </span>
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', item.iconBg)}>
                  {item.icon}
                </div>
              </div>
              <p className="font-semibold text-sm leading-snug line-clamp-2">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.desc}</p>
              <span className={cn('mt-2.5 inline-flex items-center gap-1 text-xs font-semibold transition-colors', item.actionColor)}>
                {item.action}
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
