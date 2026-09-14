'use client'

/**
 * Mentees tab (TH-FE-3) — "My Mentees": a calm enterprise list of the
 * teacher's mentoring assignments (active first, archived dimmed). Every
 * value comes from the server aggregate; clicking a row opens the mentee
 * detail sheet.
 */

import { ChevronRight, UserPlus, Users } from 'lucide-react'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { MENTEE_STATUS_LABELS } from '@/lib/teacher-hub-types'
import type { MenteeItem } from '@/lib/teacher-hub-types'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { dueMeta, MENTEE_STATUS_STYLES, PRIMARY_SM, supportTypeLabel } from './shared'
import type { DueMeta } from './shared'

interface MenteesTabProps {
  assignments: MenteeItem[]
  onSelect: (studentId: string) => void
  onAddMentee: () => void
}

export function MenteesTab({ assignments, onSelect, onAddMentee }: MenteesTabProps) {
  if (assignments.length === 0) {
    return (
      <GlassCard className="p-0" hover={false}>
        <HubEmptyState
          icon={Users}
          title="No mentees assigned"
          hint="Students assigned to you for mentoring will appear here."
          action={
            <button type="button" onClick={onAddMentee} className={PRIMARY_SM}>
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Mentee
            </button>
          }
        />
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-0" hover={false}>
      <div className="divide-y divide-border">
        {assignments.map((m) => (
          <MenteeRow key={m.id} mentee={m} onSelect={onSelect} />
        ))}
      </div>
    </GlassCard>
  )
}

function MenteeRow({
  mentee,
  onSelect,
}: {
  mentee: MenteeItem
  onSelect: (studentId: string) => void
}) {
  const style = MENTEE_STATUS_STYLES[mentee.status]
  const due = mentee.nextFollowUpAt ? dueMeta(mentee.nextFollowUpAt) : null

  return (
    <button
      type="button"
      onClick={() => onSelect(mentee.student.id)}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
        !mentee.active && 'opacity-60',
      )}
    >
      <GradientAvatar name={mentee.student.name} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-medium text-foreground">
            {mentee.student.name}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
              style.badge,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden="true" />
            {MENTEE_STATUS_LABELS[mentee.status]}
          </span>
          {!mentee.active && (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Archived
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Roll {mentee.student.rollNo ?? '—'} · {mentee.student.classLabel}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/80">
          {supportTypeLabel(mentee.supportType)}
        </p>
        {/* mobile meta */}
        <div className="mt-2 flex flex-col items-start gap-1 sm:hidden">
          <MenteeMeta mentee={mentee} due={due} align="left" />
        </div>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1 text-right sm:flex">
        <MenteeMeta mentee={mentee} due={due} align="right" />
      </div>
      <ChevronRight
        className="hidden h-4 w-4 shrink-0 self-center text-muted-foreground/40 sm:block"
        aria-hidden="true"
      />
    </button>
  )
}

function MenteeMeta({
  mentee,
  due,
  align,
}: {
  mentee: MenteeItem
  due: DueMeta | null
  align: 'left' | 'right'
}) {
  return (
    <>
      <span className="text-[11px] text-muted-foreground">
        {mentee.lastSessionAt
          ? `Last session ${formatRelativeTime(mentee.lastSessionAt)}`
          : 'No sessions yet'}
      </span>
      {due ? (
        due.state === 'overdue' ? (
          <span className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
            {due.label}
          </span>
        ) : due.state === 'today' ? (
          <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            Due today
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Follow-up {due.label}</span>
        )
      ) : (
        <span className="text-[11px] text-muted-foreground/50">Follow-up —</span>
      )}
      <span className="text-[11px] text-muted-foreground">
        {mentee.goals.total > 0 ? (
          <>
            {mentee.goals.total} goal{mentee.goals.total === 1 ? '' : 's'} ·{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {mentee.goals.achieved} achieved
            </span>
          </>
        ) : (
          'No goals yet'
        )}
      </span>
    </>
  )
}
