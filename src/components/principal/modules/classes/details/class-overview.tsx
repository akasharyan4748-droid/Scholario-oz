'use client'

/**
 * ClassOverview — read-only snapshot of the current class state.
 *
 * Brief section 8 (Overview must remain read-only):
 *   - No edit pencils, no archive controls, no destructive actions.
 *
 * Brief section 10 (Remove redundant teacher info):
 *   - Section teacher is shown compactly inside the section row, NOT repeated
 *     as a standalone footer summary.
 *
 * Brief section 11 (Same SubjectCard as Subjects tab):
 *   - Uses the shared SubjectCard component (read-only variant).
 *
 * Brief section 39 (No box-inside-box):
 *   - Sections are rendered directly on the page with thin dividers, NOT
 *     wrapped in an outer white card.
 */
import { BookOpen, Users, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getVirtualOccupied, useStudentsStore } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { getTeacherById } from '@/lib/mock/teachers'
import { SummaryCard, SummaryCardGrid } from '../../shared/summary-card'
import { SubjectCard } from './subject-card'

export function ClassOverview({ cls }: { cls: ClassRecord }) {
  // Subscribe to the canonical class so external mutations (archive/add a
  // subject from the Subjects tab, or a teacher reassignment from the
  // Teachers tab) reflect immediately here. Brief section 22 / 33.
  const liveClass = useStudentsStore((s) => s.getClassById(cls.id)) ?? cls
  const cap = liveClass.capacity * liveClass.sections.length
  const enr = liveClass.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)

  return (
    <div className="space-y-6">
      <SummaryCardGrid columns={4}>
        <SummaryCard label="Capacity" value={cap} tone="violet" icon={<Layers className="h-4 w-4" />} delay={0} />
        <SummaryCard label="Enrolled" value={enr} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0.04} />
        <SummaryCard label="Vacant" value={Math.max(0, cap - enr)} tone="cyan" icon={<Users className="h-4 w-4" />} delay={0.08} />
        <SummaryCard label="Subjects" value={liveClass.subjects.length} tone="amber" icon={<BookOpen className="h-4 w-4" />} delay={0.12} />
      </SummaryCardGrid>

      {/* Sections — flat list with thin dividers (no outer card) */}
      <section className="space-y-1">
        <h3 className="text-xs font-medium text-muted-foreground">Sections</h3>
        <div>
          {liveClass.sections.map((s) => {
            const count = getVirtualOccupied(s.id, s.capacity)
            const over = count > s.capacity
            const fillPct = s.capacity > 0 ? Math.round((count / s.capacity) * 100) : 0
            const sFull = !over && fillPct >= 90
            const secTeacher = s.classTeacherId ? getTeacherById(s.classTeacherId) : null
            return (
              <div key={s.id} className="py-3 border-t border-border/40 first:border-t-0 first:pt-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                      over ? 'bg-rose-500/15 text-rose-600' : sFull ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-foreground'
                    )}>{s.name}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Section {s.name}</p>
                      <p className="text-[10px] text-muted-foreground">Room {s.room || liveClass.room}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      'text-xs font-semibold tabular-nums',
                      over ? 'text-rose-600' : sFull ? 'text-amber-600' : 'text-foreground'
                    )}>{count}/{s.capacity}</span>
                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn(
                        'h-full rounded-full',
                        over ? 'bg-rose-500' : sFull ? 'bg-amber-500' : 'bg-emerald-500'
                      )} style={{ width: `${Math.min(100, fillPct)}%` }} />
                    </div>
                  </div>
                </div>
                {/* Compact teacher metadata — single line, secondary */}
                <div className="mt-1 pl-9">
                  <p className="text-[10px] text-muted-foreground">
                    Class Teacher: <span className="text-foreground font-medium">{secTeacher?.name ?? '—'}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Subjects — same SubjectCard component as Subjects tab, read-only */}
      <section className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground">Subjects</h3>
        {liveClass.subjects.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">No subjects allocated for this class.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {liveClass.subjects.map((subj) => (
              <SubjectCard key={subj} subject={subj} cls={liveClass} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
