'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Layers, Users, AlertTriangle, Plus, MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useStudentsStore, getVirtualOccupied } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { SearchFilterBar, type FilterConfig } from '../shared/search-filter-bar'
import { toast } from 'sonner'

/**
 * ClassesView — flat class management page (no sub-tabs).
 * Shows: summary cards + search/filter + class grid + Add Class.
 * Opening a class calls onOpenClass (handled by parent).
 */
export function ClassesView({ onOpenClass }: { onOpenClass: (c: ClassRecord) => void }) {
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const store = useStudentsStore()
  const classes = store.classes.filter((c) => c.status === 'Active')

  const stats = useMemo(() => {
    const totalSections = classes.reduce((a, c) => a + c.sections.length, 0)
    const totalCapacity = classes.reduce((a, c) => a + c.capacity * c.sections.length, 0)
    const totalEnrolled = classes.reduce(
      (a, c) => a + c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0), 0,
    )
    const vacant = Math.max(0, totalCapacity - totalEnrolled)
    const withTeacher = classes.filter((c) => c.classTeacherId).length
    const overloaded = classes.filter((c) => {
      const enr = c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0)
      const cap = c.capacity * c.sections.length
      return cap > 0 && enr / cap >= 0.9
    })
    return { totalClasses: classes.length, totalSections, totalCapacity, totalEnrolled, vacant, withTeacher, overloaded: overloaded.length }
  }, [classes])

  const levels = useMemo(() => {
    const set = new Set<string>(); classes.forEach((c) => set.add(c.level)); return Array.from(set)
  }, [classes])

  const filterConfig: FilterConfig = {
    id: 'level', value: levelFilter, onChange: setLevelFilter,
    placeholder: 'All Levels', width: 'w-[160px]',
    options: [{ value: 'all', label: 'All Levels' }, ...levels.map((l) => ({ value: l, label: l }))],
  }

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      const q = search.toLowerCase()
      const matchesSearch = !search.trim() ||
        c.name.toLowerCase().includes(q) ||
        c.sections.map((s) => s.name).join(' ').toLowerCase().includes(q) ||
        c.room.toLowerCase().includes(q)
      const matchesLevel = levelFilter === 'all' || c.level === levelFilter
      return matchesSearch && matchesLevel
    })
  }, [classes, search, levelFilter])

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <SummaryCardGrid columns={4}>
        <SummaryCard label="Total Classes" value={stats.totalClasses} sub={`${stats.totalSections} sections`} tone="amber" icon={<Layers className="h-4 w-4" />} delay={0} />
        <SummaryCard label="Total Students" value={stats.totalEnrolled} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0.04} />
        <SummaryCard label="Vacant Seats" value={stats.vacant} tone="cyan" icon={<Users className="h-4 w-4" />} delay={0.08} />
        <SummaryCard label="With Teacher" value={stats.withTeacher} sub={`${stats.totalClasses - stats.withTeacher} unassigned`} tone={stats.totalClasses - stats.withTeacher > 0 ? 'rose' : 'emerald'} icon={<AlertTriangle className="h-4 w-4" />} delay={0.12} />
      </SummaryCardGrid>

      {/* Search + filter + Add Class — universal SearchFilterBar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search class, section, or room…"
        filters={[filterConfig]}
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9">
            <Plus className="h-3.5 w-3.5" /> Add Class
          </Button>
        }
      />

      {/* Class cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((cls, i) => {
          const cap = cls.capacity * cls.sections.length
          const enr = cls.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)
          const pct = cap > 0 ? Math.round((enr / cap) * 100) : 0
          const tight = pct >= 90
          return (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.2) }}
              onClick={() => onOpenClass(cls)}
              className="rounded-lg border border-border/60 bg-card p-4 hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-xs">
                    {cls.name.replace('Class ', 'C').replace('Pre-', 'P').slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{cls.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cls.level} · {cls.sections.length} sections</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] gap-0.5 shrink-0">
                  <MapPin className="h-2.5 w-2.5" /> {cls.room}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                {cls.sections.map((s) => {
                  const count = getVirtualOccupied(s.id, s.capacity)
                  const over = count > s.capacity
                  return (
                    <span key={s.id} className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border',
                      over ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20')}>
                      Sec {s.name} · {count}/{s.capacity}
                    </span>
                  )
                })}
                <span className="text-[10px] text-muted-foreground">· {cls.subjects.length} subjects</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-border/40">
                <div><p className="text-[10px] text-muted-foreground">Capacity</p><p className="font-medium text-foreground">{cap}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Enrolled</p><p className="font-medium text-foreground">{enr}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Available</p><p className={cn('font-medium', tight ? 'text-amber-600' : 'text-emerald-600')}>{Math.max(0, cap - enr)}</p></div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', tight ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{pct}% full</span>
                <span className="flex items-center gap-0.5 text-emerald-600 font-medium">View <ChevronRight className="h-3 w-3" /></span>
              </div>
            </motion.div>
          )
        })}
      </div>
      {filtered.length === 0 && (
        <div className="py-10 text-center"><p className="text-sm text-muted-foreground">No classes found matching your search.</p></div>
      )}

      <AddClassDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

/* ============================================================
   ADD CLASS DIALOG
   ============================================================ */
function AddClassDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', section: 'A', academicYear: '2025-2026', capacity: 40,
    medium: 'English', shift: 'Morning', room: '', building: 'Main', floor: '',
    classTeacher: '', assistantTeacher: '', remarks: '',
  })
  const setF = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))
  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Class name is required'); return }
    toast.success(`Class ${form.name} created`); onClose()
    setForm({ name: '', section: 'A', academicYear: '2025-2026', capacity: 40, medium: 'English', shift: 'Morning', room: '', building: 'Main', floor: '', classTeacher: '', assistantTeacher: '', remarks: '' })
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add New Class</DialogTitle><DialogDescription>Create a new class with sections, capacity, and teacher assignments.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><Label className="text-xs font-semibold">Class Name</Label><Input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="e.g. Class 6" className="mt-1.5 h-9" /></div>
            <div><Label className="text-xs font-semibold">Section</Label><Input value={form.section} onChange={(e) => setF('section', e.target.value)} placeholder="e.g. A" className="mt-1.5 h-9" /></div>
            <div><Label className="text-xs font-semibold">Academic Year</Label><Input value={form.academicYear} onChange={(e) => setF('academicYear', e.target.value)} placeholder="2025-2026" className="mt-1.5 h-9" /></div>
            <div><Label className="text-xs font-semibold">Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setF('capacity', parseInt(e.target.value) || 40)} placeholder="40" className="mt-1.5 h-9" /></div>
            <div><Label className="text-xs font-semibold">Medium</Label><Select value={form.medium} onValueChange={(v) => setF('medium', v)}><SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="English">English</SelectItem><SelectItem value="Hindi">Hindi</SelectItem><SelectItem value="Bilingual">Bilingual</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs font-semibold">Shift</Label><Select value={form.shift} onValueChange={(v) => setF('shift', v)}><SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Morning">Morning</SelectItem><SelectItem value="Afternoon">Afternoon</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs font-semibold">Room Number</Label><Input value={form.room} onChange={(e) => setF('room', e.target.value)} placeholder="e.g. F2-09" className="mt-1.5 h-9" /></div>
            <div><Label className="text-xs font-semibold">Building</Label><Input value={form.building} onChange={(e) => setF('building', e.target.value)} placeholder="e.g. Main" className="mt-1.5 h-9" /></div>
            <div><Label className="text-xs font-semibold">Floor</Label><Input value={form.floor} onChange={(e) => setF('floor', e.target.value)} placeholder="e.g. 2" className="mt-1.5 h-9" /></div>
          </div>
          <div className="pt-3 border-t border-border">
            <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Teacher Assignments</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Class Teacher</Label><Input value={form.classTeacher} onChange={(e) => setF('classTeacher', e.target.value)} placeholder="Search teacher…" className="mt-1.5 h-9" /></div>
              <div><Label className="text-xs font-semibold">Assistant Class Teacher</Label><Input value={form.assistantTeacher} onChange={(e) => setF('assistantTeacher', e.target.value)} placeholder="Search teacher…" className="mt-1.5 h-9" /></div>
            </div>
          </div>
          <div className="pt-3 border-t border-border"><Label className="text-xs font-semibold">Remarks</Label><Input value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} placeholder="Optional notes about this class…" className="mt-1.5 h-9" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Create Class</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
