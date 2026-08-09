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
import { ClassOverview } from './details/class-overview'
import { ClassSubjects } from './details/class-subjects'
import { ClassTeachers } from './details/class-teachers'

export function ClassDetailsPage({ cls, onBack, store, onStudentClick }: {
  cls: ClassRecord; onBack: () => void; store: any; onStudentClick?: (s: StudentRecord) => void
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
          <div className="min-w-0"><h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{cls.name}</h1><p className="text-xs text-muted-foreground truncate">{cls.level} · {cls.sections.length} sections · Room {cls.room}</p></div>
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
        {detailTab === 'overview' && <ClassOverview cls={cls} />}
        {detailTab === 'students' && <ClassStudentsTab students={students} cls={cls} onStudentClick={onStudentClick} />}
        {detailTab === 'subjects' && <ClassSubjects cls={cls} />}
        {detailTab === 'teachers' && <ClassTeachers cls={cls} />}
      </div>
    </PageTransition>
  )
}

/* ClassStudentsTab — grid/list with section filter, fee amounts */
function ClassStudentsTab({ students, cls, onStudentClick }: { students: StudentRecord[]; cls: ClassRecord; onStudentClick?: (s: StudentRecord) => void }) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sectionFilter, setSectionFilter] = useState('all')
  const sections = useMemo(() => Array.from(new Set(students.map((s) => s.section))).sort(), [students])
  const filtered = useMemo(() => sectionFilter === 'all' ? students : students.filter((s) => s.section === sectionFilter), [students, sectionFilter])
  const getFee = (s: StudentRecord) => { const due = s.feeTotal - s.feePaid; if (due <= 0) return { text: '₹0 due', color: 'text-emerald-600 dark:text-emerald-400' }; if (s.feeStatus === 'Pending') return { text: `${formatINR(due, true)} overdue`, color: 'text-rose-600 dark:text-rose-400' }; return { text: `${formatINR(due, true)} due`, color: 'text-amber-600 dark:text-amber-400' } }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {sections.length > 1 && (<select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"><option value="all">All Sections</option>{sections.map((sec) => <option key={sec} value={sec}>Section {sec}</option>)}</select>)}
          <span className="text-xs text-muted-foreground">{filtered.length} students</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 h-9">
          <button onClick={() => setView('grid')} className={cn('h-7 w-7 flex items-center justify-center rounded-md transition-all', view === 'grid' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><LayoutGrid className="h-3.5 w-3.5" /></button>
          <button onClick={() => setView('list')} className={cn('h-7 w-7 flex items-center justify-center rounded-md transition-all', view === 'list' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><List className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {filtered.length === 0 ? (<div className="py-8 text-center"><p className="text-sm text-muted-foreground">No students enrolled in this class.</p></div>) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((s) => { const fee = getFee(s); return (
            <div key={s.id} className="rounded-lg border border-border/60 bg-card p-3.5 cursor-pointer hover:border-emerald-500/40 hover:shadow-sm transition-all group" onClick={() => onStudentClick?.(s)}>
              <div className="flex items-start gap-3"><GradientAvatar name={s.name} initials={s.avatar} size="md" /><div className="flex-1 min-w-0"><h3 className="font-semibold text-xs sm:text-sm truncate group-hover:text-primary transition-colors">{s.name}</h3><p className="text-[10px] text-muted-foreground font-mono">{s.admissionNo}</p><p className="text-[10px] text-muted-foreground">Roll {s.rollNo} · Sec {s.section}</p></div></div>
              <div className="flex items-center justify-between mt-2.5"><span className={cn('text-xs font-semibold', s.attendance >= 90 ? 'text-emerald-600 dark:text-emerald-400' : s.attendance >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>{s.attendance}% att</span><span className={cn('text-xs font-semibold', fee.color)}>{fee.text}</span></div>
            </div>
          )})}
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
          {filtered.map((s) => { const fee = getFee(s); return (
            <button key={s.id} onClick={() => onStudentClick?.(s)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left bg-card">
              <GradientAvatar name={s.name} initials={s.avatar} size="sm" />
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{s.name}</p><span className="text-[10px] font-mono text-muted-foreground">{s.admissionNo}</span></div><p className="text-xs text-muted-foreground">Roll {s.rollNo} · Sec {s.section}</p></div>
              <div className="hidden sm:flex items-center gap-3 shrink-0"><span className={cn('text-xs font-semibold', s.attendance >= 90 ? 'text-emerald-600' : s.attendance >= 75 ? 'text-amber-600' : 'text-rose-600')}>{s.attendance}%</span><span className={cn('text-xs font-semibold', fee.color)}>{fee.text}</span></div>
            </button>
          )})}
        </div>
      )}
    </div>
  )
}
