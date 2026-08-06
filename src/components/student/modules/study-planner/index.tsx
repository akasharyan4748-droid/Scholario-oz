'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarClock, Plus, CheckCircle2, Circle, Clock, Flame, Play, Pause,
  RotateCcw, Coffee, BookOpen, Bell, Target, TrendingUp, Timer, Zap, X,
  ChevronRight, AlertCircle,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, BarTrend, Donut, ProgressBar } from '@/components/shared/charts'
import { studyTasks, plannerStats, type StudyTask } from '@/lib/mock/study-planner'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { type Tab } from './shared'
import { FOCUS_DURATION, BREAK_DURATION } from './shared'
import { TasksTab } from './tasks-tab'
import { ScheduleTab } from './schedule-tab'
import { PomodoroTab } from './pomodoro-tab'

export function StudyPlannerModule() {
  const [tab, setTab] = useState<Tab>('tasks')
  const [tasks, setTasks] = useState<StudyTask[]>(studyTasks)

  // Pomodoro state
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus')
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            // Session complete
            if (pomodoroMode === 'focus') {
              setCompletedSessions((c) => c + 1)
              toast.success('Focus session complete! 🎯', { description: '+25 XP — time for a break!' })
              setPomodoroMode('break')
              return BREAK_DURATION
            } else {
              toast.info('Break over! Ready to focus? 💪')
              setPomodoroMode('focus')
              return FOCUS_DURATION
            }
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, pomodoroMode])

  const togglePomodoro = () => setIsRunning((r) => !r)
  const resetPomodoro = () => {
    setIsRunning(false)
    setTimeLeft(pomodoroMode === 'focus' ? FOCUS_DURATION : BREAK_DURATION)
  }
  const selectPomodoroMode = (mode: 'focus' | 'break') => {
    setPomodoroMode(mode)
    setTimeLeft(mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION)
    setIsRunning(false)
  }

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t))
    const task = tasks.find((t) => t.id === id)
    if (task && task.status !== 'completed') toast.success('Task completed! ✅', { description: '+15 XP — great job!' })
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Study Planner"
        subtitle="Plan your study time, track tasks & stay focused with Pomodoro"
        icon={<CalendarClock className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Task added', { description: 'New study task created' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Add Task
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Tasks Today" value={plannerStats.tasksToday} icon={<Target className="h-5 w-5" />} accent="violet" trendLabel={`${plannerStats.completedToday} done`} delay={0} />
        <KpiCard label="Study Time" value={plannerStats.studyTimeToday} suffix={`/${plannerStats.studyTimeTarget}m`} icon={<Clock className="h-5 w-5" />} accent="emerald" trend={12} trendLabel="today" delay={0.05} />
        <KpiCard label="Focus Sessions" value={completedSessions > 0 ? completedSessions : plannerStats.focusSessions} suffix={`/${plannerStats.focusSessionsTarget}`} icon={<Zap className="h-5 w-5" />} accent="amber" trendLabel="pomodoro done" delay={0.1} />
        <KpiCard label="Study Streak" value={plannerStats.streak} suffix=" days 🔥" icon={<Flame className="h-5 w-5" />} accent="rose" trendLabel={`best: 28 days`} delay={0.15} />
      </div>

      {/* Productivity score */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white shadow-premium-lg"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-violet-50/80 text-xs font-medium flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> Productivity Score
            </p>
            <p className="font-display text-3xl font-extrabold">{plannerStats.productivityScore}/100</p>
            <p className="text-violet-50/70 text-xs mt-0.5">You're in the top 25% of focused students! 🎯</p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-2 text-center">
              <p className="font-display text-xl font-bold">{plannerStats.weeklyStudyHours}h</p>
              <p className="text-[10px] text-violet-50">this week</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-2 text-center">
              <p className="font-display text-xl font-bold">{Math.round((plannerStats.completedToday / plannerStats.tasksToday) * 100)}%</p>
              <p className="text-[10px] text-violet-50">done today</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'tasks' as Tab, label: 'Study Tasks', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
          { id: 'schedule' as Tab, label: "Today's Schedule", icon: <CalendarClock className="h-3.5 w-3.5" /> },
          { id: 'pomodoro' as Tab, label: 'Focus Timer', icon: <Timer className="h-3.5 w-3.5" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              tab === t.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'tasks' && <TasksTab tasks={tasks} onToggleTask={toggleTask} />}

        {tab === 'schedule' && <ScheduleTab />}

        {tab === 'pomodoro' && (
          <PomodoroTab
            pomodoroMode={pomodoroMode}
            timeLeft={timeLeft}
            isRunning={isRunning}
            onToggleRun={togglePomodoro}
            onReset={resetPomodoro}
            onSelectMode={selectPomodoroMode}
            completedSessions={completedSessions}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
