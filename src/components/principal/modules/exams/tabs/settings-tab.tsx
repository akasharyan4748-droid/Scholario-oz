'use client'

/**
 * SettingsTab — display grading configuration, exam types, and academic session.
 *
 * These settings are server-side constants today (configured via schema +
 * types.ts). A future iteration could expose editable configuration via a
 * dedicated settings API, but for now we show what's authoritative.
 */

import { Settings as SettingsIcon, GraduationCap, Calendar } from 'lucide-react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { EXAM_TYPES, GRADE_BOUNDARIES, PASSING_PERCENTAGE_DEFAULT } from '@/lib/exams/types'

export function SettingsTab() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <SettingsIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Examination Settings</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mb-4">
          Configuration for the academic session. All examinations created in this session inherit these defaults.
        </p>

        {/* Grading configuration */}
        <div className="space-y-2 mb-4">
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
                      <span className={cn('inline-block h-3 w-3 rounded-full', gradeToBgClass(g.color))} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pass marks */}
        <div className="space-y-2 mb-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Pass Marks</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground">Passing Percentage</p>
              <p className="font-display text-lg font-bold text-foreground">{PASSING_PERCENTAGE_DEFAULT}%</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground">Default Max Marks (per subject)</p>
              <p className="font-display text-lg font-bold text-foreground">100</p>
            </div>
          </div>
        </div>

        {/* Exam types */}
        <div className="space-y-2 mb-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            <GraduationCap className="h-3 w-3" /> Examination Types
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAM_TYPES.map((t) => (
              <span key={t} className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Academic session */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Academic Session
          </p>
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-[10px] text-muted-foreground">Current Session</p>
            <p className="font-display text-lg font-bold text-foreground">2025–2026</p>
          </div>
        </div>
      </div>

      {/* Workflow states reference */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Marks Workflow</h3>
        <p className="text-[10px] text-muted-foreground mb-3">
          All examination marks pass through a four-state workflow to ensure data integrity.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {[
            { state: 'DRAFT', color: 'bg-muted text-muted-foreground border-border', desc: 'Teacher editing marks' },
            { state: 'SUBMITTED', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20', desc: 'Awaiting verification' },
            { state: 'VERIFIED', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20', desc: 'Verified by principal' },
            { state: 'LOCKED', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20', desc: 'Immutable until declared' },
          ].map((s, i) => (
            <div key={s.state} className={cn('rounded-lg border p-3', s.color)}>
              <p className="text-[10px] uppercase font-bold tracking-wider">{i + 1}. {s.state}</p>
              <p className="text-[10px] mt-0.5 opacity-80">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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
