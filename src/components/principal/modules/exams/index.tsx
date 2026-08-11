'use client'

/**
 * ExamsModule — production-grade examination management.
 *
 * Brief §1-2: COMBINE the old visual richness with the new examination lifecycle.
 * The page has proper vertical depth:
 *   1. Header + summary
 *   2. Filters + exam list (operational)
 *   3. Performance analytics (pass %, grade dist, subject perf)
 *   4. Result insights (class toppers + grade sheet)
 *
 * All analytics are DERIVED from actual exam data via getExamAnalytics().
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, FileText, Trophy, GraduationCap, Download, Award } from 'lucide-react'
import { PageTransition, GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Donut, RadialGauge } from '@/components/shared/charts'
import {
  EXAMS,
  filterExams,
  EXAM_STATUS_STYLES,
  RESULT_STATUS_STYLES,
  EXAM_TYPE_STYLES,
  getExamMarksProgress,
  getExamAnalytics,
  calculateResult,
  GRADE_BOUNDARIES,
  type Exam,
  type ExamFilter,
} from '@/lib/mock/exams-data'
import { class2AAttendance } from '@/lib/mock/attendance'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { CreateExamDialog } from './create-exam-dialog'
import { ExamDetailsDialog } from './exam-details-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

  // Brief §4: Derived counts — from actual data
  const counts = useMemo(() => ({
    total: EXAMS.length,
    scheduled: EXAMS.filter((e) => e.status === 'Scheduled').length,
    ongoing: EXAMS.filter((e) => e.status === 'Ongoing').length,
    resultsDeclared: EXAMS.filter((e) => e.resultStatus === 'Result Declared').length,
  }), [])

  // Brief §16: Analytics derived from the most recent declared exam
  const analyticsExam = useMemo(() => {
    return EXAMS.find((e) => e.resultStatus === 'Result Declared') || null
  }, [])

  const analytics = useMemo(() => {
    if (!analyticsExam) return null
    return getExamAnalytics(analyticsExam.id)
  }, [analyticsExam])

  // Grade sheet data — from the most recent declared exam
  const gradeSheetData = useMemo(() => {
    if (!analyticsExam) return null
    const classConfig = analyticsExam.classConfigs[0]
    if (!classConfig) return null
    const subjectNames = classConfig.subjects.map((s) => s.name)
    const rows = class2AAttendance.map((student) => {
      const result = calculateResult(analyticsExam, classConfig.classId, student.rollNo)
      const marks = classConfig.marks.map((sm) => {
        const mark = sm.marks.find((m) => m.studentId === student.rollNo)
        return mark?.isAbsent ? 'AB' : mark?.marksObtained ?? '—'
      })
      return { student, result, marks }
    }).sort((a, b) => (b.result?.percentage || 0) - (a.result?.percentage || 0))
    return { subjectNames, rows }
  }, [analyticsExam])

  const handleCreateExam = () => {
    setCreateOpen(false)
    toast.success('Examination created', {
      description: 'The examination has been created as a draft. Configure subjects and schedule next.',
    })
  }

  return (
    <PageTransition className="space-y-5">
      {/* ── 1. HEADER ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Manage examinations, schedules, marks and results</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">Academic Session 2025–2026</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Examination
        </Button>
      </div>

      {/* ── 2. SUMMARY METRICS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Examinations" value={counts.total} sub="Academic year" icon={<FileText className="h-3.5 w-3.5" />} tone="emerald" />
        <SummaryCard label="Scheduled" value={counts.scheduled} sub="Upcoming" icon={<FileText className="h-3.5 w-3.5" />} tone="sky" />
        <SummaryCard label="Ongoing" value={counts.ongoing} sub="Currently active" icon={<FileText className="h-3.5 w-3.5" />} tone="amber" />
        <SummaryCard label="Results Declared" value={counts.resultsDeclared} sub="Completed results" icon={<Award className="h-3.5 w-3.5" />} tone="emerald" />
      </div>

      {/* ── 3. EXAM NAVIGATION + FILTERS ── */}
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

      {/* ── 4. EXAMINATION LIST ── */}
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

      {/* ── 5. PERFORMANCE ANALYTICS — COMPACT, NO DEAD SPACE ── */}
      {analytics ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pass Percentage — compact: gauge + pass/fail inline */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Pass Percentage</h3>
            <p className="text-[10px] text-muted-foreground mb-3">{analyticsExam?.name} · {analytics.totalStudents} students</p>
            <div className="flex items-center gap-4">
              <div className="shrink-0" style={{ width: 100, height: 100 }}>
                <RadialGauge
                  value={analytics.passRate}
                  label="pass"
                  size={100}
                  color="oklch(0.55 0.14 162)"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5">
                  <span className="text-[10px] text-muted-foreground">Passed</span>
                  <span className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">{analytics.passed}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-rose-500/10 px-2.5 py-1.5">
                  <span className="text-[10px] text-muted-foreground">Not Passed</span>
                  <span className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">{analytics.totalStudents - analytics.passed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Distribution — compact donut + legend */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Grade Distribution</h3>
            <p className="text-[10px] text-muted-foreground mb-3">Across all students</p>
            <div className="flex items-center gap-3">
              <div className="shrink-0" style={{ width: 110, height: 110 }}>
                <Donut
                  data={GRADE_BOUNDARIES.map((g) => ({
                    name: g.grade,
                    value: analytics.gradeDistribution[g.grade] || 0,
                    color: g.color.includes('emerald') ? 'oklch(0.65 0.16 162)' :
                           g.color.includes('sky') ? 'oklch(0.7 0.15 200)' :
                           g.color.includes('amber') ? 'oklch(0.75 0.15 75)' :
                           g.color.includes('orange') ? 'oklch(0.7 0.18 50)' :
                           g.color.includes('rose') ? 'oklch(0.62 0.2 25)' :
                           'oklch(0.6 0.15 300)',
                  })).filter((d) => d.value > 0)}
                  height={110}
                  innerRadius={32}
                  outerRadius={48}
                  centerValue={`${analytics.totalStudents}`}
                  centerLabel=""
                />
              </div>
              <div className="flex-1 space-y-1">
                {GRADE_BOUNDARIES.map((g) => {
                  const count = analytics.gradeDistribution[g.grade] || 0
                  if (count === 0) return null
                  const dotColor = g.color.includes('emerald') ? 'bg-emerald-500' :
                                   g.color.includes('sky') ? 'bg-sky-500' :
                                   g.color.includes('amber') ? 'bg-amber-500' :
                                   g.color.includes('orange') ? 'bg-orange-500' :
                                   g.color.includes('rose') ? 'bg-rose-500' : 'bg-violet-500'
                  return (
                    <div key={g.grade} className="flex items-center gap-2 text-xs">
                      <span className={cn('h-2 w-2 rounded-full shrink-0', dotColor)} />
                      <span className="text-muted-foreground flex-1">{g.grade}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Subject Performance — compact horizontal bars */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Subject Performance</h3>
            <p className="text-[10px] text-muted-foreground mb-3">Average marks by subject</p>
            <div className="space-y-1.5">
              {analytics.subjectPerformance.map((subj, i) => (
                <div key={subj.subject} className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-foreground w-20 shrink-0 truncate">{subj.subject}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${subj.avg}%` }}
                      transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{
                        background: subj.avg >= 80 ? 'oklch(0.65 0.16 162)' :
                                   subj.avg >= 60 ? 'oklch(0.75 0.15 75)' :
                                   'oklch(0.62 0.2 25)'
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums w-10 text-right">{subj.avg}%</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Average: {analytics.averagePercentage}%</span>
              <span>{analytics.totalStudents} students</span>
            </div>
          </div>
        </div>
      ) : (
        <GlassCard className="p-6 text-center">
          <p className="text-xs text-muted-foreground">No results declared yet. Analytics will appear once examination results are declared.</p>
        </GlassCard>
      )}

      {/* ── 6. RESULT INSIGHTS: CLASS TOPPERS + GRADE SHEET ── */}
      {gradeSheetData && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Class Toppers */}
          <GlassCard className="p-3 sm:p-4 lg:p-5">
            <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Class Toppers
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {analyticsExam?.name} · Class 2-A · Top 5
            </p>
            <div className="space-y-2">
              {gradeSheetData.rows.slice(0, 5).map(({ student, result }, i) => (
                <motion.div
                  key={student.rollNo}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-2.5',
                    i === 0 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-card/40 border-border'
                  )}
                >
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{student.name}</p>
                    <p className="text-[10px] text-muted-foreground">Roll #{student.rollNo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-sm">{result?.percentage}%</p>
                    <p className={cn('text-[10px] font-semibold', result?.gradeColor)}>{result?.grade}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Grade Sheet */}
          <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Grade Sheet
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {analyticsExam?.name} · Class 2-A · {gradeSheetData.rows.length} students
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => toast.success('Grade sheet exported', { description: `${analyticsExam?.name}_class-2A_gradesheet.pdf` })}
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
            <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Student</TableHead>
                    {gradeSheetData.subjectNames.map((s) => (
                      <TableHead key={s} className="text-center hidden md:table-cell text-[10px]">{s.slice(0, 4)}</TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradeSheetData.rows.map(({ student, result, marks }, i) => (
                    <TableRow
                      key={student.rollNo}
                      className={cn('border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors', i < 3 && 'bg-amber-500/5')}
                    >
                      <TableCell className="font-bold text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium text-xs truncate">{student.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">#{student.rollNo}</p>
                        </div>
                      </TableCell>
                      {marks.map((m, idx) => (
                        <TableCell key={idx} className="text-center hidden md:table-cell text-xs font-mono">
                          {m === 'AB' ? (
                            <span className="text-rose-600 font-semibold text-[10px]">AB</span>
                          ) : m === '—' ? (
                            <span className="text-muted-foreground/40">—</span>
                          ) : (
                            <span className={cn(
                              Number(m) >= 40 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' :
                              Number(m) >= 17 ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'
                            )}>{m}</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-display font-bold text-sm">
                        {result?.totalObtained}<span className="text-muted-foreground text-[10px]">/{result?.totalMax}</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">{result?.percentage}%</TableCell>
                      <TableCell className="text-center">
                        <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold',
                          result?.grade === 'A+' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                          result?.grade === 'A' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                          result?.grade === 'B+' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                          result?.grade === 'B' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                          'bg-muted text-muted-foreground border-border'
                        )}>{result?.grade}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </div>
      )}

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
   SummaryCard — compact but visually polished metric card
   ────────────────────────────────────────────────────────── */
function SummaryCard({ label, value, sub, icon, tone }: {
  label: string
  value: number
  sub: string
  icon: React.ReactNode
  tone: 'emerald' | 'sky' | 'amber'
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
      <p className={cn('font-display text-2xl sm:text-3xl font-bold tabular-nums tracking-tight', toneClasses.text)}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

export default ExamsModule
