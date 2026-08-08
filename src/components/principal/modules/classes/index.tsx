'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Users, AlertTriangle, Plus, MapPin, ChevronRight, Search,
  LayoutGrid, List, Archive, ArrowLeft, BookOpen, Shield, Calendar,
} from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useStudentsStore, getVirtualOccupied } from '@/lib/store/students-store'
import type { ClassRecord } from '@/lib/store/students-store'
import { ModuleHeader } from '../shared/module-header'
import { SegmentedTabs } from '../shared/segmented-tabs'
import { SummaryCard, SummaryCardGrid } from '../shared/summary-card'
import { SearchFilterBar, type FilterConfig } from '../shared/search-filter-bar'
import { toast } from 'sonner'

type Tab = 'overview' | 'directory' | 'archived'

export function ClassesModule({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const store = useStudentsStore()
  const classes = store.classes

  // Compute stats
  const stats = useMemo(() => {
    const active = classes.filter((c) => c.status === 'Active')
    const archived = classes.filter((c) => c.status === 'Archived')
    const totalSections = active.reduce((a, c) => a + c.sections.length, 0)
    const totalCapacity = active.reduce((a, c) => a + c.capacity * c.sections.length, 0)
    const totalEnrolled = active.reduce(
      (a, c) => a + c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0), 0,
    )
    const vacant = Math.max(0, totalCapacity - totalEnrolled)
    const avgStrength = totalSections > 0 ? Math.round(totalEnrolled / totalSections) : 0
    const utilization = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0
    const withTeacher = active.filter((c) => c.classTeacherId).length
    const withoutTeacher = active.length - withTeacher
    const overloaded = active.filter((c) => {
      const enr = c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0)
      const cap = c.capacity * c.sections.length
      return cap > 0 && enr / cap >= 0.9
    })
    return {
      totalClasses: active.length, totalSections, totalCapacity, totalEnrolled,
      vacant, avgStrength, utilization, withTeacher, withoutTeacher,
      overloaded: overloaded.length, archivedCount: archived.length,
    }
  }, [classes])

  // If a class is selected, show the details page
  if (selectedClass) {
    return <ClassDetailsPage cls={selectedClass} onBack={() => setSelectedClass(null)} store={store} />
  }

  const classesHeader = (
    <div className="flex items-center justify-between gap-3 mb-4">
      <SegmentedTabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'directory', label: 'Directory' },
          { value: 'archived', label: 'Archived', badge: stats.archivedCount || undefined },
        ]}
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
      />
      <Button size="sm" onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8">
        <Plus className="h-3.5 w-3.5" /> Add Class
      </Button>
    </div>
  )

  const classesContent = (
    <>
      {classesHeader}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          {tab === 'overview' && <OverviewTab classes={classes.filter((c) => c.status === 'Active')} stats={stats} onOpenClass={setSelectedClass} />}
          {tab === 'directory' && <DirectoryTab classes={classes.filter((c) => c.status === 'Active')} onOpenClass={setSelectedClass} />}
          {tab === 'archived' && <ArchivedTab classes={classes.filter((c) => c.status === 'Archived')} onOpenClass={setSelectedClass} />}
        </motion.div>
      </AnimatePresence>
      <AddClassDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )

  if (embedded) {
    return <div className="space-y-4">{classesContent}</div>
  }

  return (
    <PageTransition className="space-y-4">
      <ModuleHeader meta={[`${stats.totalClasses} active classes`, `${stats.totalSections} sections`]} />
      {classesContent}
    </PageTransition>
  )
}

/* ============================================================
   OVERVIEW TAB
   ============================================================ */

function OverviewTab({ classes, stats, onOpenClass }: {
  classes: ClassRecord[]
  stats: any
  onOpenClass: (c: ClassRecord) => void
}) {
  return (
    <div className="space-y-4">
      {/* Comprehensive stats */}
      <SummaryCardGrid columns={6}>
        <SummaryCard label="Total Classes" value={stats.totalClasses} sub={`${stats.totalSections} sections`} tone="amber" icon={<Layers className="h-4 w-4" />} delay={0} />
        <SummaryCard label="Total Students" value={stats.totalEnrolled} sub={`${stats.avgStrength} avg/class`} tone="emerald" icon={<Users className="h-4 w-4" />} delay={0.04} />
        <SummaryCard label="Vacant Seats" value={stats.vacant} sub={`${stats.utilization}% full`} tone="cyan" icon={<Users className="h-4 w-4" />} delay={0.08} />
        <SummaryCard label="Capacity" value={stats.totalCapacity} sub={`${stats.utilization}% utilized`} tone="violet" icon={<Layers className="h-4 w-4" />} delay={0.12} />
        <SummaryCard label="With Teacher" value={stats.withTeacher} sub={`${stats.withoutTeacher} unassigned`} tone={stats.withoutTeacher > 0 ? 'rose' : 'emerald'} icon={<Shield className="h-4 w-4" />} delay={0.16} />
        <SummaryCard label="Over Capacity" value={stats.overloaded} sub={stats.overloaded > 0 ? 'needs attention' : 'within limits'} tone={stats.overloaded > 0 ? 'rose' : 'emerald'} icon={<AlertTriangle className="h-4 w-4" />} delay={0.2} />
      </SummaryCardGrid>

      {/* Class cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map((cls, i) => {
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
              {/* Header */}
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

              {/* Section capacity badges */}
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

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-border/40">
                <div><p className="text-[10px] text-muted-foreground">Capacity</p><p className="font-medium text-foreground">{cap}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Enrolled</p><p className="font-medium text-foreground">{enr}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Available</p><p className={cn('font-medium', tight ? 'text-amber-600' : 'text-emerald-600')}>{Math.max(0, cap - enr)}</p></div>
              </div>

              {/* Progress bar */}
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
    </div>
  )
}

/* ============================================================
   DIRECTORY TAB
   ============================================================ */

function DirectoryTab({ classes, onOpenClass }: {
  classes: ClassRecord[]
  onOpenClass: (c: ClassRecord) => void
}) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  const levels = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((c) => set.add(c.level))
    return Array.from(set)
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
    <div className="space-y-3">
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search class, section, or room…"
        filters={[filterConfig]}
      />

      {/* Class rows */}
      <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
        {filtered.map((cls) => {
          const cap = cls.capacity * cls.sections.length
          const enr = cls.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)
          const avail = Math.max(0, cap - enr)
          const pct = cap > 0 ? Math.round((enr / cap) * 100) : 0
          const tight = pct >= 90
          return (
            <div key={cls.id} onClick={() => onOpenClass(cls)} className="px-4 py-3 bg-card hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{cls.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cls.sections.map((s) => `Sec ${s.name}`).join(', ')} · Room {cls.room}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs shrink-0">
                <div className="text-center"><p className="font-medium text-foreground">{cap}</p><p className="text-[10px] text-muted-foreground">Cap</p></div>
                <div className="text-center"><p className="font-medium text-foreground">{enr}</p><p className="text-[10px] text-muted-foreground">Enr</p></div>
                <div className="text-center"><p className={cn('font-medium', avail === 0 ? 'text-rose-600' : 'text-emerald-600')}>{avail}</p><p className="text-[10px] text-muted-foreground">Avail</p></div>
                <Badge variant="secondary" className={cn('text-[10px]', tight ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700')}>{pct}%</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">No classes found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   ARCHIVED TAB
   ============================================================ */

function ArchivedTab({ classes, onOpenClass }: {
  classes: ClassRecord[]
  onOpenClass: (c: ClassRecord) => void
}) {
  if (classes.length === 0) {
    return (
      <div className="py-12 text-center">
        <Archive className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No archived classes</p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
      {classes.map((cls) => (
        <div key={cls.id} onClick={() => onOpenClass(cls)} className="px-4 py-3 bg-card hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{cls.name}</p>
              <p className="text-xs text-muted-foreground truncate">{cls.level} · {cls.sections.length} sections</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">Archived</Badge>
        </div>
      ))}
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
    classTeacher: '', assistantTeacher: '', remarks: '', status: 'Active',
  })

  const setF = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Class name is required'); return }
    toast.success(`Class ${form.name} created`)
    onClose()
    setForm({ name: '', section: 'A', academicYear: '2025-2026', capacity: 40, medium: 'English', shift: 'Morning', room: '', building: 'Main', floor: '', classTeacher: '', assistantTeacher: '', remarks: '', status: 'Active' })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>Create a new class with sections, capacity, and teacher assignments.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><Label className="text-xs font-semibold">Class Name</Label><Input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="e.g. Class 6" className="mt-1.5 h-9" /></div>
            <div><Label className="text-xs font-semibold">Section</Label><Input value={form.section} onChange={(e) => setF('section', e.target.value)} placeholder="e.g. A" className="mt-1.5 h-9" /></div>
            <div><Label className="text-xs font-semibold">Academic Year</Label><Input value={form.academicYear} onChange={(e) => setF('academicYear', e.target.value)} placeholder="2025-2026" className="mt-1.5 h-9" /></div>
            <div><Label className="text-xs font-semibold">Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setF('capacity', parseInt(e.target.value) || 40)} placeholder="40" className="mt-1.5 h-9" /></div>
            <div>
              <Label className="text-xs font-semibold">Medium</Label>
              <Select value={form.medium} onValueChange={(v) => setF('medium', v)}>
                <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="English">English</SelectItem><SelectItem value="Hindi">Hindi</SelectItem><SelectItem value="Bilingual">Bilingual</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Shift</Label>
              <Select value={form.shift} onValueChange={(v) => setF('shift', v)}>
                <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Morning">Morning</SelectItem><SelectItem value="Afternoon">Afternoon</SelectItem></SelectContent>
              </Select>
            </div>
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

          <div className="pt-3 border-t border-border">
            <Label className="text-xs font-semibold">Remarks</Label>
            <Input value={form.remarks} onChange={(e) => setF('remarks', e.target.value)} placeholder="Optional notes about this class…" className="mt-1.5 h-9" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Create Class</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================
   CLASS DETAILS PAGE (full-page view)
   ============================================================ */

function ClassDetailsPage({ cls, onBack, store }: {
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
      {/* Page header */}
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
