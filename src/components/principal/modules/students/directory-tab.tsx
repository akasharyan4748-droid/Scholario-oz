'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, LayoutGrid, Filter, ChevronRight, X } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { StudentRecord, ClassRecord } from '@/lib/store/students-store'

export function StudentCard({ student, onClick }: { student: StudentRecord; onClick: () => void }) {
  const warningBadges: React.ReactNode[] = []
  if (student.attendance < 75) warningBadges.push(<Badge key="att" variant="secondary" className="text-[9px] bg-rose-500/10 text-rose-700 dark:text-rose-300">Low Attendance</Badge>)
  if (student.feeStatus === 'Pending') warningBadges.push(<Badge key="fee" variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300">Fee Pending</Badge>)
  if (student.academics.overallPercent < 60) warningBadges.push(<Badge key="grd" variant="secondary" className="text-[9px] bg-rose-500/10 text-rose-700 dark:text-rose-300">At Risk</Badge>)

  return (
    <GlassCard className="p-3.5 cursor-pointer hover:shadow-md transition-all group" hover={false} onClick={onClick}>
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
    </GlassCard>
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

  return (
    <div className="space-y-4">
      <GlassCard className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, admission no, roll, phone, parent, house…" className="pl-9 h-9 text-xs" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-40 h-9 text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent className="max-h-72"><SelectItem value="all">All Classes</SelectItem>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={feeFilter} onValueChange={setFeeFilter}>
            <SelectTrigger className="w-full sm:w-32 h-9 text-xs"><SelectValue placeholder="Fee" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Fees</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Partial">Partial</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent>
          </Select>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button onClick={() => setView('grid')} className={cn('h-8 w-8 flex items-center justify-center rounded-md text-xs', view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><LayoutGrid className="h-3.5 w-3.5" /></button>
            <button onClick={() => setView('list')} className={cn('h-8 w-8 flex items-center justify-center rounded-md text-xs', view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><Filter className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2.5 text-xs text-muted-foreground"><span>{filtered.length} of {students.length} students</span></div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3"><Search className="h-5 w-5" /></div>
          <h3 className="font-semibold text-sm">No students found</h3>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </GlassCard>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.slice(0, 60).map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}>
              <StudentCard student={s} onClick={() => onStudentClick(s)} />
            </motion.div>
          ))}
        </div>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {filtered.slice(0, 100).map((s) => (
              <button key={s.id} onClick={() => onStudentClick(s)} className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors border-b border-border last:border-0 text-left">
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
        </GlassCard>
      )}
      {filtered.length > 60 && view === 'grid' && <p className="text-xs text-muted-foreground text-center">Showing first 60 of {filtered.length} results.</p>}
    </div>
  )
}
