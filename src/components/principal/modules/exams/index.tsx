'use client'

/**
 * ExamsModule — premium production-grade examination management.
 *
 * Brief §1: Four primary sections: Overview | Exams | Results | Settings
 * Brief §2-4: Overview = KPI cards + compact analytics + performance trend
 * Brief §5-6: Exams = premium exam cards + status filters + search
 * Brief §8-11: Results = analytics + class toppers + grade sheet
 * Brief §12: Settings = grading config + exam types + pass marks
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, FileText, Trophy, GraduationCap, Download, Award, Calendar, Clock, CheckCircle2, Settings as SettingsIcon, ChevronRight, TrendingUp } from 'lucide-react'
import { PageTransition, GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Donut, RadialGauge } from '@/components/shared/charts'
import {
  EXAMS as SEED_EXAMS,
  filterExams,
  EXAM_STATUS_STYLES,
  RESULT_STATUS_STYLES,
  EXAM_TYPE_STYLES,
  getExamMarksProgress,
  calculateResult,
  GRADE_BOUNDARIES,
  EXAM_TYPES,
  PASSING_PERCENTAGE,
  type Exam,
  type ExamFilter,
  type ExamStatus,
  type ResultStatus,
  type ExamType,
} from '@/lib/mock/exams-data'
import {
  useExamsStore,
  getExamAnalyticsFromStore,
  getGradeSheetData,
} from '@/lib/store/exams-store'
import { class2AAttendance } from '@/lib/mock/attendance'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { CreateExamDialog } from './create-exam-dialog'
import { ExamDetailsDialog } from './exam-details-dialog'
import { generateGradeSheetPDF, generateStudentReportCardPDF } from './exams-pdf'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type SectionTab = 'overview' | 'exams' | 'results' | 'settings'

const SECTION_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'exams', label: 'Exams' },
  { value: 'results', label: 'Results' },
  { value: 'settings', label: 'Settings' },
]

const EXAM_FILTER_TABS = [
  { value: 'all', label: 'All' },
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
  const [section, setSection] = useState<SectionTab>('overview')
  const [filter, setFilter] = useState<ExamFilter>('all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)

  // P0: Get exams from the store (not static import)
  const storeExams = useExamsStore((s) => s.exams)

  const filteredExams = useMemo(() => {
    let result = filterExams(storeExams, filter)
    if (typeFilter !== 'all') result = result.filter((e) => e.type === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((e) =>
        e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || e.classes.some((c) => c.toLowerCase().includes(q))
      )
    }
    return result
  }, [storeExams, filter, typeFilter, search])

  const counts = useMemo(() => ({
    total: storeExams.length,
    scheduled: storeExams.filter((e) => e.status === 'Scheduled').length,
    ongoing: storeExams.filter((e) => e.status === 'Ongoing').length,
    resultsDeclared: storeExams.filter((e) => e.resultStatus === 'Result Declared').length,
  }), [storeExams])

  const analyticsExam = useMemo(() => storeExams.find((e) => e.resultStatus === 'Result Declared') || null, [storeExams])
  const analytics = useMemo(() => analyticsExam ? getExamAnalyticsFromStore(analyticsExam) : null, [analyticsExam])

  const gradeSheetData = useMemo(() => {
    if (!analyticsExam) return null
    return getGradeSheetData(analyticsExam)
  }, [analyticsExam])

  // Performance trend — from declared exams
  const trendData = useMemo(() => {
    const declaredExams = storeExams.filter((e) => e.resultStatus === 'Result Declared')
    return declaredExams.map((exam) => {
      const a = getExamAnalyticsFromStore(exam)
      return { name: exam.name, avg: a?.averagePercentage || 0, passRate: a?.passRate || 0 }
    })
  }, [storeExams])

  const handleCreateExam = () => {
    setCreateOpen(false)
    toast.success('Examination created', { description: 'Configure subjects and schedule next.' })
  }

  return (
    <PageTransition className="space-y-4">
      {/* ── SECTION NAVIGATION ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedTabs tabs={SECTION_TABS} value={section} onValueChange={(v) => setSection(v as SectionTab)} />
        {section === 'exams' && (
          <Button onClick={() => setCreateOpen(true)} size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-3.5 w-3.5" /> Create Examination
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {section === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="Examinations" value={counts.total} sub="Academic year" icon={<FileText className="h-3.5 w-3.5" />} tone="emerald" />
              <KpiCard label="Scheduled" value={counts.scheduled} sub="Upcoming" icon={<Calendar className="h-3.5 w-3.5" />} tone="sky" />
              <KpiCard label="Ongoing" value={counts.ongoing} sub="Currently active" icon={<Clock className="h-3.5 w-3.5" />} tone="amber" />
              <KpiCard label="Results Declared" value={counts.resultsDeclared} sub="Completed results" icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="emerald" />
            </div>

            {/* Analytics Row */}
            {analytics ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Pass Percentage */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Pass Percentage</h3>
                  <p className="text-[10px] text-muted-foreground mb-3">{analyticsExam?.name} · {analytics.totalStudents} students</p>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0" style={{ width: 100, height: 100 }}>
                      <RadialGauge value={analytics.passRate} label="pass" size={100} color="oklch(0.55 0.14 162)" />
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

                {/* Grade Distribution */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Grade Distribution</h3>
                  <p className="text-[10px] text-muted-foreground mb-3">Across all students</p>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0" style={{ width: 110, height: 110 }}>
                      <Donut
                        data={GRADE_BOUNDARIES.map((g) => ({
                          name: g.grade, value: analytics.gradeDistribution[g.grade] || 0,
                          color: g.color.includes('emerald') ? 'oklch(0.65 0.16 162)' : g.color.includes('sky') ? 'oklch(0.7 0.15 200)' : g.color.includes('amber') ? 'oklch(0.75 0.15 75)' : g.color.includes('orange') ? 'oklch(0.7 0.18 50)' : g.color.includes('rose') ? 'oklch(0.62 0.2 25)' : 'oklch(0.6 0.15 300)',
                        })).filter((d) => d.value > 0)}
                        height={110} innerRadius={32} outerRadius={48}
                        centerValue={`${analytics.totalStudents}`} centerLabel=""
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      {GRADE_BOUNDARIES.map((g) => {
                        const count = analytics.gradeDistribution[g.grade] || 0
                        if (count === 0) return null
                        const dotColor = g.color.includes('emerald') ? 'bg-emerald-500' : g.color.includes('sky') ? 'bg-sky-500' : g.color.includes('amber') ? 'bg-amber-500' : g.color.includes('orange') ? 'bg-orange-500' : g.color.includes('rose') ? 'bg-rose-500' : 'bg-violet-500'
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

                {/* Subject Performance */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Subject Performance</h3>
                  <p className="text-[10px] text-muted-foreground mb-3">Average marks by subject</p>
                  <div className="space-y-1.5">
                    {analytics.subjectPerformance.map((subj, i) => (
                      <div key={subj.subject} className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-foreground w-20 shrink-0 truncate" title={subj.subject}>{subj.subject}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${subj.avg}%` }} transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{ background: subj.avg >= 80 ? 'oklch(0.65 0.16 162)' : subj.avg >= 60 ? 'oklch(0.75 0.15 75)' : 'oklch(0.62 0.2 25)' }}
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
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No results declared yet. Analytics will appear once examination results are declared.</p>
              </div>
            )}

            {/* Performance Trend */}
            {trendData.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Performance Trend</h3>
                  <span className="text-[10px] text-muted-foreground ml-auto">{trendData.length} examinations</span>
                </div>
                <div className="flex items-end gap-3 sm:gap-6 h-24">
                  {trendData.map((t, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold tabular-nums">{t.avg}%</span>
                      <div className="w-full rounded-t-md bg-primary/20 overflow-hidden flex items-end" style={{ height: 60 }}>
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: `${t.avg}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                          className="w-full rounded-t-md bg-primary"
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {section === 'exams' && (
          <motion.div key="exams" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-4">
            {/* Status filters + search */}
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedTabs tabs={EXAM_FILTER_TABS} value={filter} onValueChange={(v) => setFilter(v as ExamFilter)} />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger size="sm" className="w-[150px] text-xs rounded-lg">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search examinations…" className="h-8 pl-8 pr-3 text-xs w-[180px] rounded-lg" />
              </div>
            </div>

            {/* Exam Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredExams.map((exam, i) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25 }}
                  onClick={() => setSelectedExam(exam)}
                  className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:shadow-sm hover:border-primary/30 transition-all group"
                >
                  {/* Header: name + type pill */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{exam.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{exam.classes[0]} · {exam.classConfigs[0]?.subjects.length || 0} subjects</p>
                    </div>
                    <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold shrink-0', EXAM_TYPE_STYLES[exam.type])}>
                      {exam.type}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {formatDateRange(exam.startDate, exam.endDate)}
                  </div>

                  {/* Status row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                    <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold', EXAM_STATUS_STYLES[exam.status])}>
                      {exam.status}
                    </span>
                    <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold', RESULT_STATUS_STYLES[exam.resultStatus])}>
                      {exam.resultStatus}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              ))}
              {filteredExams.length === 0 && (
                <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No examinations found matching filters.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {section === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-4">
            {analytics && gradeSheetData ? (
              <>
                {/* Results analytics row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Pass Percentage</h3>
                    <p className="text-[10px] text-muted-foreground mb-3">{analyticsExam?.name} · {analytics.totalStudents} students</p>
                    <div className="flex items-center gap-4">
                      <div className="shrink-0" style={{ width: 100, height: 100 }}>
                        <RadialGauge value={analytics.passRate} label="pass" size={100} color="oklch(0.55 0.14 162)" />
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

                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Grade Distribution</h3>
                    <p className="text-[10px] text-muted-foreground mb-3">Across all students</p>
                    <div className="flex items-center gap-3">
                      <div className="shrink-0" style={{ width: 110, height: 110 }}>
                        <Donut
                          data={GRADE_BOUNDARIES.map((g) => ({
                            name: g.grade, value: analytics.gradeDistribution[g.grade] || 0,
                            color: g.color.includes('emerald') ? 'oklch(0.65 0.16 162)' : g.color.includes('sky') ? 'oklch(0.7 0.15 200)' : g.color.includes('amber') ? 'oklch(0.75 0.15 75)' : g.color.includes('orange') ? 'oklch(0.7 0.18 50)' : g.color.includes('rose') ? 'oklch(0.62 0.2 25)' : 'oklch(0.6 0.15 300)',
                          })).filter((d) => d.value > 0)}
                          height={110} innerRadius={32} outerRadius={48}
                          centerValue={`${analytics.totalStudents}`} centerLabel=""
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        {GRADE_BOUNDARIES.map((g) => {
                          const count = analytics.gradeDistribution[g.grade] || 0
                          if (count === 0) return null
                          const dotColor = g.color.includes('emerald') ? 'bg-emerald-500' : g.color.includes('sky') ? 'bg-sky-500' : g.color.includes('amber') ? 'bg-amber-500' : g.color.includes('orange') ? 'bg-orange-500' : g.color.includes('rose') ? 'bg-rose-500' : 'bg-violet-500'
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

                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Subject Performance</h3>
                    <p className="text-[10px] text-muted-foreground mb-3">Average marks by subject</p>
                    <div className="space-y-1.5">
                      {analytics.subjectPerformance.map((subj, i) => (
                        <div key={subj.subject} className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-foreground w-20 shrink-0 truncate" title={subj.subject}>{subj.subject}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${subj.avg}%` }} transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                              className="h-full rounded-full"
                              style={{ background: subj.avg >= 80 ? 'oklch(0.65 0.16 162)' : subj.avg >= 60 ? 'oklch(0.75 0.15 75)' : 'oklch(0.62 0.2 25)' }}
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

                {/* Class Toppers + Grade Sheet */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Class Toppers */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" /> Class Toppers
                    </h3>
                    <p className="text-[10px] text-muted-foreground mb-3">{analyticsExam?.name} · Class 2-A · Top 5</p>
                    <div className="space-y-1.5">
                      {gradeSheetData.rows.slice(0, 5).map(({ student, result }, i) => (
                        <motion.div key={student.rollNo} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                          className={cn('flex items-center gap-3 rounded-lg border p-2', i === 0 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-card/40 border-border')}
                        >
                          <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                            i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground')}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{student.name}</p>
                            <p className="text-[9px] text-muted-foreground">Roll #{student.rollNo}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-display font-bold text-sm">{result?.percentage}%</p>
                            <p className={cn('text-[9px] font-semibold', result?.gradeColor)}>{result?.grade}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Grade Sheet */}
                  <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" /> Grade Sheet
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{analyticsExam?.name} · Class 2-A · {gradeSheetData.rows.length} students</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                        if (analyticsExam) {
                          const { filename } = generateGradeSheetPDF(analyticsExam)
                          toast.success('Grade sheet exported', { description: filename })
                        }
                      }}>
                        <Download className="h-3 w-3" /> Export
                      </Button>
                    </div>
                    <div className="overflow-x-auto max-h-[28rem] overflow-y-auto rounded-lg border border-border/40">
                      <Table>
                        <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur z-10">
                          <TableRow>
                            <TableHead className="w-8 text-[9px] uppercase font-semibold text-muted-foreground">#</TableHead>
                            <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Student</TableHead>
                            {gradeSheetData.subjectNames.map((s) => (
                              <TableHead key={s} className="text-center hidden md:table-cell text-[9px] uppercase font-semibold text-muted-foreground" title={s}>{s.slice(0, 4)}</TableHead>
                            ))}
                            <TableHead className="text-right text-[9px] uppercase font-semibold text-muted-foreground">Total</TableHead>
                            <TableHead className="text-right text-[9px] uppercase font-semibold text-muted-foreground">%</TableHead>
                            <TableHead className="text-center text-[9px] uppercase font-semibold text-muted-foreground">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gradeSheetData.rows.map(({ student, result, marks }, i) => (
                            <TableRow key={student.rollNo} className={cn('border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors', i < 3 && 'bg-amber-500/5')}>
                              <TableCell className="font-bold text-xs py-1.5">{i + 1}</TableCell>
                              <TableCell className="py-1.5">
                                <p className="font-medium text-xs truncate">{student.name}</p>
                                <p className="text-[9px] text-muted-foreground font-mono">#{student.rollNo}</p>
                              </TableCell>
                              {marks.map((m, idx) => (
                                <TableCell key={idx} className="text-center hidden md:table-cell text-xs font-mono py-1.5">
                                  {m === 'AB' ? <span className="text-rose-600 font-semibold text-[10px]">AB</span> :
                                   m === '—' ? <span className="text-muted-foreground/40">—</span> :
                                   <span className={cn(Number(m) >= 40 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : Number(m) >= 17 ? 'text-foreground' : 'text-rose-600 dark:text-rose-400')}>{m}</span>}
                                </TableCell>
                              ))}
                              <TableCell className="text-right font-display font-bold text-sm py-1.5">{result?.totalObtained}<span className="text-muted-foreground text-[9px]">/{result?.totalMax}</span></TableCell>
                              <TableCell className="text-right font-semibold text-sm py-1.5">{result?.percentage}%</TableCell>
                              <TableCell className="text-center py-1.5">
                                <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold',
                                  result?.grade === 'A+' || result?.grade === 'A' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                  result?.grade === 'B+' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                                  result?.grade === 'B' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                  'bg-muted text-muted-foreground border-border')}>{result?.grade}</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No results declared yet. Results and analytics will appear here once examinations are completed.</p>
              </div>
            )}
          </motion.div>
        )}

        {section === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <SettingsIcon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Examination Settings</h3>
              </div>
              <p className="text-[10px] text-muted-foreground mb-4">Configure grading, pass marks and examination types for the academic session.</p>

              {/* Grading Configuration */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Grading Configuration</p>
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border">
                        <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2">Grade</TableHead>
                        <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Min %</TableHead>
                        <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground py-2 text-center">Color</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {GRADE_BOUNDARIES.map((g) => (
                        <TableRow key={g.grade} className="border-b border-border/40 last:border-0">
                          <TableCell className="py-2 text-xs font-bold">{g.grade}</TableCell>
                          <TableCell className="py-2 text-xs text-center tabular-nums">{g.minPct}%</TableCell>
                          <TableCell className="py-2 text-center">
                            <span className={cn('inline-block h-3 w-3 rounded-full', g.color.replace('text-', 'bg-'))} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pass Marks */}
              <div className="space-y-2 mt-4">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Pass Marks</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground">Passing Percentage</p>
                    <p className="font-display text-lg font-bold text-foreground">{PASSING_PERCENTAGE}%</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground">Default Max Marks</p>
                    <p className="font-display text-lg font-bold text-foreground">50</p>
                  </div>
                </div>
              </div>

              {/* Exam Types */}
              <div className="space-y-2 mt-4">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Examination Types</p>
                <div className="flex flex-wrap gap-2">
                  {EXAM_TYPES.map((t) => (
                    <span key={t} className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', EXAM_TYPE_STYLES[t])}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Academic Session */}
              <div className="space-y-2 mt-4">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Academic Session</p>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground">Current Session</p>
                  <p className="font-display text-lg font-bold text-foreground">2025–2026</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <CreateExamDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreateExam} />
      {selectedExam && <ExamDetailsDialog exam={selectedExam} onOpenChange={(o) => !o && setSelectedExam(null)} />}
    </PageTransition>
  )
}

/* ──────────────────────────────────────────────────────────
   KpiCard — compact premium metric card
   ────────────────────────────────────────────────────────── */
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

export default ExamsModule
