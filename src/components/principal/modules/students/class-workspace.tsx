'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { getTeacherById } from '@/lib/mock/teachers'
import { cn } from '@/lib/utils'
import { getVirtualOccupied, type ClassRecord, type StudentRecord } from '@/lib/store/students-store'
import {
  Users, BookOpen, UserCheck, MapPin, ChevronRight, ChevronDown,
  TrendingUp,
} from 'lucide-react'
import { OverviewPanel } from './class-workspace-overview-panel'
import { StudentsPanel } from './class-workspace-students-panel'
import { SubjectsPanel } from './class-workspace-subjects-panel'
import { TeachersPanel } from './class-workspace-teachers-panel'
import { PerformancePanel } from './class-workspace-performance-panel'

interface ClassWorkspaceProps {
  classRecord: ClassRecord
  students: StudentRecord[]
  onStudentClick: (student: StudentRecord) => void
}

export function ClassWorkspace({ classRecord, students, onStudentClick }: ClassWorkspaceProps) {
  const [expanded, setExpanded] = useState(false)
  const teacher = getTeacherById(classRecord.classTeacherId)
  const totalCapacity = classRecord.sections.reduce((a, s) => a + s.capacity, 0)
  const virtualOccupied = classRecord.sections.reduce((a, s) => a + getVirtualOccupied(s.id, s.capacity), 0)
  const fillPct = Math.round((virtualOccupied / totalCapacity) * 100)
  const isOverloaded = virtualOccupied > totalCapacity
  const capacityColor = isOverloaded ? 'oklch(0.6 0.2 25)' : fillPct >= 95 ? 'oklch(0.7 0.15 75)' : 'oklch(0.6 0.18 150)'

  return (
    <GlassCard className="p-0 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 text-left hover:bg-accent/30 transition-colors">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 font-display font-bold text-white shadow-md text-sm">
          {classRecord.name.replace('Class ', 'C').replace('Pre-', 'P').slice(0, 3)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm sm:text-base">{classRecord.name}</h3>
            <Badge variant="secondary" className="text-[10px] gap-0.5"><MapPin className="h-2.5 w-2.5" /> {classRecord.room}</Badge>
            <Badge variant="outline" className="text-[10px]">{classRecord.level}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {classRecord.sections.map((s) => {
              const count = getVirtualOccupied(s.id, s.capacity)
              const pct = Math.round((count / s.capacity) * 100)
              const over = count > s.capacity
              return (
                <span key={s.id} className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border', over ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' : pct >= 95 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' : 'bg-primary/10 text-primary border-primary/20')}>
                  Sec {s.name} · {count}/{s.capacity}
                </span>
              )
            })}
            <span className="text-[11px] text-muted-foreground">· {classRecord.subjects.length} subjects</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 pr-2">
          <div className="text-center min-w-[60px]">
            <p className="font-display text-lg font-bold" style={{ color: capacityColor }}>
              {virtualOccupied}<span className="text-sm text-muted-foreground font-normal">/{totalCapacity}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">{isOverloaded ? 'Overloaded' : 'Students'}</p>
          </div>
          {teacher && (
            <div className="flex items-center gap-2">
              <GradientAvatar name={teacher.name} initials={teacher.avatar} size="sm" />
              <div className="hidden lg:block">
                <p className="text-xs font-medium leading-tight">{teacher.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Class Teacher</p>
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 text-muted-foreground">{expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}</div>
      </button>
      <div className="px-4 sm:px-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, fillPct)}%`, background: capacityColor }} />
          </div>
          <span className="text-[11px] font-semibold w-10 text-right" style={{ color: capacityColor }}>{fillPct}%</span>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden border-t border-border">
            <div className="p-4 sm:p-5 bg-card/20">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="flex h-9 flex-wrap gap-1 bg-muted/50 p-1 mb-4">
                  <TabsTrigger value="overview" className="text-xs h-7 gap-1"><Users className="h-3 w-3" /> Overview</TabsTrigger>
                  <TabsTrigger value="students" className="text-xs h-7 gap-1"><Users className="h-3 w-3" /> Students <span className="ml-1 text-[10px] bg-primary/15 px-1 rounded">{students.length}</span></TabsTrigger>
                  <TabsTrigger value="subjects" className="text-xs h-7 gap-1"><BookOpen className="h-3 w-3" /> Subjects</TabsTrigger>
                  <TabsTrigger value="teachers" className="text-xs h-7 gap-1"><UserCheck className="h-3 w-3" /> Teachers</TabsTrigger>
                  <TabsTrigger value="performance" className="text-xs h-7 gap-1"><TrendingUp className="h-3 w-3" /> Performance</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-0"><OverviewPanel classRecord={classRecord} students={students} teacher={teacher} virtualOccupied={virtualOccupied} /></TabsContent>
                <TabsContent value="students" className="mt-0"><StudentsPanel students={students} onStudentClick={onStudentClick} /></TabsContent>
                <TabsContent value="subjects" className="mt-0"><SubjectsPanel classRecord={classRecord} /></TabsContent>
                <TabsContent value="teachers" className="mt-0"><TeachersPanel classRecord={classRecord} teacher={teacher} /></TabsContent>
                <TabsContent value="performance" className="mt-0"><PerformancePanel students={students} /></TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
