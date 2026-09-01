'use client'

/**
 * HomeworkDashboard — Principal's main oversight landing.
 *
 * Top: 4 compliance KPI cards.
 * Left 70%: Load Matrix heatmap + Subject Distribution donut.
 * Right 30%: Teacher Activity Feed + Low Submission Alerts.
 */

import { motion } from 'framer-motion'
import { CheckCircle2, Users, AlertTriangle, MessageSquareWarning, Activity, TrendingDown, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useComplianceMetrics,
  useLoadMatrix,
  useSubjectDistribution,
  useTeacherActivity,
  useLowSubmissionAlerts,
} from '@/lib/homework/use-oversight'
import { InlineLoading } from '../exams/inline-loading'

interface Props {
  onNavigate: (s: 'dashboard' | 'policy' | 'quality' | 'analytics' | 'feedback') => void
}

export function HomeworkDashboard({ onNavigate }: Props) {
  const { data: metrics, loading: metricsLoading } = useComplianceMetrics()
  const { data: matrix, loading: matrixLoading } = useLoadMatrix()
  const { data: subjects, loading: subjectsLoading } = useSubjectDistribution()
  const { data: activity, loading: activityLoading } = useTeacherActivity()
  const { data: alerts, loading: alertsLoading } = useLowSubmissionAlerts()

  if (metricsLoading) return <InlineLoading label="Loading compliance metrics…" />

  return (
    <div className="space-y-4">
      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Today's Submission Rate"
          value={metrics ? `${metrics.todaysSubmissionRate}%` : '—'}
          sub="Students submitted on time"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          tone={metrics ? (metrics.todaysSubmissionRate >= 80 ? 'emerald' : metrics.todaysSubmissionRate >= 50 ? 'amber' : 'rose') : 'muted'}
        />
        <KpiCard
          label="Homework Compliance"
          value={metrics ? `${metrics.teacherCompliance}%` : '—'}
          sub="Teachers posted on time"
          icon={<Users className="h-3.5 w-3.5" />}
          tone={metrics ? (metrics.teacherCompliance >= 90 ? 'emerald' : metrics.teacherCompliance >= 70 ? 'amber' : 'rose') : 'muted'}
        />
        <KpiCard
          label="Overloaded Classes"
          value={metrics?.overloadedClasses ?? 0}
          sub="Exceeding daily limit"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          tone={metrics ? (metrics.overloadedClasses === 0 ? 'emerald' : metrics.overloadedClasses <= 2 ? 'amber' : 'rose') : 'muted'}
          onClick={() => onNavigate('policy')}
        />
        <KpiCard
          label="Pending Grievances"
          value={metrics?.pendingGrievances ?? 0}
          sub="Parent complaints open"
          icon={<MessageSquareWarning className="h-3.5 w-3.5" />}
          tone={metrics ? (metrics.pendingGrievances === 0 ? 'emerald' : 'amber') : 'muted'}
          onClick={() => onNavigate('feedback')}
        />
      </div>

      {/* Main body: 70/30 split */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Left column — Load Matrix + Subject Distribution */}
        <div className="space-y-4">
          {/* Homework Load Matrix */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Homework Load Matrix
              </h3>
              <div className="flex items-center gap-2 text-[9px]">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Balanced</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> High</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Overload</span>
              </div>
            </div>
            {matrixLoading ? (
              <InlineLoading label="Loading load matrix…" />
            ) : matrix && matrix.cells.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {matrix.cells.map((cell, i) => (
                  <motion.div
                    key={cell.classId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className={cn(
                      'rounded-lg border p-2.5 cursor-pointer hover:shadow-sm transition-all',
                      cell.loadLevel === 'green' && 'bg-emerald-500/5 border-emerald-500/20',
                      cell.loadLevel === 'amber' && 'bg-amber-500/5 border-amber-500/20',
                      cell.loadLevel === 'red' && 'bg-rose-500/5 border-rose-500/20'
                    )}
                  >
                    <p className="text-[10px] font-semibold text-foreground truncate">{cell.className}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {cell.homeworkCount} hw · ~{cell.estimatedMinutes}m
                    </p>
                    <div className={cn(
                      'mt-1.5 h-1 rounded-full',
                      cell.loadLevel === 'green' && 'bg-emerald-500',
                      cell.loadLevel === 'amber' && 'bg-amber-500',
                      cell.loadLevel === 'red' && 'bg-rose-500'
                    )} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No active homework today. All classes balanced.
              </div>
            )}
          </div>

          {/* Subject Distribution */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Subject-Wise Homework Distribution</h3>
            {subjectsLoading ? (
              <InlineLoading label="Loading…" />
            ) : subjects.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="shrink-0" style={{ width: 120, height: 120 }}>
                  <SubjectDonut data={subjects} />
                </div>
                <div className="flex-1 space-y-1">
                  {subjects.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      />
                      <span className="text-muted-foreground flex-1 truncate">{s.subjectName}</span>
                      <span className="font-semibold tabular-nums">{s.count}</span>
                      <span className="text-muted-foreground text-[9px]">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No homework assigned yet.</p>
            )}
          </div>
        </div>

        {/* Right column — Activity Feed + Low Submission Alerts */}
        <div className="space-y-4">
          {/* Teacher Activity Feed */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Teacher Activity
            </h3>
            {activityLoading ? (
              <InlineLoading label="Loading…" />
            ) : activity.length > 0 ? (
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {activity.map((a) => (
                  <div key={a.id} className="text-xs p-2 rounded-lg border border-border/40 bg-card/40">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-medium text-foreground truncate">{a.teacherName}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto">
                        {new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {actionLabel(a.action)} · {a.homeworkTitle}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {a.className}{a.subjectName ? ` · ${a.subjectName}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No recent activity.</p>
            )}
          </div>

          {/* Low Submission Alerts */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" /> Low Submission Alerts
            </h3>
            {alertsLoading ? (
              <InlineLoading label="Loading…" />
            ) : alerts.length > 0 ? (
              <div className="space-y-1.5">
                {alerts.map((a, i) => (
                  <div key={i} className="text-xs p-2 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-foreground truncate">{a.className}</span>
                      <span className={cn(
                        'text-[10px] font-bold tabular-nums',
                        a.submissionRate < 30 ? 'text-rose-600' : 'text-amber-600'
                      )}>{a.submissionRate}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{a.homeworkTitle}</p>
                    <p className="text-[9px] text-muted-foreground">{a.submitted}/{a.total} submitted</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No low-submission classes.</p>
            )}
          </div>

          {/* Quick stats */}
          {metrics && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Overview
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/30 p-2">
                  <p className="text-[9px] text-muted-foreground">Active HW</p>
                  <p className="font-display text-lg font-bold">{metrics.totalActiveHomework}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-2">
                  <p className="text-[9px] text-muted-foreground">Students</p>
                  <p className="font-display text-lg font-bold">{metrics.totalStudents}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-2">
                  <p className="text-[9px] text-muted-foreground">Teachers</p>
                  <p className="font-display text-lg font-bold">{metrics.totalTeachers}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-2">
                  <p className="text-[9px] text-muted-foreground">Overloaded</p>
                  <p className="font-display text-lg font-bold">{metrics.overloadedClasses}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, tone, onClick }: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  tone: 'emerald' | 'amber' | 'rose' | 'muted'
  onClick?: () => void
}) {
  const toneClasses = {
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-border hover:border-emerald-500/40' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/5', border: 'border-border hover:border-amber-500/40' },
    rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/5', border: 'border-border hover:border-rose-500/40' },
    muted: { text: 'text-muted-foreground', bg: 'bg-muted/5', border: 'border-border' },
  }[tone]
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn('text-left rounded-xl border p-3 sm:p-4 transition-all', toneClasses.bg, toneClasses.border, !onClick && 'cursor-default')}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
        <span className={toneClasses.text}>{icon}</span>
      </div>
      <p className={cn('font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight', toneClasses.text)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </button>
  )
}

// ─── Subject Donut (inline SVG) ────────────────────────────────────────

const DONUT_COLORS = ['oklch(0.55 0.14 162)', 'oklch(0.7 0.15 200)', 'oklch(0.75 0.15 75)', 'oklch(0.7 0.18 50)', 'oklch(0.62 0.2 25)', 'oklch(0.6 0.15 300)']

function SubjectDonut({ data }: { data: Array<{ subjectName: string; count: number; pct: number }> }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const circumference = 2 * Math.PI * 42
  // Build slices with cumulative offset via reduce — no mutation, pure expression.
  const slices = data.reduce<
    Array<{ i: number; dash: number; gap: number; offset: number; color: string }>
  >((acc, s, i) => {
    const pct = total > 0 ? s.count / total : 0
    const dash = pct * circumference
    const gap = circumference - dash
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
    acc.push({ i, dash, gap, offset, color: DONUT_COLORS[i % DONUT_COLORS.length] })
    return acc
  }, [])
  return (
    <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
      {slices.map(({ i, dash, gap, offset, color }) => (
        <circle
          key={i}
          cx="55" cy="55" r="42"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={-offset}
        />
      ))}
      <text x="55" y="50" textAnchor="middle" className="fill-foreground" style={{ fontSize: 18, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: '55px 55px' }}>
        {total}
      </text>
      <text x="55" y="65" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 8, transform: 'rotate(90deg)', transformOrigin: '55px 55px' }}>
        total
      </text>
    </svg>
  )
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    HOMEWORK_CREATED: 'Created',
    HOMEWORK_PUBLISHED: 'Published',
    SUBMISSION_RECEIVED: 'Received submission',
    SUBMISSION_REVIEWED: 'Reviewed',
  }
  return map[action] ?? action
}
