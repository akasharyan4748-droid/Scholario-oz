'use client'

/**
 * learning/hub/hub-home — the student's learning command centre (§7/§8/§67).
 *
 * Answers, in order, the five questions a student actually has:
 *   1. What was I studying?      → CONTINUE LEARNING (real last-studied state)
 *   2. What should I do now?     → TODAY'S FOCUS (real planner + due cards)
 *   3. Where do I stand?         → SUBJECTS (derived mastery, one action each)
 *   4. What next?                → RECOMMENDED (derived — weak areas from
 *                                  RESULTS, unfinished work, saved items)
 *   5. What did I do recently?   → RECENT + SAVED
 *
 * Over-texting is banned (§4): the workspace knows who I am — the page says
 * "Learning Hub / Your learning space" and nothing else. Every number derives
 * from the learning store + the canonical results store (§61).
 */

import { useMemo, useState } from 'react'
import {
  CalendarRange, ChevronRight, Clock, Flame, Layers,
  Play, TrendingUp,
} from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useLearningStore, dueCards, deckStats, continueLearning, recentlyStudied, streakOf } from '@/lib/store/learning-store'
import { useMyResults } from '@/lib/store/student-results-store'
import { pctOf } from '@/lib/store/student-results-store'
import { subjectColor } from '../../timetable/subject-colors'
import { SectionLabel } from '../../../shell/page-header'
import { ResourceCard } from '../shared/resource-card'
import { typeToken, resourceMeta, ProgressBar, fmtMin } from '../shared/tokens'
import { SubjectView } from './subject-view'
import { ResourceDetail } from './resource-detail'
import { CreateCardDialog } from '../flashcards/create-card-dialog'
import type { LearningResource } from '@/lib/store/learning-types'

interface HubHomeProps {
  /** Navigate to a Learning section (hub/flashcards/planner/groups). */
  onSection: (section: string) => void
  /** Jump into the flashcards session for a specific deck. */
  onReviewDeck: (deckId: string) => void
  onNavigate: (key: string) => void
}

export function HubHome({ onSection, onReviewDeck, onNavigate }: HubHomeProps) {
  const resources = useLearningStore((s) => s.resources)
  const progress = useLearningStore((s) => s.progress)
  const bookmarks = useLearningStore((s) => s.bookmarks)
  const cards = useLearningStore((s) => s.cards)
  const decks = useLearningStore((s) => s.decks)
  const tasks = useLearningStore((s) => s.tasks)
  const sessions = useLearningStore((s) => s.sessions)
  const addTask = useLearningStore((s) => s.addTask)
  const toggleBookmark = useLearningStore((s) => s.toggleBookmark)
  const setProgress = useLearningStore((s) => s.setProgress)

  const results = useMyResults()

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [openResource, setOpenResource] = useState<LearningResource | null>(null)
  const [cardDialogFor, setCardDialogFor] = useState<LearningResource | null>(null)

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const due = useMemo(() => dueCards(cards, null, today), [cards, today])
  const allStats = useMemo(() => deckStats(cards, null, today), [cards, today])
  const cont = useMemo(() => continueLearning(resources, progress), [resources, progress])
  const recent = useMemo(() => recentlyStudied(resources, progress, 4), [resources, progress])
  const streak = useMemo(() => streakOf(sessions), [sessions])
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.date === today && (t.status === 'todo' || t.status === 'in_progress')),
    [tasks, today],
  )
  const plannedMin = todayTasks.reduce((sum, t) => sum + t.durationMin, 0)

  /* Weak subjects — from the student's REAL latest published result (§28/§44). */
  const weakSubjects = useMemo(() => {
    const latest = results.latest
    if (!latest) return [] as { subject: string; pct: number }[]
    return latest.result.subjects
      .map((s) => ({ subject: s.subject, pct: pctOf(s.obtained, s.maxMarks) }))
      .filter((s) => s.pct < 85)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 2)
  }, [results.latest])

  /* Subject rows — mastery derived from REAL card buckets + completed resources. */
  const subjects = useMemo(() => {
    const names = [...new Set(resources.map((r) => r.subject))]
    return names.map((subject) => {
      const subjectDeckIds = new Set(decks.filter((d) => d.subject === subject).map((d) => d.id))
      const subjectCards = cards.filter((c) => subjectDeckIds.has(c.deckId))
      const mastered = subjectCards.filter((c) => c.intervalDays >= 21 && c.reps > 0).length
      const subjectResources = resources.filter((r) => r.subject === subject)
      const completed = subjectResources.filter((r) => progress[r.id]?.completedAt).length
      const total = subjectCards.length + subjectResources.length
      const dueHere = subjectCards.filter((c) => c.due <= today).length
      const weak = weakSubjects.find((w) => w.subject === subject)
      return {
        subject,
        mastery: total > 0 ? Math.round(((mastered + completed) / total) * 100) : 0,
        due: dueHere,
        completed,
        resources: subjectResources.length,
        cards: subjectCards.length,
        weak,
      }
    }).sort((a, b) => (b.weak ? 0 : 1) - (a.weak ? 0 : 1) || b.mastery - a.mastery)
  }, [resources, decks, cards, progress, today, weakSubjects])

  /* Recommended — derived ONLY from real signals (§14, never fabricated). */
  const recommended = useMemo(() => {
    const items: { resource: LearningResource; reason: string }[] = []
    // 1. Weak subjects from results → unfinished resources in that subject
    for (const w of weakSubjects) {
      const pick = resources.find(
        (r) => r.subject === w.subject && !progress[r.id]?.completedAt && r.type !== 'deck',
      )
      if (pick) {
        items.push({ resource: pick, reason: `${w.subject} — ${Math.round(w.pct)}% in your latest result` })
      }
    }
    // 2. Unfinished started resources
    for (const [id, p] of Object.entries(progress)) {
      if (items.length >= 5) break
      if (p.pct > 0 && p.pct < 100) {
        const r = resources.find((x) => x.id === id)
        if (r && !items.some((i) => i.resource.id === r.id)) {
          items.push({ resource: r, reason: `Unfinished — ${p.pct}% done` })
        }
      }
    }
    // 3. Bookmarked, not started
    for (const id of bookmarks) {
      if (items.length >= 5) break
      const r = resources.find((x) => x.id === id)
      if (r && !progress[id]?.pct && !items.some((i) => i.resource.id === r.id)) {
        items.push({ resource: r, reason: 'Saved for later' })
      }
    }
    return items.slice(0, 4)
  }, [resources, progress, bookmarks, weakSubjects])

  const addResourceToPlan = (r: LearningResource) => {
    addTask({
      title: r.type === 'quiz' ? `Quiz — ${r.title}` : `Study — ${r.title}`,
      subject: r.subject,
      topic: r.topic,
      type: r.type === 'quiz' ? 'quiz' : r.type === 'deck' ? 'revision' : 'reading',
      date: today,
      durationMin: r.durationMin ?? (r.questions?.length ? 10 : 15),
      resourceId: r.id,
      deckId: r.deckId,
    })
    toast.success('Added to today\u2019s plan', { description: r.title })
  }

  const reviseWeak = (subject: string, pct: number) => {
    addTask({
      title: `Revise ${subject}`,
      subject,
      type: 'revision',
      date: today,
      durationMin: 25,
      priority: 'high',
    })
    toast.success('Revision added to today\u2019s plan', { description: `${subject} — ${Math.round(pct)}% in your latest result` })
  }

  /* ── Subject drill-down (§9) — dialogs must render here too, else they
     never mount while a subject is open. ── */
  if (selectedSubject) {
    return (
      <>
        <SubjectView
          subject={selectedSubject}
          onBack={() => setSelectedSubject(null)}
          onOpenResource={setOpenResource}
          onAddToPlanner={addResourceToPlan}
          onReviewDeck={onReviewDeck}
        />
        <ResourceDetail
          resource={openResource}
          onClose={() => setOpenResource(null)}
          onAddToPlanner={addResourceToPlan}
          onCreateFlashcard={setCardDialogFor}
          onReviewDeck={onReviewDeck}
          onNavigate={onNavigate}
        />
        <CreateCardDialog
          open={!!cardDialogFor}
          onClose={() => setCardDialogFor(null)}
          prefill={cardDialogFor ? {
            subject: cardDialogFor.subject,
            topic: cardDialogFor.topic,
            resourceId: cardDialogFor.id,
            deckId: cardDialogFor.deckId,
          } : undefined}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── 1 + 2 · Continue learning + Today's focus ─────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        {cont ? (
          <GlassCard hover={false} className="on-card overflow-hidden p-0">
            <div className="border-b border-border/60 bg-amber-500/[0.04] px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Continue where you left off</p>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              {(() => {
                const tt = typeToken(cont.resource.type)
                const TypeIcon = tt.icon
                const sc = subjectColor(cont.resource.subject)
                return (
                  <>
                    <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border', tt.tile)} aria-hidden>
                      <TypeIcon className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold tracking-tight text-foreground">{cont.resource.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} aria-hidden />
                        {cont.resource.subject} · {cont.resource.topic} · {resourceMeta(cont.resource)}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2.5">
                        <ProgressBar pct={cont.pct} className="max-w-44" />
                        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{cont.pct}%</span>
                      </div>
                    </div>
                    <Button className="shrink-0 gap-1.5" onClick={() => setOpenResource(cont.resource)}>
                      <Play className="h-4 w-4" aria-hidden /> Continue
                    </Button>
                  </>
                )
              })()}
            </div>
          </GlassCard>
        ) : (
          <GlassCard hover={false} className="on-card flex flex-col items-start justify-center gap-2 p-5">
            <p className="text-sm font-semibold">Nothing in progress</p>
            <p className="text-xs text-muted-foreground">Pick something from Recommended below to begin.</p>
          </GlassCard>
        )}

        <GlassCard hover={false} className="on-card flex flex-col p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Today&apos;s focus</p>
          <div className="mt-2.5 flex items-end gap-5">
            <div>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                {todayTasks.length}<span className="ml-1 text-sm font-semibold text-muted-foreground">planned</span>
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden /> {fmtMin(plannedMin)} · {due.length} cards due
              </p>
            </div>
            {streak > 0 && (
              <div className="ml-auto flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2.5 py-1">
                <Flame className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">{streak}-day streak</span>
              </div>
            )}
          </div>
          <div className="mt-auto flex gap-2 pt-4">
            <Button size="sm" className="gap-1.5" onClick={() => onSection('planner')}>
              <CalendarRange className="h-3.5 w-3.5" aria-hidden /> Start studying
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onSection('flashcards')} disabled={due.length === 0}>
              <Layers className="h-3.5 w-3.5" aria-hidden /> Review {due.length > 0 ? due.length : ''} cards
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* ── Weak-subject revision engine (§28 — real Results data) ────── */}
      {weakSubjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/[0.05] px-4 py-3">
          <TrendingUp className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
          <p className="min-w-0 flex-1 text-xs text-foreground/80">
            <span className="font-semibold">{weakSubjects[0].subject}</span> scored {Math.round(weakSubjects[0].pct)}% in your latest result — a short revision today helps.
          </p>
          <Button size="sm" variant="outline" className="h-7 gap-1 border-rose-500/30 text-rose-600 hover:bg-rose-500/10" onClick={() => reviseWeak(weakSubjects[0].subject, weakSubjects[0].pct)}>
            Add revision <ChevronRight className="h-3 w-3" aria-hidden />
          </Button>
        </div>
      )}

      {/* ── 3 · Subjects (§9 entry points) ────────────────────────────── */}
      <section aria-label="Your subjects">
        <SectionLabel hint={`${subjects.length} subjects`}>Subjects</SectionLabel>
        <div className="mt-2 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const sc = subjectColor(s.subject)
            return (
              <button
                key={s.subject}
                type="button"
                onClick={() => setSelectedSubject(s.subject)}
                className="group flex flex-col rounded-xl border border-border bg-card/60 p-3.5 text-left transition-all hover:border-primary/30 hover:shadow-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ring-1', sc.bg, sc.text, sc.ring)} aria-hidden>
                    {s.subject.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{s.subject}</p>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <ProgressBar pct={s.mastery} className="flex-1" />
                  <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">{s.mastery}%</span>
                </div>
                <p className="mt-1.5 truncate text-[10px] text-muted-foreground/80">
                  {s.weak ? 'Needs attention · ' : ''}
                  {s.due > 0 ? `${s.due} cards due · ` : ''}
                  {s.completed}/{s.resources} done
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 4 · Recommended (§14 — derived, reasons included) ─────────── */}
      <section aria-label="Recommended for you">
        <SectionLabel hint="from your results & activity">Recommended</SectionLabel>
        <div className="mt-2 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
          {recommended.map(({ resource, reason }) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              progress={progress[resource.id]}
              bookmarked={bookmarks.includes(resource.id)}
              onOpen={setOpenResource}
              onToggleBookmark={toggleBookmark}
              onAddToPlanner={addResourceToPlan}
              onCreateFlashcard={setCardDialogFor}
              onMarkComplete={(r) => setProgress(r.id, 100)}
              reason={reason}
            />
          ))}
        </div>
      </section>

      {/* ── 5 · Recently studied + Saved ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section aria-label="Recently studied">
          <SectionLabel>Recently studied</SectionLabel>
          <div className="mt-2 divide-y divide-border/60 rounded-xl border border-border/60 bg-card/40">
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">Nothing yet — your activity will appear here.</p>
            ) : (
              recent.map(({ resource, pct }) => {
                const sc = subjectColor(resource.subject)
                return (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => setOpenResource(resource)}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', sc.dot)} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground/85">{resource.title}</span>
                    <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
                      {pct >= 100 ? 'Completed' : `${pct}%`}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </section>

        <section aria-label="Saved resources">
          <SectionLabel hint={`${bookmarks.length} saved`}>Saved</SectionLabel>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {bookmarks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground sm:col-span-2">
                Nothing saved yet — bookmark resources to find them quickly.
              </p>
            ) : (
              bookmarks.slice(0, 4).map((id) => {
                const r = resources.find((x) => x.id === id)
                if (!r) return null
                const sc = subjectColor(r.subject)
                const tt = typeToken(r.type)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setOpenResource(r)}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-card/50 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <tt.icon className={cn('h-4 w-4 shrink-0', tt.text)} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">{r.title}</span>
                      <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                        <span className={cn('h-1 w-1 rounded-full', sc.dot)} aria-hidden /> {r.subject}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </section>
      </div>

      {/* ── Shared dialogs ── */}
      <ResourceDetail
        resource={openResource}
        onClose={() => setOpenResource(null)}
        onAddToPlanner={addResourceToPlan}
        onCreateFlashcard={setCardDialogFor}
        onReviewDeck={onReviewDeck}
        onNavigate={onNavigate}
      />
      <CreateCardDialog
        open={!!cardDialogFor}
        onClose={() => setCardDialogFor(null)}
        prefill={cardDialogFor ? {
          subject: cardDialogFor.subject,
          topic: cardDialogFor.topic,
          resourceId: cardDialogFor.id,
          deckId: cardDialogFor.deckId,
        } : undefined}
      />
    </div>
  )
}
