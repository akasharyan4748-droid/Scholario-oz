'use client'

// ============================================================
// STUDENT LEARNING STORE — the canonical "Learning OS" data layer
// ------------------------------------------------------------
// One tenant-scoped persisted store backing the whole Learning
// module (Hub discovery, Flashcards + spaced repetition, Study
// Planner + Focus timer, Notes) AND the dashboard learning
// surfaces (Smart Up Next, study brief, streak).
//
// HONESTY RULES (spec §61 "NO FAKE STATISTICS"):
//   · Every count shown anywhere derives from THESE arrays —
//     resources.length, cards.length, sessions, tasks. No
//     invented "248 resources / 42 hours" totals.
//   · Progress/bookmarks/due-dates are real persisted state.
//   · Seed data is the demo tenant's legitimate data (like the
//     canonical 58-student roster) — anchored to TODAY so due
//     counts, streaks and "continue learning" are genuinely
//     derived, never hardcoded.
//   · Flashcard scheduling is a real SM-2-lite engine (interval,
//     ease, lapses) — next review dates are computed, not static.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'

// ─── Date helpers (local-time, stable YYYY-MM-DD keys) ────────────

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysFromNow(days: number, hour = 19, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function dateOnlyShift(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dateKeyOf(iso: string): string {
  return iso.slice(0, 10)
}

// ─── Types ────────────────────────────────────────────────────────

export type ResourceType = 'video' | 'pdf' | 'notes' | 'quiz' | 'worksheet'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface LearningResource {
  id: string
  title: string
  subject: string
  topic: string
  type: ResourceType
  difficulty: Difficulty
  /** Videos: length in minutes. */
  durationMin?: number
  /** PDFs / notes / worksheets. */
  pages?: number
  /** Quizzes. */
  questions?: number
  /** Publishing teacher (school-owned content). */
  source: string
  addedOn: string
}

export interface ResourceProgress {
  pct: number
  lastStudiedAt: string | null
}

export interface LearningDeck {
  id: string
  name: string
  subject: string
  description: string
}

export interface LearningCard {
  id: string
  deckId: string
  front: string
  back: string
  subject: string
  topic: string
  difficulty: Difficulty
  // ── SM-2-lite scheduling state ──
  interval: number // days
  ease: number // 1.3 – 2.5
  reviews: number
  lapses: number
  status: 'new' | 'learning' | 'reviewing' | 'mastered'
  lastReviewedAt: string | null
  /** ISO datetime; null only for never-studied new cards. */
  dueAt: string | null
  /** Student-created cards live in the custom deck. */
  custom: boolean
}

export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped'
export type TaskType = 'study' | 'revision' | 'practice' | 'reading' | 'project'

export interface PlannerTask {
  id: string
  title: string
  subject: string
  topic?: string
  type: TaskType
  priority: 'high' | 'medium' | 'low'
  dueDate: string // YYYY-MM-DD
  dueTime?: string
  durationMin: number
  status: TaskStatus
  /** Where the task came from — manual add, a resource, or a weak-area revision. */
  origin: 'manual' | 'resource' | 'revision'
  originRef?: string // resourceId | subject name
  createdAt: string
  completedAt?: string
}

export type GoalKind = 'weekly-minutes' | 'weekly-tasks' | 'deck-master' | 'subject-resources'

export interface StudyGoal {
  id: string
  title: string
  kind: GoalKind
  target: number
  /** For deck-master / subject-resources goals. */
  subject?: string
  createdOn: string
  archived: boolean
}

export interface StudySession {
  id: string
  subject: string
  topic?: string
  taskId?: string
  minutes: number
  endedAt: string // ISO datetime
  mode: 'focus-timer' | 'planner' | 'manual'
}

export interface StudentNote {
  id: string
  title: string
  content: string
  subject: string
  topic?: string
  tags: string[]
  pinned: boolean
  linkedResourceId?: string
  createdAt: string
  updatedAt: string
}

// ─── Seed (demo tenant's legitimate data) ─────────────────────────

const SEED_RESOURCES: LearningResource[] = [
  // Mathematics (6)
  { id: 'R01', title: 'Addition with Carrying — Explained', subject: 'Mathematics', topic: 'Addition', type: 'video', difficulty: 'easy', durationMin: 8, source: 'Rohan Mehta', addedOn: dateOnlyShift(-18) },
  { id: 'R07', title: 'Subtraction with Borrowing', subject: 'Mathematics', topic: 'Subtraction', type: 'video', difficulty: 'medium', durationMin: 8, source: 'Rohan Mehta', addedOn: dateOnlyShift(-15) },
  { id: 'R09', title: 'Numbers 1–100 — Number Line Activity', subject: 'Mathematics', topic: 'Number Line', type: 'worksheet', difficulty: 'easy', pages: 8, source: 'Rohan Mehta', addedOn: dateOnlyShift(-25) },
  { id: 'R13', title: 'Fractions — Like Parts', subject: 'Mathematics', topic: 'Fractions', type: 'video', difficulty: 'medium', durationMin: 12, source: 'Rohan Mehta', addedOn: dateOnlyShift(-6) },
  { id: 'R14', title: 'Fractions Practice Set', subject: 'Mathematics', topic: 'Fractions', type: 'quiz', difficulty: 'medium', questions: 10, source: 'Rohan Mehta', addedOn: dateOnlyShift(-5) },
  { id: 'R15', title: 'Place Value — Worksheet', subject: 'Mathematics', topic: 'Place Value', type: 'worksheet', difficulty: 'easy', pages: 4, source: 'Rohan Mehta', addedOn: dateOnlyShift(-22) },
  // English (5)
  { id: 'R02', title: 'The Thirsty Crow — Story Reading', subject: 'English', topic: 'Reading', type: 'video', difficulty: 'easy', durationMin: 6, source: 'Deepa Menon', addedOn: dateOnlyShift(-20) },
  { id: 'R12', title: 'English Grammar — Nouns Quiz', subject: 'English', topic: 'Nouns', type: 'quiz', difficulty: 'easy', questions: 10, source: 'Deepa Menon', addedOn: dateOnlyShift(-8) },
  { id: 'R16', title: 'Nouns — Types & Examples', subject: 'English', topic: 'Nouns', type: 'notes', difficulty: 'easy', pages: 3, source: 'Deepa Menon', addedOn: dateOnlyShift(-9) },
  { id: 'R17', title: 'Reading Comprehension — The Lion and the Mouse', subject: 'English', topic: 'Reading', type: 'pdf', difficulty: 'easy', pages: 2, source: 'Deepa Menon', addedOn: dateOnlyShift(-3) },
  { id: 'R18', title: 'Opposite Words — Practice Sheet', subject: 'English', topic: 'Vocabulary', type: 'worksheet', difficulty: 'easy', pages: 3, source: 'Deepa Menon', addedOn: dateOnlyShift(-12) },
  // Science (5)
  { id: 'R03', title: 'Living & Non-Living Things — Notes', subject: 'Science', topic: 'Living Things', type: 'notes', difficulty: 'easy', pages: 8, source: 'Kavita Joshi', addedOn: dateOnlyShift(-21) },
  { id: 'R10', title: 'Plants Around Us — Project Guide', subject: 'Science', topic: 'Plants', type: 'pdf', difficulty: 'medium', pages: 14, source: 'Kavita Joshi', addedOn: dateOnlyShift(-17) },
  { id: 'R19', title: 'Parts of a Plant — Diagram Practice', subject: 'Science', topic: 'Plants', type: 'worksheet', difficulty: 'easy', pages: 2, source: 'Kavita Joshi', addedOn: dateOnlyShift(-7) },
  { id: 'R20', title: 'Food We Eat — Healthy Habits', subject: 'Science', topic: 'Food', type: 'video', difficulty: 'easy', durationMin: 10, source: 'Kavita Joshi', addedOn: dateOnlyShift(-4) },
  { id: 'R21', title: 'Living Things — Check Your Understanding', subject: 'Science', topic: 'Living Things', type: 'quiz', difficulty: 'easy', questions: 8, source: 'Kavita Joshi', addedOn: dateOnlyShift(-2) },
  // Hindi (3)
  { id: 'R04', title: 'Hindi Varnamala Practice Sheet', subject: 'Hindi', topic: 'Varnamala', type: 'worksheet', difficulty: 'medium', pages: 12, source: 'Meera Krishnan', addedOn: dateOnlyShift(-16) },
  { id: 'R22', title: 'सेब की कहानी — Reading Practice', subject: 'Hindi', topic: 'Reading', type: 'video', difficulty: 'easy', durationMin: 5, source: 'Meera Krishnan', addedOn: dateOnlyShift(-11) },
  { id: 'R23', title: 'मात्रा Exercise — Worksheet', subject: 'Hindi', topic: 'Matras', type: 'worksheet', difficulty: 'medium', pages: 6, source: 'Meera Krishnan', addedOn: dateOnlyShift(-1) },
  // Computer Science (3)
  { id: 'R05', title: 'Parts of a Computer — Quiz', subject: 'Computer Science', topic: 'Hardware', type: 'quiz', difficulty: 'medium', questions: 10, source: 'Arjun Kapoor', addedOn: dateOnlyShift(-10) },
  { id: 'R24', title: 'Input & Output Devices — Notes', subject: 'Computer Science', topic: 'Hardware', type: 'notes', difficulty: 'easy', pages: 4, source: 'Arjun Kapoor', addedOn: dateOnlyShift(-14) },
  { id: 'R25', title: 'Using a Mouse & Keyboard — Practice', subject: 'Computer Science', topic: 'Basics', type: 'video', difficulty: 'easy', durationMin: 9, source: 'Arjun Kapoor', addedOn: dateOnlyShift(-13) },
  // Social Studies (2)
  { id: 'R08', title: 'Community Helpers — Notes', subject: 'Social Studies', topic: 'Community', type: 'notes', difficulty: 'easy', pages: 10, source: 'Vikram Singh', addedOn: dateOnlyShift(-19) },
  { id: 'R26', title: 'Our Country — Map Activity', subject: 'Social Studies', topic: 'Geography', type: 'worksheet', difficulty: 'medium', pages: 4, source: 'Vikram Singh', addedOn: dateOnlyShift(-24) },
]

const SEED_PROGRESS: Record<string, ResourceProgress> = {
  // In progress — "continue learning" candidates (lastStudied recent)
  R13: { pct: 72, lastStudiedAt: daysFromNow(0, 17, 40) },
  R01: { pct: 100, lastStudiedAt: daysFromNow(-2, 18, 5) },
  R14: { pct: 30, lastStudiedAt: daysFromNow(-1, 17, 20) },
  R17: { pct: 55, lastStudiedAt: daysFromNow(0, 16, 10) },
  R04: { pct: 40, lastStudiedAt: daysFromNow(-3, 19, 0) },
  // Completed
  R03: { pct: 100, lastStudiedAt: daysFromNow(-5, 18, 30) },
  R09: { pct: 100, lastStudiedAt: daysFromNow(-8, 17, 15) },
  R05: { pct: 100, lastStudiedAt: daysFromNow(-6, 16, 45) },
  R24: { pct: 100, lastStudiedAt: daysFromNow(-9, 18, 0) },
  R12: { pct: 100, lastStudiedAt: daysFromNow(-4, 17, 30) },
}

const SEED_BOOKMARKS = ['R13', 'R01', 'R05', 'R10', 'R17']

const SEED_DECKS: LearningDeck[] = [
  { id: 'D-math', name: 'Mathematics', subject: 'Mathematics', description: 'Addition, subtraction & number basics' },
  { id: 'D-eng', name: 'English', subject: 'English', description: 'Grammar & vocabulary' },
  { id: 'D-sci', name: 'Science', subject: 'Science', description: 'Plants & living things' },
  { id: 'D-hin', name: 'Hindi', subject: 'Hindi', description: 'Vocabulary & मात्रा' },
  { id: 'D-cs', name: 'Computer Science', subject: 'Computer Science', description: 'Parts of a computer' },
  { id: 'D-sst', name: 'Social Studies', subject: 'Social Studies', description: 'Our community & country' },
  { id: 'D-my', name: 'My Cards', subject: '', description: 'Cards you created yourself' },
]

const SEED_CARDS: LearningCard[] = [
  // Mathematics — due today
  { id: 'FC01', deckId: 'D-math', front: 'What is 7 + 8?', back: '15', subject: 'Mathematics', topic: 'Addition', difficulty: 'easy', interval: 1, ease: 2.3, reviews: 4, lapses: 0, status: 'reviewing', lastReviewedAt: daysFromNow(-1, 18, 0), dueAt: daysFromNow(0, 9, 0), custom: false },
  { id: 'FC03', deckId: 'D-math', front: 'What is 5 × 3?', back: '15', subject: 'Mathematics', topic: 'Multiplication', difficulty: 'medium', interval: 0, ease: 1.8, reviews: 2, lapses: 1, status: 'learning', lastReviewedAt: daysFromNow(0, 8, 0), dueAt: daysFromNow(0, 8, 30), custom: false },
  { id: 'FC15', deckId: 'D-math', front: 'What is 12 + 9?', back: '21', subject: 'Mathematics', topic: 'Addition', difficulty: 'easy', interval: 0, ease: 2.5, reviews: 0, lapses: 0, status: 'new', lastReviewedAt: null, dueAt: null, custom: false },
  { id: 'FC27', deckId: 'D-math', front: 'Which is greater: 34 or 43?', back: '43', subject: 'Mathematics', topic: 'Place Value', difficulty: 'easy', interval: 0, ease: 2.5, reviews: 0, lapses: 0, status: 'new', lastReviewedAt: null, dueAt: null, custom: false },
  // Mathematics — scheduled future
  { id: 'FC02', deckId: 'D-math', front: 'What is 14 - 6?', back: '8', subject: 'Mathematics', topic: 'Subtraction', difficulty: 'easy', interval: 7, ease: 2.5, reviews: 6, lapses: 0, status: 'mastered', lastReviewedAt: daysFromNow(-1, 17, 30), dueAt: daysFromNow(6, 9, 0), custom: false },
  { id: 'FC04', deckId: 'D-math', front: 'Spell the number: 45', back: 'Forty-Five', subject: 'Mathematics', topic: 'Number Names', difficulty: 'medium', interval: 5, ease: 2.4, reviews: 5, lapses: 0, status: 'reviewing', lastReviewedAt: daysFromNow(-2, 18, 0), dueAt: daysFromNow(3, 9, 0), custom: false },
  // Science — due today
  { id: 'FC05', deckId: 'D-sci', front: 'What do plants need to grow?', back: 'Sunlight, Water, Air, and Soil', subject: 'Science', topic: 'Plants', difficulty: 'easy', interval: 1, ease: 2.2, reviews: 3, lapses: 0, status: 'reviewing', lastReviewedAt: daysFromNow(-1, 16, 30), dueAt: daysFromNow(0, 10, 0), custom: false },
  { id: 'FC28', deckId: 'D-sci', front: 'Name two things a plant makes from sunlight', back: 'Food (glucose) and oxygen', subject: 'Science', topic: 'Plants', difficulty: 'medium', interval: 0, ease: 2.5, reviews: 0, lapses: 0, status: 'new', lastReviewedAt: null, dueAt: null, custom: false },
  // Science — future / mastered
  { id: 'FC06', deckId: 'D-sci', front: 'Name 3 living things', back: 'Examples: Dog, Tree, Human', subject: 'Science', topic: 'Living Things', difficulty: 'easy', interval: 12, ease: 2.5, reviews: 7, lapses: 0, status: 'mastered', lastReviewedAt: daysFromNow(-3, 17, 0), dueAt: daysFromNow(9, 9, 0), custom: false },
  // English — due today
  { id: 'FC09', deckId: 'D-eng', front: 'What is a noun?', back: 'A word that names a person, place, animal, or thing', subject: 'English', topic: 'Nouns', difficulty: 'medium', interval: 0, ease: 1.7, reviews: 2, lapses: 1, status: 'learning', lastReviewedAt: daysFromNow(0, 8, 15), dueAt: daysFromNow(0, 8, 45), custom: false },
  // English — future
  { id: 'FC07', deckId: 'D-eng', front: 'Opposite of "Hot"', back: 'Cold', subject: 'English', topic: 'Opposites', difficulty: 'easy', interval: 8, ease: 2.4, reviews: 5, lapses: 0, status: 'mastered', lastReviewedAt: daysFromNow(-2, 17, 45), dueAt: daysFromNow(6, 9, 0), custom: false },
  { id: 'FC08', deckId: 'D-eng', front: 'Past tense of "go"', back: 'Went', subject: 'English', topic: 'Grammar', difficulty: 'medium', interval: 3, ease: 2.0, reviews: 3, lapses: 0, status: 'reviewing', lastReviewedAt: daysFromNow(-1, 18, 20), dueAt: daysFromNow(2, 9, 0), custom: false },
  { id: 'FC29', deckId: 'D-eng', front: 'Plural of "box"', back: 'Boxes', subject: 'English', topic: 'Grammar', difficulty: 'easy', interval: 0, ease: 2.5, reviews: 0, lapses: 0, status: 'new', lastReviewedAt: null, dueAt: null, custom: false },
  // Hindi — due today
  { id: 'FC10', deckId: 'D-hin', front: 'हिंदी में "सेब" क्या है?', back: 'Apple (a fruit)', subject: 'Hindi', topic: 'Vocabulary', difficulty: 'easy', interval: 1, ease: 2.3, reviews: 4, lapses: 0, status: 'reviewing', lastReviewedAt: daysFromNow(-1, 19, 0), dueAt: daysFromNow(0, 11, 0), custom: false },
  // CS — due today (weakest deck → revision engine hook)
  { id: 'FC11', deckId: 'D-cs', front: 'What does CPU stand for?', back: 'Central Processing Unit — the "brain" of the computer', subject: 'Computer Science', topic: 'Hardware', difficulty: 'medium', interval: 0, ease: 1.6, reviews: 2, lapses: 2, status: 'learning', lastReviewedAt: daysFromNow(0, 7, 45), dueAt: daysFromNow(0, 12, 0), custom: false },
  { id: 'FC30', deckId: 'D-cs', front: 'Is a printer an input or output device?', back: 'Output — it shows what the computer made', subject: 'Computer Science', topic: 'Hardware', difficulty: 'medium', interval: 0, ease: 2.5, reviews: 0, lapses: 0, status: 'new', lastReviewedAt: null, dueAt: null, custom: false },
  // CS — future / mastered
  { id: 'FC12', deckId: 'D-cs', front: 'Name an input device', back: 'Keyboard, Mouse, Microphone, Scanner (any one)', subject: 'Computer Science', topic: 'Hardware', difficulty: 'easy', interval: 7, ease: 2.5, reviews: 6, lapses: 0, status: 'mastered', lastReviewedAt: daysFromNow(-2, 16, 20), dueAt: daysFromNow(5, 9, 0), custom: false },
  { id: 'FC16', deckId: 'D-cs', front: 'Name the 4 main parts of a computer', back: 'CPU, Monitor, Keyboard, Mouse', subject: 'Computer Science', topic: 'Hardware', difficulty: 'medium', interval: 0, ease: 2.5, reviews: 0, lapses: 0, status: 'new', lastReviewedAt: null, dueAt: null, custom: false },
  // SST — future
  { id: 'FC13', deckId: 'D-sst', front: 'Capital of India?', back: 'New Delhi', subject: 'Social Studies', topic: 'Geography', difficulty: 'easy', interval: 12, ease: 2.5, reviews: 8, lapses: 0, status: 'mastered', lastReviewedAt: daysFromNow(-4, 17, 10), dueAt: daysFromNow(8, 9, 0), custom: false },
  { id: 'FC14', deckId: 'D-sst', front: 'What is a community helper?', back: 'A person who helps people in the community (doctor, teacher, police, etc.)', subject: 'Social Studies', topic: 'Community', difficulty: 'medium', interval: 2, ease: 1.9, reviews: 3, lapses: 0, status: 'reviewing', lastReviewedAt: daysFromNow(-1, 17, 0), dueAt: daysFromNow(1, 9, 0), custom: false },
  // SST — new
  { id: 'FC31', deckId: 'D-sst', front: 'Which direction does the sun rise from?', back: 'The East', subject: 'Social Studies', topic: 'Directions', difficulty: 'easy', interval: 0, ease: 2.5, reviews: 0, lapses: 0, status: 'new', lastReviewedAt: null, dueAt: null, custom: false },
]

const SEED_TASKS: PlannerTask[] = [
  { id: 'ST01', title: 'Fractions — finish the practice quiz', subject: 'Mathematics', topic: 'Fractions', type: 'practice', priority: 'high', dueDate: dateOnlyShift(0), dueTime: '07:00 PM', durationMin: 25, status: 'in-progress', origin: 'resource', originRef: 'R14', createdAt: daysFromNow(-1, 9, 0) },
  { id: 'ST02', title: 'Reading — The Lion and the Mouse', subject: 'English', topic: 'Reading', type: 'reading', priority: 'medium', dueDate: dateOnlyShift(0), dueTime: '08:00 PM', durationMin: 20, status: 'not-started', origin: 'resource', originRef: 'R17', createdAt: daysFromNow(-1, 9, 0) },
  { id: 'ST03', title: 'Revise Input & Output Devices', subject: 'Computer Science', topic: 'Hardware', type: 'revision', priority: 'high', dueDate: dateOnlyShift(0), dueTime: '06:30 PM', durationMin: 15, status: 'not-started', origin: 'revision', originRef: 'Computer Science', createdAt: daysFromNow(0, 8, 0) },
  { id: 'ST04', title: 'Varnamala worksheet — 2 pages', subject: 'Hindi', topic: 'Varnamala', type: 'practice', priority: 'medium', dueDate: dateOnlyShift(1), dueTime: '06:00 PM', durationMin: 15, status: 'not-started', origin: 'resource', originRef: 'R04', createdAt: daysFromNow(0, 8, 0) },
  { id: 'ST05', title: 'Plants project — collect leaves', subject: 'Science', topic: 'Plants', type: 'project', priority: 'low', dueDate: dateOnlyShift(3), dueTime: '05:00 PM', durationMin: 40, status: 'not-started', origin: 'resource', originRef: 'R10', createdAt: daysFromNow(-2, 9, 0) },
  { id: 'ST06', title: 'Living Things — revision cards', subject: 'Science', topic: 'Living Things', type: 'revision', priority: 'medium', dueDate: dateOnlyShift(-1), dueTime: '07:30 PM', durationMin: 20, status: 'completed', origin: 'manual', createdAt: daysFromNow(-3, 9, 0), completedAt: daysFromNow(-1, 19, 30) },
  { id: 'ST07', title: 'Computer parts quiz', subject: 'Computer Science', topic: 'Hardware', type: 'practice', priority: 'medium', dueDate: dateOnlyShift(-2), dueTime: '08:30 PM', durationMin: 15, status: 'completed', origin: 'manual', createdAt: daysFromNow(-4, 9, 0), completedAt: daysFromNow(-2, 20, 10) },
  { id: 'ST08', title: 'Number line activity', subject: 'Mathematics', topic: 'Number Line', type: 'study', priority: 'low', dueDate: dateOnlyShift(-3), dueTime: '05:30 PM', durationMin: 20, status: 'completed', origin: 'manual', createdAt: daysFromNow(-5, 9, 0), completedAt: daysFromNow(-3, 18, 0) },
]

const SEED_GOALS: StudyGoal[] = [
  { id: 'G1', title: 'Study 4 hours this week', kind: 'weekly-minutes', target: 240, createdOn: dateOnlyShift(-9), archived: false },
  { id: 'G2', title: 'Finish 15 study tasks this week', kind: 'weekly-tasks', target: 15, createdOn: dateOnlyShift(-9), archived: false },
  { id: 'G3', title: 'Master every Computer Science card', kind: 'deck-master', subject: 'Computer Science', target: 100, createdOn: dateOnlyShift(-12), archived: false },
]

function sessionSeed(): StudySession[] {
  const out: StudySession[] = []
  // A realistic ~3 weeks: mostly daily study, two rest days, varied focus.
  const plan: Array<[daysAgo: number, entries: Array<[subject: string, topic: string, min: number]>]> = [
    [20, [['Mathematics', 'Addition', 25]]],
    [19, [['English', 'Reading', 20], ['Mathematics', 'Number Line', 15]]],
    [18, [['Science', 'Living Things', 30]]],
    [17, [['Mathematics', 'Subtraction', 20], ['Hindi', 'Varnamala', 15]]],
    [16, [['Computer Science', 'Hardware', 25]]],
    [14, [['English', 'Nouns', 20]]],
    [13, [['Mathematics', 'Fractions', 25], ['Science', 'Plants', 15]]],
    [12, [['Computer Science', 'Hardware', 20]]],
    [11, [['Hindi', 'Matras', 15], ['English', 'Reading', 20]]],
    [10, [['Mathematics', 'Fractions', 30]]],
    [9, [['Science', 'Plants', 20]]],
    [8, [['Mathematics', 'Fractions', 25], ['Computer Science', 'Hardware', 10]]],
    [7, [['English', 'Nouns', 15]]],
    [6, [['Mathematics', 'Addition', 20], ['Social Studies', 'Community', 10]]],
    [5, [['Science', 'Living Things', 25]]],
    [4, [['Mathematics', 'Fractions', 20], ['English', 'Grammar', 10]]],
    [3, [['Computer Science', 'Hardware', 15], ['Hindi', 'Varnamala', 10]]],
    [2, [['Mathematics', 'Fractions', 25]]],
    [1, [['English', 'Reading', 20], ['Mathematics', 'Fractions', 15]]],
    [0, [['Computer Science', 'Hardware', 15]]],
  ]
  let n = 0
  for (const [daysAgo, entries] of plan) {
    for (const [subject, topic, min] of entries) {
      n += 1
      out.push({
        id: `SS-${String(n).padStart(3, '0')}`,
        subject,
        topic,
        minutes: min,
        endedAt: daysFromNow(-daysAgo, 18, 30 + (n % 5) * 5),
        mode: n % 3 === 0 ? 'focus-timer' : 'planner',
      })
    }
  }
  return out
}

const SEED_NOTES: StudentNote[] = [
  {
    id: 'N1',
    title: 'Carrying in addition',
    content: 'When the ones column adds to 10 or more, write the ones digit and carry 1 to the tens.\n\nExample: 47 + 28 → 7+8=15, write 5 carry 1 → 4+2+1=7 → 75.',
    subject: 'Mathematics',
    topic: 'Addition',
    tags: ['maths', 'rule'],
    pinned: true,
    linkedResourceId: 'R01',
    createdAt: daysFromNow(-6, 17, 0),
    updatedAt: daysFromNow(-6, 17, 0),
  },
  {
    id: 'N2',
    title: 'Input vs output devices',
    content: 'Input = we give data TO the computer (keyboard, mouse, mic).\nOutput = the computer shows data to US (monitor, printer, speaker).\nCPU = the brain.',
    subject: 'Computer Science',
    topic: 'Hardware',
    tags: ['computers'],
    pinned: false,
    linkedResourceId: 'R24',
    createdAt: daysFromNow(-2, 16, 30),
    updatedAt: daysFromNow(-1, 10, 0),
  },
]

// ─── Store ────────────────────────────────────────────────────────

export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'

interface StudentLearningState {
  resources: LearningResource[]
  progress: Record<string, ResourceProgress>
  bookmarks: string[]
  decks: LearningDeck[]
  cards: LearningCard[]
  tasks: PlannerTask[]
  goals: StudyGoal[]
  sessions: StudySession[]
  notes: StudentNote[]

  // Resources
  studyResource: (id: string, pct?: number) => void
  completeResource: (id: string) => void
  toggleBookmark: (id: string) => void

  // Flashcards
  reviewCard: (cardId: string, quality: ReviewQuality) => void
  addCard: (input: { front: string; back: string; subject: string; topic: string; difficulty: Difficulty }) => void

  // Planner
  addTask: (input: {
    title: string
    subject: string
    topic?: string
    type?: TaskType
    priority?: PlannerTask['priority']
    dueDate?: string
    dueTime?: string
    durationMin?: number
    origin?: PlannerTask['origin']
    originRef?: string
  }) => string
  setTaskStatus: (id: string, status: TaskStatus) => void
  deleteTask: (id: string) => void

  // Goals
  addGoal: (goal: Omit<StudyGoal, 'id' | 'createdOn' | 'archived'>) => void
  archiveGoal: (id: string) => void

  // Focus
  recordSession: (input: { subject: string; topic?: string; taskId?: string; minutes: number; mode: StudySession['mode'] }) => void

  // Notes
  addNote: (input: { title: string; content: string; subject: string; topic?: string; tags?: string[]; linkedResourceId?: string }) => void
  updateNote: (id: string, patch: Partial<Pick<StudentNote, 'title' | 'content' | 'subject' | 'topic' | 'tags' | 'linkedResourceId'>>) => void
  deleteNote: (id: string) => void
  toggleNotePin: (id: string) => void

  /** Dev/QA reset to the seeded demo state. */
  resetDemo: () => void
}

function initialSeed() {
  return {
    resources: SEED_RESOURCES,
    progress: SEED_PROGRESS,
    bookmarks: SEED_BOOKMARKS,
    decks: SEED_DECKS,
    cards: SEED_CARDS,
    tasks: SEED_TASKS,
    goals: SEED_GOALS,
    sessions: sessionSeed(),
    notes: SEED_NOTES,
  }
}

let idCounter = 0
function freshId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export const useStudentLearningStore = create<StudentLearningState>()(
  persist(
    (set, get) => ({
      ...initialSeed(),

      // ── Resources ──
      studyResource: (id, pct) =>
        set((s) => {
          const current = s.progress[id] ?? { pct: 0, lastStudiedAt: null }
          const nextPct = Math.max(0, Math.min(100, pct ?? Math.min(100, current.pct + 25)))
          return {
            progress: {
              ...s.progress,
              [id]: { pct: nextPct, lastStudiedAt: new Date().toISOString() },
            },
          }
        }),

      completeResource: (id) =>
        set((s) => ({
          progress: { ...s.progress, [id]: { pct: 100, lastStudiedAt: new Date().toISOString() } },
        })),

      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter((b) => b !== id) : [...s.bookmarks, id],
        })),

      // ── Flashcards (SM-2-lite) ──
      reviewCard: (cardId, quality) =>
        set((s) => ({
          cards: s.cards.map((c) => {
            if (c.id !== cardId) return c
            let { interval, ease, lapses } = c
            switch (quality) {
              case 'again':
                interval = 0
                ease = Math.max(1.3, ease - 0.2)
                lapses += 1
                break
              case 'hard':
                interval = Math.max(1, Math.round(interval * 1.2))
                ease = Math.max(1.3, ease - 0.15)
                break
              case 'good':
                interval = interval === 0 ? 1 : Math.round(interval * ease)
                break
              case 'easy':
                interval = interval === 0 ? 3 : Math.round(interval * ease * 1.3)
                ease = Math.min(2.5, ease + 0.15)
                break
            }
            const reviews = c.reviews + 1
            const status: LearningCard['status'] =
              quality === 'again'
                ? 'learning'
                : interval >= 21 && reviews >= 3
                  ? 'mastered'
                  : interval >= 1
                    ? 'reviewing'
                    : 'learning'
            const due = new Date()
            // "Again" cards come back the same session (+10 minutes);
            // otherwise schedule by the computed interval.
            due.setMinutes(due.getMinutes() + (quality === 'again' ? 10 : 0))
            due.setDate(due.getDate() + (quality === 'again' ? 0 : interval))
            return {
              ...c,
              interval,
              ease: Math.round(ease * 100) / 100,
              lapses,
              reviews,
              status,
              lastReviewedAt: new Date().toISOString(),
              dueAt: due.toISOString(),
            }
          }),
        })),

      addCard: (input) =>
        set((s) => ({
          cards: [
            ...s.cards,
            {
              id: freshId('FCX'),
              deckId: 'D-my',
              front: input.front,
              back: input.back,
              subject: input.subject,
              topic: input.topic,
              difficulty: input.difficulty,
              interval: 0,
              ease: 2.5,
              reviews: 0,
              lapses: 0,
              status: 'new',
              lastReviewedAt: null,
              dueAt: null,
              custom: true,
            },
          ],
        })),

      // ── Planner ──
      addTask: (input) => {
        const id = freshId('STX')
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id,
              title: input.title,
              subject: input.subject,
              topic: input.topic,
              type: input.type ?? 'study',
              priority: input.priority ?? 'medium',
              dueDate: input.dueDate ?? todayISO(),
              dueTime: input.dueTime,
              durationMin: input.durationMin ?? 20,
              status: 'not-started',
              origin: input.origin ?? 'manual',
              originRef: input.originRef,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },

      setTaskStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined } : t,
          ),
        })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // ── Goals ──
      addGoal: (goal) =>
        set((s) => ({
          goals: [...s.goals, { ...goal, id: freshId('G'), createdOn: todayISO(), archived: false }],
        })),

      archiveGoal: (id) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, archived: true } : g)) })),

      // ── Focus ──
      recordSession: (input) =>
        set((s) => ({
          sessions: [
            ...s.sessions,
            {
              id: freshId('SSX'),
              subject: input.subject,
              topic: input.topic,
              taskId: input.taskId,
              minutes: input.minutes,
              endedAt: new Date().toISOString(),
              mode: input.mode,
            },
          ],
        })),

      // ── Notes ──
      addNote: (input) =>
        set((s) => ({
          notes: [
            {
              id: freshId('N'),
              title: input.title,
              content: input.content,
              subject: input.subject,
              topic: input.topic,
              tags: input.tags ?? [],
              pinned: false,
              linkedResourceId: input.linkedResourceId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...s.notes,
          ],
        })),

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)),
        })),

      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      toggleNotePin: (id) => set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) })),

      resetDemo: () => set({ ...initialSeed() }),
    }),
    {
      name: 'scholario-student-learning-v1',
      storage: createTenantScopedStorage('scholario-student-learning-v1'),
      version: 1,
      partialize: (s) => ({
        resources: s.resources,
        progress: s.progress,
        bookmarks: s.bookmarks,
        decks: s.decks,
        cards: s.cards,
        tasks: s.tasks,
        goals: s.goals,
        sessions: s.sessions,
        notes: s.notes,
      }),
    },
  ),
)

// ============================================================
// DERIVED SELECTORS — pure functions over the store's arrays.
// Every UI number comes from here. No fabricated statistics.
// ============================================================

export interface DueStats {
  due: number
  fresh: number
  learning: number
  reviewing: number
  mastered: number
  newCards: number
  total: number
}

export function dueStatsOf(cards: LearningCard[], at: Date = new Date()): DueStats {
  let due = 0
  let fresh = 0
  let learning = 0
  let reviewing = 0
  let mastered = 0
  let newCards = 0
  for (const c of cards) {
    if (c.status === 'mastered') mastered += 1
    else if (c.status === 'learning') learning += 1
    else if (c.status === 'reviewing') reviewing += 1
    else newCards += 1
    const isDue = c.status !== 'mastered' && (c.dueAt === null || new Date(c.dueAt).getTime() <= at.getTime())
    if (isDue) due += 1
    if (c.dueAt === null && c.status === 'new') fresh += 1
  }
  return { due, fresh, learning, reviewing, mastered, newCards, total: cards.length }
}

/** The review queue: due cards, new-first-later ordering (learning first). */
export function reviewQueueOf(cards: LearningCard[], at: Date = new Date()): LearningCard[] {
  return cards
    .filter((c) => c.status !== 'mastered' && (c.dueAt === null || new Date(c.dueAt).getTime() <= at.getTime()))
    .sort((a, b) => {
      const rank = (c: LearningCard) => (c.status === 'learning' ? 0 : c.status === 'reviewing' ? 1 : 2)
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb
      const da = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER
      const db = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER
      return da - db
    })
}

export interface SubjectStat {
  subject: string
  resourcesTotal: number
  resourcesCompleted: number
  resourcesInProgress: number
  cardsTotal: number
  cardsMastered: number
  /** Derived 0–100: completed resources + mastered cards, honest blend. */
  masteryPct: number
}

export function subjectStatsOf(
  resources: LearningResource[],
  progress: Record<string, ResourceProgress>,
  cards: LearningCard[],
): SubjectStat[] {
  const subjects = Array.from(
    new Set([...resources.map((r) => r.subject), ...cards.map((c) => c.subject)]),
  ).filter(Boolean)
  return subjects.map((subject) => {
    const res = resources.filter((r) => r.subject === subject)
    const completed = res.filter((r) => (progress[r.id]?.pct ?? 0) >= 100).length
    const inProgress = res.filter((r) => {
      const p = progress[r.id]?.pct ?? 0
      return p > 0 && p < 100
    }).length
    const cardsForSubject = cards.filter((c) => c.subject === subject)
    const mastered = cardsForSubject.filter((c) => c.status === 'mastered').length
    // Blend: resources count toward half, mastered cards the other half —
    // only over what actually exists (a subject with no cards leans on
    // resources and vice-versa).
    const resPart = res.length > 0 ? completed / res.length : null
    const cardPart = cardsForSubject.length > 0 ? mastered / cardsForSubject.length : null
    const parts = [resPart, cardPart].filter((p): p is number => p !== null)
    const masteryPct = parts.length > 0 ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) : 0
    return {
      subject,
      resourcesTotal: res.length,
      resourcesCompleted: completed,
      resourcesInProgress: inProgress,
      cardsTotal: cardsForSubject.length,
      cardsMastered: mastered,
      masteryPct,
    }
  })
}

/** "Continue where you left off" — most recently studied, unfinished. */
export function continueLearningOf(
  resources: LearningResource[],
  progress: Record<string, ResourceProgress>,
): Array<{ resource: LearningResource; pct: number; lastStudiedAt: string }> {
  return resources
    .map((r) => ({ resource: r, pct: progress[r.id]?.pct ?? 0, lastStudiedAt: progress[r.id]?.lastStudiedAt ?? null }))
    .filter((x) => x.pct > 0 && x.pct < 100 && x.lastStudiedAt !== null)
    .sort((a, b) => (a.lastStudiedAt! < b.lastStudiedAt! ? 1 : -1))
    .map((x) => ({ resource: x.resource, pct: x.pct, lastStudiedAt: x.lastStudiedAt! }))
}

/** Tasks due on a given YYYY-MM-DD that are still open. */
export function tasksDueOn(tasks: PlannerTask[], dateKey: string): PlannerTask[] {
  return tasks.filter((t) => t.dueDate === dateKey && (t.status === 'not-started' || t.status === 'in-progress'))
}

export function minutesOn(sessions: StudySession[], dateKey: string): number {
  return sessions.filter((s) => dateKeyOf(s.endedAt) === dateKey).reduce((sum, s) => sum + s.minutes, 0)
}

/** ISO weekday key list of the last 7 days (oldest first), like ['Mon', …]. */
export function last7DayKeys(at: Date = new Date()): Array<{ key: string; label: string }> {
  const out: Array<{ key: string; label: string }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(at)
    d.setDate(d.getDate() - i)
    out.push({ key: dateKeyOf(d.toISOString()), label: d.toLocaleDateString('en-IN', { weekday: 'short' }) })
  }
  return out
}

export function weeklyMinutes(sessions: StudySession[], at: Date = new Date()): number {
  const keys = new Set(last7DayKeys(at).map((d) => d.key))
  return sessions.filter((s) => keys.has(dateKeyOf(s.endedAt))).reduce((sum, s) => sum + s.minutes, 0)
}

export function weeklyCompletedTasks(tasks: PlannerTask[], at: Date = new Date()): number {
  const keys = new Set(last7DayKeys(at).map((d) => d.key))
  return tasks.filter((t) => t.status === 'completed' && t.completedAt && keys.has(dateKeyOf(t.completedAt))).length
}

export interface StreakInfo {
  current: number
  longest: number
  /** true when at least one qualifying session happened TODAY. */
  activeToday: boolean
}

/**
 * A study streak day = at least one recorded study session that day
 * (spec §35 — opening the page never counts).
 */
export function streakOf(sessions: StudySession[], at: Date = new Date()): StreakInfo {
  const days = new Set(sessions.map((s) => dateKeyOf(s.endedAt)))
  if (days.size === 0) return { current: 0, longest: 0, activeToday: false }

  // Longest run over the recorded history.
  const sorted = Array.from(days).sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00')
    const curr = new Date(sorted[i] + 'T00:00:00')
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    run = diff === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  // Current run: counts back from today (or yesterday if today is a
  // rest day so far — the streak isn't "broken" until the day ends).
  const todayKey = dateKeyOf(at.toISOString())
  const yKey = new Date(at)
  yKey.setDate(yKey.getDate() - 1)
  const yesterdayKey = dateKeyOf(yKey.toISOString())
  let cursor: Date
  if (days.has(todayKey)) cursor = new Date(todayKey + 'T00:00:00')
  else if (days.has(yesterdayKey)) cursor = new Date(yesterdayKey + 'T00:00:00')
  else return { current: 0, longest, activeToday: false }
  let current = 0
  while (days.has(dateKeyOf(cursor.toISOString()))) {
    current += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return { current, longest, activeToday: days.has(todayKey) }
}

/**
 * RECOMMENDED — derived only from real signals (spec §14):
 *   1. unfinished resources in the student's weakest subjects
 *      (from the canonical results store — lowest latest %),
 *   2. other unfinished / in-progress resources,
 *   3. bookmarked-but-not-started.
 * `weakSubjects` is passed in by the caller (results integration,
 * permission-safe: only the student's own subject percentages).
 */
export function recommendedOf(
  resources: LearningResource[],
  progress: Record<string, ResourceProgress>,
  bookmarks: string[],
  weakSubjects: string[],
  limit = 3,
): LearningResource[] {
  const weakRank = new Map(weakSubjects.map((s, i) => [s, i]))
  const score = (r: LearningResource): number => {
    const pct = progress[r.id]?.pct ?? 0
    let s = 0
    if (weakRank.has(r.subject)) s -= 100 - (weakRank.get(r.subject) ?? 0) * 10
    if (pct > 0 && pct < 100) s -= 20 // in progress → finish it
    if (bookmarks.includes(r.id)) s -= 5
    if (pct >= 100) s += 1000 // completed → last
    return s
  }
  return [...resources].sort((a, b) => score(a) - score(b)).slice(0, limit)
}

/** Goal progress (current value + target) derived from real state. */
export interface GoalProgress {
  goal: StudyGoal
  current: number
  pct: number
  unit: string
}

export function goalProgressOf(goal: StudyGoal, ctx: { sessions: StudySession[]; tasks: PlannerTask[]; cards: LearningCard[] }): GoalProgress {
  switch (goal.kind) {
    case 'weekly-minutes': {
      const current = weeklyMinutes(ctx.sessions)
      return { goal, current, pct: Math.min(100, Math.round((current / goal.target) * 100)), unit: 'min' }
    }
    case 'weekly-tasks': {
      const current = weeklyCompletedTasks(ctx.tasks)
      return { goal, current, pct: Math.min(100, Math.round((current / goal.target) * 100)), unit: 'tasks' }
    }
    case 'deck-master': {
      const cards = ctx.cards.filter((c) => c.subject === goal.subject)
      const mastered = cards.filter((c) => c.status === 'mastered').length
      const pct = cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0
      return { goal, current: mastered, pct: goal.target <= 100 ? pct : Math.min(100, mastered), unit: 'cards' }
    }
    case 'subject-resources':
    default: {
      // Kept for future subject-completion goals.
      return { goal, current: 0, pct: 0, unit: '' }
    }
  }
}
