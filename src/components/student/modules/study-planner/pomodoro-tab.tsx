'use client'

import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee, Zap, Flame, Target } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { FOCUS_DURATION, BREAK_DURATION } from './shared'

interface PomodoroTabProps {
  pomodoroMode: 'focus' | 'break'
  timeLeft: number
  isRunning: boolean
  onToggleRun: () => void
  onReset: () => void
  onSelectMode: (mode: 'focus' | 'break') => void
  completedSessions: number
}

export function PomodoroTab({
  pomodoroMode, timeLeft,
  isRunning, onToggleRun, onReset, onSelectMode, completedSessions,
}: PomodoroTabProps) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const total = pomodoroMode === 'focus' ? FOCUS_DURATION : BREAK_DURATION
  const progress = ((total - timeLeft) / total) * 100

  return (
    <motion.div key="pm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Timer */}
      <GlassCard className="p-6 lg:col-span-2 flex flex-col items-center justify-center">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => onSelectMode('focus')}
            className={cn('flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all', pomodoroMode === 'focus' ? 'bg-violet-600 text-white shadow-md' : 'bg-muted text-muted-foreground')}
          >
            <Zap className="h-3.5 w-3.5" /> Focus 25:00
          </button>
          <button
            onClick={() => onSelectMode('break')}
            className={cn('flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all', pomodoroMode === 'break' ? 'bg-emerald-600 text-white shadow-md' : 'bg-muted text-muted-foreground')}
          >
            <Coffee className="h-3.5 w-3.5" /> Break 05:00
          </button>
        </div>

        {/* Circular timer */}
        <div className="relative">
          <svg className="h-56 w-56 -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--muted)" strokeWidth="10" />
            <motion.circle
              cx="100" cy="100" r="90" fill="none"
              stroke={pomodoroMode === 'focus' ? 'oklch(0.6 0.2 300)' : 'oklch(0.55 0.14 162)'}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl font-extrabold tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className={cn('text-xs font-semibold mt-1 uppercase tracking-wider', pomodoroMode === 'focus' ? 'text-violet-600' : 'text-emerald-600')}>
              {pomodoroMode === 'focus' ? 'Focus Time' : 'Break Time'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-8">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onToggleRun}
            className={cn('flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg', pomodoroMode === 'focus' ? 'bg-gradient-to-br from-violet-600 to-purple-600 shadow-violet-500/30' : 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/30')}
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </motion.button>
          <button
            onClick={onReset}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/50 text-muted-foreground hover:bg-accent transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground mt-4 text-center">
          {isRunning ? 'Stay focused — you\'re doing great! 💪' : 'Press play to start your focus session'}
        </p>
      </GlassCard>

      {/* Session stats */}
      <div className="space-y-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-500" /> Today's Sessions
          </h3>
          <div className="text-center mb-4">
            <p className="font-display text-4xl font-bold text-violet-600">{completedSessions}</p>
            <p className="text-xs text-muted-foreground">pomodoros completed</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn('aspect-square rounded-lg flex items-center justify-center text-xs', i < completedSessions ? 'bg-violet-500/20 text-violet-600 font-bold' : 'bg-muted text-muted-foreground/50')}>
                {i < completedSessions ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Focus time</span><span className="font-semibold">{completedSessions * 25} min</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Break time</span><span className="font-semibold">{completedSessions * 5} min</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">XP earned</span><span className="font-semibold text-violet-600">+{completedSessions * 25}</span></div>
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3">How it works</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-start gap-2"><Zap className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" /> Focus for 25 minutes on one task</p>
            <p className="flex items-start gap-2"><Coffee className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" /> Take a 5 minute break</p>
            <p className="flex items-start gap-2"><Flame className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" /> Complete 4 sessions for a long break</p>
            <p className="flex items-start gap-2"><Target className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" /> Earn XP for every session!</p>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  )
}
