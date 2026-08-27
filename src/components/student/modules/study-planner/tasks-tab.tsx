'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, BookOpen, Clock, Bell } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { upcomingReminders, type StudyTask } from '@/lib/mock/study-planner'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { priorityConfig, typeIcons } from './shared'

interface TasksTabProps {
  tasks: StudyTask[]
  onToggleTask: (id: string) => void
}

export function TasksTab({ tasks, onToggleTask }: TasksTabProps) {
  return (
    <motion.div key="tk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Tasks list */}
      <div className="lg:col-span-2 space-y-2.5">
        {tasks.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn('flex items-center gap-3 rounded-xl border p-3 transition-colors', t.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-card/40 hover:bg-accent/30')}
          >
            <button
              onClick={() => onToggleTask(t.id)}
              className={cn('shrink-0', t.status === 'completed' ? 'text-emerald-500' : 'text-muted-foreground hover:text-primary')}
            >
              {t.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn('text-sm font-medium', t.status === 'completed' && 'line-through text-muted-foreground')}>{t.title}</p>
                <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-semibold', priorityConfig[t.priority])}>{t.priority}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">{typeIcons[t.type]} {t.type}</span>
                <span className="flex items-center gap-1"><BookOpen className="h-2.5 w-2.5" /> {t.subject}</span>
                <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {t.estimatedTime}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-muted-foreground">Due</p>
              <p className={cn('text-xs font-semibold', t.priority === 'high' && t.status !== 'completed' && 'text-rose-600')}>{formatDate(t.dueDate)}</p>
              <p className="text-[9px] text-muted-foreground">{t.dueTime}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reminders sidebar */}
      <div className="space-y-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" /> Upcoming
          </h3>
          <div className="space-y-2.5">
            {upcomingReminders.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-2.5 rounded-lg border border-border bg-card/40 p-2.5">
                <div className="shrink-0 mt-0.5 h-2 w-2 rounded-full" style={{ background: r.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-tight">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{r.time}</p>
                </div>
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold', r.daysAway <= 1 ? 'bg-rose-500/15 text-rose-600' : r.daysAway <= 4 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground')}>
                  {r.daysAway}d
                </span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  )
}
