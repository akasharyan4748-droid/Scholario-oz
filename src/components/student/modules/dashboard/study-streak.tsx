'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, Zap } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { useStudentLearningStore, streakOf, weeklyMinutes } from '@/lib/store/student-learning-store'
import { useMyResults } from '@/lib/store/student-results-store'
import { cn } from '@/lib/utils'

/**
 * StudyStreak — derived from the REAL study-session history (spec §35: a
 * streak day = at least one recorded study session; opening the page
 * never counts). The 14-day mini-calendar marks actual session days.
 */
export function StudyStreak() {
  const sessions = useStudentLearningStore((s) => s.sessions)
  // Level/XP stay owned by My Progress (the gamification module) — the
  // streak card here shows only the honest study consistency.
  const results = useMyResults()

  const streak = useMemo(() => streakOf(sessions), [sessions])
  const weekMinutes = useMemo(() => weeklyMinutes(sessions), [sessions])

  // The last 14 days: a day is "active" iff a session ended that day.
  const last14 = useMemo(() => {
    const days = new Set(sessions.map((s) => s.endedAt.slice(0, 10)))
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (13 - i))
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return { key, active: days.has(key), isLast: i === 13 }
    })
  }, [sessions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5 lg:p-6">
        {/* Decorative warm gradient backdrop (matches streak fire theme) */}
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
          {/* Left: Streak flame + headline */}
          <div className="lg:col-span-5 flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 220 }}
              className="relative shrink-0"
            >
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 blur-md opacity-50 animate-pulse" />
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/30">
                <Flame className="h-9 w-9 sm:h-10 sm:w-10" />
              </div>
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Study Streak
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-0.5">
                  <Zap className="h-3 w-3 text-amber-500" /> {Math.round(weekMinutes / 60 * 10) / 10}h this week
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight flex items-baseline gap-2">
                <AnimatedCounter value={streak.current} />
                <span className="text-sm font-semibold text-muted-foreground">days</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Best: <span className="font-semibold text-rose-600 dark:text-rose-400">{streak.longest} days</span>
                {' · '}a session a day keeps it alive
              </p>
            </div>
          </div>

          {/* Middle: Last 14 days mini-calendar */}
          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-500" /> Last 14 days
              </p>
              <p className="text-[10px] text-muted-foreground">Each square = 1 day with a study session</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {last14.map((d, i) => (
                <motion.div
                  key={d.key}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.04, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.15 }}
                  className={cn(
                    'aspect-square rounded-md flex items-center justify-center text-[9px] font-bold',
                    d.active
                      ? d.isLast
                        ? 'bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-300/50'
                        : 'bg-gradient-to-br from-amber-400/80 to-orange-500/80 text-white'
                      : 'bg-muted/60 text-muted-foreground/40',
                  )}
                  title={d.active ? 'Active study day' : 'No study session'}
                  aria-hidden
                />
              ))}
            </div>
          </div>

          {/* Right: honest context */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-center">
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Today</p>
              <p className="font-display text-lg font-bold mt-0.5">{streak.activeToday ? 'Done ✓' : 'Not yet'}</p>
              <p className="text-[10px] text-muted-foreground">one session counts</p>
            </div>
            {results.latest && (
              <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Last Exam</p>
                <p className="font-display text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{Math.round(results.latest.totals.pct * 10) / 10}%</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
