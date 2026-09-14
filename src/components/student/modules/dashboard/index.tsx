'use client'

/**
 * StudentDashboard V2 (SD-3) — a STUDENT COMMAND CENTER, not a widget wall.
 *
 * Information hierarchy (PHASE 1/20):
 *   1. Who am I + how am I doing          → WelcomeHero (compact, personal)
 *   2. What should I do next              → UpNext (ranked priority queue)
 *   3. What is happening today            → TodayClasses
 *   4. How is my record                   → Attendance · AcademicSnapshot
 *   5. What needs action                  → AttentionRail (messages/fees/transport)
 *   6. Learning                           → ContinueLearning (ONE surface)
 *   7. What did school communicate        → NoticesStrip
 *   8. Special responsibilities           → LeadershipPanel (appointed only)
 *
 * ADAPTIVE (PHASE 21): every section renders from REAL data and simply
 * disappears without any — no rows of empty metric cards. ONE server
 * aggregation powers everything (PHASE 29); subsystem failures degrade
 * per-section (PHASE 32); skeletons match the final layout (PHASE 33).
 */

import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudentDashboard } from './data'
import { WelcomeHero } from './welcome-hero'
import { UpNext } from './up-next'
import { TodayClasses } from './today-classes'
import { AttendanceCard } from './attendance-card'
import { AcademicSnapshot } from './academic-snapshot'
import { AttentionRail } from './attention-rail'
import { ContinueLearning } from './continue-learning'
import { NoticesStrip } from './notices-strip'
import { LeadershipPanel } from './leadership-panel'

export function StudentDashboard({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { data, loading, error, reload } = useStudentDashboard()

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

  if (!data.student) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <p className="text-sm font-semibold">No student record linked to this account</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Please contact your school office — your profile is not enrolled in a class yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1 · Who am I — compact personal context */}
      <WelcomeHero data={data} />

      {/* 2 · What should I do next — the priority center */}
      <UpNext data={data} onNavigate={onNavigate} />

      {/* 3 + 4 · Today + Attendance */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayClasses data={data} />
        </div>
        <AttendanceCard data={data} onNavigate={onNavigate} />
      </div>

      {/* 4 + 5 · Academics + the attention rail */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AcademicSnapshot data={data} onNavigate={onNavigate} />
        </div>
        <AttentionRail data={data} onNavigate={onNavigate} />
      </div>

      {/* 6 · Learning — ONE real surface */}
      <ContinueLearning data={data} onNavigate={onNavigate} />

      {/* 7 + 8 · School communication + leadership (appointed students) */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NoticesStrip data={data} onNavigate={onNavigate} />
        </div>
        <LeadershipPanel onNavigate={onNavigate} />
      </div>
    </div>
  )
}

/** PHASE 33 — skeletons that match the FINAL layout (no blank page, no jump). */
function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-[104px] rounded-2xl" />
      <Skeleton className="h-[220px] rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <Skeleton className="h-[280px] rounded-2xl lg:col-span-2" />
        <Skeleton className="h-[280px] rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <Skeleton className="h-[260px] rounded-2xl lg:col-span-2" />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-[56px] rounded-xl" />
          <Skeleton className="h-[56px] rounded-xl" />
          <Skeleton className="h-[56px] rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
        <Skeleton className="h-[240px] rounded-2xl lg:col-span-2" />
        <Skeleton className="h-[240px] rounded-2xl" />
      </div>
    </div>
  )
}
