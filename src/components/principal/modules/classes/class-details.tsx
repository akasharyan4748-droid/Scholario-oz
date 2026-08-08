'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Layers, Users, BookOpen, Shield, MapPin } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getVirtualOccupied } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'

/**
 * ClassDetailsPage — full-page class details (no parent tabs visible).
 * Has its own Back button + its own SegmentedTabs (Overview/Students/Subjects/Teachers).
 */
export function ClassDetailsPage({ cls, onBack, store }: {
  cls: ClassRecord
  onBack: () => void
  store: any
}) {
  const [detailTab, setDetailTab] = useState('overview')

  const students = useMemo(() =>
    store.students.filter((s: any) => s.classId === cls.id),
  [store.students, cls.id])

  const cap = cls.capacity * cls.sections.length
  const enr = cls.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)
  const pct = cap > 0 ? Math.round((enr / cap) * 100) : 0

  return (
    <PageTransition>
      {/* Header — Back button + class identity + status badges */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-sm">
            {cls.name.replace('Class ', 'C').replace('Pre-', 'P').slice(0, 3)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{cls.name}</h1>
            <p className="text-xs text-muted-foreground truncate">{cls.level} · {cls.sections.length} sections · Room {cls.room}</p>
          </div>
        </div>
        <SegmentedTabs
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'students', label: 'Students', badge: students.length },
            { value: 'subjects', label: 'Subjects' },
            { value: 'teachers', label: 'Teachers' },
          ]}
          value={detailTab}
          onValueChange={setDetailTab}
        />
      </div>

      {/* Status strip */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{cls.level}</Badge>
        <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{cls.sections.length} sections</Badge>
        <Badge variant="secondary" className={cn('text-[10px]', pct >= 90 ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700')}>{pct}% full</Badge>
        <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{cls.subjects.length} subjects</Badge>
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {detailTab === 'overview' && (
          <div className="space-y-4">
            <SummaryCardGrid columns={4}>
              <SummaryCard label="Capacity" value={cap} tone="violet" icon={<Layers className="h-4 w-4" />} delay={0} />
              <SummaryCard label="Enrolled" value={enr} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0.04} />
              <SummaryCard label="Vacant" value={Math.max(0, cap - enr)} tone="cyan" icon={<Users className="h-4 w-4" />} delay={0.08} />
              <SummaryCard label="Subjects" value={cls.subjects.length} tone="amber" icon={<BookOpen className="h-4 w-4" />} delay={0.12} />
            </SummaryCardGrid>

            {/* Sections breakdown */}
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Sections</p>
              <div className="space-y-2">
                {cls.sections.map((s) => {
                  const count = getVirtualOccupied(s.id, s.capacity)
                  const over = count > s.capacity
                  const fillPct = s.capacity > 0 ? Math.round((count / s.capacity) * 100) : 0
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-t border-border/40 first:border-t-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">{s.name}</div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Section {s.name}</p>
                          <p className="text-[10px] text-muted-foreground">Room {s.room || cls.room}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn('text-xs font-medium', over ? 'text-rose-600' : 'text-foreground')}>{count}/{s.capacity}</span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full', over ? 'bg-rose-500' : fillPct >= 90 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(100, fillPct)}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Subjects list */}
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Subjects (from Timetable)</p>
              <div className="flex flex-wrap gap-1.5">
                {cls.subjects.map((subj) => (
                  <Badge key={subj} variant="secondary" className="text-xs bg-primary/10 text-primary">{subj}</Badge>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 italic">Subjects are allocated via the Timetable module. This is a read-only display.</p>
            </div>
          </div>
        )}

        {detailTab === 'students' && (
          <div className="space-y-3">
            {students.length > 0 ? (
              <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
                {students.map((s: any) => (
                  <div key={s.id} className="px-4 py-2.5 bg-card hover:bg-muted/30 transition-colors flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold">{s.avatar}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">Roll {s.rollNo} · Sec {s.section}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs shrink-0">
                      <Badge variant="secondary" className={cn('text-[10px]', s.feeStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-700' : s.feeStatus === 'Partial' ? 'bg-amber-500/10 text-amber-700' : 'bg-rose-500/10 text-rose-700')}>{s.feeStatus}</Badge>
                      <span className="text-[10px] text-muted-foreground">Att {s.attendance}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center"><p className="text-sm text-muted-foreground">No students enrolled in this class.</p></div>
            )}
          </div>
        )}

        {detailTab === 'subjects' && (
          <div className="rounded-lg border border-border/60 bg-card p-4">
            <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Allocated Subjects</p>
            <div className="flex flex-wrap gap-1.5">
              {cls.subjects.map((subj) => (
                <Badge key={subj} variant="secondary" className="text-xs bg-primary/10 text-primary">{subj}</Badge>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 italic">Subject allocation is managed centrally via the Timetable module. Changes there automatically update this class, teacher profiles, and student schedules.</p>
          </div>
        )}

        {detailTab === 'teachers' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Class Teacher</p>
              {cls.classTeacherId ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold">CT</div>
                  <div><p className="text-sm font-medium text-foreground">Teacher ID: {cls.classTeacherId}</p><p className="text-[10px] text-muted-foreground">Assigned via Staff Settings</p></div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No class teacher assigned. Assign from Settings → Staff Settings.</p>
              )}
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Section Teachers</p>
              <div className="space-y-2">
                {cls.sections.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-t border-border/40 first:border-t-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">{s.name}</div>
                      <p className="text-sm font-medium text-foreground">Section {s.name}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{s.classTeacherId ? `Teacher: ${s.classTeacherId}` : 'Unassigned'}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic">Teacher assignments are managed centrally. This is a read-only display.</p>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
