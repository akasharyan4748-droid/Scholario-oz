'use client'

/**
 * ExamsOverviewTab — premium Principal dashboard.
 * All numbers come from the real /api/exams payload — no mock data.
 * If no real data exists, shows proper empty states.
 */

import { FileText, Calendar, Clock, CheckCircle2, Trophy, TrendingUp, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Donut, RadialGauge } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  type ExamDTO,
  GRADE_BOUNDARIES,
} from '@/lib/exams/types'
import { useClassResults } from '@/lib/exams/use-exams'
import { InlineLoading } from '../inline-loading'

interface Props {
  exams: ExamDTO[]
  classes: any[]
  loading: boolean
  error: string | null
  onSelectExam: (id: string) => void
  onGoToExams: () => void
}

export function ExamsOverviewTab({ exams, classes, loading, error, onSelectExam, onGoToExams }: Props) {
  if (loading) {
    return <InlineLoading label="Loading examinations…" />
  }
  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
        <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">Failed to load examinations</p>
        <p className="text-xs text-rose-600/70 mt-1">{error}</p>
      </div>
    )
  }

  const counts = {
    total: exams.length,
    scheduled: exams.filter((e) => e.status === 'Scheduled' || e.status === 'Draft').length,
    ongoing: exams.filter((e) => e.status === 'Ongoing').length,
    resultsDeclared: exams.filter((e) => e.resultStatus === 'Result Declared').length,
  }

  // Pick the most recent declared exam for analytics preview
  const declaredExams = exams.filter((e) => e.resultStatus === 'Result Declared')
  const analyticsExam = declaredExams[0] || null
  const analyticsClassId = analyticsExam?.classes[0]?.classId ?? null

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Examinations" value={counts.total} sub="Academic year" icon={<FileText className="h-3.5 w-3.5" />} tone="emerald" />
        <KpiCard label="Scheduled" value={counts.scheduled} sub="Upcoming" icon={<Calendar className="h-3.5 w-3.5" />} tone="sky" />
        <KpiCard label="Ongoing" value={counts.ongoing} sub="Currently active" icon={<Clock className="h-3.5 w-3.5" />} tone="amber" />
        <KpiCard label="Results Declared" value={counts.resultsDeclared} sub="Completed results" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" />
      </div>

      {/* Upcoming examinations list */}
      <UpcomingExams exams={exams} onSelectExam={onSelectExam} />

      {/* Analytics preview from a real declared exam */}
      {analyticsExam && analyticsClassId ? (
        <AnalyticsPreview examId={analyticsExam.id} classId={analyticsClassId} examName={analyticsExam.name} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No examination results available yet. Analytics will appear once results are declared.
          </p>
          <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={onGoToExams}>
            Go to Exams
          </Button>
        </div>
      )}

      {/* Recent activity / audit-style summary */}
      <RecentActivity exams={exams} onSelectExam={onSelectExam} />
    </div>
  )
}

function UpcomingExams({ exams, onSelectExam }: { exams: ExamDTO[]; onSelectExam: (id: string) => void }) {
  const upcoming = exams
    .filter((e) => e.status === 'Scheduled' || e.status === 'Draft' || e.status === 'Ongoing')
    .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
    .slice(0, 5)

  if (upcoming.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-1">Upcoming Examinations</h3>
        <p className="text-xs text-muted-foreground">No upcoming examinations scheduled.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Upcoming Examinations</h3>
      <div className="space-y-2">
        {upcoming.map((exam) => (
          <button
            key={exam.id}
            onClick={() => onSelectExam(exam.id)}
            className="w-full flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{exam.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {exam.type} · {exam.classes[0]?.className ?? '—'} · {exam.startDate || 'TBD'} → {exam.endDate || '—'}
              </p>
            </div>
            <StatusPill status={exam.status} />
            <ResultStatusPill status={exam.resultStatus} />
          </button>
        ))}
      </div>
    </div>
  )
}

function AnalyticsPreview({ examId, classId, examName }: { examId: string; classId: string; examName: string }) {
  const { data, loading, error } = useClassResults(examId, classId)

  if (loading) return <InlineLoading label="Loading analytics…" />
  if (error || !data) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Unable to load analytics for {examName}.</p>
      </div>
    )
  }
  if (data.analytics.totalStudents === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">No students in this class.</p>
      </div>
    )
  }
  const a = data.analytics
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{examName} — Analytics</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{a.totalStudents} students</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Pass percentage */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Pass Percentage</h4>
          <p className="text-[10px] text-muted-foreground mb-3">{examName}</p>
          <div className="flex items-center gap-4">
            <div className="shrink-0" style={{ width: 100, height: 100 }}>
              <RadialGauge value={a.passRate} label="pass" size={100} color="oklch(0.55 0.14 162)" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5">
                <span className="text-[10px] text-muted-foreground">Passed</span>
                <span className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">{a.passed}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-rose-500/10 px-2.5 py-1.5">
                <span className="text-[10px] text-muted-foreground">Not Passed</span>
                <span className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">{a.failed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grade distribution */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Grade Distribution</h4>
          <p className="text-[10px] text-muted-foreground mb-3">Across all students</p>
          <div className="flex items-center gap-3">
            <div className="shrink-0" style={{ width: 110, height: 110 }}>
              <Donut
                data={GRADE_BOUNDARIES.map((g) => ({
                  name: g.grade,
                  value: a.gradeDistribution[g.grade] || 0,
                  color: gradeToOklch(g.color),
                })).filter((d) => d.value > 0)}
                height={110}
                innerRadius={32}
                outerRadius={48}
                centerValue={`${a.totalStudents}`}
                centerLabel=""
              />
            </div>
            <div className="flex-1 space-y-1">
              {GRADE_BOUNDARIES.map((g) => {
                const count = a.gradeDistribution[g.grade] || 0
                if (count === 0) return null
                return (
                  <div key={g.grade} className="flex items-center gap-2 text-xs">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', gradeToBgClass(g.color))} />
                    <span className="text-muted-foreground flex-1">{g.grade}</span>
                    <span className="font-semibold tabular-nums">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Subject performance */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Subject Performance</h4>
          <p className="text-[10px] text-muted-foreground mb-3">Average by subject</p>
          <div className="space-y-1.5">
            {a.subjectPerformance.length === 0 && (
              <p className="text-[10px] text-muted-foreground">No subject marks entered.</p>
            )}
            {a.subjectPerformance.map((subj, i) => (
              <div key={subj.subjectId} className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-foreground w-20 shrink-0 truncate" title={subj.subjectName}>{subj.subjectName}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subj.averagePercentage}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: subj.averagePercentage >= 80 ? 'oklch(0.65 0.16 162)' : subj.averagePercentage >= 60 ? 'oklch(0.75 0.15 75)' : 'oklch(0.62 0.2 25)' }}
                  />
                </div>
                <span className="text-[10px] font-semibold tabular-nums w-10 text-right">{subj.averagePercentage}%</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Average: {a.averagePercentage}%</span>
            <span>{a.totalStudents} students</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function RecentActivity({ exams, onSelectExam }: { exams: ExamDTO[]; onSelectExam: (id: string) => void }) {
  const recent = [...exams].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
  if (recent.length === 0) return null
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
      <div className="space-y-2">
        {recent.map((exam) => (
          <button
            key={exam.id}
            onClick={() => onSelectExam(exam.id)}
            className="w-full flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{exam.name}</p>
              <p className="text-[10px] text-muted-foreground">
                Last updated {new Date(exam.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <ResultStatusPill status={exam.resultStatus} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────

function gradeToOklch(color: string): string {
  switch (color) {
    case 'emerald': return 'oklch(0.65 0.16 162)'
    case 'sky': return 'oklch(0.7 0.15 200)'
    case 'amber': return 'oklch(0.75 0.15 75)'
    case 'orange': return 'oklch(0.7 0.18 50)'
    case 'rose': return 'oklch(0.62 0.2 25)'
    default: return 'oklch(0.6 0.15 300)'
  }
}

function gradeToBgClass(color: string): string {
  switch (color) {
    case 'emerald': return 'bg-emerald-500'
    case 'sky': return 'bg-sky-500'
    case 'amber': return 'bg-amber-500'
    case 'orange': return 'bg-orange-500'
    case 'rose': return 'bg-rose-500'
    default: return 'bg-violet-500'
  }
}

function StatusPill({ status }: { status: string }) {
  const cls = {
    Draft: 'bg-muted text-muted-foreground border-border',
    Scheduled: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    Ongoing: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    Completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    Cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  }[status] || 'bg-muted text-muted-foreground border-border'
  return <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold shrink-0', cls)}>{status}</span>
}

function ResultStatusPill({ status }: { status: string }) {
  const cls = {
    'Not Started': 'bg-muted/60 text-muted-foreground border-border',
    'Marks Entry': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    'Under Verification': 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    'Result Ready': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
    'Result Declared': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  }[status] || 'bg-muted text-muted-foreground border-border'
  return <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold shrink-0', cls)}>{status}</span>
}

function KpiCard({ label, value, sub, icon, tone }: {
  label: string; value: number; sub: string; icon: React.ReactNode; tone: 'emerald' | 'sky' | 'amber'
}) {
  const toneClasses = {
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-border hover:border-emerald-500/40' },
    sky: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/5', border: 'border-border hover:border-sky-500/40' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/5', border: 'border-border hover:border-amber-500/40' },
  }[tone]
  return (
    <div className={cn('rounded-xl border p-3 sm:p-4 transition-colors', toneClasses.bg, toneClasses.border)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
        <span className={toneClasses.text}>{icon}</span>
      </div>
      <p className={cn('font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight', toneClasses.text)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}
