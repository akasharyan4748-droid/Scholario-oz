'use client'

/**
 * lesson-planner/index — the Lesson Planner module (TWC-FE-1), rewritten
 * around the curriculum architecture:
 *
 *   Teacher → Class + Subject → Curriculum → automatic day-wise schedule →
 *   Today's topic → completion.
 *
 * Composition: quiet context toolbar carrying the Class + Subject selectors
 * (only assigned pairs ever appear) → Today's Lesson hero → two-column body
 * (Curriculum Progress + Curriculum Map on the left, Upcoming + Schedule
 * basis on the right). Every number on screen comes from
 * /api/teacher/lesson-planner* — the old mock tabs, "New Plan" button, donut
 * chart and fake AI suggestions are gone for good.
 *
 * module-router.tsx imports the named `LessonPlannerModule` and renders it
 * with no props.
 */

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, BookX, CircleAlert } from 'lucide-react'
import { GlassCard, PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '@/components/teacher/teacher-panel/module-toolbar'
import {
  HubEmptyState,
  HubSectionError,
} from '@/components/teacher/modules/shared/hub-stat-cards'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  fetchLessonPlan,
  fetchTeachingAssignments,
  setTopicCompletion,
  type LessonPlanPayload,
  type TeachingAssignment,
} from './api'
import { CurriculumMapCard } from './curriculum-map'
import { ProgressPanel } from './progress-panel'
import { ScheduleBasisCard, UpcomingPanel } from './upcoming-panel'
import { TodayLessonCard } from './today-lesson'
import { applyCompletion } from './shared'

interface Selection {
  classId: string
  subjectId: string
}

// ─── Layout-matched skeletons (pulse rows, never spinners) ──────────────

function PlanSkeleton() {
  return (
    <div className="space-y-4">
      {/* hero */}
      <div className="animate-pulse rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="h-3 w-36 rounded bg-muted" />
        <div className="mt-3 h-5 w-44 rounded bg-muted" />
        <div className="mt-2.5 h-7 w-2/3 rounded bg-muted" />
        <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
        <div className="mt-4 h-8 w-36 rounded-lg bg-muted" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {/* progress */}
          <div className="animate-pulse rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="h-3 w-36 rounded bg-muted" />
            <div className="mt-3 h-2 w-full rounded-full bg-muted" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2.5 w-40 rounded bg-muted" />
                  <div className="h-1.5 w-full rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>
          {/* map */}
          <div className="h-[420px] animate-pulse rounded-xl border border-border bg-card" />
        </div>
        <div className="hidden min-w-0 space-y-4 lg:block">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      </div>
    </div>
  )
}

function LessonPlannerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <PlanSkeleton />
    </div>
  )
}

// ─── Quiet retry card ───────────────────────────────────────────────────

function LoadErrorCard({
  message,
  detail,
  onRetry,
}: {
  message: string
  detail?: string | null
  onRetry: () => void
}) {
  return (
    <GlassCard hover={false} className="p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10">
          <CircleAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-foreground">{message}</p>
        {detail && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{detail}</p>}
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </GlassCard>
  )
}

// ─── Module ─────────────────────────────────────────────────────────────

export function LessonPlannerModule() {
  // Teaching assignments (the picker source)
  const [assignments, setAssignments] = useState<TeachingAssignment[] | null>(null)
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null)
  const [assignmentsTick, setAssignmentsTick] = useState(0)

  // The selected (class, subject) pair + its plan
  const [selection, setSelection] = useState<Selection | null>(null)
  const [plan, setPlan] = useState<LessonPlanPayload | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [planTick, setPlanTick] = useState(0)

  // Topic completion in flight (optimistic toggle)
  const [pendingTopicId, setPendingTopicId] = useState<string | null>(null)

  // ── assignments load (mount + retry) ──
  useEffect(() => {
    let cancelled = false
    setAssignmentsLoading(true)
    setAssignmentsError(null)
    fetchTeachingAssignments()
      .then((list) => {
        if (!cancelled) setAssignments(list)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setAssignmentsError(e instanceof Error ? e.message : 'Lesson Planner could not load.')
      })
      .finally(() => {
        if (!cancelled) setAssignmentsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [assignmentsTick])

  // Default = first assignment; keep the selection only while it still exists.
  useEffect(() => {
    if (!assignments) return
    setSelection((prev) => {
      if (prev && assignments.some((a) => a.classId === prev.classId && a.subjectId === prev.subjectId)) {
        return prev
      }
      const first = assignments[0]
      return first ? { classId: first.classId, subjectId: first.subjectId } : null
    })
  }, [assignments])

  // ── plan load (selection change + quiet refetch after mutations) ──
  useEffect(() => {
    if (!selection) {
      setPlan(null)
      setPlanError(null)
      setPlanLoading(false)
      return
    }
    let cancelled = false
    setPlanLoading(true)
    setPlanError(null)
    fetchLessonPlan(selection.classId, selection.subjectId)
      .then((p) => {
        if (!cancelled) setPlan(p)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        // Keep any existing (optimistically updated) plan on screen — the
        // inline error strip offers a retry; only a truly empty module
        // falls back to the full error card.
        setPlanError(e instanceof Error ? e.message : 'The lesson plan could not load.')
      })
      .finally(() => {
        if (!cancelled) setPlanLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selection, planTick])

  const retryAssignments = useCallback(() => setAssignmentsTick((t) => t + 1), [])
  const retryPlan = useCallback(() => setPlanTick((t) => t + 1), [])

  // ── selectors ──
  const selectClass = useCallback(
    (classId: string) => {
      const inClass = (assignments ?? []).filter((a) => a.classId === classId)
      const next =
        inClass.find((a) => a.subjectId === selection?.subjectId) ?? inClass[0] ?? null
      if (!next) return
      if (selection && next.classId === selection.classId && next.subjectId === selection.subjectId) {
        return
      }
      setPlan(null)
      setPlanError(null)
      setSelection({ classId: next.classId, subjectId: next.subjectId })
    },
    [assignments, selection],
  )

  const selectSubject = useCallback(
    (subjectId: string) => {
      if (!selection || subjectId === selection.subjectId) return
      const exists = (assignments ?? []).some(
        (a) => a.classId === selection.classId && a.subjectId === subjectId,
      )
      if (!exists) return
      setPlan(null)
      setPlanError(null)
      setSelection({ ...selection, subjectId })
    },
    [assignments, selection],
  )

  // ── optimistic completion toggle (rollback + toast; refetch = truth) ──
  const handleToggleCompletion = useCallback(
    async (topicId: string, completed: boolean) => {
      const snapshot = plan
      if (!snapshot) return
      setPendingTopicId(topicId)
      setPlan(applyCompletion(snapshot, topicId, completed))
      try {
        await setTopicCompletion(topicId, completed)
        toast.success(completed ? 'Topic completed' : 'Completion undone')
        setPlanTick((t) => t + 1)
      } catch (e: unknown) {
        setPlan(snapshot)
        toast.error(
          completed ? 'Could not mark the topic complete' : 'Could not undo the completion',
          { description: e instanceof Error ? e.message : undefined },
        )
      } finally {
        setPendingTopicId(null)
      }
    },
    [plan],
  )

  // ── render: full-module states ──

  if (assignmentsLoading && !assignments) {
    return (
      <PageTransition className="space-y-4">
        <LessonPlannerSkeleton />
      </PageTransition>
    )
  }

  if (!assignments) {
    return (
      <PageTransition className="space-y-4">
        <LoadErrorCard
          message="Couldn't load the lesson plan"
          detail={assignmentsError}
          onRetry={retryAssignments}
        />
      </PageTransition>
    )
  }

  if (assignments.length === 0) {
    return (
      <PageTransition className="space-y-4">
        <GlassCard hover={false} className="p-4 sm:p-6">
          <HubEmptyState
            icon={BookOpen}
            title="No teaching assignments yet"
            hint="Classes you teach will appear here."
          />
        </GlassCard>
      </PageTransition>
    )
  }

  // ── render: module with selectors ──

  const classOptions: TeachingAssignment[] = []
  for (const a of assignments) {
    if (!classOptions.some((c) => c.classId === a.classId)) classOptions.push(a)
  }
  const subjectOptions = assignments.filter((a) => a.classId === selection?.classId)
  const selected =
    assignments.find(
      (a) => a.classId === selection?.classId && a.subjectId === selection?.subjectId,
    ) ?? null

  const toolbarContext = plan
    ? `${plan.classLabel} · ${plan.subjectName} · ${plan.progress.pct}% complete`
    : selected
      ? `${selected.classLabel} · ${selected.subjectName}`
      : undefined

  const toggleCompletion = (topicId: string, completed: boolean) => {
    void handleToggleCompletion(topicId, completed)
  }

  return (
    <PageTransition className="space-y-4">
      {/* quiet context toolbar — the top bar already names the module.
          NO "New Plan" action: the schedule is derived, not authored. */}
      <ModuleToolbar
        context={toolbarContext}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selection?.classId ?? ''}
              onValueChange={selectClass}
              disabled={classOptions.length === 0}
            >
              <SelectTrigger
                aria-label="Class"
                className="h-8 w-[150px] text-xs font-medium sm:w-[170px]"
              >
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((c) => (
                  <SelectItem key={c.classId} value={c.classId} className="text-xs">
                    {c.classLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selection?.subjectId ?? ''}
              onValueChange={selectSubject}
              disabled={subjectOptions.length === 0}
            >
              <SelectTrigger
                aria-label="Subject"
                className="h-8 w-[150px] text-xs font-medium sm:w-[170px]"
              >
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((s) => (
                  <SelectItem key={s.subjectId} value={s.subjectId} className="text-xs">
                    {s.subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* quiet-refetch failure while content is on screen */}
      {plan && planError && <HubSectionError message={planError} onRetry={retryPlan} />}

      {planLoading && !plan ? (
        <PlanSkeleton />
      ) : plan ? (
        plan.topics.length === 0 ? (
          /* honest zero-topic state — the curriculum was never configured */
          <GlassCard hover={false} className="p-4 sm:p-6">
            <HubEmptyState
              icon={BookX}
              title="Curriculum unavailable for this subject yet"
              hint={`Topics for ${plan.subjectName} in ${plan.classLabel} haven't been configured.`}
            />
          </GlassCard>
        ) : (
          <motion.div
            key={`${plan.classId}|${plan.subjectId}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* 1 — today's lesson, the first thing the teacher sees */}
            <TodayLessonCard
              plan={plan}
              pending={plan.today.topic != null && pendingTopicId === plan.today.topic.id}
              onToggleCompletion={toggleCompletion}
            />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-4">
                {/* 3 — curriculum progress */}
                <ProgressPanel plan={plan} />
                {/* 4 — the curriculum map (primary experience) */}
                <CurriculumMapCard
                  plan={plan}
                  pendingTopicId={pendingTopicId}
                  onToggleCompletion={toggleCompletion}
                />
              </div>
              <div className="min-w-0 space-y-4">
                {/* 5 — upcoming queue */}
                <UpcomingPanel plan={plan} />
                <ScheduleBasisCard plan={plan} />
              </div>
            </div>
          </motion.div>
        )
      ) : planError ? (
        <LoadErrorCard
          message="Couldn't load the lesson plan"
          detail={planError}
          onRetry={retryPlan}
        />
      ) : null}
    </PageTransition>
  )
}
