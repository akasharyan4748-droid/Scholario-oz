'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Layers, Users, AlertTriangle, Plus, MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useStudentsStore, getVirtualOccupied } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { getTeacherById } from '@/lib/mock/teachers'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { SearchFilterBar, type FilterConfig } from '../shared/search-filter-bar'

export function ClassesView({ onOpenClass, onAddClass }: { onOpenClass: (c: ClassRecord) => void; onAddClass: () => void }) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const store = useStudentsStore()
  const classes = store.classes.filter((c) => c.status === 'Active')

  const stats = useMemo(() => {
    const totalSections = classes.reduce((a, c) => a + c.sections.length, 0)
    const totalCapacity = classes.reduce((a, c) => a + c.capacity * c.sections.length, 0)
    const totalEnrolled = classes.reduce((a, c) => a + c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0), 0)
    const vacant = Math.max(0, totalCapacity - totalEnrolled)
    const withTeacher = classes.filter((c) => c.classTeacherId).length
    return { totalClasses: classes.length, totalSections, totalCapacity, totalEnrolled, vacant, withTeacher, unassigned: classes.length - withTeacher }
  }, [classes])

  const levels = useMemo(() => { const set = new Set<string>(); classes.forEach((c) => set.add(c.level)); return Array.from(set) }, [classes])

  const filterConfig: FilterConfig = { id: 'level', value: levelFilter, onChange: setLevelFilter, placeholder: 'All Levels', width: 'w-[160px]', options: [{ value: 'all', label: 'All Levels' }, ...levels.map((l) => ({ value: l, label: l }))] }

  const filtered = useMemo(() => classes.filter((c) => {
    const q = search.toLowerCase()
    const matchesSearch = !search.trim() || c.name.toLowerCase().includes(q) || c.sections.map((s) => s.name).join(' ').toLowerCase().includes(q) || c.room.toLowerCase().includes(q)
    return matchesSearch && (levelFilter === 'all' || c.level === levelFilter)
  }), [classes, search, levelFilter])

  return (
    <div className="space-y-4">
      <SummaryCardGrid columns={4}>
        <SummaryCard label="Total Classes" value={stats.totalClasses} sub={`${stats.totalSections} sections`} tone="amber" icon={<Layers className="h-4 w-4" />} delay={0} />
        <SummaryCard label="Total Students" value={stats.totalEnrolled} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0.04} />
        <SummaryCard label="Vacant Seats" value={stats.vacant} tone="cyan" icon={<Users className="h-4 w-4" />} delay={0.08} />
        <SummaryCard label="With Teacher" value={stats.withTeacher} sub={`${stats.unassigned} unassigned`} tone={stats.unassigned > 0 ? 'rose' : 'emerald'} icon={<AlertTriangle className="h-4 w-4" />} delay={0.12} />
      </SummaryCardGrid>

      <SearchFilterBar search={search} onSearchChange={setSearch} placeholder="Search class, section, or room…" filters={[filterConfig]}
        actions={<Button size="sm" onClick={onAddClass} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"><Plus className="h-3.5 w-3.5" /> Add Class</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((cls, i) => <ClassCard key={cls.id} cls={cls} index={i} onClick={() => onOpenClass(cls)} />)}
      </div>
      {filtered.length === 0 && <div className="py-10 text-center"><p className="text-sm text-muted-foreground">No classes found matching your search.</p></div>}
    </div>
  )
}

import { useState } from 'react'

/* ============================================================
   ClassCard — premium class identity + operational snapshot
   ============================================================ */
function ClassCard({ cls, index, onClick }: { cls: ClassRecord; index: number; onClick: () => void }) {
  const cap = cls.capacity * cls.sections.length
  const enr = cls.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)
  const vacant = Math.max(0, cap - enr)
  const pct = cap > 0 ? Math.round((enr / cap) * 100) : 0
  const tight = pct >= 90
  const teacher = cls.classTeacherId ? getTeacherById(cls.classTeacherId) : null
  const avatarText = cls.name.replace('Class ', 'C').replace('Pre-', 'P').slice(0, 3)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.2) }} onClick={onClick}
      className="rounded-lg border border-border/60 bg-card p-4 hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer group">
      {/* Identity row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-xs">{avatarText}</div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{cls.name}</p>
            <p className="text-[10px] text-muted-foreground">{cls.level} · {cls.sections.length} sections</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[9px] gap-0.5 shrink-0 text-muted-foreground"><MapPin className="h-2.5 w-2.5" /> {cls.room}</Badge>
      </div>

      {/* Section occupancy — compact */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {cls.sections.map((s) => {
          const count = getVirtualOccupied(s.id, s.capacity)
          const over = count > s.capacity
          const sFull = !over && count / s.capacity >= 0.9
          return (
            <span key={s.id} className={cn('inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium',
              over ? 'bg-rose-500/10 text-rose-600' : sFull ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground')}>
              {s.name} {count}/{s.capacity}
            </span>
          )
        })}
        <span className="text-[9px] text-muted-foreground ml-0.5">· {cls.subjects.length} subjects</span>
      </div>

      {/* Capacity stats — compact aligned */}
      <div className="grid grid-cols-3 gap-1 pt-2.5 border-t border-border/40">
        <div><p className="text-[8px] text-muted-foreground uppercase tracking-wide">Capacity</p><p className="text-sm font-bold text-foreground tabular-nums">{cap}</p></div>
        <div><p className="text-[8px] text-muted-foreground uppercase tracking-wide">Enrolled</p><p className="text-sm font-bold text-foreground tabular-nums">{enr}</p></div>
        <div><p className="text-[8px] text-muted-foreground uppercase tracking-wide">Available</p><p className={cn('text-sm font-bold tabular-nums', tight ? 'text-amber-600' : 'text-emerald-600')}>{vacant}</p></div>
      </div>

      {/* Bottom: capacity bar + teacher + view */}
      <div className="flex items-center justify-between gap-2 mt-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden max-w-[80px]">
            <div className={cn('h-full rounded-full', tight ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <span className="text-[9px] text-muted-foreground tabular-nums shrink-0">{pct}%</span>
        </div>
        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium shrink-0">View <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" /></span>
      </div>
    </motion.div>
  )
}
