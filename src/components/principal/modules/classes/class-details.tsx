'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Layers, Users, BookOpen, MapPin, LayoutGrid, List } from 'lucide-react'
import { PageTransition, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getVirtualOccupied } from '@/lib/store/students-store'
import type { ClassRecord, StudentRecord } from '@/lib/store/students-store'
import { formatINR } from '@/lib/format'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'

export function ClassDetailsPage({ cls, onBack, store, onStudentClick }: {
  cls: ClassRecord
  onBack: () => void
  store: any
  onStudentClick?: (s: StudentRecord) => void
}) {
  const [detailTab, setDetailTab] = useState('overview')
  const students = useMemo(() => store.students.filter((s: any) => s.classId === cls.id), [store.students, cls.id])
  const cap = cls.capacity * cls.sections.length
  const enr = cls.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)
  const pct = cap > 0 ? Math.round((enr / cap) * 100) : 0

  return (
    <PageTransition>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-sm">{cls.name.replace('Class ', 'C').replace('Pre-', 'P').slice(0, 3)}</div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{cls.name}</h1>
            <p className="text-xs text-muted-foreground truncate">{cls.level} · {cls.sections.length} sections · Room {cls.room}</p>
          </div>
        </div>
        <SegmentedTabs tabs={[{ value: 'overview', label: 'Overview' }, { value: 'students', label: 'Students', badge: students.length }, { value: 'subjects', label: 'Subjects' }, { value: 'teachers', label: 'Teachers' }]} value={detailTab} onValueChange={setDetailTab} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{cls.level}</Badge>
        <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{cls.sections.length} sections</Badge>
        <Badge variant="secondary" className={cn('text-[10px]', pct >= 90 ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700')}>{pct}% full</Badge>
        <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">{cls.subjects.length} subjects</Badge>
      </div>

      <div className="space-y-4">
        {detailTab === 'overview' && (
          <div className="space-y-4">
            <SummaryCardGrid columns={4}>
              <SummaryCard label="Capacity" value={cap} tone="violet" icon={<Layers className="h-4 w-4" />} delay={0} />
              <SummaryCard label="Enrolled" value={enr} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0.04} />
              <SummaryCard label="Vacant" value={Math.max(0, cap - enr)} tone="cyan" icon={<Users className="h-4 w-4" />} delay={0.08} />
              <SummaryCard label="Subjects" value={cls.subjects.length} tone="amber" icon={<BookOpen className="h-4 w-4" />} delay={0.12} />
            </SummaryCardGrid>
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
                        <div><p className="text-sm font-medium text-foreground">Section {s.name}</p><p className="text-[10px] text-muted-foreground">Room {s.room || cls.room}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn('text-xs font-medium', over ? 'text-rose-600' : 'text-foreground')}>{count}/{s.capacity}</span>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className={cn('h-full rounded-full', over ? 'bg-rose-500' : fillPct >= 90 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(100, fillPct)}%` }} /></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Subjects</p>
              <div className="flex flex-wrap gap-1.5">{cls.subjects.map((subj) => <Badge key={subj} variant="secondary" className="text-xs bg-primary/10 text-primary">{subj}</Badge>)}</div>
            </div>
          </div>
        )}

        {detailTab === 'students' && <ClassStudentsTab students={students} cls={cls} onStudentClick={onStudentClick} />}

        {detailTab === 'subjects' && (
          <div className="rounded-lg border border-border/60 bg-card p-4">
            <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Allocated Subjects</p>
            <div className="flex flex-wrap gap-1.5">{cls.subjects.map((subj) => <Badge key={subj} variant="secondary" className="text-xs bg-primary/10 text-primary">{subj}</Badge>)}</div>
          </div>
        )}

        {detailTab === 'teachers' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Class Teacher</p>
              {cls.classTeacherId ? (
                <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold">CT</div><div><p className="text-sm font-medium text-foreground">Teacher ID: {cls.classTeacherId}</p><p className="text-[10px] text-muted-foreground">Assigned via Staff Settings</p></div></div>
              ) : <p className="text-xs text-muted-foreground">No class teacher assigned.</p>}
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Section Teachers</p>
              <div className="space-y-2">{cls.sections.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-t border-border/40 first:border-t-0">
                  <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">{s.name}</div><p className="text-sm font-medium text-foreground">Section {s.name}</p></div>
                  <p className="text-[10px] text-muted-foreground">{s.classTeacherId ? `Teacher: ${s.classTeacherId}` : 'Unassigned'}</p>
                </div>
              ))}</div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

/* ClassStudentsTab — grid/list with section filter, fee amounts, clickable */
function ClassStudentsTab({ students, cls, onStudentClick }: { students: StudentRecord[]; cls: ClassRecord; onStudentClick?: (s: StudentRecord) => void }) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sectionFilter, setSectionFilter] = useState('all')
  const sections = useMemo(() => Array.from(new Set(students.map((s) => s.section))).sort(), [students])
  const filtered = useMemo(() => sectionFilter === 'all' ? students : students.filter((s) => s.section === sectionFilter), [students, sectionFilter])

  const getFeeDisplay = (s: StudentRecord) => {
    const due = s.feeTotal - s.feePaid
    if (due <= 0) return { text: '₹0 due', color: 'text-emerald-600 dark:text-emerald-400' }
    if (s.feeStatus === 'Pending') return { text: `${formatINR(due, true)} overdue`, color: 'text-rose-600 dark:text-rose-400' }
    return { text: `${formatINR(due, true)} due`, color: 'text-amber-600 dark:text-amber-400' }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {sections.length > 1 && (
            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">All Sections</option>
              {sections.map((sec) => <option key={sec} value={sec}>Section {sec}</option>)}
            </select>
          )}
          <span className="text-xs text-muted-foreground">{filtered.length} students</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 h-9">
          <button onClick={() => setView('grid')} className={cn('h-7 w-7 flex items-center justify-center rounded-md transition-all', view === 'grid' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><LayoutGrid className="h-3.5 w-3.5" /></button>
          <button onClick={() => setView('list')} className={cn('h-7 w-7 flex items-center justify-center rounded-md transition-all', view === 'list' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><List className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center"><p className="text-sm text-muted-foreground">No students enrolled in this class.</p></div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((s) => {
            const fee = getFeeDisplay(s)
            return (
              <div key={s.id} className="rounded-lg border border-border/60 bg-card p-3.5 cursor-pointer hover:border-emerald-500/40 hover:shadow-sm transition-all group" onClick={() => onStudentClick?.(s)}>
                <div className="flex items-start gap-3">
                  <GradientAvatar name={s.name} initials={s.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm truncate group-hover:text-primary transition-colors">{s.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">{s.admissionNo}</p>
                    <p className="text-[10px] text-muted-foreground">Roll {s.rollNo} · Sec {s.section}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className={cn('text-xs font-semibold', s.attendance >= 90 ? 'text-emerald-600 dark:text-emerald-400' : s.attendance >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>{s.attendance}% att</span>
                  <span className={cn('text-xs font-semibold', fee.color)}>{fee.text}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
          {filtered.map((s) => {
            const fee = getFeeDisplay(s)
            return (
              <button key={s.id} onClick={() => onStudentClick?.(s)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left bg-card">
                <GradientAvatar name={s.name} initials={s.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{s.name}</p><span className="text-[10px] font-mono text-muted-foreground">{s.admissionNo}</span></div>
                  <p className="text-xs text-muted-foreground">Roll {s.rollNo} · Sec {s.section}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                  <span className={cn('text-xs font-semibold', s.attendance >= 90 ? 'text-emerald-600' : s.attendance >= 75 ? 'text-amber-600' : 'text-rose-600')}>{s.attendance}%</span>
                  <span className={cn('text-xs font-semibold', fee.color)}>{fee.text}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
