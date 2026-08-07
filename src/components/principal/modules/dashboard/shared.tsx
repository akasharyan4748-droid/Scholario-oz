'use client'

import { attendanceOverview } from '@/lib/mock/attendance'
import { studentStats } from '@/lib/mock/students'
import { school } from '@/lib/mock/school'
import { useAuth } from '@/lib/store/auth-store'

/**
 * Welcome banner — minimal greeting + date + 2 inline stats.
 *
 * Replaces the heavy emerald gradient hero. Calm white card with subtle
 * divider, no decorative orbs, no giant colored box.
 */
export function WelcomeBanner() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ').slice(0, 2).join(' ') ?? 'Principal'
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="rounded-lg border border-border/60 bg-card px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{today}</p>
        <h1 className="text-lg font-semibold tracking-tight text-foreground mt-0.5">
          Good morning, {firstName}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {school.shortName} · Attendance {attendanceOverview.today.rate}% · {studentStats.birthdaysToday} birthdays today
        </p>
      </div>
      <div className="flex items-center gap-4 shrink-0 text-sm">
        <div>
          <p className="font-semibold text-foreground tabular-nums">{attendanceOverview.today.present}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Present</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="font-semibold text-foreground tabular-nums">{studentStats.birthdaysToday}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Birthdays</p>
        </div>
      </div>
    </div>
  )
}
