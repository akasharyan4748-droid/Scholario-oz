'use client'

/**
 * PerformanceSection — Last Examination Performance + Top Performers.
 *
 * Sections:
 *   1. Overall School / Class-wise scope toggle
 *   2. Latest declared exam performance (avg, pass rate, highest, students)
 *   3. Score distribution visualization
 *   4. Subject performance bars
 *   5. Performance trend (only if 2+ declared exams with data)
 *   6. Top 3 podium + Top 5 list
 *   7. Needs attention students (below pass threshold)
 *
 * All data from /api/exams/overview-analytics — uses the existing result engine.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, TrendingUp, Crown, Award, ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SegmentedTabs } from '../../shared/segmented-tabs'
import { useOverviewAnalytics, type OverviewAnalytics } from '@/lib/exams/use-overview-analytics'
import { cn } from '@/lib/utils'

interface Props {
  classes: any[]
  onSelectExam: (id: string) => void
  onNavigate?: (s: string) => void
}

export function PerformanceSection({ classes, onNavigate }: Props) {
  const [scope, setScope] = useState<'overall' | 'class'>('overall')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const { data, loading } = useOverviewAnalytics(scope === 'class' ? selectedClassId : null)

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!data || !data.hasResults) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Trophy className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          {data?.declaredExamCount === 0
            ? 'No declared examination results yet.'
            : 'No result data available for the latest declared examination.'}
        </p>
      </div>
    )
  }

  const a = data.analytics!
  const exam = data.latestExam!
  const toppers = data.toppers
  const className = data.className || 'School'

  return (
    <div className="space-y-4">
      {/* Scope toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <SegmentedTabs
          tabs={[
            { value: 'overall', label: 'Overall School' },
            { value: 'class', label: 'Class-wise' },
          ]}
          value={scope}
          onValueChange={(v) => setScope(v as 'overall' | 'class')}
        />
        {scope === 'class' && (
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger size="sm" className="w-[160px] text-xs">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Performance section */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-0.5">Last Examination Performance</p>
            <h2 className="font-display text-base font-bold tracking-tight truncate">{exam.name}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {exam.type} · {className}
              {exam.startDate && exam.endDate && (
                <span> · {formatDate(exam.startDate)} — {formatDate(exam.endDate)}</span>
              )}
            </p>
          </div>
        </div>

        {/* 4 compact metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Metric label="Average Score" value={`${a.averagePercentage}%`} tone="emerald" />
          <Metric label="Pass Rate" value={`${a.passRate}%`} tone={a.passRate >= 80 ? 'emerald' : 'amber'} />
          <Metric label="Highest" value={`${a.highestPercentage}%`} tone="sky" />
          <Metric label="Students" value={a.totalStudents} tone="violet" />
        </div>

        {/* Two-column: Score Distribution + Subject Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Score Distribution */}
          <div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Score Distribution</p>
            <ScoreDistribution grades={a.gradeDistribution} />
          </div>

          {/* Subject Performance */}
          <div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Subject Performance</p>
            <div className="space-y-1.5">
              {a.subjectPerformance.slice(0, 6).map((subj, i) => (
                <div key={subj.subjectId} className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-foreground w-20 shrink-0 truncate" title={subj.subjectName}>
                    {subj.subjectName}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${subj.averagePercentage}%` }}
                      transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        'h-full rounded-full',
                        subj.averagePercentage >= 80 ? 'bg-emerald-500' :
                        subj.averagePercentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      )}
                    />
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums w-10 text-right">{subj.averagePercentage}%</span>
                </div>
              ))}
              {a.subjectPerformance.length === 0 && (
                <p className="text-[10px] text-muted-foreground">No subject data.</p>
              )}
            </div>
          </div>
        </div>

        {/* Trend — only if 2+ declared exams with data */}
        {data.trend.length > 1 && (
          <div className="mb-4">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> Performance Trend
            </p>
            <div className="flex items-end gap-3 sm:gap-6 h-16">
              {data.trend.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold tabular-nums">{t.averagePercentage}%</span>
                  <div className="w-full rounded-t-md bg-primary/20 overflow-hidden flex items-end" style={{ height: 40 }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${t.averagePercentage}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full rounded-t-md bg-primary"
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center" title={t.examName}>{t.examName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Needs Attention — compact inline */}
        {data.needsAttention.length > 0 && (
          <div className="flex items-center gap-2 px-1 py-2 border-t border-border/40">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              {data.needsAttention.length} {data.needsAttention.length === 1 ? 'student' : 'students'} below passing threshold
            </span>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-0.5 ml-auto" onClick={() => onNavigate?.('results')}>
              View Results <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </motion.div>

      {/* Top Performers */}
      {toppers.length > 0 && (
        <TopPerformers toppers={toppers} examName={exam.name} className={className} />
      )}
    </div>
  )
}

// ─── Metric ──────────────────────────────────────────────────────────

function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  const tones: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    sky: 'text-sky-600 dark:text-sky-400',
    violet: 'text-violet-600 dark:text-violet-400',
  }
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2">
      <p className="text-[9px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className={cn('font-display text-lg font-bold tabular-nums mt-0.5', tones[tone] ?? '')}>{value}</p>
    </div>
  )
}

// ─── Score Distribution ───────────────────────────────────────────────

function ScoreDistribution({ grades }: { grades: Record<string, number> }) {
  const GRADE_ORDER = ['A+', 'A', 'B+', 'B', 'C', 'D', 'E']
  const colors: Record<string, string> = {
    'A+': 'bg-emerald-500', 'A': 'bg-emerald-400', 'B+': 'bg-sky-500',
    'B': 'bg-amber-500', 'C': 'bg-orange-500', 'D': 'bg-rose-500', 'E': 'bg-rose-600',
  }
  const total = Object.values(grades).reduce((s, v) => s + v, 0)
  const maxCount = Math.max(...Object.values(grades), 1)

  return (
    <div className="space-y-1.5">
      {GRADE_ORDER.filter((g) => grades[g] > 0).map((g, i) => (
        <div key={g} className="flex items-center gap-2">
          <span className="text-[10px] font-bold w-6 shrink-0">{g}</span>
          <div className="flex-1 h-3 rounded bg-muted/40 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(grades[g] / maxCount) * 100}%` }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={cn('h-full rounded', colors[g] ?? 'bg-muted')}
            />
          </div>
          <span className="text-[10px] font-semibold tabular-nums w-8 text-right">{grades[g]}</span>
          <span className="text-[9px] text-muted-foreground w-8 text-right">{total > 0 ? Math.round((grades[g] / total) * 100) : 0}%</span>
        </div>
      ))}
      {GRADE_ORDER.filter((g) => grades[g] > 0).length === 0 && (
        <p className="text-[10px] text-muted-foreground">No grade data.</p>
      )}
    </div>
  )
}

// ─── Top Performers ──────────────────────────────────────────────────

function TopPerformers({ toppers, examName, className }: {
  toppers: OverviewAnalytics['toppers']
  examName: string
  className: string
}) {
  const top3 = toppers.slice(0, 3)
  const rest = toppers.slice(3, 5)
  const rankStyles = [
    { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/10', ring: 'ring-slate-400/20' },
    { icon: Award, color: 'text-orange-600', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Top Performers</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{examName}</span>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {top3.map((t, i) => {
          const style = rankStyles[i] ?? rankStyles[2]
          const Icon = style.icon
          return (
            <motion.div
              key={t.studentId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              className={cn(
                'flex flex-col items-center text-center p-3 rounded-xl border border-border/60 bg-card',
                i === 0 && 'sm:scale-105'
              )}
            >
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-full ring-2 mb-2', style.bg, style.ring)}>
                <Icon className={cn('h-5 w-5', style.color)} />
              </div>
              <p className="text-xs font-semibold truncate w-full">{t.name}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{t.className}</p>
              <p className={cn('font-display text-base font-bold tabular-nums mt-1', style.color)}>
                {t.percentage}%
              </p>
              <span className="text-[9px] text-muted-foreground">Rank {t.rank}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Top 4-5 */}
      {rest.length > 0 && (
        <div className="space-y-1">
          {rest.map((t, i) => (
            <div key={t.studentId} className="flex items-center gap-3 p-2 rounded-lg border border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground w-5">{t.rank}</span>
              <span className="text-xs font-medium flex-1 truncate">{t.name}</span>
              <span className="text-[9px] text-muted-foreground">{t.className}</span>
              <span className="text-xs font-bold tabular-nums">{t.percentage}%</span>
              <span className="text-[9px] text-muted-foreground font-semibold">{t.grade}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
