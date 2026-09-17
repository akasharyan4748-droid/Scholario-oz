'use client'

// ============================================================
// STUDENT GROWTH STORE — the canonical "My Progress" data layer
// ------------------------------------------------------------
// Backs the Achievements tab of the Progress module (and, from
// PROGRESS-B onwards, the Portfolio tab): earned achievements +
// portfolio showcase items, one tenant-scoped persisted store.
//
// HONESTY RULES (the Learning OS convention, spec §61):
//   · Seeded records are the demo tenant's legitimate school
//     records (like the class roster) — but every number that
//     CAN be cross-checked against a real store IS:
//       - "Mathematics Excellence" links to the REAL Mid Term
//         result (MID-2026, student-results-store): 48/50 = 96%
//         in Mathematics, 274/300 = A+ overall, published
//         2026-09-11 — evidence lines carry exactly those real
//         numbers.
//       - "Science Activity — perfect score" uses the REAL Mid
//         Term Science component breakdown (Activity 10/10).
//       - NO "Perfect Attendance" achievement is seeded: the
//         real attendance records are 96% (one absent day), so
//         an earned perfect-attendance record would be a lie.
//         Attendance is recognised instead by the live-evaluated
//         Attendance Star badge (≥ 90%).
//   · Self-reported achievements (source 'self') are stored as
//     exactly that — the UI renders them visually distinct
//     ("Added by you") so they NEVER look like official awards.
//   · Badge earned-ness is NEVER stored — badges are rules over
//     the LIVE learning/attendance/results stores (see the
//     achievements module's badge-rules.ts).
//
// Tenant-scoped persistence (see lib/tenant/tenant-storage.ts):
// every school gets its own localStorage namespace.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage, migrateLegacyScopedStore } from '@/lib/tenant/tenant-storage'
import { DEFAULT_TENANT_ID } from '@/lib/tenant/schools'
import { getSchoolProfile } from '@/lib/school-profile'

migrateLegacyScopedStore('scholario-student-growth-v1', DEFAULT_TENANT_ID)

// ─── Date helpers (local-time, anchored to the real clock) ────────

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Types ────────────────────────────────────────────────────────

export type GrowthCategory =
  | 'academic'
  | 'sports'
  | 'arts'
  | 'leadership'
  | 'participation'
  | 'learning'

export type GrowthSource = 'school' | 'teacher' | 'system' | 'self'

export type GrowthScope = 'class' | 'school' | 'inter-school'

export interface GrowthAchievement {
  id: string
  title: string
  description: string
  category: GrowthCategory
  /** ISO date (YYYY-MM-DD) the achievement was earned/awarded on. */
  dateISO: string
  source: GrowthSource
  /** School / teacher / the student's own name (for 'self'). */
  awardedByName: string
  scope: GrowthScope
  subject?: string
  /** Skill tags (no scores — see skillsWithEvidence). */
  skills: string[]
  /** Link into student-results-store assessments (real ids only). */
  relatedAssessmentId?: string
  /** Link into certificates-store documents (real doc ids only). */
  certificateId?: string
  /** Short factual evidence lines (no invented numbers). */
  evidence: string[]
  /** True when a from-achievement mirror PortfolioItem exists. */
  inPortfolio: boolean
}

export type PortfolioKind =
  | 'project'
  | 'certificate'
  | 'achievement'
  | 'activity'
  | 'artwork'
  | 'presentation'

export type PortfolioVisibility = 'private' | 'class' | 'school'

export interface PortfolioItem {
  id: string
  title: string
  kind: PortfolioKind
  description: string
  dateISO: string
  subject?: string
  skills: string[]
  /** Set on from-achievement mirrors (toggleInPortfolio). */
  achievementId?: string
  certificateId?: string
  visibility: PortfolioVisibility
  /** Max 2 featured (toggleFeatured demotes the oldest beyond that). */
  featured: boolean
  origin: 'self' | 'from-achievement'
}

// ─── Category → portfolio kind mapping (toggleInPortfolio mirror) ─

export function portfolioKindOf(category: GrowthCategory): PortfolioKind {
  switch (category) {
    case 'academic':
    case 'leadership':
      return 'achievement'
    case 'sports':
    case 'participation':
      return 'activity'
    case 'arts':
      return 'artwork'
    case 'learning':
    default:
      return 'project'
  }
}

// ─── Identity ─────────────────────────────────────────────────────

/** The demo student (Class 2-A) — self-reported records use this name. */
export const GROWTH_DEMO_STUDENT = 'Aarav Sharma'

// ─── Seed — the demo tenant's legitimate records ──────────────────
// Real-store anchors used below (all verified against the seeds):
//   · student-results-store MID-2026: Mathematics 48/50, Science
//     components Written 34/40 + Activity 10/10, total 274/300,
//     conducted to 2026-08-28, published 2026-09-11, class rank #3
//     of 18 (deterministic classStandingsOf output).
//   · Teachers: Kavita Joshi (Science) and Rohan Mehta (class
//     teacher) are the real seeded names in the learning/results/
//     attendance stores.
//   · NO certificateId is seeded: the certificates store holds only
//     a Bonafide (passport) and a Character certificate (scholarship
//     application) for STU-58 — neither is an achievement certificate,
//     so no achievement claims one. The linking pathway is fully
//     implemented for real future documents.

const SCHOOL_NAME = getSchoolProfile().name

const SEED_ACHIEVEMENTS: GrowthAchievement[] = [
  {
    id: 'GA-01',
    title: 'Mathematics Excellence',
    description: 'Awarded for outstanding performance in Mathematics in the Mid Term Examination.',
    category: 'academic',
    dateISO: '2026-09-11', // the REAL Mid Term publish date (student-results-store)
    source: 'school',
    awardedByName: SCHOOL_NAME,
    scope: 'school',
    subject: 'Mathematics',
    skills: ['Problem Solving'],
    relatedAssessmentId: 'MID-2026',
    evidence: [
      '48 out of 50 marks (96%) in Mathematics',
      'Overall A+ — 274 out of 300 in the Mid Term Examination',
      '3rd position in Class 2-A',
    ],
    inPortfolio: false,
  },
  {
    id: 'GA-02',
    title: 'Science Activity — perfect score',
    description: 'Scored full marks in the Science activity component of the Mid Term Examination.',
    category: 'academic',
    dateISO: '2026-08-28', // the REAL Mid Term conducted-to date
    source: 'teacher',
    awardedByName: 'Kavita Joshi',
    scope: 'class',
    subject: 'Science',
    skills: ['Experimentation'],
    relatedAssessmentId: 'MID-2026',
    evidence: ['10 out of 10 in the Mid Term Science activity'],
    inPortfolio: false,
  },
  {
    id: 'GA-03',
    title: 'Sports Day — Runner-up, 50m sprint',
    description: 'Finished 2nd in the Class 2 50m sprint on Annual Sports Day.',
    category: 'sports',
    dateISO: daysAgoISO(20),
    source: 'school',
    awardedByName: SCHOOL_NAME,
    scope: 'school',
    skills: ['Athletics'],
    evidence: ['2nd place — Class 2 category, 50m sprint'],
    inPortfolio: false,
  },
  {
    id: 'GA-04',
    title: 'Inter-house Art Competition — 2nd place',
    description: 'Won 2nd place in the Class 2 category of the inter-house art competition.',
    category: 'arts',
    dateISO: daysAgoISO(33),
    source: 'school',
    awardedByName: SCHOOL_NAME,
    scope: 'school',
    subject: 'Art & Craft',
    skills: ['Drawing'],
    evidence: ['2nd place — Class 2 category'],
    inPortfolio: true,
  },
  {
    id: 'GA-05',
    title: 'Science project — “Living Things Around Us”',
    description: 'Class science project on living and non-living things, presented in the Science period.',
    category: 'learning',
    dateISO: daysAgoISO(12),
    source: 'teacher',
    awardedByName: 'Kavita Joshi',
    scope: 'class',
    subject: 'Science',
    skills: ['Research', 'Presentation'],
    evidence: ['Presented to the class with a chart of examples'],
    inPortfolio: true,
  },
  {
    id: 'GA-06',
    title: 'Annual Day — class group performance',
    description: 'Performed in the Class 2-A group item at the Annual Day celebration.',
    category: 'participation',
    dateISO: daysAgoISO(40),
    source: 'teacher',
    awardedByName: 'Rohan Mehta',
    scope: 'class',
    skills: ['Teamwork'],
    evidence: ['Performed in the class group item'],
    inPortfolio: false,
  },
  {
    id: 'GA-07',
    title: 'Class Monitor — week duty',
    description: 'Served as class monitor for one week.',
    category: 'leadership',
    dateISO: daysAgoISO(6),
    source: 'teacher',
    awardedByName: 'Rohan Mehta',
    scope: 'class',
    skills: ['Leadership'],
    evidence: ['Led the morning line-up for the week'],
    inPortfolio: false,
  },
]

const SEED_PORTFOLIO_ITEMS: PortfolioItem[] = [
  // Mirror of GA-05 (what toggleInPortfolio would create — featured).
  {
    id: 'PF-01',
    title: 'Science project — “Living Things Around Us”',
    kind: 'project',
    description: 'Presented to the class with a chart of examples',
    dateISO: daysAgoISO(12),
    subject: 'Science',
    skills: ['Research', 'Presentation'],
    achievementId: 'GA-05',
    visibility: 'class',
    featured: true,
    origin: 'from-achievement',
  },
  // Mirror of GA-04.
  {
    id: 'PF-02',
    title: 'Inter-house Art Competition entry',
    kind: 'artwork',
    description: '2nd place — Class 2 category',
    dateISO: daysAgoISO(33),
    subject: 'Art & Craft',
    skills: ['Drawing'],
    achievementId: 'GA-04',
    visibility: 'school',
    featured: false,
    origin: 'from-achievement',
  },
  // A self-origin written piece, private by choice.
  {
    id: 'PF-03',
    title: 'Story: The Lost Kite',
    kind: 'project',
    description: 'A short story about a kite that keeps flying away, written for English practice.',
    dateISO: daysAgoISO(8),
    subject: 'English',
    skills: ['Creative Writing'],
    visibility: 'private',
    featured: false,
    origin: 'self',
  },
]

// ─── Store ────────────────────────────────────────────────────────

export interface AddSelfAchievementInput {
  title: string
  category: GrowthCategory
  dateISO: string
  description: string
}

export interface AddPortfolioItemInput {
  title: string
  kind: PortfolioKind
  description: string
  dateISO: string
  subject?: string
  skills?: string[]
  visibility?: PortfolioVisibility
  featured?: boolean
  /** Link into certificates-store documents (real doc ids only). */
  certificateId?: string
}

interface StudentGrowthState {
  achievements: GrowthAchievement[]
  portfolioItems: PortfolioItem[]

  /** Self-reported record — source 'self', scope 'class', no evidence lines. */
  addSelfAchievement: (input: AddSelfAchievementInput) => string
  /** Creates/removes the from-achievement portfolio mirror. */
  toggleInPortfolio: (achievementId: string) => void
  addPortfolioItem: (input: AddPortfolioItemInput) => string
  updatePortfolioItem: (id: string, patch: Partial<Pick<PortfolioItem, 'title' | 'kind' | 'description' | 'dateISO' | 'subject' | 'skills' | 'visibility' | 'featured' | 'certificateId'>>) => void
  removePortfolioItem: (id: string) => void
  /** Max 2 featured — demotes the oldest beyond that. */
  toggleFeatured: (id: string) => void
  setVisibility: (id: string, visibility: PortfolioVisibility) => void
  /** Dev/QA reset to the seeded demo state. */
  resetDemo: () => void
}

function freshId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export const useStudentGrowthStore = create<StudentGrowthState>()(
  persist(
    (set) => ({
      achievements: SEED_ACHIEVEMENTS,
      portfolioItems: SEED_PORTFOLIO_ITEMS,

      addSelfAchievement: ({ title, category, dateISO, description }) => {
        const id = freshId('GA')
        set((s) => ({
          achievements: [
            {
              id,
              title,
              description,
              category,
              dateISO,
              source: 'self',
              awardedByName: GROWTH_DEMO_STUDENT,
              scope: 'class',
              skills: [],
              evidence: [],
              inPortfolio: false,
            },
            ...s.achievements,
          ],
        }))
        return id
      },

      toggleInPortfolio: (achievementId) =>
        set((s) => {
          const a = s.achievements.find((x) => x.id === achievementId)
          if (!a) return s
          if (a.inPortfolio) {
            return {
              achievements: s.achievements.map((x) => (x.id === achievementId ? { ...x, inPortfolio: false } : x)),
              portfolioItems: s.portfolioItems.filter((p) => p.achievementId !== achievementId),
            }
          }
          const mirror: PortfolioItem = {
            id: freshId('PF'),
            title: a.title,
            kind: portfolioKindOf(a.category),
            description: a.evidence.length > 0 ? a.evidence.join('. ') : a.description,
            dateISO: a.dateISO,
            subject: a.subject,
            skills: [...a.skills],
            achievementId: a.id,
            certificateId: a.certificateId,
            visibility: a.scope === 'class' ? 'class' : 'school',
            featured: false,
            origin: 'from-achievement',
          }
          return {
            achievements: s.achievements.map((x) => (x.id === achievementId ? { ...x, inPortfolio: true } : x)),
            portfolioItems: [...s.portfolioItems, mirror],
          }
        }),

      addPortfolioItem: (input) => {
        const id = freshId('PF')
        set((s) => ({
          portfolioItems: [
            ...s.portfolioItems,
            {
              id,
              title: input.title,
              kind: input.kind,
              description: input.description,
              dateISO: input.dateISO,
              subject: input.subject,
              skills: input.skills ?? [],
              certificateId: input.certificateId,
              visibility: input.visibility ?? 'class',
              featured: false,
              origin: 'self',
            },
          ],
        }))
        return id
      },

      updatePortfolioItem: (id, patch) =>
        set((s) => ({
          portfolioItems: s.portfolioItems.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePortfolioItem: (id) =>
        set((s) => {
          const item = s.portfolioItems.find((p) => p.id === id)
          // Removing a from-achievement mirror also clears the link on
          // the achievement so the two slices never disagree.
          const achievements =
            item?.origin === 'from-achievement' && item.achievementId
              ? s.achievements.map((a) => (a.id === item.achievementId ? { ...a, inPortfolio: false } : a))
              : s.achievements
          return {
            achievements,
            portfolioItems: s.portfolioItems.filter((p) => p.id !== id),
          }
        }),

      toggleFeatured: (id) =>
        set((s) => {
          const item = s.portfolioItems.find((p) => p.id === id)
          if (!item) return s
          if (item.featured) {
            return { portfolioItems: s.portfolioItems.map((p) => (p.id === id ? { ...p, featured: false } : p)) }
          }
          let items = s.portfolioItems.map((p) => (p.id === id ? { ...p, featured: true } : p))
          const featured = items
            .filter((p) => p.featured)
            .sort((a, b) => (a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0))
          if (featured.length > 2) {
            // Demote the OLDEST featured items (stable sort keeps equal
            // dates in insertion order) until only 2 remain.
            const toDemote = new Set(featured.slice(0, featured.length - 2).map((p) => p.id))
            items = items.map((p) => (toDemote.has(p.id) ? { ...p, featured: false } : p))
          }
          return { portfolioItems: items }
        }),

      setVisibility: (id, visibility) =>
        set((s) => ({
          portfolioItems: s.portfolioItems.map((p) => (p.id === id ? { ...p, visibility } : p)),
        })),

      resetDemo: () => set({ achievements: SEED_ACHIEVEMENTS, portfolioItems: SEED_PORTFOLIO_ITEMS }),
    }),
    {
      // TENANT-SCOPED persistence — each school gets its own namespace.
      // Only the data slices persist; actions live on the store instance.
      name: 'scholario-student-growth-v1',
      storage: createTenantScopedStorage('scholario-student-growth-v1'),
      version: 1,
      partialize: (s) => ({
        achievements: s.achievements,
        portfolioItems: s.portfolioItems,
      }) as StudentGrowthState,
    },
  ),
)

// ============================================================
// PURE HELPERS — every UI number comes from here.
// ============================================================

/** Canonical display order of the six growth categories. */
export const GROWTH_CATEGORIES: GrowthCategory[] = [
  'academic',
  'sports',
  'arts',
  'leadership',
  'participation',
  'learning',
]

/** Only the categories that actually have records (canonical order). */
export function categoriesOf(achievements: GrowthAchievement[]): GrowthCategory[] {
  return GROWTH_CATEGORIES.filter((c) => achievements.some((a) => a.category === c))
}

export interface GrowthTimelineMonth {
  /** YYYY-MM */
  monthKey: string
  /** e.g. "Sep 2026" */
  label: string
  /** Newest first within the month. */
  items: GrowthAchievement[]
}

/** Achievements grouped by month, newest month first. */
export function timelineOf(achievements: GrowthAchievement[]): GrowthTimelineMonth[] {
  const byMonth = new Map<string, GrowthAchievement[]>()
  for (const a of achievements) {
    const key = a.dateISO.slice(0, 7)
    const arr = byMonth.get(key) ?? []
    arr.push(a)
    byMonth.set(key, arr)
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([monthKey, items]) => ({
      monthKey,
      label: new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      items: [...items].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)),
    }))
}

/** Portfolio items of one kind (newest first). */
export function portfolioItemsOfKind(items: PortfolioItem[], kind: PortfolioKind): PortfolioItem[] {
  return items.filter((i) => i.kind === kind).sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1))
}

export interface SkillEvidence {
  title: string
  dateISO: string
  /** 'achievement' for achievements, the item's kind for portfolio items. */
  kind: string
}

export interface SkillSummary {
  skill: string
  evidence: SkillEvidence[]
}

/**
 * Skills aggregated from PortfolioItem.skills + GrowthAchievement.skills —
 * the evidence list is the set of real items/achievements carrying that
 * skill tag. NO skill scores anywhere (the Learning OS honesty rule).
 */
export function skillsWithEvidence(input: { achievements: GrowthAchievement[]; portfolioItems: PortfolioItem[] }): SkillSummary[] {
  const map = new Map<string, SkillEvidence[]>()
  const push = (skill: string, ev: SkillEvidence) => {
    const arr = map.get(skill) ?? []
    arr.push(ev)
    map.set(skill, arr)
  }
  for (const a of input.achievements) {
    for (const skill of a.skills) push(skill, { title: a.title, dateISO: a.dateISO, kind: 'achievement' })
  }
  for (const p of input.portfolioItems) {
    for (const skill of p.skills) push(skill, { title: p.title, dateISO: p.dateISO, kind: p.kind })
  }
  return [...map.entries()]
    .map(([skill, evidence]) => ({
      skill,
      evidence: [...evidence].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)),
    }))
    .sort((a, b) => b.evidence.length - a.evidence.length || a.skill.localeCompare(b.skill))
}
