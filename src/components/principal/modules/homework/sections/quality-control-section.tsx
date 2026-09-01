'use client'

/**
 * QualityControlSection — Assignment Repository + Grading & Feedback Audit.
 *
 * A. Assignment Repository: searchable DB of all historical homework.
 * B. Grading & Feedback Audit: inspect how teachers evaluate.
 */

import { useState } from 'react'
import { BookOpen, Search, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { InlineLoading } from '../../exams/inline-loading'
import { useHomeworkList } from '@/lib/homework/use-homework'
import { useAssignmentRepository, useGradingAudit } from '@/lib/homework/use-oversight'
import { cn } from '@/lib/utils'

export function QualityControlSection() {
  return (
    <div className="space-y-4">
      <AssignmentRepository />
      <GradingFeedbackAudit />
    </div>
  )
}

// ─── Assignment Repository ────────────────────────────────────────────

function AssignmentRepository() {
  const { classes, teachers } = useHomeworkList()
  const [search, setSearch] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const { data, loading } = useAssignmentRepository({
    teacherId: teacherFilter !== 'all' ? teacherFilter : undefined,
    classId: classFilter !== 'all' ? classFilter : undefined,
    search: search || undefined,
  })

  const allSubjects = Array.from(new Map(
    classes.flatMap((c) => c.subjects.map((s) => [s.id, s.name] as const))
  ).entries()).map(([id, name]) => ({ id, name }))

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Assignment Repository</h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">
        Searchable database of all homework assigned across the school. Read actual prompts and check submission rates.
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search homework…" className="h-8 pl-8 pr-3 text-xs" />
        </div>
        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
          <SelectTrigger size="sm" className="w-[140px] text-xs"><SelectValue placeholder="Teacher" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger size="sm" className="w-[140px] text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger size="sm" className="w-[140px] text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {allSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <InlineLoading label="Loading assignments…" />
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No homework found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Title</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Class</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Teacher</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Subject</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Assigned</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Submissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((hw) => (
                <TableRow key={hw.id}>
                  <TableCell className="text-xs font-medium">{hw.title}</TableCell>
                  <TableCell className="text-xs">{hw.className}</TableCell>
                  <TableCell className="text-xs">{hw.teacherName ?? '—'}</TableCell>
                  <TableCell className="text-xs">{hw.subjectName ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{hw.assignedDate}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">{hw.submissionCount}/{hw.totalStudents}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ─── Grading & Feedback Audit ─────────────────────────────────────────

function GradingFeedbackAudit() {
  const { data, loading } = useGradingAudit()

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Grading & Feedback Audit</h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">
        Inspect how teachers evaluate homework. Check if feedback is meaningful or just checkmarks.
      </p>
      {loading ? (
        <InlineLoading label="Loading audit…" />
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No reviewed submissions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Homework</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Student</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Marks</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Feedback</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Quality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs font-medium truncate max-w-[120px]">{s.homeworkTitle}</TableCell>
                  <TableCell className="text-xs">{s.studentName}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">
                    {s.marks !== null ? `${s.marks}/${s.maxMarks ?? '?'}` : '—'}
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px]">
                    {s.feedback ? (
                      <span className="line-clamp-2">{s.feedback}</span>
                    ) : (
                      <span className="text-muted-foreground/50">No feedback</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {s.hasMeaningfulFeedback ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Good
                      </span>
                    ) : s.feedback ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                        <MessageSquare className="h-3 w-3" /> Brief
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] text-rose-600 dark:text-rose-400 font-semibold">
                        <AlertCircle className="h-3 w-3" /> None
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
