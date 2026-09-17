/**
 * learning-types — the Learning OS domain model (§48/§76).
 *
 * Ownership is explicit on every record:
 *   · SCHOOL content  — resources, school decks, groups, seeded Q&A (the
 *     school published them; a teacher can evolve them later §75)
 *   · STUDENT content — progress, bookmarks, notes, custom decks/cards,
 *     review history, tasks, goals, sessions, posted questions, reports
 *
 * All dates are local-timezone YYYY-MM-DD (or full ISO for timestamps),
 * matching the attendance/results conventions.
 */

import type { ReviewGrade, Sm2State } from '@/lib/learning/sm2'

/* ─── Resources ────────────────────────────────────────────────────── */

export type ResourceType = 'video' | 'pdf' | 'notes' | 'worksheet' | 'quiz' | 'interactive' | 'deck'
export type Difficulty = 'beginner' | 'core' | 'challenge'

export interface QuizQuestion {
  id: string
  question: string
  options: [string, string, string, string] | string[]
  answer: string // 'A' | 'B' | 'C' | 'D'
}

export interface LearningResource {
  id: string
  title: string
  subject: string
  topic: string
  type: ResourceType
  difficulty: Difficulty
  /** One honest line — never a paragraph (§12). */
  description: string
  /** Video/interactive length. */
  durationMin?: number
  /** PDF/notes/worksheet length. */
  pages?: number
  /** Quiz question bank — the quiz is genuinely playable. */
  questions?: QuizQuestion[]
  /** deck-type resources link to a school deck. */
  deckId?: string
  /** Teacher display name (school source, §47). */
  uploadedBy: string
  uploadedOn: string
  /** School-community stats (seeded; honest catalogue metadata). */
  rating?: number
}

export interface ResourceProgress {
  /** 0–100. */
  pct: number
  lastStudiedAt: string
  completedAt?: string
  /** Set when the student finishes a quiz-type resource. */
  quizScore?: { correct: number; total: number; on: string }
}

/* ─── Notes (§20 — a real personal notes system) ──────────────────── */

export interface LearningNote {
  id: string
  title: string
  body: string
  subject: string
  topic?: string
  pinned: boolean
  archived: boolean
  tags: string[]
  linkedResourceId?: string
  linkedDeckId?: string
  createdAt: string
  updatedAt: string
}

/* ─── Flashcards (§15–§19) ─────────────────────────────────────────── */

export interface Deck {
  id: string
  name: string
  subject: string
  topic?: string
  description?: string
  source: 'school' | 'student'
}

export interface Flashcard extends Sm2State {
  id: string
  deckId: string
  front: string
  back: string
  hint?: string
  source: 'school' | 'student'
  /** Resource the card was created from (§71 resource → flashcard). */
  resourceId?: string
  createdAt: string
  lastReviewedAt?: string
}

export interface ReviewLog {
  id: string
  cardId: string
  deckId: string
  grade: ReviewGrade
  reviewedAt: string
  intervalBefore: number
  intervalAfter: number
}

/* ─── Planner (§21–§33) ────────────────────────────────────────────── */

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped'
export type TaskType = 'reading' | 'practice' | 'revision' | 'quiz' | 'notes' | 'other'
export type Priority = 'low' | 'normal' | 'high'

export interface StudyTask {
  id: string
  title: string
  subject: string
  topic?: string
  type: TaskType
  /** Planned day (YYYY-MM-DD). */
  date: string
  startTime?: string // 'HH:MM'
  durationMin: number
  priority: Priority
  notes?: string
  tags: string[]
  status: TaskStatus
  /** Interconnection (§71): task ← resource / goal / session. */
  resourceId?: string
  deckId?: string
  goalId?: string
  createdAt: string
  completedAt?: string
}

export type GoalKind = 'time' | 'tasks' | 'resources' | 'cards'
export type GoalUnit = 'minutes' | 'tasks' | 'resources' | 'cards'

export interface StudyGoal {
  id: string
  title: string
  kind: GoalKind
  target: number
  unit: GoalUnit
  scope: 'week' | 'term' | 'custom'
  subject?: string
  deadline?: string
  createdAt: string
  archived: boolean
}

export type FocusMode = 'focus25' | 'focus45' | 'focus60' | 'custom'

export interface StudySession {
  id: string
  subject: string
  topic?: string
  taskId?: string
  goalId?: string
  startedAt: string
  endedAt: string
  durationMin: number
  mode: 'focus' | 'review' | 'quiz' | 'reading'
  focusMode?: FocusMode
  completed: boolean
}

/* ─── Study Groups / Q&A / Shared (§36–§41) ────────────────────────── */

export interface StudyGroup {
  id: string
  name: string
  subject: string
  topic?: string
  description: string
  rules: string[]
  visibility: 'class' | 'school'
  createdBy: string
  createdAt: string
  /** Display names (roster-backed for the demo tenant). */
  members: string[]
  /** The demo student's membership (student-owned state). */
  joined: boolean
  nextSessionAt?: string
}

export interface QaAnswer {
  id: string
  body: string
  by: string
  byRole: 'student' | 'teacher'
  at: string
  helpful: number
  accepted?: boolean
  reported?: boolean
}

export interface QaQuestion {
  id: string
  groupId?: string
  title: string
  body: string
  subject: string
  topic?: string
  askedBy: string
  askedAt: string
  helpful: number
  locked?: boolean
  reported?: boolean
  answers: QaAnswer[]
}

export interface SharedResourceItem {
  id: string
  resourceId?: string
  title: string
  sharedBy: string
  sharedAt: string
  groupId?: string
  note?: string
  saves: number
}

/** Moderation queue entries (§40 — students report, staff review). */
export interface ModerationReport {
  id: string
  kind: 'question' | 'answer' | 'group' | 'share'
  targetId: string
  by: string
  at: string
  reason: string
}
