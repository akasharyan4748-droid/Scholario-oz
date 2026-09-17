'use client'

/**
 * TeacherDashboard (TWC-FE-4) — rebuilt on the ONE server aggregate
 * (GET /api/teacher/dashboard). The former fully-static mock (fake Class 2-A
 * identity, fake charts, fake insights, fake calendar/gauge/activity
 * widgets) is deleted; every section below renders REAL data and simply
 * disappears when it has none.
 *
 * Information hierarchy:
 *   1. Who am I + my day at a glance   → WelcomeBanner (live facts)
 *   2. Headline numbers                 → TeacherKpiCards (honest fallbacks)
 *   3. What needs marking now           → AttendanceCard (class-teacher only)
 *   4. Today + what I should teach      → TodayClasses (schedule · lessons)
 *   5. Shortcuts + school communication → QuickActions · NoticeBoard
 *   6. What awaits my attention         → PendingActions (real hub APIs)
 *
 * Loading  → layout-matched skeletons (no blank page, no jump).
 * Error    → full retry card (mirrors the student dashboard v2 pattern).
 * Reload   → stale data is KEPT on failure; only a quiet inline strip shows.
 */

import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeacherDashboard } from './hooks/use-teacher-dashboard'
import { WelcomeBanner } from './welcome-banner'
import { TeacherKpiCards } from './kpi-cards'
import { AttendanceCard } from './attendance-card'
import { TodayClasses } from './today-classes'
import { QuickActions, NoticeBoard } from './quick-actions'
import { PendingActions } from './pending-actions'

interface DashboardProps {
  onNavigate: (key: string) => void
}

export function TeacherDashboard({ onNavigate }: DashboardProps) {
  const { data, loading, error, staleError, reload } = useTeacherDashboard()

  if (loading) return <DashboardSkeleton />

  if (error || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold">Dashboard could not load</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {error ?? 'Your school data is temporarily unavailable.'}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={reload} className="h-8 gap-1.5">
          <RotateCw className="h-3.5 w-3.5" aria-hidden /> Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* A failed refresh never wipes a readable dashboard — quiet strip only */}
      {staleError && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-400"
        >
          <span className="flex min-w-0 items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              Couldn&rsquo;t refresh — showing your last loaded dashboard. {staleError}
            </span>
          </span>
          <button
            type="button"
            onClick={reload}
            className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
          >
            Try again
          </button>
        </div>
      )}

      {/* 1 · Personal context + live facts */}
      <WelcomeBanner data={data} />

      {/* 2 · Headline numbers */}
      <TeacherKpiCards data={data} />

      {/* 3 · Attendance prompt (class-teacher classes only; null otherwise) */}
      <AttendanceCard attendance={data.attendance} onNavigate={onNavigate} />

      {/* 4 · Today's schedule + today's lessons */}
      <TodayClasses data={data} onNavigate={onNavigate} />

      {/* 5 · Shortcuts + real school notices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <QuickActions onNavigate={onNavigate} />
        <NoticeBoard notices={data.notices} onNavigate={onNavigate} />
      </div>

      {/* 6 · Real pending queue (fetches the Teacher Hub aggregates itself) */}
      <PendingActions onNavigate={onNavigate} />
    </div>
  )
}

/** Layout-matched skeletons — the final composition, quietly loading. */
function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-[132px] rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Skeleton className="h-[104px] rounded-xl" />
        <Skeleton className="h-[104px] rounded-xl" />
        <Skeleton className="h-[104px] rounded-xl" />
        <Skeleton className="h-[104px] rounded-xl" />
      </div>
      <Skeleton className="h-[76px] rounded-xl" />
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <Skeleton className="h-[400px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-[260px] rounded-xl lg:col-span-2" />
      </div>
      <Skeleton className="h-[260px] rounded-xl" />
    </div>
  )
}
