'use client'

/**
 * results/subject-performance — the core of Results (§7/§8/§9).
 *
 * Premium subject rows in the Timetable's card language: each subject
 * carries its canonical subject-colour identity (same colour as the
 * Timetable — one visual identity system, §40), a proportional
 * performance bar, and its school-scale grade. Tapping a row opens the
 * assessment breakdown — ONLY the components the school actually
 * configured for that subject (dynamic structure, never invented);
 * single-paper subjects say so, factually.
 *
 * Responsive (§43): a row→card transformation with comfortable touch
 * targets; the performance bar never shrinks to invisibility.
 */

import { useState } from 'react'
import { ChevronDown, FileCheck2, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { gradeColor } from '@/lib/format'
import { fmtPct, pctOf, type SubjectMark } from '@/lib/store/student-results-store'
import { subjectColor } from '../timetable/subject-colors'

interface SubjectPerformanceProps {
  subjects: SubjectMark[]
  gradeFor: (pct: number) => string
  assessmentName: string
}

export function SubjectPerformance({ subjects, gradeFor, assessmentName }: SubjectPerformanceProps) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">Subject Performance</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {assessmentName} · {subjects.length} subjects · tap a subject for its breakdown
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {subjects.map((s) => {
          const color = subjectColor(s.subject)
          const pct = pctOf(s.obtained, s.maxMarks)
          const grade = gradeFor(pct)
          const isOpen = open === s.subject
          const hasComponents = (s.components?.length ?? 0) > 0
          return (
            <div
              key={s.subject}
              className={cn(
                'rounded-xl border transition-colors',
                isOpen ? 'border-border bg-muted/30' : 'border-border/60 hover:border-border hover:bg-muted/20'
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : s.subject)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-3 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4 sm:px-4"
              >
                {/* Subject identity — the Timetable's colour system */}
                <span
                  className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ring-1', color.bg, color.text, color.ring)}
                  aria-hidden
                >
                  {s.subject.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="truncate text-sm font-semibold text-foreground">{s.subject}</span>
                    {hasComponents && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                        <Layers className="h-2.5 w-2.5" aria-hidden />
                        {s.components!.length} components
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2.5">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <span
                        className={cn('block h-full rounded-full bg-gradient-to-r', color.gradient)}
                        style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
                      />
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-foreground/80">{fmtPct(pct)}%</span>
                  </span>
                </span>

                <span className="hidden shrink-0 text-right sm:block">
                  <span className="block text-sm font-bold tabular-nums text-foreground">{s.obtained}</span>
                  <span className="block text-[11px] tabular-nums text-muted-foreground">of {s.maxMarks}</span>
                </span>

                <span
                  className="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold"
                  style={{ background: `${gradeColor(grade)}14`, color: gradeColor(grade), borderColor: `${gradeColor(grade)}35` }}
                >
                  {grade}
                </span>

                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform', isOpen && 'rotate-180')}
                  aria-hidden
                />
              </button>

              {/* ── Subject detail — only what actually exists (§8/§9) ── */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/60 px-3 pb-3.5 pt-3 sm:px-4">
                      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-foreground/70">{s.subject}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          <span className="text-sm font-bold text-foreground">{s.obtained}</span> / {s.maxMarks} · {fmtPct(pct)}% · Grade {grade}
                        </p>
                      </div>

                      {hasComponents ? (
                        <div className="space-y-2.5">
                          {s.components!.map((c) => {
                            const cpct = pctOf(c.obtained, c.max)
                            return (
                              <div key={c.name} className="flex items-center gap-3">
                                <span className="w-24 shrink-0 truncate text-xs font-medium text-foreground/80">{c.name}</span>
                                <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                                  <span
                                    className={cn('block h-full rounded-full bg-gradient-to-r', color.gradient)}
                                    style={{ width: `${Math.max(2, Math.min(100, cpct))}%` }}
                                  />
                                </span>
                                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-foreground/80">
                                  {c.obtained}/{c.max}
                                </span>
                              </div>
                            )
                          })}
                          <p className="pt-0.5 text-[10px] text-muted-foreground/80">
                            Components total {s.components!.reduce((n, c) => n + c.obtained, 0)} of{' '}
                            {s.components!.reduce((n, c) => n + c.max, 0)} — the school&apos;s configured structure for this assessment.
                          </p>
                        </div>
                      ) : (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
                          Single written paper · {s.maxMarks} marks — no component breakdown for this assessment.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
