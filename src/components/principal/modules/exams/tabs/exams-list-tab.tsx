'use client'

/**
 * ExamsListTab — Principal examination list organized by lifecycle.
 *
 * Three sections: Current / Active → Upcoming → Completed.
 * No status filters (Scheduled/Ongoing/Completed/Results) — those
 * are top-level tabs. Only search + optional type filter remain.
 *
 * All data from real /api/exams via useExamsList.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, ChevronRight, Radio, CheckCircle2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { EXAM_TYPES, type ExamDTO } from '@/lib/exams/types'
import { InlineLoading } from '../inline-loading'
import { cn } from '@/lib/utils'

interface Props {
  exams: ExamDTO[]
  loading: boolean
  error: string | null
  onOpenExam: (id: string) => void
  onReload: () => void
  onCreate?: () => void
}

export function ExamsListTab({ exams, loading, error, onOpenExam, onCreate }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // Classify exams into lifecycle sections
  const sections = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const filtered = exams.filter((e) => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matches = e.name.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          e.classes.some((c) => c.className.toLowerCase().includes(q))
        if (!matches) return false
      }
      return true
    })

    const current = filtered.filter((e) =>
      e.status.toLowerCase() === 'ongoing'
    ).sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))

    const upcoming = filtered.filter((e) =>
      ['scheduled', 'draft'].includes(e.status.toLowerCase())
    ).sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))

    const completed = filtered.filter((e) =>
      e.status.toLowerCase() === 'completed'
    ).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))

    return { current, upcoming, completed }
  }, [exams, search, typeFilter])

  if (loading) return <InlineLoading label="Loading examinations…" />

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
        <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">Failed to load examinations</p>
        <p className="text-xs text-rose-600/70 mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Toolbar: search + type filter + create button */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search examinations…"
            className="h-8 pl-8 pr-3 text-xs"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger size="sm" className="w-[140px] text-xs rounded-lg">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EXAM_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onCreate && (
          <Button
            onClick={onCreate}
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Create Examination
          </Button>
        )}
      </div>

      {/* Section 1: Current / Active */}
      <ExamSection
        title="Current"
        icon={<Radio className="h-3.5 w-3.5" />}
        exams={sections.current}
        variant="live"
        onOpenExam={onOpenExam}
        emptyMessage="No examination is currently in progress."
      />

      {/* Section 2: Upcoming */}
      <ExamSection
        title="Upcoming"
        icon={<Calendar className="h-3.5 w-3.5" />}
        exams={sections.upcoming}
        variant="upcoming"
        onOpenExam={onOpenExam}
        emptyMessage="No upcoming examinations scheduled."
      />

      {/* Section 3: Completed */}
      <ExamSection
        title="Completed"
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        exams={sections.completed}
        variant="completed"
        onOpenExam={onOpenExam}
        emptyMessage="No completed examinations yet."
      />
    </div>
  )
}

// ─── Exam Section ────────────────────────────────────────────────────

function ExamSection({ title, icon, exams, variant, onOpenExam, emptyMessage }: {
  title: string
  icon: React.ReactNode
  exams: ExamDTO[]
  variant: 'live' | 'upcoming' | 'completed'
  onOpenExam: (id: string) => void
  emptyMessage: string
}) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md',
          variant === 'live' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          variant === 'upcoming' && 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
          variant === 'completed' && 'bg-muted text-muted-foreground',
        )}>
          {icon}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-[10px] text-muted-foreground">({exams.length})</span>
      </div>

      {/* Content */}
      {exams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 py-4 text-center">
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exams.map((exam, i) => (
            <ExamCard key={exam.id} exam={exam} variant={variant} delay={i} onOpen={() => onOpenExam(exam.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Exam Card ───────────────────────────────────────────────────────

function ExamCard({ exam, variant, delay, onOpen }: {
  exam: ExamDTO
  variant: 'live' | 'upcoming' | 'completed'
  delay: number
  onOpen: () => void
}) {
  const isLive = variant === 'live'
  const totalStudents = exam.classes.reduce((s, c) => s + c.studentCount, 0)
  const markPct = exam.markSummary.pct
  const dateRange = exam.startDate && exam.endDate
    ? `${formatDate(exam.startDate)} — ${formatDate(exam.endDate)}`
    : exam.startDate ? formatDate(exam.startDate) : 'Date TBD'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(delay * 0.04, 0.3), duration: 0.25 }}
      whileHover={{ y: -2 }}
      onClick={onOpen}
      className={cn(
        'rounded-xl border bg-card p-4 cursor-pointer transition-all group',
        isLive && 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/40 hover:shadow-sm',
        variant === 'upcoming' && 'border-border hover:border-sky-500/30 hover:shadow-sm',
        variant === 'completed' && 'border-border/60 hover:border-border hover:shadow-sm',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground truncate">{exam.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{exam.type} · {exam.session}</p>
        </div>
        {isLive && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </span>
        )}
        {variant === 'completed' && (
          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="h-2.5 w-2.5" /> Done
          </span>
        )}
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-3">
        <Calendar className="h-3 w-3 shrink-0" />
        <span>{dateRange}</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="Classes" value={exam.classes.length} />
        <Stat label="Subjects" value={exam.subjects.length} />
        <Stat label="Students" value={totalStudents} />
      </div>

      {/* Marks progress (only for live/upcoming with marks) */}
      {exam.markSummary.total > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
            <span>Marks Entry</span>
            <span className="font-semibold tabular-nums">{exam.markSummary.entered}/{exam.markSummary.total}</span>
          </div>
          <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
            <div className={cn('h-full rounded-full', markPct === 100 ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${markPct}%` }} />
          </div>
        </div>
      )}

      {/* Footer: schedule + result status */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-[9px] text-muted-foreground">
        <span>{exam.schedule.length} papers</span>
        <span>·</span>
        {variant === 'completed' ? (
          <span className={cn(
            'font-medium',
            exam.resultStatus === 'Result Declared' && 'text-emerald-600 dark:text-emerald-400',
          )}>
            {exam.resultStatus}
          </span>
        ) : (
          <span>{exam.resultStatus}</span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/30 px-2 py-1">
      <p className="text-[8px] uppercase text-muted-foreground">{label}</p>
      <p className="text-xs font-bold tabular-nums">{value}</p>
    </div>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
