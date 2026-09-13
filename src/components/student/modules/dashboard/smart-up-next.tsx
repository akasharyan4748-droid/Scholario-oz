'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, PlayCircle, ListTodo, ArrowUpRight, Zap,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import {
  useStudentLearningStore, continueLearningOf, tasksDueOn, dueStatsOf,
} from '@/lib/store/student-learning-store'
import { subjectColor } from '@/components/student/modules/timetable/subject-colors'

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

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface SmartUpNextProps {
  onNavigate: (key: string) => void
}

/**
 * SmartUpNext — derived from the student's REAL learning queue (spec: no
 * fabricated urgency): the flashcards that are actually due today, the
 * next open task in today's plan, and the resource they left unfinished.
 */
export function SmartUpNext({ onNavigate }: SmartUpNextProps) {
  const resources = useStudentLearningStore((s) => s.resources)
  const progress = useStudentLearningStore((s) => s.progress)
  const tasks = useStudentLearningStore((s) => s.tasks)
  const cards = useStudentLearningStore((s) => s.cards)

  const smartTasks = useMemo<SmartTask[]>(() => {
    const out: SmartTask[] = []
    const due = dueStatsOf(cards)

    if (due.due > 0) {
      out.push({
        priority: 'REVIEW',
        priorityColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        icon: <Sparkles className="h-4 w-4" />,
        iconBg: 'from-emerald-500 to-teal-600',
        title: `Flashcards — ${due.due} card${due.due === 1 ? '' : 's'} due`,
        desc: `Across your decks · ${due.mastered} mastered so far`,
        action: 'Review',
        actionColor: 'text-emerald-600 hover:bg-emerald-500/10',
        navKey: 'flashcards',
      })
    }

    const nextTask = tasksDueOn(tasks, todayKey())[0]
    if (nextTask) {
      const sc = subjectColor(nextTask.subject)
      out.push({
        priority: 'STUDY',
        priorityColor: `${sc.bg} ${sc.text}`,
        icon: <ListTodo className="h-4 w-4" />,
        iconBg: 'from-violet-500 to-purple-600',
        title: nextTask.title,
        desc: `Today${nextTask.dueTime ? ` · by ${nextTask.dueTime}` : ''} · ${nextTask.durationMin} min · ${nextTask.subject}`,
        action: 'Open Plan',
        actionColor: 'text-violet-600 hover:bg-violet-500/10',
        navKey: 'planner',
      })
    }

    const upNext = continueLearningOf(resources, progress)[0]
    if (upNext) {
      out.push({
        priority: 'CONTINUE',
        priorityColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        icon: <PlayCircle className="h-4 w-4" />,
        iconBg: 'from-sky-500 to-cyan-600',
        title: upNext.resource.title,
        desc: `${upNext.resource.subject} · ${upNext.resource.topic} · ${upNext.pct}% done`,
        action: 'Continue',
        actionColor: 'text-sky-600 hover:bg-sky-500/10',
        navKey: 'resources',
      })
    }

    return out
  }, [resources, progress, tasks, cards])

  if (smartTasks.length === 0) {
    return null
  }

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
                <h3 className="font-display text-base sm:text-lg font-bold tracking-tight">Smart Up Next</h3>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Your Queue
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                From your own learning activity — what to focus on right now.
              </p>
            </div>
          </div>
        </div>

        <div className={cn('relative mt-4 grid grid-cols-1 gap-3', smartTasks.length >= 2 ? 'md:grid-cols-2' : '', smartTasks.length >= 3 ? 'md:grid-cols-3' : '')}>
          {smartTasks.map((item, i) => (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              onClick={() => onNavigate(item.navKey)}
              className="group relative rounded-xl border border-border bg-card/50 p-3.5 text-left hover:shadow-premium hover:border-violet-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', item.priorityColor)}>
                  {item.priority}
                </span>
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', item.iconBg)}>
                  {item.icon}
                </div>
              </div>
              <p className="font-semibold text-sm leading-snug">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              <span className={cn('mt-2.5 inline-flex items-center gap-1 text-xs font-semibold transition-colors', item.actionColor)}>
                {item.action}
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </motion.button>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
