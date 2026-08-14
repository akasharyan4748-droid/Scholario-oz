'use client'

/**
 * AnalyticsSection — Teacher Compliance + Chronic Non-Submitters.
 *
 * A. Teacher Compliance Report: ranking table.
 * B. Chronic Non-Submitters: students missing ≥25% of homework.
 */

import { BarChart3, Users, TrendingDown } from 'lucide-react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { InlineLoading } from '../../exams/inline-loading'
import { useTeacherCompliance, useChronicNonSubmitters } from '@/lib/homework/use-oversight'
import { cn } from '@/lib/utils'

export function AnalyticsSection() {
  return (
    <div className="space-y-4">
      <TeacherComplianceReport />
      <ChronicNonSubmittersList />
    </div>
  )
}

// ─── Teacher Compliance Report ───────────────────────────────────────

function TeacherComplianceReport() {
  const { data, loading } = useTeacherCompliance()

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Teacher Compliance Report</h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">
        Which teachers post homework on time and grade promptly.
      </p>
      {loading ? (
        <InlineLoading label="Loading compliance…" />
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No homework assigned yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Teacher</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Total HW</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Published On Time</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Graded Promptly</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Compliance</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Avg Grading Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{t.teacherName}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">{t.totalHomework}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">{t.publishedOnTime}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">{t.gradedPromptly}</TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold',
                      t.compliancePct >= 90 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' :
                      t.compliancePct >= 70 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                    )}>
                      {t.compliancePct}%
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center tabular-nums">
                    {t.avgGradingHours > 0 ? `${t.avgGradingHours}h` : '—'}
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

// ─── Chronic Non-Submitters ──────────────────────────────────────────

function ChronicNonSubmittersList() {
  const { data, loading } = useChronicNonSubmitters()

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Chronic Non-Submitters</h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">
        Students who missed ≥25% of their homework assignments. Flag for parental meetings.
      </p>
      {loading ? (
        <InlineLoading label="Loading…" />
      ) : data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No chronic non-submitters. All students are on track.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Roll No</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Student</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground">Class</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Assigned</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Missed</TableHead>
                <TableHead className="text-[9px] uppercase font-semibold text-muted-foreground text-center">Miss Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-mono">{s.rollNo ?? '—'}</TableCell>
                  <TableCell className="text-xs font-medium">{s.studentName}</TableCell>
                  <TableCell className="text-xs">{s.className}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">{s.totalAssigned}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">{s.missedCount}</TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold',
                      s.missRate >= 50 ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                    )}>
                      {s.missRate}%
                    </span>
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
