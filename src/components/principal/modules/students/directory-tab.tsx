'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, LayoutGrid, List, ChevronRight, X } from 'lucide-react'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { StudentRecord, ClassRecord } from '@/lib/store/students-store'
import { SearchFilterBar, type FilterConfig } from '../shared/search-filter-bar'

export function StudentCard({ student, onClick }: { student: StudentRecord; onClick: () => void }) {
  const warningBadges: React.ReactNode[] = []
  if (student.attendance < 75) warningBadges.push(<Badge key="att" variant="secondary" className="text-[9px] bg-rose-500/10 text-rose-700 dark:text-rose-300">Low Attendance</Badge>)
  if (student.feeStatus === 'Pending') warningBadges.push(<Badge key="fee" variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300">Fee Pending</Badge>)
  if (student.academics.overallPercent < 60) warningBadges.push(<Badge key="grd" variant="secondary" className="text-[9px] bg-rose-500/10 text-rose-700 dark:text-rose-300">At Risk</Badge>)

  return (
    <div className="rounded-lg border border-border/60 bg-card p-3.5 cursor-pointer hover:border-emerald-500/40 hover:shadow-sm transition-all group" onClick={onClick}>
      <div className="flex items-start gap-3">
        <GradientAvatar name={student.name} initials={student.avatar} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xs sm:text-sm truncate group-hover:text-primary transition-colors">{student.name}</h3>
          <p className="text-[10px] text-muted-foreground font-mono">{student.admissionNo}</p>
          <p className="text-[10px] text-muted-foreground">{student.className} · Sec {student.section} · Roll {student.rollNo}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <span className={cn('text-xs font-semibold', student.attendance >= 90 ? 'text-emerald-600 dark:text-emerald-400' : student.attendance >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>{student.attendance}% att</span>
        <Badge variant="secondary" className="text-[10px]">{student.academics.overallGrade}</Badge>
      </div>
      {warningBadges.length > 0 && <div className="flex items-center gap-1 mt-2 flex-wrap">{warningBadges}</div>}
    </div>
  )
}

export function DirectoryTab({ students, classes, onStudentClick }: { students: StudentRecord[]; classes: ClassRecord[]; onStudentClick: (s: StudentRecord) => void }) {
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [feeFilter, setFeeFilter] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => students.filter((s) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.guardianPhone.toLowerCase().includes(q) || s.fatherName.toLowerCase().includes(q) || s.houseName?.toLowerCase().includes(q) || s.className.toLowerCase().includes(q)
    return matchesSearch && (classFilter === 'all' || s.classId === classFilter) && (feeFilter === 'all' || s.feeStatus === feeFilter)
  }), [students, search, classFilter, feeFilter])

  const classFilterConfig: FilterConfig = {
    id: 'class', value: classFilter, onChange: setClassFilter,
    placeholder: 'All Classes', width: 'w-[160px]',
    options: [{ value: 'all', label: 'All Classes' }, ...classes.map((c) => ({ value: c.id, label: c.name }))],
  }
  const feeFilterConfig: FilterConfig = {
    id: 'fee', value: feeFilter, onChange: setFeeFilter,
    placeholder: 'All Fees', width: 'w-[120px]',
    options: [
      { value: 'all', label: 'All Fees' },
      { value: 'Paid', label: 'Paid' },
      { value: 'Partial', label: 'Partial' },
      { value: 'Pending', label: 'Pending' },
    ],
  }

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 h-9">
      <button onClick={() => setView('grid')} className={cn('h-7 w-7 flex items-center justify-center rounded-md text-xs transition-all', view === 'grid' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><LayoutGrid className="h-3.5 w-3.5" /></button>
      <button onClick={() => setView('list')} className={cn('h-7 w-7 flex items-center justify-center rounded-md text-xs transition-all', view === 'list' ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><List className="h-3.5 w-3.5" /></button>
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Universal SearchFilterBar — no box-in-box */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search name, admission no, roll, phone, parent…"
        filters={[classFilterConfig, feeFilterConfig]}
        actions={viewToggle}
      />

      <p className="text-xs text-muted-foreground">{filtered.length} of {students.length} students</p>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No students found. Try adjusting your search.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.slice(0, 60).map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}>
              <StudentCard student={s} onClick={() => onStudentClick(s)} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
          {filtered.slice(0, 100).map((s) => (
            <button key={s.id} onClick={() => onStudentClick(s)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left bg-card">
              <GradientAvatar name={s.name} initials={s.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <span className="text-[10px] font-mono text-muted-foreground">{s.admissionNo}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.className} · Sec {s.section} · Roll {s.rollNo}</p>
              </div>
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <span className={cn('text-xs font-semibold', s.attendance >= 90 ? 'text-emerald-600' : s.attendance >= 75 ? 'text-amber-600' : 'text-rose-600')}>{s.attendance}%</span>
                {s.feeStatus === 'Paid' ? <StatusBadge status="Paid" variant="success" /> : s.feeStatus === 'Partial' ? <StatusBadge status="Partial" variant="warning" /> : <StatusBadge status="Pending" variant="danger" />}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
      {filtered.length > 60 && view === 'grid' && <p className="text-xs text-muted-foreground text-center">Showing first 60 of {filtered.length} results.</p>}
    </div>
  )
}
