'use client'

/**
 * results/snapshot — SUBJECT SNAPSHOT (§14).
 *
 * Three quiet, data-derived facts about the latest published result:
 * strongest subject, the one to focus on next (respectful academic
 * language — never "weak"/"failure"), and the most improved vs the
 * previous assessment. Each tile shows only what genuinely derives
 * from the canonical marks; missing derivations collapse the tile
 * rather than fabricate a label.
 */

import { Award, Focus, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { fmtPct, type SubjectSnapshot } from '@/lib/store/student-results-store'
import { subjectColor } from '../timetable/subject-colors'

export function Snapshot({ snapshot }: { snapshot: SubjectSnapshot }) {
  const { strongest, needsAttention, mostImproved } = snapshot
  if (!strongest && !needsAttention && !mostImproved) return null

  const tiles: {
    key: string
    label: string
    subject: string
    value: string
    delta?: string
    icon: typeof Award
    tone: string
  }[] = []

  if (strongest) {
    tiles.push({
      key: 'strongest',
      label: 'Strongest',
      subject: strongest.subject,
      value: `${fmtPct(strongest.pct)}%`,
      icon: Award,
      tone: 'text-emerald-600 dark:text-emerald-400',
    })
  }
  if (needsAttention) {
    tiles.push({
      key: 'focus',
      label: 'Focus next',
      subject: needsAttention.subject,
      value: `${fmtPct(needsAttention.pct)}%`,
      icon: Focus,
      tone: 'text-amber-600 dark:text-amber-400',
    })
  }
  if (mostImproved) {
    tiles.push({
      key: 'improved',
      label: 'Most improved',
      subject: mostImproved.subject,
      value: `${fmtPct(mostImproved.pct)}%`,
      delta: `+${fmtPct(mostImproved.delta)}%`,
      icon: TrendingUp,
      tone: 'text-sky-600 dark:text-sky-400',
    })
  }

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-bold tracking-tight text-foreground">Subject Snapshot</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Derived from your published results</p>
      </div>
      <div className="space-y-2">
        {tiles.map((t) => {
          const color = subjectColor(t.subject)
          const Icon = t.icon
          return (
            <div key={t.key} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/15 px-3 py-2.5">
              <Icon className={cn('h-4 w-4 shrink-0', t.tone)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t.label}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', color.dot)} aria-hidden />
                  {t.subject}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-foreground">{t.value}</p>
                {t.delta && <p className="text-[10px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{t.delta}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
