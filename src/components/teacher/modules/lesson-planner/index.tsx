'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Calendar, Plus, Clock, CheckCircle2, CalendarDays, TrendingUp, BookMarked,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { lessonPlannerStats, type LessonPlan } from '@/lib/mock/lessons'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { WeeklyPlansTab } from './weekly-plans-tab'
import { CurriculumTab } from './curriculum-tab'
import { PlanDetailDialog } from './plan-detail-dialog'

// Teacher Lesson Planner module entry point.
//
// `teacher-panel/module-router.tsx` imports the named `LessonPlannerModule`:
//   import { LessonPlannerModule } from '../modules/lesson-planner'
//
// This index owns the page-level state (selected plan, active tab) and
// composes the three sub-views: WeeklyPlansTab, CurriculumTab, and the
// PlanDetailDialog.
export function LessonPlannerModule() {
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null)
  const [activeTab, setActiveTab] = useState<'week' | 'curriculum'>('week')

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Lesson Planner"
        subtitle="Plan, track and deliver your lessons with curriculum mapping"
        icon={<BookOpen className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('New lesson plan', { description: 'Lesson plan builder would open here' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> New Plan
          </button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="This Week's Plans" value={lessonPlannerStats.thisWeek} icon={<CalendarDays className="h-5 w-5" />} accent="amber" trendLabel="2 pending" delay={0} />
        <KpiCard label="Completed Lessons" value={lessonPlannerStats.completed} icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" trend={8} trendLabel="this term" delay={0.05} />
        <KpiCard label="Pending Plans" value={lessonPlannerStats.pending} icon={<Clock className="h-5 w-5" />} accent="rose" trendLabel="needs attention" delay={0.1} />
        <KpiCard label="Curriculum Progress" value={lessonPlannerStats.curriculumProgress} suffix="%" icon={<TrendingUp className="h-5 w-5" />} accent="violet" trend={5} trendLabel="Maths syllabus" delay={0.15} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'week', label: 'Weekly Plans', icon: <Calendar className="h-3.5 w-3.5" /> },
          { id: 'curriculum', label: 'Curriculum Map', icon: <BookMarked className="h-3.5 w-3.5" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as 'week' | 'curriculum')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              activeTab === t.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'week' ? (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <WeeklyPlansTab onSelect={setSelectedPlan} />
          </motion.div>
        ) : (
          <motion.div
            key="curriculum"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          >
            <CurriculumTab />
          </motion.div>
        )}
      </AnimatePresence>

      <PlanDetailDialog plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
    </div>
  )
}
