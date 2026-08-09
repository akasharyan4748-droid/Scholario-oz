'use client'

import { BookOpen, Users, UserCheck, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getVirtualOccupied } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { getTeacherById } from '@/lib/mock/teachers'
import { SummaryCard, SummaryCardGrid } from '../../shared/summary-card'

/**
 * ClassOverview — READ-ONLY snapshot.
 * Shows: summary metrics, sections, subjects, teaching summary.
 * No editing controls — management is in other tabs.
 */
export function ClassOverview({ cls }: { cls: ClassRecord }) {
  const cap = cls.capacity * cls.sections.length
  const enr = cls.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)
  const classTeacher = cls.classTeacherId ? getTeacherById(cls.classTeacherId) : null

  return (
    <div className="space-y-4">
      <SummaryCardGrid columns={4}>
        <SummaryCard label="Capacity" value={cap} tone="violet" icon={<Layers className="h-4 w-4" />} delay={0} />
        <SummaryCard label="Enrolled" value={enr} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0.04} />
        <SummaryCard label="Vacant" value={Math.max(0, cap - enr)} tone="cyan" icon={<Users className="h-4 w-4" />} delay={0.08} />
        <SummaryCard label="Subjects" value={cls.subjects.length} tone="amber" icon={<BookOpen className="h-4 w-4" />} delay={0.12} />
      </SummaryCardGrid>

      {/* Sections — read-only with occupancy */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Sections</p>
        <div className="space-y-2">
          {cls.sections.map((s) => {
            const count = getVirtualOccupied(s.id, s.capacity)
            const over = count > s.capacity
            const fillPct = s.capacity > 0 ? Math.round((count / s.capacity) * 100) : 0
            const sFull = !over && fillPct >= 90
            const secTeacher = s.classTeacherId ? getTeacherById(s.classTeacherId) : null
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-t border-border/40 first:border-t-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold',
                    over ? 'bg-rose-500/15 text-rose-600' : sFull ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/10 text-primary')}>{s.name}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Section {s.name}</p>
                    <p className="text-[10px] text-muted-foreground">Room {s.room || cls.room}{secTeacher ? ` · ${secTeacher.name}` : ' · No section teacher'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('text-xs font-semibold tabular-nums', over ? 'text-rose-600' : sFull ? 'text-amber-600' : 'text-foreground')}>{count}/{s.capacity}</span>
                  <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full', over ? 'bg-rose-500' : sFull ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(100, fillPct)}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Subjects — read-only pills */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Subjects</p>
        {cls.subjects.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No subjects allocated.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {cls.subjects.map((subj) => <Badge key={subj} variant="secondary" className="text-xs bg-primary/10 text-primary">{subj}</Badge>)}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-2">Manage subjects in the Subjects tab.</p>
      </div>

      {/* Teaching summary — read-only */}
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Teaching Summary</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-medium text-foreground">Class Teacher</span>
            </div>
            {classTeacher ? (
              <span className="text-xs text-muted-foreground">{classTeacher.name}</span>
            ) : <span className="text-xs text-muted-foreground/60 italic">Not assigned</span>}
          </div>
          <div className="flex items-center justify-between py-1.5 border-t border-border/40">
            <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm font-medium text-foreground">Section Teachers</span></div>
            <span className="text-xs text-muted-foreground">{cls.sections.filter((s) => s.classTeacherId).length} / {cls.sections.length} assigned</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Manage teachers in the Teachers tab.</p>
      </div>
    </div>
  )
}
