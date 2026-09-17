'use client'

/**
 * SubjectsSection — the SUBJECTS grid + in-place subject drill-down
 * (spec §9 subject experience, §66/§67 structure).
 *
 * Grid: one compact card per subject from subjectStatsOf() — subjectColor
 * identity, honest mastery %, thin progress bar, real count facts.
 * Clicking a subject swaps the grid for a focused SUBJECT VIEW (animated,
 * in place): Continue (most-recent unfinished resource) → Practice &
 * revise (unfinished resources) → Weak areas (ONLY when this subject is
 * among the 2 weakest by the latest published assessment — topics of its
 * unfinished resources as revision candidates with a working
 * "Add to plan" action). Progressive disclosure, never overwhelming.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import { cn } from '@/lib/utils'
import type { LearningResource, ResourceProgress, SubjectStat } from '@/lib/store/student-learning-store'
import { TYPE_META, BTN_VIOLET, BTN_SOFT_AMBER } from './type-meta'
import { useResourceActions } from './actions'

interface SubjectsSectionProps {
  stats: SubjectStat[]
  resources: LearningResource[]
  progress: Record<string, ResourceProgress>
  weakSubjects: string[]
  onOpen: (id: string) => void
}

export function SubjectsSection({ stats, resources, progress, weakSubjects, onOpen }: SubjectsSectionProps) {
  const [openSubject, setOpenSubject] = useState<string | null>(null)
  const openStat = openSubject ? stats.find((s) => s.subject === openSubject) ?? null : null

  if (stats.length === 0) return null

  return (
    <section className="space-y-3">
      <SectionLabel hint={`${stats.length} subjects`}>Subjects</SectionLabel>
      <AnimatePresence mode="wait" initial={false}>
        {openStat ? (
          <motion.div
            key={`subject-view-${openStat.subject}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SubjectView
              stat={openStat}
              resources={resources}
              progress={progress}
              weakSubjects={weakSubjects}
              onOpen={onOpen}
              onBack={() => setOpenSubject(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="subject-grid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {stats.map((stat) => (
                <SubjectCard key={stat.subject} stat={stat} onOpen={setOpenSubject} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ── Grid card ───────────────────────────────────────────────────────── */

function SubjectCard({ stat, onOpen }: { stat: SubjectStat; onOpen: (subject: string) => void }) {
  const sc = subjectColor(stat.subject)
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
      onClick={() => onOpen(stat.subject)}
      aria-label={`Open ${stat.subject} — ${stat.masteryPct}% mastery, ${stat.resourcesCompleted} of ${stat.resourcesTotal} resources done`}
      className="on-card flex min-h-11 flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5 text-left shadow-2xs text-slate-800 transition-all hover:shadow-xs"
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', sc.dot)} aria-hidden />
          <span className="truncate text-[13px] font-semibold">{stat.subject}</span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">Mastery</span>
          <span className="text-xs font-bold tabular-nums">{stat.masteryPct}%</span>
        </div>
        <div
          className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={stat.masteryPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${stat.subject} mastery`}
        >
          <div className={cn('h-full rounded-full', sc.dot)} style={{ width: `${stat.masteryPct}%` }} />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {stat.resourcesCompleted} of {stat.resourcesTotal} done
        {stat.cardsTotal > 0 ? ` · ${stat.cardsTotal} cards` : ''}
      </p>
    </motion.button>
  )
}

/* ── Drill-down subject view (§9) ────────────────────────────────────── */

function SubjectView({ stat, resources, progress, weakSubjects, onOpen, onBack }: {
  stat: SubjectStat
  resources: LearningResource[]
  progress: Record<string, ResourceProgress>
  weakSubjects: string[]
  onOpen: (id: string) => void
  onBack: () => void
}) {
  const sc = subjectColor(stat.subject)
  const actions = useResourceActions()

  /** Unfinished resources, most recently studied first (then newest added). */
  const unfinished = useMemo(
    () =>
      resources
        .filter((r) => r.subject === stat.subject && (progress[r.id]?.pct ?? 0) < 100)
        .map((r) => ({ resource: r, pct: progress[r.id]?.pct ?? 0, last: progress[r.id]?.lastStudiedAt ?? null }))
        .sort((a, b) => {
          const ta = a.last ? new Date(a.last).getTime() : 0
          const tb = b.last ? new Date(b.last).getTime() : 0
          if (ta !== tb) return tb - ta
          return b.resource.addedOn < a.resource.addedOn ? -1 : 1
        }),
    [resources, progress, stat.subject],
  )

  const continueItem = unfinished[0] ?? null
  const ContinueIcon = continueItem ? TYPE_META[continueItem.resource.type].icon : null

  /** Weak areas — ONLY derivable when the latest assessment says so. */
  const isWeak = weakSubjects.includes(stat.subject)
  const weakTopics = useMemo(
    () => (isWeak ? Array.from(new Set(unfinished.map((x) => x.resource.topic))) : []),
    [isWeak, unfinished],
  )

  return (
    <GlassCard hover={false} className="on-card p-4 sm:p-5">
      {/* Header — back + subject identity + honest mastery */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to all subjects"
          className="inline-flex h-11 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground sm:h-9"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Subjects
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', sc.dot)} aria-hidden />
          <h3 className="truncate text-sm font-semibold">{stat.subject}</h3>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">{stat.masteryPct}% mastery</span>
        </div>
      </div>
      <div
        className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={stat.masteryPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${stat.subject} mastery`}
      >
        <div className={cn('h-full rounded-full', sc.dot)} style={{ width: `${stat.masteryPct}%` }} />
      </div>

      {/* Continue — the one thing to pick up in this subject */}
      {continueItem ? (
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/75">Continue</p>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-500/25 bg-violet-500/[0.05] p-3">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', sc.bg, sc.text)}>
              {ContinueIcon && <ContinueIcon className="h-4 w-4" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{continueItem.resource.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {continueItem.resource.topic} · {continueItem.pct > 0 ? `${continueItem.pct}% done` : 'not started yet'}
              </p>
            </div>
            <button type="button" onClick={() => onOpen(continueItem.resource.id)} className={BTN_VIOLET}>
              {continueItem.pct > 0 ? 'Continue' : 'Start'}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          All {stat.resourcesTotal} resources completed
        </p>
      )}

      {/* Practice & revise — the subject's unfinished resources, compact */}
      {unfinished.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/75">
            Practice &amp; revise · {unfinished.length} unfinished
          </p>
          <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border">
            {unfinished.map((x) => {
              const Icon = TYPE_META[x.resource.type].icon
              return (
                <button
                  key={x.resource.id}
                  type="button"
                  onClick={() => onOpen(x.resource.id)}
                  className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium leading-tight">{x.resource.title}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{x.resource.topic}</span>
                  </span>
                  {x.pct > 0 ? (
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-violet-600 dark:text-violet-400">{x.pct}%</span>
                  ) : (
                    <span className="shrink-0 text-[11px] text-muted-foreground">Not started</span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Weak areas — only when the latest results actually say so (§28/§44) */}
      {weakTopics.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-3.5">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
            Weak areas · from your latest results
          </p>
          <div className="space-y-2">
            {weakTopics.map((topic) => (
              <div key={topic} className="flex items-center justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{topic}</p>
                <button
                  type="button"
                  onClick={() => actions.addRevision(stat.subject, topic)}
                  aria-label={`Add revision task for ${topic} to today's plan`}
                  className={BTN_SOFT_AMBER}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add to plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
