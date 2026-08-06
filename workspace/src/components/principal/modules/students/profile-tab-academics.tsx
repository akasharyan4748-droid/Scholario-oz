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
      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<GraduationCap className="h-3.5 w-3.5" />} label="Overall" value={student.academics.overallGrade} color="text-violet-600 dark:text-violet-400" />
        <Metric icon={<TrendingUp className="h-3.5 w-3.5" />} label="Average" value={`${student.academics.overallPercent}%`} color="text-emerald-600 dark:text-emerald-400" />
        <Metric icon={<Award className="h-3.5 w-3.5" />} label="Rank" value={`#${student.academics.rankInClass}`} color="text-amber-600 dark:text-amber-400" />
      </div>
      <Section title="Subject Performance">
        <div className="space-y-2">
          {student.academics.subjects.map((subj, i) => (
            <div key={i} className="rounded-lg border border-border bg-card/40 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate">{subj.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">{subj.teacher}</Badge>
                  <Badge className={cn('text-[10px]', subj.percent >= 90 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : subj.percent >= 75 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300')}>{subj.grade}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${subj.percent}%`, background: subj.percent >= 90 ? 'oklch(0.6 0.18 150)' : subj.percent >= 75 ? 'oklch(0.7 0.15 75)' : 'oklch(0.6 0.2 25)' }} />
                </div>
                <span className="text-xs font-semibold w-10 text-right">{subj.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
