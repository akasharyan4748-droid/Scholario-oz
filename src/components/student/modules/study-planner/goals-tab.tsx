'use client'

/**
 * GoalsTab — STUDY GOALS (spec §26).
 *
 * Rows come from the store's goals via goalProgressOf() — current value,
 * target and % are ALL derived from real state (sessions, tasks, cards;
 * §61 no fake statistics). Weekly goals track the last 7 days
 * (weeklyMinutes / weeklyCompletedTasks semantics); deck-master goals
 * show "X of N cards mastered" where N is the subject's real card count.
 *
 * New Goal dialog: a clean form (§24-style honesty — no fake AI): title,
 * kind (Weekly study time / Weekly tasks / Master a subject's cards),
 * target, and subject chips for deck-master with an honest note when a
 * subject has no cards. Archived goals collapse away but stay inspectable.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MoreHorizontal,
  Plus,
  X,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { SectionLabel } from '../../shell/page-header'
import { subjectColor } from '../timetable/subject-colors'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDismissOnEscape } from '@/hooks/use-dismiss-on-escape'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  goalProgressOf,
  useStudentLearningStore,
  type GoalKind,
  type LearningCard,
  type StudyGoal,
} from '@/lib/store/student-learning-store'

const KIND_META: Record<GoalKind, { label: string }> = {
  'weekly-minutes': { label: 'Weekly study time' },
  'weekly-tasks': { label: 'Weekly tasks' },
  'deck-master': { label: "Master a subject's cards" },
  'subject-resources': { label: 'Subject resources' },
}

function kindIconOf(kind: GoalKind) {
  switch (kind) {
    case 'weekly-minutes':
      return Clock3
    case 'weekly-tasks':
      return CheckCircle2
    default:
      return Award
  }
}

/** The honest "current of target" label per goal kind. */
function progressLabel(
  goal: StudyGoal,
  current: number,
  pct: number,
  cardsInSubject: number,
): string {
  switch (goal.kind) {
    case 'weekly-minutes':
      return `${current} of ${goal.target} min · ${pct}%`
    case 'weekly-tasks':
      return `${current} of ${goal.target} tasks · ${pct}%`
    case 'deck-master':
      return `${current} of ${cardsInSubject} cards mastered · ${pct}%`
    default:
      return 'Not tracked yet'
  }
}

const FIELD_CLASSES =
  'w-full rounded-xl border border-border bg-card/50 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10'

export function GoalsTab() {
  const goals = useStudentLearningStore((s) => s.goals)
  const sessions = useStudentLearningStore((s) => s.sessions)
  const tasks = useStudentLearningStore((s) => s.tasks)
  const cards = useStudentLearningStore((s) => s.cards)
  const resources = useStudentLearningStore((s) => s.resources)
  const archiveGoal = useStudentLearningStore((s) => s.archiveGoal)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [archivedOpen, setArchivedOpen] = useState(false)

  const rows = useMemo(
    () =>
      goals
        .filter((g) => !g.archived)
        .map((g) => ({
          goal: g,
          progress: goalProgressOf(g, { sessions, tasks, cards }),
          cardsInSubject: g.subject ? cards.filter((c) => c.subject === g.subject).length : 0,
        })),
    [goals, sessions, tasks, cards],
  )
  const archived = goals.filter((g) => g.archived)

  return (
    <div className="space-y-5">
      {/* ── My goals (§26) ── */}
      <section className="space-y-3">
        <SectionLabel hint={`${rows.length} active · last 7 days`}>My goals</SectionLabel>

        {rows.length === 0 ? (
          <GlassCard hover={false} className="on-card flex min-h-20 flex-col items-center justify-center gap-2 p-6">
            <p className="text-sm text-muted-foreground">No goals yet.</p>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:text-violet-400 sm:h-9"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New goal
            </button>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {rows.map(({ goal, progress, cardsInSubject }, i) => {
              const KindIcon = kindIconOf(goal.kind)
              const sc = goal.subject ? subjectColor(goal.subject) : null
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.2), duration: 0.2 }}
                >
                  <GlassCard className="on-card p-3 sm:p-4">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <KindIcon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="text-[13px] font-semibold leading-tight text-foreground">{goal.title}</p>
                          {sc && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                              <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                              {goal.subject}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{KIND_META[goal.kind].label}</p>

                        <div className="mt-2.5">
                          <div
                            className="h-2 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-valuenow={progress.pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${goal.title} progress`}
                          >
                            <div
                              className={cn(
                                'h-full rounded-full transition-[width] duration-500',
                                progress.pct >= 100 ? 'bg-emerald-500' : 'bg-emerald-500/70',
                              )}
                              style={{ width: `${progress.pct}%` }}
                            />
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                            <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                              {progressLabel(goal, progress.current, progress.pct, cardsInSubject)}
                            </p>
                            {progress.pct >= 100 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" aria-hidden />
                                Goal reached
                              </span>
                            )}
                            {goal.kind === 'deck-master' && cardsInSubject === 0 && (
                              <span className="text-[10px] italic text-muted-foreground">
                                No cards in this subject yet.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`More actions for ${goal.title}`}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => {
                              archiveGoal(goal.id)
                              toast.info('Goal archived', { description: goal.title })
                            }}
                          >
                            <Archive />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:text-violet-400 sm:h-9"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New goal
            </button>
          </div>
        )}
      </section>

      {/* ── Archived goals (collapsed, inspectable) ── */}
      {archived.length > 0 && (
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => setArchivedOpen((o) => !o)}
            aria-expanded={archivedOpen}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span>Archived · {archived.length}</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', archivedOpen && 'rotate-180')} aria-hidden />
          </button>
          {archivedOpen && (
            <GlassCard hover={false} className="on-card divide-y divide-border/60 p-0">
              {archived.map((g) => (
                <div key={g.id} className="flex min-h-11 items-center gap-2.5 px-3 py-2.5">
                  <Archive className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium leading-tight text-muted-foreground">{g.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {KIND_META[g.kind].label}
                      {g.subject ? ` · ${g.subject}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Archived
                  </span>
                </div>
              ))}
            </GlassCard>
          )}
        </section>
      )}

      <NewGoalDialog open={dialogOpen} onClose={() => setDialogOpen(false)} subjects={Array.from(new Set(resources.map((r) => r.subject))).filter(Boolean)} cards={cards} />
    </div>
  )
}

// ─── New Goal dialog (clean form — §24 no fake AI) ─────────────────────

const KIND_OPTIONS: Array<{ key: GoalKind; label: string; icon: typeof Clock3 }> = [
  { key: 'weekly-minutes', label: 'Weekly study time', icon: Clock3 },
  { key: 'weekly-tasks', label: 'Weekly tasks', icon: CheckCircle2 },
  { key: 'deck-master', label: "Master a subject's cards", icon: Award },
]

function NewGoalDialog({
  open,
  onClose,
  subjects,
  cards,
}: {
  open: boolean
  onClose: () => void
  subjects: string[]
  cards: LearningCard[]
}) {
  const addGoal = useStudentLearningStore((s) => s.addGoal)

  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<GoalKind>('weekly-minutes')
  const [target, setTarget] = useState('60')
  const [subject, setSubject] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle('')
    setKind('weekly-minutes')
    setTarget('60')
    setSubject('')
  }, [open])

  useDismissOnEscape(onClose, open)

  const subjectCards = subject ? cards.filter((c) => c.subject === subject) : []
  const parsedTarget = Number(target)
  const targetValid =
    kind === 'deck-master'
      ? subject !== ''
      : Number.isFinite(parsedTarget) && parsedTarget >= 1 && parsedTarget <= 1000
  const valid = title.trim() !== '' && targetValid

  const submit = () => {
    if (!valid) return
    addGoal({
      title: title.trim(),
      kind,
      // deck-master goals target "every card" — 100% of the deck (the
      // store's goalProgressOf semantics for target ≤ 100).
      target: kind === 'deck-master' ? 100 : Math.round(parsedTarget),
      subject: kind === 'deck-master' ? subject : undefined,
    })
    toast.success('Goal created', { description: title.trim() })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create a new study goal"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-premium-lg sm:max-w-lg sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-snug">New goal</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Real progress, tracked from your study activity.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close new goal dialog"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div>
                <label htmlFor="ng-title" className="mb-1.5 block text-xs font-medium text-foreground">
                  Title
                  <span className="ml-0.5 text-rose-500" aria-hidden>
                    *
                  </span>
                </label>
                <input
                  id="ng-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Study 4 hours this week"
                  aria-required="true"
                  className={FIELD_CLASSES}
                />
              </div>

              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-foreground">Goal type</legend>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Goal type">
                  {KIND_OPTIONS.map((k) => {
                    const active = kind === k.key
                    const Icon = k.icon
                    return (
                      <button
                        key={k.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setKind(k.key)}
                        className={cn(
                          'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                          active
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {k.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              {kind === 'deck-master' ? (
                <div className="space-y-3">
                  <fieldset>
                    <legend className="mb-1.5 text-xs font-medium text-foreground">
                      Subject
                      <span className="ml-0.5 text-rose-500" aria-hidden>
                        *
                      </span>
                    </legend>
                    <div className="flex flex-wrap gap-1.5">
                      {subjects.map((s) => {
                        const active = subject === s
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSubject(active ? '' : s)}
                            aria-pressed={active}
                            className={cn(
                              'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-9',
                              active
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                            )}
                          >
                            <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : subjectColor(s).dot)} aria-hidden />
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                  <p className="rounded-xl bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                    {subject
                      ? subjectCards.length > 0
                        ? `Goal: master every card — ${subjectCards.length} cards in ${subject}, ${subjectCards.filter((c) => c.status === 'mastered').length} mastered so far.`
                        : `This subject has no cards yet — the goal tracks future cards you study in ${subject}.`
                      : 'Pick the subject whose deck you want to master.'}
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="ng-target" className="mb-1.5 block text-xs font-medium text-foreground">
                    {kind === 'weekly-minutes' ? 'Target minutes this week' : 'Target tasks this week'}
                    <span className="ml-0.5 text-rose-500" aria-hidden>
                      *
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="ng-target"
                      type="number"
                      inputMode="numeric"
                      min={kind === 'weekly-minutes' ? 15 : 1}
                      max={kind === 'weekly-minutes' ? 3000 : 200}
                      step={kind === 'weekly-minutes' ? 15 : 1}
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      required
                      aria-required="true"
                      className={cn(FIELD_CLASSES, 'h-11 sm:h-10')}
                    />
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {kind === 'weekly-minutes' ? 'min' : 'tasks'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Counts the last 7 days, updated as you study.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card/60 px-4 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!valid}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9"
              >
                Create goal
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
