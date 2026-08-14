'use client'

/**
 * ExamsOverviewTab — Principal Examination Control Dashboard.
 *
 * Deliberately simple. Three sections:
 *   1. Four KPI cards (Examinations, Marks Entry, Results, Current Status)
 *   2. Current/Next Examination card
 *   3. Needs Attention list (only if items exist)
 *
 * No charts. No pipeline. No quick actions. No recent activity.
 * All data from useExamsList (real API).
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, ClipboardList, CheckCircle2, Activity,
  ArrowRight, AlertTriangle, ChevronRight,
  Trophy, Medal, TrendingUp, GraduationCap, Crown, Award,
} from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ExamDTO } from '@/lib/exams/types'
import { useOverviewAnalytics, type OverviewAnalytics } from '@/lib/exams/use-overview-analytics'
import { PerformanceSection } from './performance-section'

interface Props {
  exams: ExamDTO[]
  classes: any[]
  loading: boolean
  error: string | null
  onSelectExam: (id: string) => void
  onGoToExams: () => void
  onNavigate?: (section: string) => void
}

export function ExamsOverviewTab({ exams, classes, loading, error, onSelectExam, onNavigate }: Props) {
  const data = useMemo(() => computeOverview(exams), [exams])

  if (loading) return <OverviewSkeleton />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-4">
      {/* Session selector — top right, no heading */}
      <div className="flex justify-end">
        <Select defaultValue="2025-2026">
          <SelectTrigger size="sm" className="w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025-2026">2025–2026</SelectItem>
            <SelectItem value="2024-2025">2024–2025</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Examinations"
          value={data.total}
          sub={`${data.completed} Completed · ${data.ongoing} Ongoing · ${data.upcoming} Upcoming`}
          icon={<FileText className="h-4 w-4" />}
          tone="emerald"
          delay={0}
        />
        <KpiCard
          label="Marks Entry"
          value={data.marksTotal > 0 ? `${data.marksEntered}/${data.marksTotal}` : '—'}
          sub={data.marksSub}
          icon={<ClipboardList className="h-4 w-4" />}
          tone="amber"
          delay={0.05}
        />
        <KpiCard
          label="Results Declared"
          value={data.total > 0 ? `${data.declared}/${data.total}` : '—'}
          sub={data.resultsSub}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="cyan"
          delay={0.1}
        />
        <KpiCard
          label="Current Status"
          value={data.statusLabel}
          sub={data.statusSub}
          icon={<Activity className="h-4 w-4" />}
          tone={data.statusTone}
          delay={0.15}
        />
      </div>

      {/* Current / Next Examination */}
      <CurrentExamination data={data} onSelectExam={onSelectExam} />

      {/* Needs Attention — only if items exist */}
      <NeedsAttention items={data.attentionItems} onSelectExam={onSelectExam} onNavigate={onNavigate} />

      {/* Last Examination Performance */}
      <PerformanceSection classes={classes} onSelectExam={onSelectExam} onNavigate={onNavigate} />
    </div>
  )
}

// ─── Data computation ─────────────────────────────────────────────────

interface OverviewData {
  total: number
  completed: number
  ongoing: number
  upcoming: number
  declared: number
  marksTotal: number
  marksEntered: number
  marksSub: string
  resultsSub: string
  statusLabel: string
  statusSub: string
  statusTone: 'emerald' | 'amber' | 'sky' | 'rose'
  currentExam: ExamDTO | null
  nextExam: ExamDTO | null
  attentionItems: AttentionItem[]
}

interface AttentionItem {
  type: 'marks_pending' | 'verification_pending' | 'results_ready' | 'schedule_missing'
  label: string
  detail: string
  examId: string
  action: string
}

function computeOverview(exams: ExamDTO[]): OverviewData {
  const total = exams.length
  const completed = exams.filter((e) => e.status.toLowerCase() === 'completed').length
  const ongoing = exams.filter((e) => e.status.toLowerCase() === 'ongoing').length
  const upcoming = exams.filter((e) => ['scheduled', 'draft'].includes(e.status.toLowerCase())).length
  const declared = exams.filter((e) => e.resultStatus.toLowerCase() === 'result declared').length

  // Marks: aggregate across all exams
  const marksTotal = exams.reduce((s, e) => s + e.markSummary.total, 0)
  const marksEntered = exams.reduce((s, e) => s + e.markSummary.entered, 0)

  let marksSub: string
  if (marksTotal === 0) {
    marksSub = 'No marks workflow active'
  } else if (marksEntered === marksTotal) {
    marksSub = 'All marks submitted'
  } else {
    const pct = marksTotal > 0 ? Math.round((marksEntered / marksTotal) * 100) : 0
    marksSub = `${pct}% completed`
  }

  let resultsSub: string
  if (total === 0) {
    resultsSub = 'No examinations'
  } else if (declared === total) {
    resultsSub = 'All results declared'
  } else {
    resultsSub = `${total - declared} remaining`
  }

  // Current exam: prefer Ongoing, then most recent Scheduled
  const currentExam = exams.find((e) => e.status.toLowerCase() === 'ongoing') ?? null

  // Next exam: upcoming, sorted by start date
  const nextExam = exams
    .filter((e) => e.status.toLowerCase() === 'scheduled')
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))[0] ?? null

  // Status logic
  let statusLabel: string
  let statusSub: string
  let statusTone: 'emerald' | 'amber' | 'sky' | 'rose'

  if (currentExam) {
    statusLabel = 'Ongoing'
    statusSub = currentExam.name
    statusTone = 'amber'
  } else if (nextExam) {
    const days = nextExam.startDate ? daysUntil(nextExam.startDate) : null
    statusLabel = 'Upcoming'
    statusSub = days !== null ? `${nextExam.name} · in ${days}d` : nextExam.name
    statusTone = 'sky'
  } else if (total > 0 && declared < total) {
    statusLabel = 'Action Needed'
    statusSub = `${total - declared} results pending`
    statusTone = 'rose'
  } else if (total > 0 && declared === total) {
    statusLabel = 'On Track'
    statusSub = 'All results declared'
    statusTone = 'emerald'
  } else {
    statusLabel = '—'
    statusSub = 'No examinations'
    statusTone = 'emerald'
  }

  // Attention items
  const attentionItems: AttentionItem[] = []
  for (const e of exams) {
    if (e.resultStatus.toLowerCase() === 'result ready') {
      attentionItems.push({
        type: 'results_ready',
        label: `${e.name} — Results ready to declare`,
        detail: 'Awaiting Principal declaration',
        examId: e.id,
        action: 'Open',
      })
    }
    if (e.resultStatus.toLowerCase() === 'under verification') {
      attentionItems.push({
        type: 'verification_pending',
        label: `${e.name} — Verification pending`,
        detail: 'Marks submitted, awaiting verification',
        examId: e.id,
        action: 'Open',
      })
    }
    if (e.resultStatus.toLowerCase() === 'marks entry' && e.markSummary.total > 0) {
      const pending = e.markSummary.total - e.markSummary.entered
      if (pending > 0) {
        attentionItems.push({
          type: 'marks_pending',
          label: `${e.name} — ${pending} marks pending`,
          detail: `${e.markSummary.entered}/${e.markSummary.total} entered`,
          examId: e.id,
          action: 'Open',
        })
      }
    }
    // Exams with classes but no schedule
    if (e.classes.length > 0 && e.schedule.length === 0 && e.status.toLowerCase() !== 'completed') {
      attentionItems.push({
        type: 'schedule_missing',
        label: `${e.name} — No schedule created`,
        detail: `${e.classes.length} classes assigned, 0 schedule items`,
        examId: e.id,
        action: 'Open',
      })
    }
  }

  return {
    total, completed, ongoing, upcoming, declared,
    marksTotal, marksEntered, marksSub, resultsSub,
    statusLabel, statusSub, statusTone,
    currentExam, nextExam, attentionItems,
  }
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── KPI Card ────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, tone, delay }: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  tone: 'emerald' | 'amber' | 'sky' | 'rose' | 'cyan'
  delay: number
}) {
  const tones: Record<string, { text: string; bg: string }> = {
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/5' },
    sky: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/5' },
    rose: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/5' },
    cyan: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/5' },
  }
  const t = tones[tone] ?? tones.emerald

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={cn('rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm', t.bg)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
        <span className={t.text}>{icon}</span>
      </div>
      <p className={cn('font-display text-2xl font-bold tabular-nums tracking-tight', t.text)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{sub}</p>
    </motion.div>
  )
}

// ─── Current / Next Examination ──────────────────────────────────────

function CurrentExamination({ data, onSelectExam }: { data: OverviewData; onSelectExam: (id: string) => void }) {
  const exam = data.currentExam ?? data.nextExam
  if (!exam) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-xs text-muted-foreground">No upcoming examinations.</p>
      </div>
    )
  }

  const isOngoing = data.currentExam !== null
  const title = isOngoing ? 'Current Examination' : 'Next Examination'
  const classNames = exam.classes.map((c) => c.className).join(', ') || '—'
  const subjectCount = exam.subjects.length
  const dateRange = exam.startDate && exam.endDate
    ? `${formatDate(exam.startDate)} — ${formatDate(exam.endDate)}`
    : exam.startDate ? formatDate(exam.startDate) : 'Date not set'

  // Marks progress for this exam
  const marksTotal = exam.markSummary.total
  const marksEntered = exam.markSummary.entered
  const marksPct = marksTotal > 0 ? Math.round((marksEntered / marksTotal) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      {/* Eyebrow + title */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">{title}</p>
          <h2 className="font-display text-base font-bold tracking-tight truncate">{exam.name}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {exam.type} · {classNames}
          </p>
          <p className="text-[11px] text-muted-foreground">{dateRange}</p>
        </div>
        {isOngoing && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </div>

      {/* Compact stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <MiniStat label="Classes" value={exam.classes.length} />
        <MiniStat label="Subjects" value={subjectCount} />
        <MiniStat label="Schedule" value={exam.schedule.length} />
        <MiniStat label="Students" value={exam.classes.reduce((s, c) => s + c.studentCount, 0)} />
      </div>

      {/* Marks + Results row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Marks Entry */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Marks Entry</span>
            <span className="text-[10px] font-semibold tabular-nums text-foreground">
              {marksTotal > 0 ? `${marksEntered}/${marksTotal}` : '—'}
            </span>
          </div>
          {marksTotal > 0 ? (
            <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${marksPct}%` }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={cn('h-full rounded-full', marksPct === 100 ? 'bg-emerald-500' : 'bg-amber-500')}
              />
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">No marks workflow</p>
          )}
        </div>
        {/* Results */}
        <div>
          <span className="text-[10px] uppercase font-semibold text-muted-foreground">Results</span>
          <p className="text-xs font-medium mt-0.5">
            {exam.resultStatus.toLowerCase() === 'result declared' ? (
              <span className="text-emerald-600 dark:text-emerald-400">Declared</span>
            ) : exam.resultStatus.toLowerCase() === 'result ready' ? (
              <span className="text-cyan-600 dark:text-cyan-400">Ready to declare</span>
            ) : exam.resultStatus.toLowerCase() === 'under verification' ? (
              <span className="text-violet-600 dark:text-violet-400">Under verification</span>
            ) : exam.resultStatus.toLowerCase() === 'marks entry' ? (
              <span className="text-amber-600 dark:text-amber-400">In progress</span>
            ) : (
              <span className="text-muted-foreground">Not started</span>
            )}
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onSelectExam(exam.id)}>
          Open Examination <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/30 px-2.5 py-1.5">
      <p className="text-[9px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold tabular-nums">{value}</p>
    </div>
  )
}

// ─── Needs Attention ────────────────────────────────────────────────

function NeedsAttention({ items, onSelectExam, onNavigate }: {
  items: AttentionItem[]
  onSelectExam: (id: string) => void
  onNavigate?: (s: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 px-1 py-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="text-xs text-muted-foreground">Everything is up to date.</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Needs Attention</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">{items.length} items</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onSelectExam(item.examId)}
            className="w-full flex items-center gap-3 p-2 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors text-left group"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{item.detail}</p>
            </div>
            <span className="text-[10px] text-primary shrink-0 group-hover:underline">{item.action}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
              <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-7 w-20 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-24 rounded bg-muted/60 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-3 w-32 rounded bg-muted animate-pulse" />
        <div className="h-5 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />)}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-rose-500/50 mx-auto mb-3" />
      <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Unable to load examination overview</p>
      <p className="text-xs text-rose-600/70 mt-1">{error}</p>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
