'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BookMarked, PlayCircle, ListTodo, Clock3, ChevronRight, CheckCircle2,
  FileText, Image as ImageIcon, FileSpreadsheet, Presentation, File as FileIcon,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import {
  useStudentLearningStore, continueLearningOf, tasksDueOn, minutesOn,
  type PlannerTask,
} from '@/lib/store/student-learning-store'
import { useStudentMaterialsStore } from '@/lib/study-materials/client'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { subjectColor } from '@/components/student/modules/timetable/subject-colors'
import { cn } from '@/lib/utils'

interface StudyBriefProps {
  onNavigate: (key: string) => void
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * StudyBrief — the dashboard's TODAY learning strip (replaces the retired
 * Homework/Assignments section with the Classwork decommission). Three
 * honest cards, every number derived from real stores:
 *   · Today's Plan — planner tasks due today (+ minutes studied so far)
 *   · Continue Learning — the most recently studied unfinished resource
 *   · Study Materials — the latest material shared with this student
 *     (server-authorized mirror; replaced the retired My Library card —
 *     NAV-CLEANUP §1: no dashboard card may point at a removed module)
 */
export function StudyBrief({ onNavigate }: StudyBriefProps) {
  const resources = useStudentLearningStore((s) => s.resources)
  const progress = useStudentLearningStore((s) => s.progress)
  const tasks = useStudentLearningStore((s) => s.tasks)
  const sessions = useStudentLearningStore((s) => s.sessions)
  const materials = useStudentMaterialsStore((s) => s.materials)

  const today = todayKey()
  const todaysTasks = useMemo(() => tasksDueOn(tasks, today), [tasks, today])
  const doneToday = useMemo(() => minutesOn(sessions, today), [sessions, today])
  const continueItems = useMemo(() => continueLearningOf(resources, progress).slice(0, 2), [resources, progress])
  const upNext = continueItems[0]
  const recentMaterials = useMemo(() => materials.slice(0, 3), [materials])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Today's study plan */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-violet-500" /> Today&apos;s Plan
          </h3>
          <StatusBadge
            status={todaysTasks.length > 0 ? `${todaysTasks.length} to do` : 'All clear'}
            variant={todaysTasks.length > 0 ? 'info' : 'success'}
          />
        </div>
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {todaysTasks.length === 0 && (
            <p className="text-xs text-muted-foreground py-6 text-center">Your day is clear — no study tasks planned.</p>
          )}
          {todaysTasks.map((t: PlannerTask, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onNavigate('planner')}
              className="w-full text-left rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 hover:border-violet-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm leading-tight">{t.title}</p>
                <span className={`text-[10px] font-semibold shrink-0 rounded-full px-2 py-0.5 ${subjectColor(t.subject).bg} ${subjectColor(t.subject).text}`}>
                  {t.subject}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Clock3 className="h-3 w-3" /> {t.durationMin} min
                {t.dueTime ? ` · by ${t.dueTime}` : ''}
                {t.status === 'in-progress' && ' · in progress'}
              </p>
            </motion.button>
          ))}
        </div>
        {doneToday >= 0 && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Studied today
            </span>
            <span className="font-semibold">{doneToday} min</span>
          </div>
        )}
      </GlassCard>

      {/* Continue learning */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-emerald-500" /> Continue Learning
          </h3>
          <button
            onClick={() => onNavigate('resources')}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            Learning Hub <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {upNext ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onNavigate('resources')}
            className="w-full text-left rounded-xl border border-border bg-card/40 p-3.5 hover:bg-accent/40 hover:border-emerald-500/30 transition-colors"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {upNext.resource.subject} · {upNext.resource.topic}
            </p>
            <p className="font-semibold text-sm leading-snug">{upNext.resource.title}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={upNext.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${upNext.resource.title} progress`}>
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${upNext.pct}%` }} />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{upNext.pct}%</span>
            </div>
          </motion.button>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">Nothing in progress — pick a resource in the Learning Hub.</p>
        )}
        {continueItems.length > 1 && (
          <button
            onClick={() => onNavigate('resources')}
            className="mt-2.5 w-full text-left rounded-xl border border-border/60 bg-card/30 p-2.5 hover:bg-accent/30 transition-colors"
          >
            <p className="text-xs font-medium truncate">{continueItems[1].resource.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{continueItems[1].resource.subject} · {continueItems[1].pct}% done</p>
          </button>
        )}
      </GlassCard>

      {/* Study Materials — the latest material shared with this student */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-sky-500" /> Study Materials
          </h3>
          <button
            onClick={() => onNavigate('study-materials')}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            All materials <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {recentMaterials.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Notes, worksheets and circulars your teachers share appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {recentMaterials.map((m, i) => {
              const Icon =
                m.kind === 'pdf' ? FileText :
                m.kind === 'image' ? ImageIcon :
                m.kind === 'sheet' ? FileSpreadsheet :
                m.kind === 'slides' ? Presentation : FileIcon
              return (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => onNavigate('study-materials')}
                  className="w-full text-left rounded-xl border border-border bg-card/40 p-3 hover:bg-accent/40 hover:border-sky-500/30 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <span className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      m.kind === 'pdf' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : m.kind === 'image' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    )}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight truncate">{m.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {m.subject ? `${m.subject} · ` : ''}{m.uploadedByName} · {formatRelativeTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Shared with you</span>
          <span className="font-semibold">{materials.length} material{materials.length === 1 ? '' : 's'}</span>
        </div>
      </GlassCard>
    </div>
  )
}
