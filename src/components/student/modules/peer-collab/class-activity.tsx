'use client'

/**
 * ClassActivity — ONE compact, honest strip replacing the old fake
 * KPI wall + gradient hero + fabricated weekly chart (spec §61).
 *
 * Every fact derives from the groups store's arrays:
 *   · questions asked this week   → questionsAskedSince(questions, 7)
 *   · classmates active this week → activeClassmatesSince(questions, 7)
 *   · groups joined               → groups.filter(joined)
 *   · open questions              → openQuestionsOf(questions)
 *   · saved shares                → shares.filter(savedByMe)
 * No invented streaks, ranks, downloads or "helpfulness scores".
 */

import { BookmarkCheck, MessageCircleQuestion, Users, UsersRound } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import {
  activeClassmatesSince,
  openQuestionsOf,
  questionsAskedSince,
  useStudentGroupsStore,
} from '@/lib/store/student-groups-store'

function Fact({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  accent: 'emerald' | 'sky' | 'violet'
}) {
  const tones = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  } as const
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tones[accent])}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-base font-bold leading-tight tabular-nums">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function ClassActivity() {
  const groups = useStudentGroupsStore((s) => s.groups)
  const questions = useStudentGroupsStore((s) => s.questions)
  const shares = useStudentGroupsStore((s) => s.shares)

  const askedThisWeek = questionsAskedSince(questions, 7)
  const activeClassmates = activeClassmatesSince(questions, 7)
  const joined = groups.filter((g) => g.joined).length
  const open = openQuestionsOf(questions).length
  const saved = shares.filter((sh) => sh.savedByMe).length

  return (
    <GlassCard hover={false} className="on-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <UsersRound className="h-4.5 w-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug">
            {askedThisWeek.length > 0
              ? `${askedThisWeek.length} question${askedThisWeek.length === 1 ? '' : 's'} asked this week`
              : 'No class questions this week yet'}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {activeClassmates.length > 0
              ? `${activeClassmates.length} classmate${activeClassmates.length === 1 ? '' : 's'} active in Class 2-A`
              : 'Your classmates have not posted recently'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/60 pt-4 sm:gap-x-7 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
        <Fact icon={Users} value={joined} label="groups joined" accent="emerald" />
        <Fact icon={MessageCircleQuestion} value={open} label="open questions" accent="sky" />
        <Fact icon={BookmarkCheck} value={saved} label="saved shares" accent="violet" />
      </div>
    </GlassCard>
  )
}
