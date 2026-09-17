'use client'

/**
 * learning-store — the canonical Learning OS data layer.
 *
 * ONE persisted, tenant-scoped store owning every learning record for the
 * student workspace (§3 "one connected ecosystem"):
 *
 *   school resources + student progress/bookmarks → the Hub
 *   decks + cards (SM-2 state) + review logs     → Flashcards
 *   tasks + goals + sessions + daily goal        → Study Planner / Focus
 *   groups + Q&A + shares + moderation reports   → Study Groups
 *
 * Every number on screen derives from THIS store (§61 — no fake stats).
 * Seeds are legitimate demo-tenant data (learning-seed.ts) derived from the
 * real clock, then they age like real personal data.
 *
 * SM-2 scheduling is delegated to the pure engine (lib/learning/sm2.ts) —
 * the store only applies it (§17 "algorithm abstracted").
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'
import { scheduleReview, isDue, bucketOf, newCardState, type ReviewGrade } from '@/lib/learning/sm2'
import {
  SCHOOL_RESOURCES, SCHOOL_DECKS, SEEDED_PROGRESS, SEEDED_BOOKMARKS, SEEDED_NOTES,
  SEEDED_TASKS, SEEDED_GOALS, SEEDED_SESSIONS, SEEDED_GROUPS, SEEDED_QUESTIONS,
  SEEDED_SHARES, buildSeededCards, buildSeededReviewLogs, DAILY_GOAL_MIN_SEED, isoToday,
} from './learning-seed'
import type {
  LearningResource, ResourceProgress, LearningNote, Flashcard, Deck, ReviewLog,
  StudyTask, StudyGoal, StudySession, StudyGroup, QaQuestion, QaAnswer,
  SharedResourceItem, ModerationReport, TaskStatus,
} from './learning-types'

const STORE_BASE = 'scholario-learning-store-v1'

function today(): string {
  return isoToday()
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0')}`
}

/* ─── Seed factory (fresh boot per tenant) ─────────────────────────── */

function buildSeed() {
  const cards = buildSeededCards()
  return {
    resources: SCHOOL_RESOURCES,
    progress: SEEDED_PROGRESS,
    bookmarks: [...SEEDED_BOOKMARKS],
    notes: [...SEEDED_NOTES],
    decks: [...SCHOOL_DECKS],
    cards,
    reviewLogs: buildSeededReviewLogs(cards),
    tasks: [...SEEDED_TASKS],
    goals: [...SEEDED_GOALS],
    sessions: [...SEEDED_SESSIONS],
    groups: [...SEEDED_GROUPS],
    questions: [...SEEDED_QUESTIONS],
    shares: [...SEEDED_SHARES],
    reports: [] as ModerationReport[],
    dailyGoalMin: DAILY_GOAL_MIN_SEED,
  }
}

/* ─── Store ────────────────────────────────────────────────────────── */

interface LearningStoreState {
  resources: LearningResource[]
  progress: Record<string, ResourceProgress>
  bookmarks: string[]
  notes: LearningNote[]
  decks: Deck[]
  cards: Flashcard[]
  reviewLogs: ReviewLog[]
  tasks: StudyTask[]
  goals: StudyGoal[]
  sessions: StudySession[]
  groups: StudyGroup[]
  questions: QaQuestion[]
  shares: SharedResourceItem[]
  reports: ModerationReport[]
  dailyGoalMin: number

  /* Resources */
  toggleBookmark: (resourceId: string) => void
  setProgress: (resourceId: string, pct: number) => void
  recordQuizResult: (resourceId: string, correct: number, total: number) => void

  /* Notes */
  upsertNote: (note: Partial<LearningNote> & { id?: string }) => string
  deleteNote: (id: string) => void
  toggleNotePin: (id: string) => void

  /* Flashcards */
  addDeck: (deck: { name: string; subject: string; topic?: string; description?: string }) => string
  addCard: (card: { deckId: string; front: string; back: string; hint?: string; subject: string; resourceId?: string }) => string
  deleteCard: (id: string) => void
  reviewCard: (cardId: string, grade: ReviewGrade) => void

  /* Planner */
  addTask: (task: Partial<StudyTask> & { title: string }) => string
  updateTask: (id: string, patch: Partial<StudyTask>) => void
  setTaskStatus: (id: string, status: TaskStatus) => void
  deleteTask: (id: string) => void
  addGoal: (goal: Partial<StudyGoal> & { title: string; kind: StudyGoal['kind']; target: number; unit: StudyGoal['unit'] }) => string
  archiveGoal: (id: string) => void
  setDailyGoalMin: (min: number) => void
  recordSession: (input: { subject: string; topic?: string; taskId?: string; durationMin: number; mode: StudySession['mode']; focusMode?: StudySession['focusMode']; startedAt?: string }) => void

  /* Groups / Q&A / Shares / moderation */
  joinGroup: (id: string) => void
  leaveGroup: (id: string) => void
  postQuestion: (q: { title: string; body: string; subject: string; topic?: string; groupId?: string }) => string
  postAnswer: (questionId: string, body: string) => void
  markHelpful: (kind: 'question' | 'answer', questionId: string, answerId?: string) => void
  shareResourceToGroup: (input: { resourceId: string; groupId?: string; note?: string }) => void
  saveSharedResource: (shareId: string) => void
  reportContent: (kind: ModerationReport['kind'], targetId: string, reason: string) => void

  /* Dev/QA */
  resetToSeed: () => void
}

export const useLearningStore = create<LearningStoreState>()(
  persist(
    (set, get) => ({
      ...buildSeed(),

      /* ── Resources ── */
      toggleBookmark: (resourceId) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(resourceId)
            ? s.bookmarks.filter((id) => id !== resourceId)
            : [...s.bookmarks, resourceId],
        })),

      setProgress: (resourceId, pct) =>
        set((s) => {
          const clamped = Math.max(0, Math.min(100, Math.round(pct)))
          const prev = s.progress[resourceId]
          return {
            progress: {
              ...s.progress,
              [resourceId]: {
                pct: clamped,
                lastStudiedAt: new Date().toISOString(),
                completedAt: clamped >= 100 ? (prev?.completedAt ?? today()) : undefined,
                quizScore: prev?.quizScore,
              },
            },
          }
        }),

      recordQuizResult: (resourceId, correct, total) =>
        set((s) => ({
          progress: {
            ...s.progress,
            [resourceId]: {
              pct: 100,
              lastStudiedAt: new Date().toISOString(),
              completedAt: today(),
              quizScore: { correct, total, on: today() },
            },
          },
        })),

      /* ── Notes ── */
      upsertNote: (note) => {
        const now = new Date().toISOString()
        const id = note.id ?? uid('NT')
        set((s) => {
          const existing = note.id ? s.notes.find((n) => n.id === note.id) : undefined
          const next: LearningNote = {
            id,
            title: note.title?.trim() || existing?.title || 'Untitled note',
            body: note.body ?? existing?.body ?? '',
            subject: note.subject ?? existing?.subject ?? 'General',
            topic: note.topic ?? existing?.topic,
            pinned: note.pinned ?? existing?.pinned ?? false,
            archived: note.archived ?? existing?.archived ?? false,
            tags: note.tags ?? existing?.tags ?? [],
            linkedResourceId: note.linkedResourceId ?? existing?.linkedResourceId,
            linkedDeckId: note.linkedDeckId ?? existing?.linkedDeckId,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          }
          return existing
            ? { notes: s.notes.map((n) => (n.id === id ? next : n)) }
            : { notes: [next, ...s.notes] }
        })
        return id
      },

      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      toggleNotePin: (id) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) })),

      /* ── Flashcards ── */
      addDeck: (deck) => {
        const id = uid('DK')
        set((s) => ({
          decks: [...s.decks, { id, source: 'student', ...deck }],
        }))
        return id
      },

      addCard: (card) => {
        const id = uid('FC')
        set((s) => ({
          cards: [
            ...s.cards,
            {
              id,
              deckId: card.deckId,
              front: card.front.trim(),
              back: card.back.trim(),
              hint: card.hint?.trim() || undefined,
              source: 'student',
              resourceId: card.resourceId,
              createdAt: new Date().toISOString(),
              ...newCardState(today()),
            },
          ],
        }))
        return id
      },

      deleteCard: (id) =>
        set((s) => ({ cards: s.cards.filter((c) => c.id !== id), reviewLogs: s.reviewLogs.filter((l) => l.cardId !== id) })),

      reviewCard: (cardId, grade) =>
        set((s) => {
          const card = s.cards.find((c) => c.id === cardId)
          if (!card) return s
          const t = today()
          const next = scheduleReview(card, grade, t)
          return {
            cards: s.cards.map((c) => (c.id === cardId ? { ...c, ...next, lastReviewedAt: new Date().toISOString() } : c)),
            reviewLogs: [
              { id: uid('RL'), cardId, deckId: card.deckId, grade, reviewedAt: new Date().toISOString(), intervalBefore: card.intervalDays, intervalAfter: next.intervalDays },
              ...s.reviewLogs,
            ].slice(0, 400),
          }
        }),

      /* ── Planner ── */
      addTask: (task) => {
        const id = uid('TK')
        set((s) => ({
          tasks: [
            {
              id,
              title: task.title.trim(),
              subject: task.subject ?? 'General',
              topic: task.topic,
              type: task.type ?? 'other',
              date: task.date ?? today(),
              startTime: task.startTime,
              durationMin: task.durationMin ?? 20,
              priority: task.priority ?? 'normal',
              notes: task.notes,
              tags: task.tags ?? [],
              status: 'todo',
              resourceId: task.resourceId,
              deckId: task.deckId,
              goalId: task.goalId,
              createdAt: new Date().toISOString(),
            },
            ...s.tasks,
          ],
        }))
        return id
      },

      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      setTaskStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : undefined }
              : t,
          ),
        })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addGoal: (goal) => {
        const id = uid('GL')
        set((s) => ({
          goals: [
            {
              id,
              title: goal.title.trim(),
              kind: goal.kind,
              target: goal.target,
              unit: goal.unit,
              scope: goal.scope ?? 'term',
              subject: goal.subject,
              deadline: goal.deadline,
              createdAt: new Date().toISOString(),
              archived: false,
            },
            ...s.goals,
          ],
        }))
        return id
      },

      archiveGoal: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, archived: true } : g)) })),

      setDailyGoalMin: (min) => set({ dailyGoalMin: Math.max(10, Math.min(300, min)) }),

      recordSession: (input) => {
        const now = new Date()
        const startedAt = input.startedAt ?? new Date(now.getTime() - input.durationMin * 60_000).toISOString()
        set((s) => ({
          sessions: [
            ...s.sessions,
            {
              id: uid('SS'),
              subject: input.subject,
              topic: input.topic,
              taskId: input.taskId,
              durationMin: Math.max(1, Math.round(input.durationMin)),
              startedAt,
              endedAt: now.toISOString(),
              mode: input.mode,
              focusMode: input.focusMode,
              completed: input.durationMin > 0,
            },
          ],
        }))
      },

      /* ── Groups / Q&A / Shares ── */
      joinGroup: (id) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === id && !g.joined ? { ...g, joined: true, members: [...g.members, 'Aarav Sharma'] } : g,
          ),
        })),

      leaveGroup: (id) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === id && g.joined ? { ...g, joined: false, members: g.members.filter((m) => m !== 'Aarav Sharma') } : g,
          ),
        })),

      postQuestion: (q) => {
        const id = uid('QA')
        set((s) => ({
          questions: [
            {
              id,
              title: q.title.trim(),
              body: q.body.trim(),
              subject: q.subject,
              topic: q.topic,
              groupId: q.groupId,
              askedBy: 'Aarav Sharma',
              askedAt: new Date().toISOString(),
              helpful: 0,
              answers: [],
            },
            ...s.questions,
          ],
        }))
        return id
      },

      postAnswer: (questionId, body) =>
        set((s) => ({
          questions: s.questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answers: [
                    ...q.answers,
                    { id: uid('QAA'), body: body.trim(), by: 'Aarav Sharma', byRole: 'student' as const, at: new Date().toISOString(), helpful: 0 },
                  ],
                }
              : q,
          ),
        })),

      markHelpful: (kind, questionId, answerId) =>
        set((s) => ({
          questions: s.questions.map((q) => {
            if (q.id !== questionId) return q
            if (kind === 'question') return { ...q, helpful: q.helpful + 1 }
            return { ...q, answers: q.answers.map((a) => (a.id === answerId ? { ...a, helpful: a.helpful + 1 } : a)) }
          }),
        })),

      shareResourceToGroup: (input) => {
        const resource = get().resources.find((r) => r.id === input.resourceId)
        if (!resource) return
        set((s) => ({
          shares: [
            {
              id: uid('SHR'),
              resourceId: resource.id,
              title: resource.title,
              sharedBy: 'Aarav Sharma',
              sharedAt: new Date().toISOString(),
              groupId: input.groupId,
              note: input.note?.trim() || undefined,
              saves: 0,
            },
            ...s.shares,
          ],
        }))
      },

      saveSharedResource: (shareId) =>
        set((s) => {
          const share = s.shares.find((x) => x.id === shareId)
          if (!share?.resourceId || s.bookmarks.includes(share.resourceId)) return {}
          return {
            shares: s.shares.map((x) => (x.id === shareId ? { ...x, saves: x.saves + 1 } : x)),
            bookmarks: [...s.bookmarks, share.resourceId],
          }
        }),

      reportContent: (kind, targetId, reason) =>
        set((s) => ({
          reports: [
            { id: uid('REP'), kind, targetId, by: 'Aarav Sharma', at: new Date().toISOString(), reason },
            ...s.reports,
          ],
          ...(kind === 'question'
            ? { questions: s.questions.map((q) => (q.id === targetId ? { ...q, reported: true } : q)) }
            : {}),
          ...(kind === 'answer'
            ? {
                questions: s.questions.map((q) => ({
                  ...q,
                  answers: q.answers.map((a) => (a.id === targetId ? { ...a, reported: true } : a)),
                })),
              }
            : {}),
        })),

      resetToSeed: () => set(buildSeed()),
    }),
    {
      name: STORE_BASE,
      storage: createTenantScopedStorage(STORE_BASE),
      version: 1,
    },
  ),
)

/* ═══ DERIVED SELECTORS — pure, from store state only (§61) ═════════ */

export type CardBucketStats = { total: number; due: number; new: number; learning: number; mastered: number }

export function deckStats(cards: Flashcard[], deckId: string | null, todayIso: string): CardBucketStats {
  const inDeck = deckId ? cards.filter((c) => c.deckId === deckId) : cards
  const stats: CardBucketStats = { total: inDeck.length, due: 0, new: 0, learning: 0, mastered: 0 }
  for (const c of inDeck) {
    const b = bucketOf(c)
    if (b === 'new') stats.new++
    else if (b === 'mastered') stats.mastered++
    else stats.learning++
    if (isDue(c, todayIso)) stats.due++
  }
  return stats
}

/** Cards due in a deck (or everywhere), ordered: learning-first, then new. */
export function dueCards(cards: Flashcard[], deckId: string | null, todayIso: string): Flashcard[] {
  return cards
    .filter((c) => (!deckId || c.deckId === deckId) && isDue(c, todayIso))
    .sort((a, b) => (b.reps > 0 ? 1 : 0) - (a.reps > 0 ? 1 : 0))
}

/** Current study streak: consecutive days (ending today or yesterday) with ≥1
 *  qualifying session. A day counts ONLY when a session was completed on it
 *  (§35 — opening the page never counts). */
export function streakOf(sessions: StudySession[]): number {
  const days = new Set(
    sessions.filter((s) => s.completed && s.durationMin > 0).map((s) => s.startedAt.slice(0, 10)),
  )
  if (days.size === 0) return 0
  const cursor = new Date()
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  // Streak may end today (already studied) or yesterday (not yet today).
  if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  for (let guard = 0; guard < 400; guard++) {
    if (!days.has(iso(cursor))) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function minutesOn(sessions: StudySession[], dateIso: string): number {
  return sessions.filter((s) => s.startedAt.slice(0, 10) === dateIso && s.completed).reduce((sum, s) => sum + s.durationMin, 0)
}

export function minutesSinceMonday(sessions: StudySession[]): number {
  const now = new Date()
  const monday = new Date(now)
  const dow = (now.getDay() + 6) % 7 // Mon=0
  monday.setDate(now.getDate() - dow)
  const mondayIso = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  return sessions.filter((s) => s.completed && s.startedAt.slice(0, 10) >= mondayIso).reduce((sum, s) => sum + s.durationMin, 0)
}

/** Subject study minutes for the analytics strip (all completed sessions). */
export function minutesBySubject(sessions: StudySession[]): { subject: string; minutes: number }[] {
  const map = new Map<string, number>()
  for (const s of sessions) {
    if (!s.completed) continue
    map.set(s.subject, (map.get(s.subject) ?? 0) + s.durationMin)
  }
  return [...map.entries()].map(([subject, minutes]) => ({ subject, minutes })).sort((a, b) => b.minutes - a.minutes)
}

/** Goal progress — derived live from its OWN metric family. */
export function goalProgress(goal: StudyGoal, ctx: {
  sessions: StudySession[]
  cards: Flashcard[]
  decks: Deck[]
  tasks: StudyTask[]
  resources: LearningResource[]
  progress: Record<string, ResourceProgress>
}): number {
  switch (goal.kind) {
    case 'time': {
      const inScope = ctx.sessions.filter((s) => !goal.subject || s.subject === goal.subject)
      return goal.scope === 'week'
        ? minutesSinceMonday(inScope)
        : inScope.filter((s) => s.completed).reduce((sum, s) => sum + s.durationMin, 0)
    }
    case 'cards': {
      const subjectDecks = new Set(
        goal.subject ? ctx.decks.filter((d) => d.subject === goal.subject).map((d) => d.id) : ctx.decks.map((d) => d.id),
      )
      return ctx.cards.filter((c) => subjectDecks.has(c.deckId) && bucketOf(c) === 'mastered').length
    }
    case 'tasks':
      return ctx.tasks.filter((t) => t.status === 'done' && (!goal.subject || t.subject === goal.subject)).length
    case 'resources': {
      const subjectResources = new Set(
        goal.subject ? ctx.resources.filter((r) => r.subject === goal.subject).map((r) => r.id) : ctx.resources.map((r) => r.id),
      )
      return Object.entries(ctx.progress).filter(([id, p]) => p.completedAt && subjectResources.has(id)).length
    }
    default:
      return 0
  }
}

/** Tasks due today that are not yet finished. */
export function openTasksToday(tasks: StudyTask[], todayIso: string): StudyTask[] {
  return tasks.filter((t) => t.date === todayIso && (t.status === 'todo' || t.status === 'in_progress'))
}

/** Continue-learning: the most recently touched unfinished resource. */
export function continueLearning(
  resources: LearningResource[],
  progress: Record<string, ResourceProgress>,
): { resource: LearningResource; pct: number } | null {
  let best: { resource: LearningResource; pct: number; at: string } | null = null
  for (const r of resources) {
    const p = progress[r.id]
    if (!p || p.pct >= 100 || p.pct <= 0) continue
    if (!best || p.lastStudiedAt > best.at) best = { resource: r, pct: p.pct, at: p.lastStudiedAt }
  }
  return best ? { resource: best.resource, pct: best.pct } : null
}

/** Recently studied resources (any state), newest first. */
export function recentlyStudied(
  resources: LearningResource[],
  progress: Record<string, ResourceProgress>,
  limit = 4,
): { resource: LearningResource; pct: number; at: string }[] {
  return resources
    .filter((r) => progress[r.id])
    .map((r) => ({ resource: r, pct: progress[r.id].pct, at: progress[r.id].lastStudiedAt }))
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, limit)
}
