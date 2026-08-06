'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Search, Plus, MapPin, ChevronRight, ArrowLeft, Users,
  BookOpen, UserCheck, TrendingUp, AlertTriangle, Filter,
} from 'lucide-react'
import { GlassCard, SectionHeading, GradientAvatar } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { getTeacherById } from '@/lib/mock/teachers'
import { cn } from '@/lib/utils'
import { getVirtualOccupied, type ClassRecord, type StudentRecord, type StudentsState } from '@/lib/store/students-store'
import { OverviewPanel } from './class-workspace-overview-panel'
import { StudentsPanel } from './class-workspace-students-panel'
import { SubjectsPanel } from './class-workspace-subjects-panel'
import { TeachersPanel } from './class-workspace-teachers-panel'
import { PerformancePanel } from './class-workspace-performance-panel'

interface ClassesTabProps {
  store: StudentsState
  onStudentClick: (s: StudentRecord) => void
  initialSelectedClassId?: string | null
}

export function ClassesTab({ store, onStudentClick, initialSelectedClassId = null }: ClassesTabProps) {
  const { classes, students } = store
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialSelectedClassId)
  const [search, setSearch] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string>('All')

  const activeStudents = useMemo(() => students.filter((s) => s.status === 'Active'), [students])

  const levels = ['All', 'Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary']

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const teacher = getTeacherById(c.classTeacherId)
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.room.toLowerCase().includes(search.toLowerCase()) ||
        (teacher && teacher.name.toLowerCase().includes(search.toLowerCase()))
      const matchesLevel = selectedLevel === 'All' || c.level === selectedLevel
      return matchesSearch && matchesLevel
    })
  }, [classes, search, selectedLevel])

  const totalCapacity = useMemo(() => classes.reduce((a, c) => a + c.sections.reduce((sa, s) => sa + s.capacity, 0), 0), [classes])
  const totalEnrolled = useMemo(() => classes.reduce((a, c) => a + c.sections.reduce((sa, s) => sa + getVirtualOccupied(s.id, s.capacity), 0), 0), [classes])
  const occupancyPct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0
  const overloadedCount = useMemo(() => classes.filter((c) => c.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0) > c.sections.reduce((a, s) => a + s.capacity, 0)).length, [classes])

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId])
  const selectedClassStudents = useMemo(() => (selectedClassId ? activeStudents.filter((s) => s.classId === selectedClassId) : []), [activeStudents, selectedClassId])

  if (selectedClass) {
    const teacher = getTeacherById(selectedClass.classTeacherId)
    const classCap = selectedClass.sections.reduce((a, s) => a + s.capacity, 0)
    const classEnrolled = selectedClass.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)
    const classFill = classCap > 0 ? Math.round((classEnrolled / classCap) * 100) : 0

    return (
      <div className="space-y-4">
        {/* Workspace Breadcrumb & Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-card/60 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-border/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-medium" onClick={() => setSelectedClassId(null)}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Classes
            </Button>
            <div className="h-4 w-px bg-border max-sm:hidden" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-xs">
                {selectedClass.name.replace('Class ', 'C').slice(0, 3)}
              </div>
              <div>
                <h2 className="font-semibold text-sm sm:text-base leading-tight">{selectedClass.name} Workspace</h2>
                <p className="text-[11px] text-muted-foreground">{selectedClass.level} · Room {selectedClass.room} · {selectedClassStudents.length} Students</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedClass.id}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-hidden"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>Switch: {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Workspace View */}
        <GlassCard className="p-4 sm:p-5">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex h-9 flex-wrap gap-1 bg-muted/60 p-1 mb-4 rounded-lg">
              <TabsTrigger value="overview" className="text-xs h-7 gap-1.5"><Users className="h-3.5 w-3.5" /> Overview</TabsTrigger>
              <TabsTrigger value="students" className="text-xs h-7 gap-1.5">
                <Users className="h-3.5 w-3.5" /> Students
                <span className="ml-1 text-[10px] bg-primary/15 text-primary px-1.5 py-0.2 rounded-full font-bold">{selectedClassStudents.length}</span>
              </TabsTrigger>
              <TabsTrigger value="subjects" className="text-xs h-7 gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Subjects</TabsTrigger>
              <TabsTrigger value="teachers" className="text-xs h-7 gap-1.5"><UserCheck className="h-3.5 w-3.5" /> Teachers</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs h-7 gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <OverviewPanel classRecord={selectedClass} students={selectedClassStudents} teacher={teacher} virtualOccupied={classEnrolled} />
            </TabsContent>
            <TabsContent value="students" className="mt-0">
              <StudentsPanel students={selectedClassStudents} onStudentClick={onStudentClick} />
            </TabsContent>
            <TabsContent value="subjects" className="mt-0">
              <SubjectsPanel classRecord={selectedClass} />
            </TabsContent>
            <TabsContent value="teachers" className="mt-0">
              <TeachersPanel classRecord={selectedClass} teacher={teacher} />
            </TabsContent>
            <TabsContent value="performance" className="mt-0">
              <PerformancePanel students={selectedClassStudents} />
            </TabsContent>
          </Tabs>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Class Directory"
        subtitle={`${classes.length} active classes · ${totalEnrolled} students enrolled · ${occupancyPct}% overall capacity`}
        icon={<Layers className="h-5 w-5" />}
        action={
          <Button size="sm" onClick={() => toast.info('Create Class feature triggered')}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Class
          </Button>
        }
      />

      {/* Summary Stat Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Classes" value={classes.length} icon={<Layers className="h-4 w-4" />} accent="amber" delay={0} />
        <KpiCard label="Total Capacity" value={totalCapacity} icon={<Users className="h-4 w-4" />} accent="violet" delay={0.04} />
        <KpiCard label="Total Enrolled" value={totalEnrolled} icon={<Users className="h-4 w-4" />} accent="emerald" trendLabel={`${occupancyPct}% capacity`} delay={0.08} />
        <KpiCard label="Over Capacity" value={overloadedCount} icon={<AlertTriangle className="h-4 w-4" />} accent={overloadedCount > 0 ? 'rose' : 'cyan'} delay={0.12} />
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-3 rounded-xl border border-border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search class name, room, or teacher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background/80"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer',
                selectedLevel === lvl
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredClasses.map((cls, idx) => {
          const teacher = getTeacherById(cls.classTeacherId)
          const clsCap = cls.sections.reduce((a, s) => a + s.capacity, 0)
          const clsEnrolled = cls.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)
          const fill = clsCap > 0 ? Math.round((clsEnrolled / clsCap) * 100) : 0
          const isOver = clsEnrolled > clsCap

          return (
            <motion.div key={cls.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <GlassCard
                className="p-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/40 group flex flex-col justify-between h-full"
                hover={false}
                onClick={() => setSelectedClassId(cls.id)}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 font-display font-bold text-white shadow-xs text-xs">
                        {cls.name.replace('Class ', 'C').replace('Pre-', 'P').slice(0, 3)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {cls.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">{cls.level}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] gap-0.5 shrink-0">
                      <MapPin className="h-2.5 w-2.5" /> Room {cls.room}
                    </Badge>
                  </div>

                  {/* Section capacity badges */}
                  <div className="flex items-center gap-1.5 flex-wrap my-3">
                    {cls.sections.map((s) => {
                      const count = getVirtualOccupied(s.id, s.capacity)
                      const over = count > s.capacity
                      return (
                        <span
                          key={s.id}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border',
                            over
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                          )}
                        >
                          Sec {s.name} · {count}/{s.capacity}
                        </span>
                      )
                    })}
                    <span className="text-[10px] text-muted-foreground">· {cls.subjects.length} subjects</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    {teacher ? (
                      <div className="flex items-center gap-1.5">
                        <GradientAvatar name={teacher.name} initials={teacher.avatar} size="sm" className="h-5 w-5 text-[9px]" />
                        <span className="text-[11px] text-muted-foreground truncate">{teacher.name}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">No Class Teacher</span>
                    )}
                    <span className={cn('text-[11px] font-bold', isOver ? 'text-rose-600' : 'text-foreground')}>
                      {clsEnrolled}/{clsCap} ({fill}%)
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', isOver ? 'bg-rose-500' : fill >= 95 ? 'bg-amber-500' : 'bg-primary')}
                      style={{ width: `${Math.min(100, fill)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-end text-[11px] font-medium text-primary pt-1 group-hover:translate-x-0.5 transition-transform">
                    Open Workspace <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      {filteredClasses.length === 0 && (
        <GlassCard className="p-12 text-center text-muted-foreground">
          <p className="text-sm">No classes found matching search criteria.</p>
        </GlassCard>
      )}
    </div>
  )
}
