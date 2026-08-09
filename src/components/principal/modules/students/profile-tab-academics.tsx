'use client'

import { Award, BookOpen, GraduationCap, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StudentRecord } from '@/lib/store/students-store'
import { Metric, Section } from './shared'

type Props = { student: StudentRecord }

export function AcademicsTab({ student }: Props) {
  return (
    <div className="space-y-4">
      {/* RESTORED: Overall / Average / Rank */}
      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<GraduationCap className="h-3.5 w-3.5" />} label="Overall" value={student.academics.overallGrade} color="text-violet-600 dark:text-violet-400" />
        <Metric icon={<TrendingUp className="h-3.5 w-3.5" />} label="Average" value={`${student.academics.overallPercent}%`} color="text-emerald-600 dark:text-emerald-400" />
        <Metric icon={<Award className="h-3.5 w-3.5" />} label="Rank" value={`#${student.academics.rankInClass}`} color="text-amber-600 dark:text-amber-400" />
      </div>

      {/* REDESIGNED: Subject Performance as premium digital report card */}
      <Section title="Subject Performance">
        <div className="rounded-lg border border-border/60 bg-card/30 overflow-hidden divide-y divide-border/40">
          {student.academics.subjects.map((subj, i) => {
            const pct = subj.percent
            const pctColor = pct >= 90 ? 'text-emerald-600 dark:text-emerald-400'
              : pct >= 75 ? 'text-amber-600 dark:text-amber-400'
              : pct >= 50 ? 'text-violet-600 dark:text-violet-400'
              : 'text-rose-600 dark:text-rose-400'

            return (
              <div key={i} className="p-3">
                {/* Subject header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">{subj.name}</span>
                  </div>
                  <span className={cn('text-sm font-bold tabular-nums shrink-0', pctColor)}>
                    {pct}%
                  </span>
                </div>

                {/* Subtle progress indicator (not a giant bar) */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full',
                      pct >= 90 ? 'bg-emerald-500'
                      : pct >= 75 ? 'bg-amber-500'
                      : pct >= 50 ? 'bg-violet-500'
                      : 'bg-rose-500')}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Teacher + Grade summary */}
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground">{subj.teacher}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[9px]">{subj.grade}</Badge>
                    <Badge variant="outline" className={cn('text-[9px]',
                      pct >= 90 ? 'bg-emerald-500/10 text-emerald-700'
                      : pct >= 75 ? 'bg-amber-500/10 text-amber-700'
                      : pct >= 50 ? 'bg-violet-500/10 text-violet-700'
                      : 'bg-rose-500/10 text-rose-700')}>
                      {pct}%
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
