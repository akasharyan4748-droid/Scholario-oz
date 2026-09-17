'use client'

// ============================================================
// STUDENT GROUPS STORE — the peer-collaboration data layer
// ------------------------------------------------------------
// Backs the Learning module's "Study Groups" tab (spec §36–§43):
// class-scoped study groups, the Q&A forum, and shared resources.
//
// PRIVACY MODEL (spec §37 — first-class, not decoration):
//   · Every group is `visibility: 'class'` — Class 2-A ONLY.
//     There is no school-wide visibility and no action that can
//     create one; the type itself is the constraint.
//   · Creation (§38) is permitted for the demo tenant at class
//     scope only — the UI surfaces the policy line everywhere.
//   · Moderation (§40): students can REPORT content; they can
//     NEVER delete each other's content. Reports persist as
//     `reportedByMe` flags for teacher review. Locking is a
//     teacher action — seeded locked threads render read-only.
//
// HONESTY RULES (spec §61):
//   · Every count derives from these arrays — member counts,
//     answer counts, helpful counts, activity dates. Seeded
//     helpful counts are legitimate seed facts of the demo
//     tenant (like the class roster), never fabricated KPIs.
//   · Shared resources REFERENCE the canonical learning store
//     by resourceId — titles/types resolve live, never copied.
//   · Dates are anchored to TODAY so relative times are real.
//
// Member/author names are REAL Class 2-A roster names (students
// store, STU-43..58). The demo student is Aarav Sharma (STU-58).
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'

// ─── Date helpers (local-time, ISO datetimes anchored to today) ───

function daysAgoIso(days: number, hour = 16, minute = 30): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function nowIso(): string {
  return new Date().toISOString()
}

// ─── Identity ─────────────────────────────────────────────────────

/** The demo student (Class 2-A, roll 18). */
export const DEMO_STUDENT = 'Aarav Sharma'

/** Render name: the demo student sees their own items as "You". */
export function displayOf(name: string): string {
  return name === DEMO_STUDENT ? 'You' : name
}

// ─── Types ────────────────────────────────────────────────────────

/** §37: the ONLY visibility that exists — class-scoped, never school-wide. */
export type GroupVisibility = 'class'

export interface StudyGroup {
  id: string
  name: string
  subject: string
  topic: string
  description: string
  /** Real Class 2-A roster names (4–6 per group; includes the demo student when joined). */
  memberNames: string[]
  createdBy: string
  createdOn: string // ISO datetime
  /** Membership of the demo student. */
  joined: boolean
  visibility: GroupVisibility
}

export interface QAAnswer {
  id: string
  body: string
  authorName: string
  answeredOn: string // ISO datetime
  /** Helpful marks by classmates (seeded counts are seed facts). */
  helpfulCount: number
  /** The demo student's own helpful mark — toggling adjusts the count by ±1. */
  markedHelpfulByMe: boolean
  reportedByMe: boolean
}

export interface QAQuestion {
  id: string
  title: string
  body: string
  subject: string
  topic: string
  tags: string[]
  authorName: string
  askedOn: string // ISO datetime
  answers: QAAnswer[]
  /** Locked by the class teacher (§40) — read-only thread, no composer. */
  locked: boolean
  reportedByMe: boolean
}

export interface SharedResourceItem {
  id: string
  /** Reference into the canonical learning store's resources — titles resolve live. */
  resourceId: string
  sharedByName: string
  sharedOn: string // ISO datetime
  note: string
  savedByMe: boolean
  reportedByMe: boolean
}

export type ReportKind = 'question' | 'answer' | 'share'

export interface ReportRef {
  questionId?: string
  answerId?: string
  shareId?: string
}

export interface NewQuestionInput {
  title: string
  body: string
  subject: string
  topic?: string
  tags?: string[]
}

export interface NewGroupInput {
  name: string
  subject: string
  topic: string
  description?: string
}

export interface NewShareInput {
  resourceId: string
  note?: string
}

// ─── Seed (demo tenant's legitimate data, anchored to today) ──────

const SEED_GROUPS: StudyGroup[] = [
  {
    id: 'G1',
    name: 'Fractions Friends',
    subject: 'Mathematics',
    topic: 'Fractions',
    description: 'We practise fractions together — halves, quarters and comparing like parts. Bring your worksheets!',
    memberNames: ['Aarav Sharma', 'Myra Iyer', 'Anika Desai', 'Vivaan Reddy', 'Saanvi Gupta'],
    createdBy: 'Myra Iyer',
    createdOn: daysAgoIso(14, 12, 0),
    joined: true,
    visibility: 'class',
  },
  {
    id: 'G2',
    name: 'Plant Explorers',
    subject: 'Science',
    topic: 'Plants',
    description: 'Leaf collections, plant-part diagrams and garden observations for our Science project.',
    memberNames: ['Aarav Sharma', 'Anika Desai', 'Kiara Rao', 'Dhruv Joshi', 'Aadhya Menon'],
    createdBy: 'Anika Desai',
    createdOn: daysAgoIso(10, 15, 0),
    joined: true,
    visibility: 'class',
  },
  {
    id: 'G3',
    name: 'Reading Circle',
    subject: 'English',
    topic: 'Reading',
    description: 'We read a new story every week and talk about the characters and the lesson. This week: The Lion and the Mouse.',
    memberNames: ['Ishaani Verma', 'Arjun Mehta', 'Kabir Khanna', 'Reyansh Kumar'],
    createdBy: 'Ishaani Verma',
    createdOn: daysAgoIso(7, 10, 0),
    joined: false,
    visibility: 'class',
  },
]

const SEED_QUESTIONS: QAQuestion[] = [
  {
    id: 'Q1',
    title: 'How do I add fractions with the same bottom number?',
    body:
      'The worksheet says 1/4 + 2/4. I know the bottom numbers match, but I forget what to do with the top numbers. Can someone explain it step by step?',
    subject: 'Mathematics',
    topic: 'Fractions',
    tags: ['fractions', 'help'],
    authorName: 'Vivaan Reddy',
    askedOn: daysAgoIso(2, 16, 30),
    answers: [
      {
        id: 'Q1-A1',
        body:
          'When the bottom numbers are the same, just add the top numbers and keep the bottom the same: 1/4 + 2/4 = 3/4. Think of pizza slices — one slice plus two slices is three slices of the same size!',
        authorName: 'Myra Iyer',
        answeredOn: daysAgoIso(2, 17, 10),
        helpfulCount: 3,
        markedHelpfulByMe: false,
        reportedByMe: false,
      },
      {
        id: 'Q1-A2',
        body: 'I remember it as "same bottom = add the tops". So the answer is 3/4.',
        authorName: 'Aarav Sharma',
        answeredOn: daysAgoIso(1, 9, 15),
        helpfulCount: 1,
        markedHelpfulByMe: false,
        reportedByMe: false,
      },
    ],
    locked: false,
    reportedByMe: false,
  },
  {
    id: 'Q2',
    title: 'Which parts of a plant make its food?',
    body:
      'We learned that plants make their own food, but which part actually does it — the roots, the stem or the leaves? And how does the food reach the rest of the plant?',
    subject: 'Science',
    topic: 'Plants',
    tags: ['plants'],
    authorName: 'Saanvi Gupta',
    askedOn: daysAgoIso(1, 15, 45),
    answers: [
      {
        id: 'Q2-A1',
        body:
          'The leaves make the food using sunlight — it is called photosynthesis. The stem then carries the food and water to the rest of the plant, like a straw.',
        authorName: 'Anika Desai',
        answeredOn: daysAgoIso(1, 16, 20),
        helpfulCount: 2,
        markedHelpfulByMe: true,
        reportedByMe: false,
      },
    ],
    locked: false,
    reportedByMe: false,
  },
  {
    id: 'Q3',
    title: 'What is a noun? I keep forgetting.',
    body:
      'I know it is a naming word, but I get confused between person, place, animal and thing. Can someone give one example of each so I can remember?',
    subject: 'English',
    topic: 'Nouns',
    tags: ['grammar'],
    authorName: 'Aarav Sharma',
    askedOn: daysAgoIso(4, 18, 0),
    answers: [],
    locked: false,
    reportedByMe: false,
  },
  {
    id: 'Q4',
    title: 'Can someone post the answers to the Fractions quiz?',
    body: 'The Fractions Practice Set is really long. Can someone just share the answers here so we can check quickly?',
    subject: 'Mathematics',
    topic: 'Fractions',
    tags: ['quiz'],
    authorName: 'Kabir Khanna',
    askedOn: daysAgoIso(6, 12, 30),
    answers: [],
    // Locked by the class teacher — sharing quiz answers is not allowed.
    locked: true,
    reportedByMe: false,
  },
]

const SEED_SHARES: SharedResourceItem[] = [
  {
    id: 'S1',
    resourceId: 'R13',
    sharedByName: 'Myra Iyer',
    sharedOn: daysAgoIso(1, 10, 0),
    note: 'This video finally made like parts click for me — wait for the pizza example!',
    savedByMe: true,
    reportedByMe: false,
  },
  {
    id: 'S2',
    resourceId: 'R03',
    sharedByName: 'Anika Desai',
    sharedOn: daysAgoIso(3, 15, 30),
    note: 'Really good 8-page summary — perfect for our Living Things revision.',
    savedByMe: false,
    reportedByMe: false,
  },
  {
    id: 'S3',
    resourceId: 'R17',
    sharedByName: 'Saanvi Gupta',
    sharedOn: daysAgoIso(2, 12, 15),
    note: 'Only 2 pages — read it before Friday’s English class.',
    savedByMe: false,
    reportedByMe: false,
  },
]

// ─── Store ────────────────────────────────────────────────────────

interface StudentGroupsState {
  groups: StudyGroup[]
  questions: QAQuestion[]
  shares: SharedResourceItem[]

  /** Join/leave for the demo student — keeps memberNames in sync. */
  toggleJoin: (groupId: string) => void
  /** §38: creation is allowed at class visibility only; the demo student becomes creator + first member. */
  createGroup: (input: NewGroupInput) => void
  addQuestion: (input: NewQuestionInput) => void
  addAnswer: (questionId: string, body: string) => void
  toggleHelpful: (questionId: string, answerId: string) => void
  /** §40: flag content for the class teacher. Students never delete each other's content. */
  reportItem: (kind: ReportKind, ref: ReportRef) => void
  toggleSaveShare: (shareId: string) => void
  /** Shared by the demo student — starts saved ("Save to collection", §41). */
  addShare: (input: NewShareInput) => void
  resetDemo: () => void
}

export const useStudentGroupsStore = create<StudentGroupsState>()(
  persist(
    (set) => ({
      groups: SEED_GROUPS,
      questions: SEED_QUESTIONS,
      shares: SEED_SHARES,

      toggleJoin: (groupId) =>
        set((s) => ({
          groups: s.groups.map((g) => {
            if (g.id !== groupId) return g
            const joined = !g.joined
            const memberNames = joined
              ? g.memberNames.includes(DEMO_STUDENT)
                ? g.memberNames
                : [...g.memberNames, DEMO_STUDENT]
              : g.memberNames.filter((n) => n !== DEMO_STUDENT)
            return { ...g, joined, memberNames }
          }),
        })),

      createGroup: (input) =>
        set((s) => ({
          groups: [
            ...s.groups,
            {
              id: `G-${Date.now()}`,
              name: input.name.trim(),
              subject: input.subject,
              topic: input.topic.trim(),
              description: (input.description ?? '').trim(),
              memberNames: [DEMO_STUDENT],
              createdBy: DEMO_STUDENT,
              createdOn: nowIso(),
              joined: true,
              visibility: 'class',
            },
          ],
        })),

      addQuestion: (input) =>
        set((s) => ({
          questions: [
            {
              id: `Q-${Date.now()}`,
              title: input.title.trim(),
              body: input.body.trim(),
              subject: input.subject,
              topic: (input.topic ?? '').trim(),
              tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean),
              authorName: DEMO_STUDENT,
              askedOn: nowIso(),
              answers: [],
              locked: false,
              reportedByMe: false,
            },
            ...s.questions,
          ],
        })),

      addAnswer: (questionId, body) =>
        set((s) => ({
          questions: s.questions.map((q) =>
            q.id === questionId && !q.locked
              ? {
                  ...q,
                  answers: [
                    ...q.answers,
                    {
                      id: `A-${Date.now()}`,
                      body: body.trim(),
                      authorName: DEMO_STUDENT,
                      answeredOn: nowIso(),
                      helpfulCount: 0,
                      markedHelpfulByMe: false,
                      reportedByMe: false,
                    },
                  ],
                }
              : q,
          ),
        })),

      toggleHelpful: (questionId, answerId) =>
        set((s) => ({
          questions: s.questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answers: q.answers.map((a) =>
                    a.id === answerId
                      ? {
                          ...a,
                          markedHelpfulByMe: !a.markedHelpfulByMe,
                          helpfulCount: Math.max(0, a.helpfulCount + (a.markedHelpfulByMe ? -1 : 1)),
                        }
                      : a,
                  ),
                }
              : q,
          ),
        })),

      reportItem: (kind, ref) =>
        set((s) => {
          if (kind === 'share' && ref.shareId) {
            return {
              shares: s.shares.map((sh) => (sh.id === ref.shareId && !sh.reportedByMe ? { ...sh, reportedByMe: true } : sh)),
            }
          }
          if (kind === 'question' && ref.questionId) {
            return {
              questions: s.questions.map((q) => (q.id === ref.questionId && !q.reportedByMe ? { ...q, reportedByMe: true } : q)),
            }
          }
          if (kind === 'answer' && ref.questionId && ref.answerId) {
            return {
              questions: s.questions.map((q) =>
                q.id === ref.questionId
                  ? {
                      ...q,
                      answers: q.answers.map((a) => (a.id === ref.answerId && !a.reportedByMe ? { ...a, reportedByMe: true } : a)),
                    }
                  : q,
              ),
            }
          }
          return s
        }),

      toggleSaveShare: (shareId) =>
        set((s) => ({
          shares: s.shares.map((sh) => (sh.id === shareId ? { ...sh, savedByMe: !sh.savedByMe } : sh)),
        })),

      addShare: (input) =>
        set((s) => ({
          shares: [
            {
              id: `S-${Date.now()}`,
              resourceId: input.resourceId,
              sharedByName: DEMO_STUDENT,
              sharedOn: nowIso(),
              note: (input.note ?? '').trim(),
              savedByMe: true,
              reportedByMe: false,
            },
            ...s.shares,
          ],
        })),

      resetDemo: () =>
        set({
          groups: SEED_GROUPS,
          questions: SEED_QUESTIONS,
          shares: SEED_SHARES,
        }),
    }),
    {
      name: 'scholario-student-groups-v1',
      storage: createTenantScopedStorage('scholario-student-groups-v1'),
      version: 1,
      partialize: (s) => ({
        groups: s.groups,
        questions: s.questions,
        shares: s.shares,
      }),
    },
  ),
)

// ─── Derived helpers (pure — UI computes counts from arrays) ─────

/** Questions that can still be answered: not locked, no answers yet. */
export function openQuestionsOf(questions: QAQuestion[]): QAQuestion[] {
  return questions.filter((q) => !q.locked && q.answers.length === 0)
}

/** Unique Class 2-A names (excluding the demo student) that asked or answered within `days`. */
export function activeClassmatesSince(questions: QAQuestion[], days: number): string[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const names = new Set<string>()
  for (const q of questions) {
    if (new Date(q.askedOn).getTime() >= cutoff && q.authorName !== DEMO_STUDENT) names.add(q.authorName)
    for (const a of q.answers) {
      if (new Date(a.answeredOn).getTime() >= cutoff && a.authorName !== DEMO_STUDENT) names.add(a.authorName)
    }
  }
  return Array.from(names)
}

/** Questions asked within `days` (used by the honest "class activity" strip). */
export function questionsAskedSince(questions: QAQuestion[], days: number): QAQuestion[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return questions.filter((q) => new Date(q.askedOn).getTime() >= cutoff)
}

/**
 * A group's honest activity hint: the most recent real event touching its
 * subject — a question asked, an answer posted, a resource shared (caller
 * passes only shares already resolved to the group's subject), or the
 * group's own creation.
 */
export function lastActivityIsoFor(
  group: StudyGroup,
  questions: QAQuestion[],
  sharesOfSubject: SharedResourceItem[],
): string | null {
  const stamps: number[] = [new Date(group.createdOn).getTime()]
  for (const q of questions) {
    if (q.subject !== group.subject) continue
    stamps.push(new Date(q.askedOn).getTime())
    for (const a of q.answers) stamps.push(new Date(a.answeredOn).getTime())
  }
  for (const sh of sharesOfSubject) stamps.push(new Date(sh.sharedOn).getTime())
  const valid = stamps.filter((t) => !Number.isNaN(t))
  if (valid.length === 0) return null
  return new Date(Math.max(...valid)).toISOString()
}
