'use client'

/**
 * Student Mentoring module (TH-FE-3) — the module composition root.
 *
 * Server-backed workspace over /api/teacher/mentoring*: quiet context
 * toolbar → 4 summary cards → pill tabs (Mentees / Sessions / Goals /
 * Follow-ups) → tab bodies, plus the four dialogs (add mentee, log session,
 * new goal, mentee detail sheet). The top application bar already names the
 * module — this page never repeats it.
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlarmClock, CalendarCheck, HeartHandshake, Plus, UserPlus, Users } from 'lucide-react'
import { PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '@/components/teacher/teacher-panel/module-toolbar'
import {
  HubModuleSkeleton,
  HubSectionError,
  HubStatCards,
  type HubStat,
} from '@/components/teacher/modules/shared/hub-stat-cards'
import { useFocusStore } from '@/lib/store/focus-store'
import { cn } from '@/lib/utils'
import { GHOST_ACTION, PRIMARY_ACTION } from './shared'
import { useMentoring } from './hooks'
import { MenteesTab } from './mentees-tab'
import { SessionsTab } from './sessions-tab'
import { GoalsTab } from './goals-tab'
import { FollowUpsTab } from './follow-ups-tab'
import { MenteeDetailDialog } from './mentee-detail-dialog'
import { LogSessionDialog } from './log-session-dialog'
import { GoalDialog } from './goal-dialog'
import { AddMenteeDialog } from './add-mentee-dialog'

type TabKey = 'mentees' | 'sessions' | 'goals' | 'follow-ups'

export function MentoringModule({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const {
    data,
    loading,
    error,
    reload,
    addMentee,
    updateMentee,
    logSession,
    addGoal,
    updateGoalStatus,
    updateFollowUp,
  } = useMentoring()

  const [tab, setTab] = useState<TabKey>('mentees')
  const [addOpen, setAddOpen] = useState(false)
  const [logState, setLogState] = useState<{ open: boolean; studentId?: string }>({ open: false })
  const [goalState, setGoalState] = useState<{ open: boolean; studentId?: string }>({
    open: false,
  })
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null)

  // Focus deep-link (command palette): a mentoring mentee focus with id
  // "mnt-<studentId>" opens that student's mentee sheet, then clears.
  const focusHandled = useRef(false)
  useEffect(() => {
    if (focusHandled.current || !data) return
    const focus = useFocusStore.getState().focus
    if (!focus || focus.moduleKey !== 'mentoring' || focus.type !== 'mentee') return
    if (typeof focus.id === 'string' && focus.id.startsWith('mnt-')) {
      const studentId = focus.id.slice('mnt-'.length)
      const known =
        data.assignments.some((a) => a.student.id === studentId) ||
        data.students.some((s) => s.id === studentId)
      if (known) setDetailStudentId(studentId)
      focusHandled.current = true
      useFocusStore.getState().clearFocus()
    }
  }, [data])

  const tabs: { key: TabKey; label: string; count: number }[] = data
    ? [
        { key: 'mentees', label: 'Mentees', count: data.assignments.length },
        { key: 'sessions', label: 'Sessions', count: data.sessions.length },
        { key: 'goals', label: 'Goals', count: data.goals.length },
        { key: 'follow-ups', label: 'Follow-ups', count: data.followUps.length },
      ]
    : []

  const stats: HubStat[] = data
    ? [
        {
          key: 'active-mentees',
          label: 'Active Mentees',
          value: data.stats.activeMentees,
          context: data.teacher.classLabel,
          icon: Users,
          tone: 'emerald',
        },
        {
          key: 'sessions-month',
          label: 'Sessions This Month',
          value: data.stats.sessionsThisMonth,
          context: `${data.stats.totalSessions} all-time`,
          icon: CalendarCheck,
          tone: 'sky',
        },
        {
          key: 'follow-ups',
          label: 'Follow-ups Due',
          value: data.stats.followUpsOpen,
          context: `${data.stats.followUpsDue} overdue`,
          icon: AlarmClock,
          tone: 'amber',
        },
        {
          key: 'needing-support',
          label: 'Needing Support',
          value: data.stats.needingSupport,
          context: 'watch & support statuses',
          icon: HeartHandshake,
          tone: 'rose',
        },
      ]
    : []

  return (
    <PageTransition className="space-y-4">
      {!data ? (
        loading ? (
          <HubModuleSkeleton />
        ) : (
          <HubSectionError
            message={error ?? 'Mentoring workspace could not load.'}
            onRetry={reload}
          />
        )
      ) : (
        <>
          {/* quiet context toolbar — the top bar already names the module */}
          <ModuleToolbar
            context={`${data.teacher.name} · Mentor · ${data.stats.activeMentees} mentees · ${data.stats.sessionsThisMonth} sessions this month`}
            action={
              <>
                <button type="button" onClick={() => setAddOpen(true)} className={GHOST_ACTION}>
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add Mentee
                </button>
                <button
                  type="button"
                  onClick={() => setLogState({ open: true })}
                  className={PRIMARY_ACTION}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Log Session
                </button>
              </>
            }
          />

          {/* summary cards */}
          <HubStatCards stats={stats} />

          {/* pill tab strip (scrolls horizontally on small screens) */}
          <div
            className="flex gap-1.5 overflow-x-auto pb-0.5"
            role="tablist"
            aria-label="Mentoring views"
          >
            {tabs.map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                      active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-background/80 text-muted-foreground',
                    )}
                  >
                    {t.count}
                  </span>
                  {t.key === 'follow-ups' && data.stats.followUpsDue > 0 && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-rose-500"
                      role="presentation"
                      aria-label={`${data.stats.followUpsDue} overdue follow-ups`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* tab bodies */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {tab === 'mentees' && (
                <MenteesTab
                  assignments={data.assignments}
                  onSelect={setDetailStudentId}
                  onAddMentee={() => setAddOpen(true)}
                />
              )}
              {tab === 'sessions' && <SessionsTab sessions={data.sessions} />}
              {tab === 'goals' && (
                <GoalsTab
                  goals={data.goals}
                  onNewGoal={() => setGoalState({ open: true })}
                  onUpdateStatus={updateGoalStatus}
                />
              )}
              {tab === 'follow-ups' && (
                <FollowUpsTab
                  followUps={data.followUps}
                  updateFollowUp={updateFollowUp}
                  onOpenStudent={setDetailStudentId}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* dialogs (need the aggregate payload) */}
      {data && (
        <>
          <AddMenteeDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            students={data.students}
            assignments={data.assignments}
            onAddMentee={addMentee}
          />
          <LogSessionDialog
            open={logState.open}
            onOpenChange={(o) => setLogState((s) => ({ ...s, open: o }))}
            students={data.students}
            defaultStudentId={logState.studentId}
            onLogSession={logSession}
          />
          <GoalDialog
            open={goalState.open}
            onOpenChange={(o) => setGoalState((s) => ({ ...s, open: o }))}
            students={data.students}
            defaultStudentId={goalState.studentId}
            onAddGoal={addGoal}
          />
          <MenteeDetailDialog
            studentId={detailStudentId}
            payload={data}
            onClose={() => setDetailStudentId(null)}
            onLogSession={(studentId) => setLogState({ open: true, studentId })}
            onAddGoal={(studentId) => setGoalState({ open: true, studentId })}
            onNavigate={onNavigate}
            updateMentee={updateMentee}
            updateGoalStatus={updateGoalStatus}
          />
        </>
      )}
    </PageTransition>
  )
}
