'use client'

/**
 * ClassOverview — read-only snapshot of the current class state.
 *
 * Brief section 8: READ ONLY. No edit pencils, no archive controls, no
 * destructive actions, no editable dropdowns, no accidental mutations.
 *
 * Brief section 9 + 11: For each section, show:
 *   Section A
 *   Room F1-05
 *   Class Teacher: <name>
 *   Assistant Class Teacher: <name or —>
 *   22/35
 *
 * Brief section 10: NO redundant teacher summary at the bottom — section
 * teacher is shown compactly inside the section row instead.
 *
 * Brief section 11 + 12: Subjects use the SAME shared SubjectCard component
 * as the Subjects tab (read-only variant).
 *
 * Brief section 27: Canonical section heading:
 *   `<p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">`
 *
 * Brief section 39: NO box-inside-box — sections render directly on the page
 * with thin dividers, NOT wrapped in an outer white card.
 */
import { BookOpen, Users, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getVirtualOccupied, useStudentsStore } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { getTeacherById } from '@/lib/mock/teachers'
import { SummaryCard, SummaryCardGrid } from '../../shared/summary-card'
import { SubjectCard } from './subject-card'

export function ClassOverview({ cls }: { cls: ClassRecord }) {
  // Subscribe to canonical class so mutations from other tabs (archive a
  // subject, reassign a teacher, etc.) reflect here immediately.
  // Brief section 35 + 37.
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
      <section>
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Sections</p>
        <div>
          {liveClass.sections.map((s) => {
            const count = getVirtualOccupied(s.id, s.capacity)
            const over = count > s.capacity
            const fillPct = s.capacity > 0 ? Math.round((count / s.capacity) * 100) : 0
            const sFull = !over && fillPct >= 90
            const secTeacher = s.classTeacherId ? getTeacherById(s.classTeacherId) : null
            const secAssistant = s.assistantTeacherId ? getTeacherById(s.assistantTeacherId) : null
            return (
              <div key={s.id} className="py-3 border-t border-border/40 first:border-t-0 first:pt-0">
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
                {/* Compact teacher metadata — single muted line per role */}
                <div className="mt-1.5 pl-9 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    Class Teacher: <span className="text-foreground font-medium">{secTeacher?.name ?? '—'}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Assistant Class Teacher: <span className="text-foreground font-medium">{secAssistant?.name ?? '—'}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Subjects — same shared SubjectCard as Subjects tab, read-only variant */}
      <section>
        <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Subjects</p>
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
