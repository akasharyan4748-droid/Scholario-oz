'use client'

/**
 * ExamsListTab — premium white-background list of examination cards.
 *
 * Status filters (All/Scheduled/Ongoing/Completed/Results) live INSIDE
 * this tab — not as top-level navigation. Each card is fully functional:
 * clicking opens the ExamWorkspaceDialog (real workspace on real exam).
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search, Calendar, ChevronRight, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { SegmentedTabs } from '../../shared/segmented-tabs'
import { InlineLoading } from '../inline-loading'
import { cn } from '@/lib/utils'
import {
  EXAM_TYPES,
  type ExamDTO,
} from '@/lib/exams/types'

interface Props {
  exams: ExamDTO[]
  loading: boolean
  error: string | null
  onOpenExam: (id: string) => void
  onReload: () => void
  onCreate?: () => void
}

type Filter = 'all' | 'scheduled' | 'ongoing' | 'completed' | 'results'

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'results', label: 'Results' },
]

export function ExamsListTab({ exams, loading, error, onOpenExam }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let result = exams
    if (filter === 'scheduled') result = result.filter((e) => e.status === 'Scheduled' || e.status === 'Draft')
    else if (filter === 'ongoing') result = result.filter((e) => e.status === 'Ongoing')
    else if (filter === 'completed') result = result.filter((e) => e.status === 'Completed')
    else if (filter === 'results') result = result.filter((e) => e.resultStatus === 'Result Declared')
    if (typeFilter !== 'all') result = result.filter((e) => e.type === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          e.classes.some((c) => c.className.toLowerCase().includes(q))
      )
    }
    return result
  }, [exams, filter, typeFilter, search])

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedTabs tabs={FILTER_TABS} value={filter} onValueChange={(v) => setFilter(v as Filter)} />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger size="sm" className="w-[150px] text-xs rounded-lg">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {EXAM_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search examinations…"
            className="h-8 pl-8 pr-3 text-xs w-[180px] rounded-lg"
          />
        </div>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {filtered.length} of {exams.length} exams
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No examinations found matching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((exam, i) => (
            <ExamCard key={exam.id} exam={exam} delay={i} onOpen={() => onOpenExam(exam.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ExamCard({ exam, delay, onOpen }: { exam: ExamDTO; delay: number; onOpen: () => void }) {
  const markPct = exam.markSummary.pct
  const totalStudents = exam.classes.reduce((s, c) => s + c.studentCount, 0)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(delay * 0.04, 0.3), duration: 0.25 }}
      onClick={onOpen}
      className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:shadow-sm hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{exam.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {exam.session} · {exam.type}
          </p>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* Meta grid — classes, subjects, students */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-md bg-muted/30 px-2 py-1">
          <p className="text-[8px] uppercase text-muted-foreground">Classes</p>
          <p className="text-xs font-bold tabular-nums">{exam.classes.length}</p>
        </div>
        <div className="rounded-md bg-muted/30 px-2 py-1">
          <p className="text-[8px] uppercase text-muted-foreground">Subjects</p>
          <p className="text-xs font-bold tabular-nums">{exam.subjects.length}</p>
        </div>
        <div className="rounded-md bg-muted/30 px-2 py-1">
          <p className="text-[8px] uppercase text-muted-foreground">Students</p>
          <p className="text-xs font-bold tabular-nums">{totalStudents}</p>
        </div>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
        <Calendar className="h-3 w-3 shrink-0" />
        <span>{exam.startDate || 'TBD'}</span>
        {exam.endDate && exam.endDate !== exam.startDate && (
          <>
            <span>→</span>
            <span>{exam.endDate}</span>
          </>
        )}
      </div>

      {/* Marks progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" /> Evaluation
          </span>
          <span className="font-semibold tabular-nums">
            {exam.markSummary.total > 0 ? `${exam.markSummary.entered}/${exam.markSummary.total} · ${markPct}%` : '—'}
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${markPct}%` }} />
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border/40 flex-wrap">
        <StatusPill status={exam.status} />
        <ResultStatusPill status={exam.resultStatus} />
      </div>
    </motion.div>
  )
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
