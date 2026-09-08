'use client'

import { motion } from 'framer-motion'
import {
  ClipboardList, BookOpen, Sparkles, ArrowUpRight, Zap,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { assignments, homeworks } from '@/lib/mock/academics'
import { flashcardStats } from '@/lib/mock/flashcards'
import { formatDate } from '@/lib/format'

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

/** Derived from the student's REAL work queue (SR-UI §25 — no fabricated
 *  urgency/progress/AI claims): the nearest pending assignment, the
 *  nearest active homework, and the flashcards that are actually due. */
function buildSmartTasks(): SmartTask[] {
  const nextAssignment = [...assignments]
    .filter((a) => a.status === 'Pending')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  const nextHomework = [...homeworks]
    .filter((h) => h.status === 'Active')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  const masteryPct = Math.round(
    (flashcardStats.masteredCards / flashcardStats.totalCards) * 100,
  )
  const tasks: SmartTask[] = []
  if (nextAssignment) {
    tasks.push({
      priority: 'ASSIGNMENT',
      priorityColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      icon: <ClipboardList className="h-4 w-4" />,
      iconBg: 'from-rose-500 to-pink-600',
      title: nextAssignment.title,
      desc: `Due ${formatDate(nextAssignment.dueDate)} · ${nextAssignment.marks} marks · ${nextAssignment.subject}`,
      action: 'Open Assignment',
      actionColor: 'text-rose-600 hover:bg-rose-500/10',
      navKey: 'assignments',
    })
  }
  if (nextHomework) {
    tasks.push({
      priority: 'HOMEWORK',
      priorityColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      icon: <BookOpen className="h-4 w-4" />,
      iconBg: 'from-amber-500 to-orange-600',
      title: nextHomework.title,
      desc: `Due ${formatDate(nextHomework.dueDate)} · by ${nextHomework.assignedBy}`,
      action: 'Open Homework',
      actionColor: 'text-amber-600 hover:bg-amber-500/10',
      navKey: 'homework',
    })
  }
  tasks.push({
    priority: 'REVIEW',
    priorityColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    icon: <Sparkles className="h-4 w-4" />,
    iconBg: 'from-emerald-500 to-teal-600',
    title: `Flashcards — ${flashcardStats.dueToday} cards due`,
    desc: `Across your decks · ${masteryPct}% mastered so far`,
    action: 'Review',
    actionColor: 'text-emerald-600 hover:bg-emerald-500/10',
    navKey: 'flashcards',
  })
  return tasks
}

interface SmartUpNextProps {
  onNavigate: (key: string) => void
}

export function SmartUpNext({ onNavigate }: SmartUpNextProps) {
  const smartTasks = buildSmartTasks()
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
                Ranked by your actual deadlines — here&apos;s what to focus on right now.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {smartTasks.map((item, i) => (
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
              <p className="font-semibold text-sm leading-snug">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
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
