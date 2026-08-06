'use client'

import { AlertTriangle, Award, Shield } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StudentRecord } from '@/lib/store/students-store'
import { Metric, Section } from './shared'

type Props = { student: StudentRecord }

export function DisciplineTab({ student }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Metric icon={<Shield className="h-3.5 w-3.5" />} label="Points" value={`${student.disciplinePoints}`} color="text-violet-600 dark:text-violet-400" />
        <Metric icon={<Award className="h-3.5 w-3.5" />} label="Status" value={student.disciplinePoints >= 15 ? 'Excellent' : student.disciplinePoints >= 8 ? 'Good' : 'Needs Attention'} color={student.disciplinePoints >= 15 ? 'text-emerald-600 dark:text-emerald-400' : student.disciplinePoints >= 8 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'} />
      </div>
      <Section title="Discipline Records">
        {student.disciplineRecords.length > 0 ? (
          <div className="space-y-2">
            {student.disciplineRecords.map((rec, i) => (
              <div key={i} className={cn('flex items-center gap-3 rounded-lg border p-3', rec.type === 'Positive' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5')}>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', rec.type === 'Positive' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400')}>
                  {rec.type === 'Positive' ? <Award className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{rec.description}</p>
                  <p className="text-[11px] text-muted-foreground">{rec.type} · {formatDate(rec.date)} · {rec.points > 0 ? '+' : ''}{rec.points} pts</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card/40 p-4 text-center">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">No discipline records</p>
            <p className="text-xs text-muted-foreground mt-1">This student has a clean record.</p>
          </div>
        )}
      </Section>
    </div>
  )
}
