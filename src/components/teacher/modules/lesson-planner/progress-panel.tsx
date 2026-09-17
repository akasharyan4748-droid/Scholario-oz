'use client'

/**
 * lesson-planner/progress-panel — Curriculum Progress. One honest overall
 * line ("20 of 32 topics · 63%") with an emerald bar, then thin per-unit
 * progress rows (unit name, completed/total, h-1.5 emerald bar). Long unit
 * lists scroll inside a thin-scrollbar area. NO donut/pie/radial charts —
 * linear bars only, per the module spec.
 */

import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { LessonPlanPayload, UnitProgress } from './api'
import { THIN_SCROLLBAR } from './shared'

function UnitRow({ unit }: { unit: UnitProgress }) {
  const pct = unit.total > 0 ? Math.round((unit.completed / unit.total) * 100) : 0
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-medium" title={`Unit ${unit.unitNo} · ${unit.unitName}`}>
          <span className="text-muted-foreground">Unit {unit.unitNo}</span> · {unit.unitName}
        </p>
        <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {unit.completed}/{unit.total}
        </p>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`Unit ${unit.unitNo} · ${unit.unitName}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function ProgressPanel({ plan }: { plan: LessonPlanPayload }) {
  const { progress, units } = plan

  return (
    <GlassCard hover={false} className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Curriculum Progress
        </p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {progress.completed} of {progress.total} topics
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <p className="font-display text-2xl font-bold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
          {progress.pct}%
        </p>
        <div
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={`${plan.subjectName} curriculum completion`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.pct}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
      </div>

      {units.length > 0 ? (
        <div className={cn('mt-4 max-h-72 overflow-y-auto divide-y divide-border/60', THIN_SCROLLBAR)}>
          {units.map((u) => (
            <UnitRow key={`${u.unitNo}-${u.unitName}`} unit={u} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">No units configured yet.</p>
      )}
    </GlassCard>
  )
}
