'use client'

/**
 * Sessions tab (TH-FE-3) — the session log: one GlassCard list of the 60
 * most recent sessions (date desc from the server). Action items expand
 * inline per row. No ratings, no moods — just what was discussed and agreed.
 */

import { useState } from 'react'
import { CalendarCheck, CheckCircle2, ChevronDown, Clock, ListChecks } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import type { SessionItem } from '@/lib/teacher-hub-types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { sessionTypeMeta } from './shared'

interface SessionsTabProps {
  sessions: SessionItem[]
}

export function SessionsTab({ sessions }: SessionsTabProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  if (sessions.length === 0) {
    return (
      <GlassCard className="p-0" hover={false}>
        <HubEmptyState
          icon={CalendarCheck}
          title="No sessions logged yet"
          hint="Log your first mentoring session to start the timeline."
        />
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-0" hover={false}>
      <div className="divide-y divide-border">
        {sessions.map((s) => (
          <div key={s.id} className="px-4 py-3.5">
            <div className="flex items-start gap-3">
              {/* date rail */}
              <span className="w-16 shrink-0 pt-0.5 text-[10px] leading-tight tabular-nums text-muted-foreground">
                {formatDate(s.date)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs font-semibold text-foreground">{s.student.name}</span>
                  <SessionTypeChip type={s.type} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.discussion}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {s.durationMinutes != null && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {s.durationMinutes} min
                    </span>
                  )}
                  {s.actionItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => ({ ...e, [s.id]: !e[s.id] }))}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      aria-expanded={!!expanded[s.id]}
                    >
                      <ListChecks className="h-3 w-3" aria-hidden="true" />
                      {s.actionItems.length} item{s.actionItems.length === 1 ? '' : 's'}
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 transition-transform',
                          expanded[s.id] && 'rotate-180',
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                  {s.followUpDate && (
                    <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Follow-up {formatDate(s.followUpDate)}
                    </span>
                  )}
                </div>
                {expanded[s.id] && s.actionItems.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    {s.actionItems.map((item, i) => (
                      <li
                        key={`${s.id}-action-${i}`}
                        className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <CheckCircle2
                          className="mt-px h-3 w-3 shrink-0 text-muted-foreground/60"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

export function SessionTypeChip({ type }: { type: string }) {
  const meta = sessionTypeMeta(type)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
        meta.chip,
      )}
    >
      {meta.label}
    </span>
  )
}
