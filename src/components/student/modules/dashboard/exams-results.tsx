'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Award, TrendingUp } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { ProgressBar } from '@/components/shared/charts'
import { examResults, exams } from '@/lib/mock/academics'

interface ExamsResultsProps {
  upcomingExams: typeof exams
}

export function ExamsResults({ upcomingExams }: ExamsResultsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Upcoming exams */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-rose-500" /> Upcoming Exams
        </h3>
        <div className="space-y-3">
          {upcomingExams.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <div className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <span className="text-xs font-bold leading-none">{new Date(e.startDate).getDate()}</span>
                <span className="text-[9px] uppercase">{new Date(e.startDate).toLocaleDateString('en-IN', { month: 'short' })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.type} · {e.subjects} subjects</p>
              </div>
              <StatusBadge status={e.status} variant="warning" />
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Latest result summary */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" /> Latest Result
        </h3>
        <div className="relative rounded-2xl bg-gradient-to-br from-amber-400/10 to-orange-500/10 border border-amber-500/20 p-4 overflow-hidden">
          <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Unit Test 3</p>
                <p className="font-display text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                  <AnimatedCounter value={examResults.percentage} decimals={1} suffix="%" />
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-400/20 text-2xl">🏆</div>
                <p className="text-[10px] text-muted-foreground mt-1">Rank #{examResults.rank}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Marks</span>
                <span className="font-semibold">{examResults.total} / {examResults.maxTotal}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Grade</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{examResults.grade}</span>
              </div>
              <div className="pt-1.5">
                <ProgressBar value={examResults.percentage} color="oklch(0.65 0.16 75)" height={6} />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Class toppers */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" /> Class Top 3
        </h3>
        <div className="space-y-2.5">
          {[
            { rank: 1, name: 'Myra Iyer', percentage: 96.7, avatar: 'MI' },
            { rank: 2, name: 'Anika Desai', percentage: 94.3, avatar: 'AD' },
            { rank: 3, name: 'Aarav Sharma (You)', percentage: 91.3, avatar: 'AS' },
          ].map((t, i) => (
            <motion.div
              key={t.rank}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 rounded-xl p-2.5 ${
                t.name.includes('You') ? 'bg-violet-500/10 border border-violet-500/30' : 'bg-card/40'
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </div>
              <GradientAvatar name={t.name} initials={t.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">Roll #{i + 10}</p>
              </div>
              <span className="font-display font-bold text-sm text-emerald-600">{t.percentage}%</span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
