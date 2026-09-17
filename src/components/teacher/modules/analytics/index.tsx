'use client'

/**
 * Performance Analytics — the module composition.
 *
 * Purpose: help the teacher understand how their assigned classes and
 * subjects are performing — not to show as many charts as possible.
 * Everything on screen comes from GET /api/teacher/analytics (real
 * ExamMark / ExamSubjectConfig / Attendance rows):
 *
 *   ModuleToolbar   — class scope + class selector (multi-class only;
 *                     defaults to the class-teacher class, which the
 *                     API lists first).
 *   KpiRow          — Class Average · Attendance Rate · Assessment
 *                     Completion · Students Needing Attention.
 *   Charts          — Performance Trend (per graded exam), Subject
 *                     Averages (latest exam), Attendance Trend (weekly).
 *   TopPerformers   — honest latest-exam rankings.
 *   AttentionList   — flagged students with reasons + View Student.
 *
 * Classes without data get honest empty states, never zero-filled
 * charts. A failed refresh keeps the last payload on screen behind a
 * quiet amber strip (only a first-load failure shows the full error
 * card). `module-router.tsx` passes onNavigate so View Student opens
 * the student directory; without it the buttons simply don't render.
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, Users } from 'lucide-react'
import { GlassCard, PageTransition } from '@/components/shared/ui'
import { ModuleToolbar } from '../../teacher-panel/module-toolbar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HubEmptyState, HubModuleSkeleton, HubSectionError } from '../shared/hub-stat-cards'
import { useAnalytics } from './hooks'
import { KpiRow } from './kpi-row'
import {
  AttendanceTrendCard,
  PerformanceTrendCard,
  SubjectAveragesCard,
} from './trend-charts'
import { AttentionList } from './attention-list'
import { TopPerformers } from './top-performers'

/** Quiet amber strip — a failed refresh never wipes a readable module. */
function StaleStrip({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-400"
    >
      <span className="flex min-w-0 items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">
          Couldn&rsquo;t refresh — showing your last loaded analytics. {message}
        </span>
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
      >
        Try again
      </button>
    </div>
  )
}

export function TeacherAnalyticsModule({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { data, error, staleError, reload } = useAnalytics()
  const [classId, setClassId] = useState<string | null>(null)

  // Keep the selection valid across reloads; default to the API's
  // first class (the route lists class-teacher classes first).
  useEffect(() => {
    if (data == null) return
    if (classId == null || !data.classes.some((c) => c.id === classId)) {
      setClassId(data.classes[0]?.id ?? null)
    }
  }, [data, classId])

  // First-load failure — nothing to keep on screen.
  if (error != null && data == null) {
    return (
      <PageTransition>
        <HubSectionError message={error} onRetry={reload} />
      </PageTransition>
    )
  }

  if (data == null) {
    return (
      <PageTransition>
        <HubModuleSkeleton />
      </PageTransition>
    )
  }

  const noClasses = (
    <PageTransition className="space-y-4">
      {staleError && <StaleStrip message={staleError} onRetry={reload} />}
      <GlassCard hover={false}>
        <HubEmptyState
          icon={Users}
          title="No classes assigned yet"
          hint="Analytics appear once you are a class teacher or teach a subject in a class."
        />
      </GlassCard>
    </PageTransition>
  )

  if (data.classes.length === 0) return noClasses

  const active =
    data.classAnalytics.find((c) => c.classId === classId) ?? data.classAnalytics[0] ?? null
  if (active == null) return noClasses

  const context = `${active.label} · ${active.studentCount} students${
    active.latestAssessment ? ` · latest graded: ${active.latestAssessment.name}` : ''
  }`

  return (
    <PageTransition className="space-y-4 sm:space-y-5">
      {/* A failed refresh never wipes a readable module — quiet strip only */}
      {staleError && <StaleStrip message={staleError} onRetry={reload} />}

      <ModuleToolbar
        context={context}
        action={
          data.classes.length > 1 ? (
            <Select value={active.classId} onValueChange={setClassId}>
              <SelectTrigger
                // Auto-width: the full class label (+ "Class teacher" chip)
                // must never truncate to "G…" (spec Phase 4) — the selected
                // context stays completely readable on every breakpoint.
                className="h-9 w-auto max-w-[280px] gap-1.5"
                aria-label="Class"
              >
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {data.classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{c.label}</span>
                      {c.isClassTeacher && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                          Class teacher
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      {/* summary — every value derived from real records */}
      <KpiRow a={active} />

      {/* time-series charts */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <PerformanceTrendCard a={active} className="lg:col-span-2" />
        <AttendanceTrendCard a={active} />
      </div>

      {/* latest assessment detail + rankings */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <SubjectAveragesCard a={active} className="lg:col-span-2" />
        <TopPerformers a={active} />
      </div>

      {/* actionable list */}
      <AttentionList a={active} onNavigate={onNavigate} />
    </PageTransition>
  )
}
