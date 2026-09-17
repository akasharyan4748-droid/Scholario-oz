'use client'

/**
 * Performance Analytics — real, derived analytics for the teacher's
 * classes: per-class subject averages from entered exam marks, attendance
 * stats + trend from canonical records, student ranking and honest
 * derived insights. Fed by GET /api/teacher/analytics.
 */

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Users, Award, CalendarCheck, BookOpen,
  RefreshCw, AlertTriangle, Sparkles, GraduationCap, ClipboardList,
} from 'lucide-react'
import { GlassCard, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { ModuleToolbar } from '../../teacher-panel/module-toolbar'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, BarTrend, AreaTrend, ProgressBar } from '@/components/shared/charts'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/signout'

// ─── API contract ─────────────────────────────────────────────────────

interface ClassAnalytics {
  classId: string
  label: string
  exam: { name: string; status: string } | null
  subjectAverages: { subject: string; avg: number; max: number }[]
  attendance: {
    total: number
    present: number
    late: number
    absent: number
    pct: number | null
    trend: { name: string; value: number }[]
  }
  studentPerformance: { name: string; rollNo: string | null; avgPct: number; subjects: number }[]
  insights: { type: 'success' | 'warning' | 'info'; title: string; desc: string }[]
}

interface AnalyticsPayload {
  classes: { id: string; label: string }[]
  classAnalytics: ClassAnalytics[]
}

async function analyticsFetch(): Promise<AnalyticsPayload> {
  const res = await fetch('/api/teacher/analytics', {
    cache: 'no-store',
    credentials: 'same-origin',
  })
  if (res.status === 401) {
    void signOut()
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const body = (await res.json()) as { ok?: boolean; data?: AnalyticsPayload; error?: string }
  if (!body.ok || !body.data) throw new Error(body.error || 'Failed to load analytics')
  return body.data
}

const SUBJECT_COLORS = [
  'oklch(0.6 0.18 300)', 'oklch(0.55 0.14 162)', 'oklch(0.65 0.16 75)',
  'oklch(0.62 0.2 25)', 'oklch(0.7 0.15 200)', 'oklch(0.55 0.16 250)',
]

export function TeacherAnalyticsModule() {
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [classId, setClassId] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    analyticsFetch()
      .then((payload) => {
        if (cancelled) return
        setData(payload)
        setClassId((prev) => {
          if (prev && payload.classAnalytics.some((c) => c.classId === prev)) return prev
          return payload.classAnalytics[0]?.classId ?? null
        })
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
    return () => { cancelled = true }
  }, [reload])

  const active = useMemo(
    () => data?.classAnalytics.find((c) => c.classId === classId) ?? data?.classAnalytics[0] ?? null,
    [data, classId],
  )

  if (error) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">Couldn&apos;t load analytics</p>
        <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={() => setReload((r) => r + 1)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
        </button>
      </GlassCard>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading analytics">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
        <div className="h-[220px] animate-pulse rounded-xl bg-muted/40" />
        <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    )
  }

  if (data.classAnalytics.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center gap-2 p-10 text-center">
        <GraduationCap className="mb-1 h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">No analytics available yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Analytics appear once your classes have entered exam marks or attendance records.
        </p>
      </GlassCard>
    )
  }

  const a = active!
  const topStudents = a.studentPerformance.slice(0, 5)
  const classAvg = a.studentPerformance.length > 0
    ? Math.round((a.studentPerformance.reduce((s, x) => s + x.avgPct, 0) / a.studentPerformance.length) * 10) / 10
    : null

  return (
    <div className="space-y-5">
      <ModuleToolbar
        context={`${a.label} · ${a.exam ? `${a.exam.name} results` : 'performance insights'}`}
      />

      {/* Class selector */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Classes">
        {data.classAnalytics.map((c) => (
          <button
            key={c.classId}
            role="tab"
            aria-selected={c.classId === a.classId}
            onClick={() => setClassId(c.classId)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              c.classId === a.classId
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'glass text-muted-foreground hover:text-foreground',
            )}
          >
            {c.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', c.classId === a.classId ? 'bg-primary-foreground/20' : 'bg-muted')}>
              {c.subjectAverages.length}
            </span>
          </button>
        ))}
      </div>

      {/* KPI row — real aggregates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Class Average"
          value={classAvg ?? 0}
          suffix={classAvg != null ? '%' : undefined}
          decimals={classAvg != null ? 1 : undefined}
          format={classAvg == null ? () => '—' : undefined}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="emerald"
          trendLabel={a.exam ? a.exam.name : 'latest assessment'}
          delay={0}
        />
        <KpiCard
          label="Attendance"
          value={a.attendance.pct ?? 0}
          suffix={a.attendance.pct != null ? '%' : undefined}
          decimals={a.attendance.pct != null ? 1 : undefined}
          format={a.attendance.pct == null ? () => '—' : undefined}
          icon={<CalendarCheck className="h-5 w-5" />}
          accent="cyan"
          trendLabel={a.attendance.total > 0 ? `${a.attendance.total} records` : 'no records yet'}
          delay={0.05}
        />
        <KpiCard
          label="Subjects Graded"
          value={a.subjectAverages.length}
          icon={<BookOpen className="h-5 w-5" />}
          accent="violet"
          trendLabel={a.exam?.name ?? '—'}
          delay={0.1}
        />
        <KpiCard
          label="Students Ranked"
          value={a.studentPerformance.length}
          icon={<Users className="h-5 w-5" />}
          accent="amber"
          trendLabel="with entered marks"
          delay={0.15}
        />
      </div>

      {/* Charts — subject averages + attendance trend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {a.subjectAverages.length > 0 ? (
          <ChartCard title="Subject Averages" subtitle={a.exam ? `${a.exam.name} · ${a.label}` : a.label} className="lg:col-span-2">
            <BarTrend
              data={a.subjectAverages.map((s) => ({ subject: s.subject, pct: Math.round((s.avg / s.max) * 100) }))}
              xKey="subject"
              yKey="pct"
              color="oklch(0.65 0.16 75)"
              height={220}
            />
          </ChartCard>
        ) : (
          <GlassCard className="flex h-[220px] flex-col items-center justify-center text-center lg:col-span-2">
            <ClipboardList className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">No marks entered yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Subject averages appear once exam marks are entered.</p>
          </GlassCard>
        )}
        {a.attendance.trend.length > 1 ? (
          <ChartCard title="Attendance Trend" subtitle="Weekly · present + late">
            <AreaTrend data={a.attendance.trend} xKey="name" yKey="value" color="oklch(0.55 0.14 162)" height={220} gradientId={`attTrend-${a.classId}`} />
          </ChartCard>
        ) : (
          <GlassCard className="flex h-[220px] flex-col items-center justify-center text-center">
            <CalendarCheck className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Attendance trend</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {a.attendance.total > 0 ? `${a.attendance.pct}% overall · more weeks needed for a trend` : 'No attendance recorded yet'}
            </p>
          </GlassCard>
        )}
      </div>

      {/* Student ranking + insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Performers</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{a.label} · {a.exam?.name ?? '—'}</p>
            </div>
            <Award className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
          <div className="space-y-2.5">
            {topStudents.map((s, i) => (
              <motion.div
                key={`${s.rollNo}-${s.name}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5"
              >
                <span className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  i === 0 ? 'bg-amber-500/15 text-amber-600' : i === 1 ? 'bg-slate-400/15 text-slate-500' : i === 2 ? 'bg-orange-500/15 text-orange-600' : 'bg-muted text-muted-foreground',
                )}>
                  {i + 1}
                </span>
                <GradientAvatar name={s.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">Roll #{s.rollNo ?? '—'} · {s.subjects} subjects</p>
                </div>
                <span className="shrink-0 font-display text-sm font-bold tabular-nums">{s.avgPct}%</span>
              </motion.div>
            ))}
            {topStudents.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">No students with entered marks yet.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5 sm:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Insights</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Derived from {a.label}&apos;s records</p>
            </div>
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {a.insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={cn(
                  'rounded-xl border p-3',
                  insight.type === 'success' && 'border-emerald-500/20 bg-emerald-500/5',
                  insight.type === 'warning' && 'border-amber-500/20 bg-amber-500/5',
                  insight.type === 'info' && 'border-cyan-500/20 bg-cyan-500/5',
                )}
              >
                <div className="flex items-start gap-2">
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    insight.type === 'success' && 'bg-emerald-500/15 text-emerald-600',
                    insight.type === 'warning' && 'bg-amber-500/15 text-amber-600',
                    insight.type === 'info' && 'bg-cyan-500/15 text-cyan-600',
                  )}>
                    {insight.type === 'success' ? <TrendingUp className="h-3.5 w-3.5" /> : insight.type === 'warning' ? <AlertTriangle className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{insight.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {a.insights.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground sm:col-span-2">
                Insights appear once marks and attendance records exist.
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Subject table — real averages */}
      {a.subjectAverages.length > 0 && (
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject Breakdown</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{a.label} · {a.exam?.name}</p>
            </div>
            <StatusBadge status={`${a.subjectAverages.length} subjects`} variant="neutral" />
          </div>
          <div className="divide-y divide-border/50">
            {a.subjectAverages.map((s, i) => {
              const pct = Math.round((s.avg / s.max) * 100)
              return (
                <div key={s.subject} className="flex items-center gap-3 py-2.5">
                  <span className="w-8 shrink-0 text-right font-mono text-[11px] text-muted-foreground">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-medium">{s.subject}</p>
                      <p className="shrink-0 text-xs tabular-nums text-muted-foreground">{s.avg}/{s.max}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar value={pct} color={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} height={5} className="flex-1" />
                      <span className="w-10 shrink-0 text-right font-display text-xs font-bold tabular-nums">{pct}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
