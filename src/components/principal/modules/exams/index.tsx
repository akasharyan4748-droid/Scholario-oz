'use client'

/**
 * ExamsModule — production-grade examination management.
 *
 * Brief §2: Revolves around the complete exam lifecycle:
 *   PLAN → CREATE → SCHEDULE → CONDUCT → ENTER MARKS → VERIFY →
 *   GENERATE RESULTS → DECLARE → VIEW → EXPORT
 *
 * Brief §5: Compact header + academic session context.
 * Brief §6: Exam LIST is the primary content (not analytics).
 * Brief §26: Practical filters (session, type, status, search).
 * Brief §4: All numbers derived from actual exam data.
 */

import { useState, useMemo } from 'react'
import { Plus, Search, FileText } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import {
  EXAMS,
  filterExams,
  EXAM_STATUS_STYLES,
  RESULT_STATUS_STYLES,
  EXAM_TYPE_STYLES,
  getExamMarksProgress,
  type Exam,
  type ExamFilter,
  type ExamStatus,
  type ResultStatus,
} from '@/lib/mock/exams-data'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { CreateExamDialog } from './create-exam-dialog'
import { ExamDetailsDialog } from './exam-details-dialog'
import { toast } from 'sonner'

const FILTER_TABS = [
  { value: 'all', label: 'All Exams' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'results', label: 'Results' },
]

function formatDateRange(start: string, end: string): string {
  if (!start) return '—'
  const [sy, sm, sd] = start.split('-').map(Number)
  const startDate = new Date(sy, sm - 1, sd)
  if (start === end) {
    return startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  const [ey, em, ed] = end.split('-').map(Number)
  const endDate = new Date(ey, em - 1, ed)
  return `${startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export function ExamsModule() {
  const [filter, setFilter] = useState<ExamFilter>('all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)

  const filteredExams = useMemo(() => {
    let result = filterExams(EXAMS, filter)
    if (typeFilter !== 'all') {
      result = result.filter((e) => e.type === typeFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.classes.some((c) => c.toLowerCase().includes(q))
      )
    }
    return result
  }, [filter, typeFilter, search])

  // Derived counts — Brief §4: from actual data, not fabricated
  const counts = useMemo(() => ({
    total: EXAMS.length,
    scheduled: EXAMS.filter((e) => e.status === 'Scheduled').length,
    ongoing: EXAMS.filter((e) => e.status === 'Ongoing').length,
    resultsDeclared: EXAMS.filter((e) => e.resultStatus === 'Result Declared').length,
  }), [])

  const handleCreateExam = () => {
    setCreateOpen(false)
    toast.success('Examination created', {
      description: 'The examination has been created as a draft. Configure subjects and schedule next.',
    })
  }

  return (
    <PageTransition className="space-y-4">
      {/* Brief §5: Compact header — no duplicate page title (topbar shows "Examinations") */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Academic Session 2025–2026
        </p>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Examination
        </Button>
      </div>

      {/* Brief §5: Compact summary strip — derived from real data */}
      <div className="grid grid-cols-4 gap-3">
        <CompactStat label="Examinations" value={counts.total} tone="text-foreground" />
        <CompactStat label="Scheduled" value={counts.scheduled} tone="text-sky-600 dark:text-sky-400" />
        <CompactStat label="Ongoing" value={counts.ongoing} tone="text-amber-600 dark:text-amber-400" />
        <CompactStat label="Results Declared" value={counts.resultsDeclared} tone="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Brief §26: Filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedTabs
          tabs={FILTER_TABS}
          value={filter}
          onValueChange={(v) => setFilter(v as ExamFilter)}
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger size="sm" className="w-[160px] text-xs rounded-lg">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Unit Test">Unit Test</SelectItem>
            <SelectItem value="Term Examination">Term Examination</SelectItem>
            <SelectItem value="Pre-Board">Pre-Board</SelectItem>
            <SelectItem value="Practical">Practical</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search examinations…"
            className="h-8 pl-8 pr-3 text-xs w-[200px] rounded-lg"
          />
        </div>
      </div>

      {/* Brief §6: Exam list as a TABLE — primary content */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur-sm z-10">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5">Examination</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 hidden sm:table-cell">Type</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 hidden md:table-cell">Date</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 hidden lg:table-cell">Classes</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5">Result</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground py-2.5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExams.map((exam) => {
              const progress = getExamMarksProgress(exam)
              return (
                <TableRow
                  key={exam.id}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors text-xs cursor-pointer"
                  onClick={() => setSelectedExam(exam)}
                >
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{exam.name}</p>
                        <p className="text-[10px] text-muted-foreground">{exam.classes[0]} · {exam.classConfigs[0]?.subjects.length || 0} subjects</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 hidden sm:table-cell">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${EXAM_TYPE_STYLES[exam.type]}`}>
                      {exam.type}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 hidden md:table-cell text-muted-foreground">
                    {formatDateRange(exam.startDate, exam.endDate)}
                  </TableCell>
                  <TableCell className="py-2.5 hidden lg:table-cell text-muted-foreground">
                    {exam.classes.join(', ')}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${EXAM_STATUS_STYLES[exam.status]}`}>
                      {exam.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${RESULT_STATUS_STYLES[exam.resultStatus]}`}>
                      {exam.resultStatus}
                    </span>
                    {exam.resultStatus === 'Marks Entry' && progress.total > 0 && (
                      <span className="text-[9px] text-muted-foreground ml-1">
                        {progress.entered}/{progress.total}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedExam(exam) }}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                      title="View details"
                      aria-label="View details"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              )
            })}
            {filteredExams.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                  No examinations found matching filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateExamDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreateExam} />
      {selectedExam && (
        <ExamDetailsDialog
          exam={selectedExam}
          onOpenChange={(o) => !o && setSelectedExam(null)}
        />
      )}
    </PageTransition>
  )
}

/* ──────────────────────────────────────────────────────────
   CompactStat — small inline stat (not a giant card)
   ────────────────────────────────────────────────────────── */
function CompactStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</span>
      <span className={`font-display text-lg font-bold tabular-nums ${tone}`}>{value}</span>
    </div>
  )
}

export default ExamsModule
