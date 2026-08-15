'use client'

/**
 * ResultsTab — Result workspace with filters (Exam + Class).
 * Shows REAL analytics derived from stored marks: pass %, grade distribution,
 * subject performance, class toppers, and the official grade sheet.
 *
 * Also supports PDF export (class-wise grade sheet).
 */

import { useState } from 'react'
import { Trophy, GraduationCap, Download, FileText } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Donut, RadialGauge } from '@/components/shared/charts'
import { InlineLoading } from '../inline-loading'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DEFAULT_GRADE_BOUNDARIES,
  type ExamDTO,
  type SchoolContextDTO,
} from '@/lib/exams/types'
import { useClassResults } from '@/lib/exams/use-exams'
import { generateClassGradeSheetPDF } from '@/lib/exams/pdf'
import { useSchoolContext } from '@/lib/exams/use-pdf-context'

interface Props {
  exams: ExamDTO[]
  onOpenExam: (id: string) => void
}

export function ResultsTab({ exams }: Props) {
  const [examId, setExamId] = useState<string | null>(exams[0]?.id ?? null)
  const [classId, setClassId] = useState<string | null>(null)

  const exam = exams.find((e) => e.id === examId) || null
  const firstClass = exam?.classes[0]?.classId ?? null
  const effectiveClassId = classId || firstClass
  const { data, loading, error, reload } = useClassResults(examId, effectiveClassId)
  const { data: schoolCtx } = useSchoolContext()

  const handleExportGradeSheet = () => {
    if (!exam || !data || !effectiveClassId) return
    const className = exam.classes.find((c) => c.classId === effectiveClassId)?.className ?? 'Class'
    const school: SchoolContextDTO = schoolCtx ?? {
      schoolId: '', schoolName: 'School', schoolCode: '', address: null,
      city: null, phone: null, email: null, logoUrl: null, academicYear: exam.session, board: 'CBSE',
    }
    try {
      const { filename } = generateClassGradeSheetPDF(exam, className, data.results, data.analytics, school)
      toast.success('Grade sheet exported', { description: filename })
    } catch (e: any) {
      toast.error('Export failed', { description: e.message })
    }
  }

  if (exams.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No examinations created yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Examination</Label>
            <Select value={examId ?? undefined} onValueChange={(v) => { setExamId(v); setClassId(null) }}>
              <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Select exam" /></SelectTrigger>
              <SelectContent>
                {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Class</Label>
            <Select value={effectiveClassId ?? undefined} onValueChange={setClassId}>
              <SelectTrigger size="sm" className="text-xs"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {exam?.classes.map((c) => <SelectItem key={c.classId} value={c.classId}>{c.className}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!examId || !effectiveClassId ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-xs text-muted-foreground">Select an exam and class to view results.</p>
        </div>
      ) : loading ? (
        <InlineLoading label="Computing results from real marks…" />
      ) : error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      ) : !data || data.analytics.totalStudents === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No results available yet. Enter marks in the Marks tab to see computed results.</p>
        </div>
      ) : (
        <ResultsWorkspace
          exam={exam!}
          classId={effectiveClassId}
          results={data.results}
          analytics={data.analytics}
          onExport={handleExportGradeSheet}
        />
      )}
    </div>
  )
}

function ResultsWorkspace({ exam, classId, results, analytics, onExport }: {
  exam: ExamDTO
  classId: string
  results: any[]
  analytics: any
  onExport: () => void
}) {
  const className = exam.classes.find((c) => c.classId === classId)?.className ?? 'Class'
  const subjectNames = exam.subjects.filter((s) => s.classId === classId).map((s) => s.subjectName)

  return (
    <div className="space-y-3">
      {/* Analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Pass Percentage</h4>
          <p className="text-[10px] text-muted-foreground mb-3">{exam.name} · {className} · {analytics.totalStudents} students</p>
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
                <span className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">{analytics.failed}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Grade Distribution</h4>
          <p className="text-[10px] text-muted-foreground mb-3">Across all students</p>
          <div className="flex items-center gap-3">
            <div className="shrink-0" style={{ width: 110, height: 110 }}>
              <Donut
                data={DEFAULT_GRADE_BOUNDARIES.map((g) => ({
                  name: g.grade,
                  value: analytics.gradeDistribution[g.grade] || 0,
                  color: gradeToOklch(g.color),
                })).filter((d) => d.value > 0)}
                height={110}
                innerRadius={32}
                outerRadius={48}
                centerValue={`${analytics.totalStudents}`}
                centerLabel=""
              />
            </div>
            <div className="flex-1 space-y-1">
              {DEFAULT_GRADE_BOUNDARIES.map((g) => {
                const count = analytics.gradeDistribution[g.grade] || 0
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

        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Subject Performance</h4>
          <p className="text-[10px] text-muted-foreground mb-3">Average by subject</p>
          <div className="space-y-1.5">
            {analytics.subjectPerformance.map((subj: any, i: number) => (
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
        </div>
      </div>

      {/* Class toppers + Grade sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Class Toppers
          </h4>
          <p className="text-[10px] text-muted-foreground mb-3">{exam.name} · {className} · Top 5</p>
          <div className="space-y-1.5">
            {analytics.toppers.length === 0 && <p className="text-[10px] text-muted-foreground">No toppers yet.</p>}
            {analytics.toppers.map((t: any, i: number) => (
              <motion.div
                key={t.studentId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-2',
                  i === 0 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-card/40 border-border'
                )}
              >
                <div className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {t.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{t.name}</p>
                  <p className="text-[9px] text-muted-foreground">Roll #{t.rollNo ?? '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-sm">{t.percentage}%</p>
                  <p className="text-[9px] font-semibold text-muted-foreground">{t.grade}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" /> Grade Sheet
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">{exam.name} · {className} · {results.length} students</p>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onExport}>
              <Download className="h-3 w-3" /> Export PDF
            </Button>
          </div>
          <div className="overflow-x-auto max-h-[28rem] overflow-y-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="w-8 text-[9px] uppercase font-semibold text-muted-foreground">#</TableHead>
                  <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Student</TableHead>
                  {subjectNames.map((s) => (
                    <TableHead key={s} className="text-center hidden md:table-cell text-[9px] uppercase font-semibold text-muted-foreground" title={s}>{s.slice(0, 4)}</TableHead>
                  ))}
                  <TableHead className="text-right text-[9px] uppercase font-semibold text-muted-foreground">Total</TableHead>
                  <TableHead className="text-right text-[9px] uppercase font-semibold text-muted-foreground">%</TableHead>
                  <TableHead className="text-center text-[9px] uppercase font-semibold text-muted-foreground">Grade</TableHead>
                  <TableHead className="text-center text-[9px] uppercase font-semibold text-muted-foreground">Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={r.studentId} className={cn('border-b border-border/40 last:border-0 hover:bg-muted/20', i < 3 && 'bg-amber-500/5')}>
                    <TableCell className="font-bold text-xs py-1.5">{i + 1}</TableCell>
                    <TableCell className="py-1.5">
                      <p className="font-medium text-xs truncate">{r.studentName}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">#{r.rollNo}</p>
                    </TableCell>
                    {r.subjects.map((sm: any, idx: number) => (
                      <TableCell key={idx} className="text-center hidden md:table-cell text-xs font-mono py-1.5">
                        {sm.isAbsent ? (
                          <span className="text-rose-600 font-semibold text-[10px]">AB</span>
                        ) : sm.marksObtained === null ? (
                          <span className="text-muted-foreground/40">—</span>
                        ) : (
                          <span className={cn(
                            sm.percentage >= 60 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' :
                            sm.percentage >= 33 ? 'text-foreground' :
                            'text-rose-600 dark:text-rose-400'
                          )}>{sm.marksObtained}</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-display font-bold text-sm py-1.5">
                      {r.totalObtained}<span className="text-muted-foreground text-[9px]">/{r.totalMax}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm py-1.5">{r.percentage}%</TableCell>
                    <TableCell className="text-center py-1.5">
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold',
                        r.grade === 'A+' || r.grade === 'A' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                        r.grade === 'B+' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                        r.grade === 'B' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                        'bg-muted text-muted-foreground border-border'
                      )}>{r.grade}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold py-1.5">{r.rank ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

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
