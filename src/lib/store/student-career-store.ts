'use client'

// ============================================================
// STUDENT CAREER STORE — the canonical "Career Explorer" data layer
// ------------------------------------------------------------
// Backs the Careers tab of the Progress module. AGE-AWARE design
// (the demo student is Aarav Sharma, Class 2-A — a primary school
// class): the experience is about INTERESTS, ACTIVITIES, CURIOSITY
// and CAREER AWARENESS. There are NO subject streams, NO salaries,
// NO entrance exams, NO degree lists, NO invented scores anywhere in
// this store — and nothing here ever tells a child what they
// "should become".
//
// Two very different kinds of data live here:
//   · CAREER_CATALOG — STATIC seed content (the career
//     encyclopedia, like the book catalogue in a library). It is
//     NOT user data and never persists; it is not state at all.
//   · The student's OWN exploration state (interests chosen,
//     careers saved, careers actually opened) — tenant-scoped
//     persisted data, exactly like student-growth-store.
//
// HONESTY RULES (the Learning OS convention):
//   · `viewed` is the REAL exploration history — the demo seeds
//     are the demo student's genuine interaction history (5
//     careers opened over the last two weeks), not a fake
//     "Careers Explored 12" counter. Every count in the UI is
//     derived at render time (exploreCountOf).
//   · Recommendations are EXPLAINABLE (spec §35): every card
//     carries only real reasons — an interest the student picked,
//     a subject that is really among their strongest (from
//     student-results-store), a skill they have real evidence for
//     (from student-growth-store skillsWithEvidence), or a
//     related career they really saved. No opaque "AI suggests".
//
// Tenant-scoped persistence (lib/tenant/tenant-storage.ts): every
// school gets its own localStorage namespace.
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage, migrateLegacyScopedStore } from '@/lib/tenant/tenant-storage'
import { DEFAULT_TENANT_ID } from '@/lib/tenant/schools'

migrateLegacyScopedStore('scholario-student-career-v1', DEFAULT_TENANT_ID)

// ─── Date helpers (local-time, anchored to the real clock) ────────

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Types ────────────────────────────────────────────────────────

export type CareerField =
  | 'technology'
  | 'science'
  | 'design'
  | 'business'
  | 'healthcare'
  | 'arts'
  | 'sports'
  | 'public-service'

/**
 * One career in the encyclopedia. Simple language a 7–8 year old
 * understands; NO salaries, NO entrance exams, NO degree lists.
 */
export interface CareerEntry {
  id: string
  title: string
  field: CareerField
  /** 1–2 sentences, simple language. */
  whatTheyDo: string
  /** 3–4 ability tags (real growth-store skill tags appear where they fit). */
  skills: string[]
  /** School subjects that help (real Scholario subject names). */
  subjects: string[]
  /** Related careers in the catalog (ids). */
  relatedIds: string[]
}

export interface SavedCareer {
  careerId: string
  /** The student's own note about why they saved it. */
  note?: string
  savedOn: string
  /** "Still exploring" — the student is actively looking into it. */
  exploring: boolean
}

export interface ViewedCareer {
  careerId: string
  viewedOn: string
}

// ─── The career catalog (STATIC seed content — not user data) ─────

export const CAREER_CATALOG: CareerEntry[] = [
  {
    id: 'cr-doctor',
    title: 'Doctor',
    field: 'healthcare',
    whatTheyDo: 'Helps people when they are ill and finds ways to keep them healthy.',
    skills: ['Care for others', 'Patience', 'Asking good questions'],
    subjects: ['Science', 'English'],
    relatedIds: ['cr-vet', 'cr-scientist', 'cr-nurse'],
  },
  {
    id: 'cr-vet',
    title: 'Veterinarian',
    field: 'healthcare',
    whatTheyDo: 'A doctor for animals — checks pets and farm animals and treats them when they are sick.',
    skills: ['Care for animals', 'Patience', 'Observation'],
    subjects: ['Science', 'English'],
    relatedIds: ['cr-doctor', 'cr-farmer'],
  },
  {
    id: 'cr-nurse',
    title: 'Nurse',
    field: 'healthcare',
    whatTheyDo: 'Looks after patients every day — gives medicines, checks how they are, and comforts them.',
    skills: ['Care for others', 'Teamwork', 'Patience'],
    subjects: ['Science', 'English'],
    relatedIds: ['cr-doctor'],
  },
  {
    id: 'cr-scientist',
    title: 'Scientist',
    field: 'science',
    whatTheyDo: 'Asks questions about the world and tries experiments to find the answers.',
    skills: ['Experimentation', 'Research', 'Curiosity'],
    subjects: ['Science', 'Mathematics'],
    relatedIds: ['cr-astronomer', 'cr-farmer', 'cr-doctor'],
  },
  {
    id: 'cr-astronomer',
    title: 'Astronomer',
    field: 'science',
    whatTheyDo: 'Studies stars, moons and planets, and tries to understand space.',
    skills: ['Research', 'Curiosity', 'Observation'],
    subjects: ['Science', 'Mathematics'],
    relatedIds: ['cr-scientist', 'cr-pilot'],
  },
  {
    id: 'cr-farmer',
    title: 'Farmer',
    field: 'science',
    whatTheyDo: 'Grows the food we eat and looks after the soil, plants and animals on a farm.',
    skills: ['Observation', 'Care for nature', 'Hard work'],
    subjects: ['Science', 'Social Studies'],
    relatedIds: ['cr-scientist', 'cr-chef', 'cr-vet'],
  },
  {
    id: 'cr-software',
    title: 'Software Engineer',
    field: 'technology',
    whatTheyDo: 'Writes instructions that make computers and apps work, and fixes problems in them.',
    skills: ['Problem Solving', 'Logic', 'Typing & code'],
    subjects: ['Computer Science', 'Mathematics'],
    relatedIds: ['cr-gamedev', 'cr-scientist'],
  },
  {
    id: 'cr-gamedev',
    title: 'Video Game Developer',
    field: 'technology',
    whatTheyDo: 'Makes video games — designs the levels, the characters and the rules, then builds them on a computer.',
    skills: ['Problem Solving', 'Creativity', 'Teamwork'],
    subjects: ['Computer Science', 'Mathematics'],
    relatedIds: ['cr-software', 'cr-artist'],
  },
  {
    id: 'cr-pilot',
    title: 'Pilot',
    field: 'technology',
    whatTheyDo: 'Flies aeroplanes and carries people safely from one place to another.',
    skills: ['Focus', 'Teamwork', 'Mathematics thinking'],
    subjects: ['Mathematics', 'Science', 'Physical Education'],
    relatedIds: ['cr-astronomer'],
  },
  {
    id: 'cr-architect',
    title: 'Architect',
    field: 'design',
    whatTheyDo: 'Plans what buildings will look like and draws them so engineers can build them.',
    skills: ['Drawing', 'Imagination', 'Problem Solving'],
    subjects: ['Mathematics', 'Art & Craft'],
    relatedIds: ['cr-civil', 'cr-artist', 'cr-fashion'],
  },
  {
    id: 'cr-civil',
    title: 'Civil Engineer',
    field: 'design',
    whatTheyDo: 'Builds bridges, roads and big buildings, and makes sure they are strong and safe.',
    skills: ['Building models', 'Mathematics thinking', 'Teamwork'],
    subjects: ['Mathematics', 'Science'],
    relatedIds: ['cr-architect'],
  },
  {
    id: 'cr-fashion',
    title: 'Fashion Designer',
    field: 'design',
    whatTheyDo: 'Designs clothes — draws the ideas and chooses the cloth and colours.',
    skills: ['Drawing', 'Imagination', 'Craft'],
    subjects: ['Art & Craft', 'English'],
    relatedIds: ['cr-artist', 'cr-architect'],
  },
  {
    id: 'cr-artist',
    title: 'Artist & Illustrator',
    field: 'arts',
    whatTheyDo: 'Makes pictures — draws and paints stories, books and ideas.',
    skills: ['Drawing', 'Imagination', 'Observation'],
    subjects: ['Art & Craft', 'English'],
    relatedIds: ['cr-fashion', 'cr-architect', 'cr-gamedev'],
  },
  {
    id: 'cr-musician',
    title: 'Musician',
    field: 'arts',
    whatTheyDo: 'Plays and makes music, and practises every day to get better.',
    skills: ['Practising regularly', 'Listening', 'Performing'],
    subjects: ['Music', 'English'],
    relatedIds: ['cr-artist'],
  },
  {
    id: 'cr-journalist',
    title: 'Journalist & Writer',
    field: 'arts',
    whatTheyDo: 'Finds out true stories and writes them so everyone can read them.',
    skills: ['Creative Writing', 'Asking good questions', 'Reading'],
    subjects: ['English', 'Social Studies'],
    relatedIds: ['cr-teacher'],
  },
  {
    id: 'cr-chef',
    title: 'Chef',
    field: 'business',
    whatTheyDo: 'Cooks food for people and often runs the kitchen of a restaurant or bakery.',
    skills: ['Creativity', 'Cleanliness', 'Teamwork'],
    subjects: ['Science', 'Mathematics'],
    relatedIds: ['cr-farmer'],
  },
  {
    id: 'cr-shopkeeper',
    title: 'Shopkeeper & Business Owner',
    field: 'business',
    whatTheyDo: 'Runs a shop — buys things to sell, counts the money, and helps customers.',
    skills: ['Mathematics thinking', 'Organising', 'Talking to people'],
    subjects: ['Mathematics', 'Social Studies'],
    relatedIds: ['cr-chef'],
  },
  {
    id: 'cr-athlete',
    title: 'Athlete',
    field: 'sports',
    whatTheyDo: 'Trains almost every day to play a sport really well, and takes part in competitions.',
    skills: ['Athletics', 'Practising regularly', 'Teamwork'],
    subjects: ['Physical Education', 'Science'],
    relatedIds: ['cr-coach'],
  },
  {
    id: 'cr-coach',
    title: 'Sports Coach',
    field: 'sports',
    whatTheyDo: 'Teaches people how to play a sport better and plans their practice.',
    skills: ['Athletics', 'Explaining ideas', 'Leadership'],
    subjects: ['Physical Education', 'English'],
    relatedIds: ['cr-athlete', 'cr-teacher'],
  },
  {
    id: 'cr-teacher',
    title: 'Teacher',
    field: 'public-service',
    whatTheyDo: 'Helps children learn new things every day and plans the lessons.',
    skills: ['Explaining ideas', 'Presentation', 'Patience'],
    subjects: ['English', 'Social Studies'],
    relatedIds: ['cr-coach', 'cr-journalist'],
  },
  {
    id: 'cr-firefighter',
    title: 'Firefighter',
    field: 'public-service',
    whatTheyDo: 'Puts out fires and helps keep people safe in emergencies.',
    skills: ['Fitness', 'Teamwork', 'Staying calm'],
    subjects: ['Physical Education', 'Science'],
    relatedIds: ['cr-police'],
  },
  {
    id: 'cr-police',
    title: 'Police Officer',
    field: 'public-service',
    whatTheyDo: 'Keeps people safe, helps anyone in trouble, and makes sure everyone follows fair rules.',
    skills: ['Observation', 'Teamwork', 'Fitness'],
    subjects: ['Physical Education', 'Social Studies'],
    relatedIds: ['cr-firefighter'],
  },
]

/** Resolve a catalog career by id (null for unknown ids — never a guess). */
export function careerById(id: string): CareerEntry | null {
  return CAREER_CATALOG.find((c) => c.id === id) ?? null
}

// ─── Interest chips → career fields (static) ──────────────────────

/** ~10 relatable interest options a primary-school child understands. */
export const INTEREST_CHIPS: string[] = [
  'Building things',
  'Solving problems',
  'Helping people',
  'Creating art',
  'Explaining ideas',
  'Working with technology',
  'Being outdoors',
  'Organising things',
  'Stories and reading',
  'Numbers and patterns',
]

/** Each chip suggests 1–2 career fields. */
export const INTEREST_FIELDS: Record<string, CareerField[]> = {
  'Building things': ['design', 'technology'],
  'Solving problems': ['technology', 'science'],
  'Helping people': ['healthcare', 'public-service'],
  'Creating art': ['arts', 'design'],
  'Explaining ideas': ['public-service', 'arts'],
  'Working with technology': ['technology'],
  'Being outdoors': ['science', 'sports'],
  'Organising things': ['business', 'design'],
  'Stories and reading': ['arts'],
  'Numbers and patterns': ['science', 'business'],
}

/** Honest cap — a real interest picker, not a survey. */
export const MAX_INTERESTS = 5

// ─── Seed — the demo student's real exploration state ─────────────
// These are the demo student's genuine interactions (the same class
// of fact as the growth-store seeds), not invented counters.

const SEED_INTERESTS: string[] = [
  'Building things',
  'Solving problems',
  'Working with technology',
]

const SEED_SAVED: SavedCareer[] = [
  {
    careerId: 'cr-architect',
    note: 'Loves drawing buildings and bridges',
    savedOn: daysAgoISO(13),
    exploring: true,
  },
  {
    careerId: 'cr-software',
    note: 'Wants to try making a small game',
    savedOn: daysAgoISO(10),
    exploring: true,
  },
]

const SEED_VIEWED: ViewedCareer[] = [
  { careerId: 'cr-architect', viewedOn: daysAgoISO(13) },
  { careerId: 'cr-software', viewedOn: daysAgoISO(10) },
  { careerId: 'cr-astronomer', viewedOn: daysAgoISO(8) },
  { careerId: 'cr-civil', viewedOn: daysAgoISO(5) },
  { careerId: 'cr-gamedev', viewedOn: daysAgoISO(2) },
]

// ─── Store ────────────────────────────────────────────────────────

/** Rolling cap on the exploration history (most recent kept). */
const VIEWED_CAP = 30

interface StudentCareerState {
  interests: string[]
  saved: SavedCareer[]
  viewed: ViewedCareer[]

  /** Returns false (no change) when the cap would be exceeded. */
  toggleInterest: (chip: string) => boolean
  saveCareer: (careerId: string) => void
  removeSaved: (careerId: string) => void
  setNote: (careerId: string, note: string) => void
  toggleExploring: (careerId: string) => void
  recordView: (careerId: string) => void
  /** Dev/QA reset to the seeded demo state. */
  resetDemo: () => void
}

export const useStudentCareerStore = create<StudentCareerState>()(
  persist(
    (set) => ({
      interests: SEED_INTERESTS,
      saved: SEED_SAVED,
      viewed: SEED_VIEWED,

      toggleInterest: (chip) => {
        let changed = true
        set((s) => {
          if (s.interests.includes(chip)) {
            return { interests: s.interests.filter((c) => c !== chip) }
          }
          if (s.interests.length >= MAX_INTERESTS) {
            changed = false
            return s
          }
          return { interests: [...s.interests, chip] }
        })
        return changed
      },

      saveCareer: (careerId) =>
        set((s) =>
          s.saved.some((c) => c.careerId === careerId)
            ? s
            : { saved: [...s.saved, { careerId, savedOn: todayISO(), exploring: false }] },
        ),

      removeSaved: (careerId) => set((s) => ({ saved: s.saved.filter((c) => c.careerId !== careerId) })),

      setNote: (careerId, note) =>
        set((s) => ({
          saved: s.saved.map((c) => (c.careerId === careerId ? { ...c, note: note.trim() ? note : undefined } : c)),
        })),

      toggleExploring: (careerId) =>
        set((s) => ({
          saved: s.saved.map((c) => (c.careerId === careerId ? { ...c, exploring: !c.exploring } : c)),
        })),

      recordView: (careerId) =>
        set((s) => {
          const today = todayISO()
          // Dedupe same-day re-opens.
          if (s.viewed.some((v) => v.careerId === careerId && v.viewedOn === today)) return s
          const viewed = [...s.viewed, { careerId, viewedOn: today }]
          // Keep the most recent VIEWED_CAP entries.
          return { viewed: viewed.slice(Math.max(0, viewed.length - VIEWED_CAP)) }
        }),

      resetDemo: () => set({ interests: SEED_INTERESTS, saved: SEED_SAVED, viewed: SEED_VIEWED }),
    }),
    {
      // TENANT-SCOPED persistence — each school gets its own namespace.
      // Only the data slices persist; actions live on the store instance.
      name: 'scholario-student-career-v1',
      storage: createTenantScopedStorage('scholario-student-career-v1'),
      version: 1,
      partialize: (s) => ({
        interests: s.interests,
        saved: s.saved,
        viewed: s.viewed,
      }) as StudentCareerState,
    },
  ),
)

// ============================================================
// PURE HELPERS — every UI number comes from here.
// ============================================================

/** The distinct career fields suggested by the chosen interest chips (canonical order). */
export const FIELD_ORDER: CareerField[] = [
  'technology',
  'science',
  'design',
  'business',
  'healthcare',
  'arts',
  'sports',
  'public-service',
]

export function fieldsOfInterests(interests: string[]): CareerField[] {
  const set = new Set<CareerField>()
  for (const chip of interests) {
    for (const f of INTEREST_FIELDS[chip] ?? []) set.add(f)
  }
  return FIELD_ORDER.filter((f) => set.has(f))
}

export interface RecentViewed {
  careerId: string
  /** The date of the MOST RECENT view of that career. */
  viewedOn: string
}

/**
 * Deduped recent careers, newest view first (the second open of a
 * career refreshes its position — real history, not a log dump).
 */
export function recentOf(viewed: ViewedCareer[], n: number): RecentViewed[] {
  const byCareer = new Map<string, RecentViewed>()
  for (const v of [...viewed].sort((a, b) => (a.viewedOn < b.viewedOn ? -1 : 1))) {
    byCareer.set(v.careerId, { careerId: v.careerId, viewedOn: v.viewedOn })
  }
  return [...byCareer.values()]
    .sort((a, b) => (a.viewedOn < b.viewedOn ? 1 : -1))
    .slice(0, n)
}

/** The honest "explored" count — distinct careers ever opened. */
export function exploreCountOf(viewed: ViewedCareer[]): number {
  return new Set(viewed.map((v) => v.careerId)).size
}

// ─── Explainable recommendations (spec §35) ───────────────────────

export interface RecommendationReason {
  /** "Because …" — one short, honest line. */
  text: string
}

export interface CareerRecommendation {
  career: CareerEntry
  reasons: RecommendationReason[]
}

export interface RecommendationInput {
  interests: string[]
  saved: SavedCareer[]
  /** Top strongest subject NAMES from the latest published result (student-results-store). */
  strongestSubjects: string[]
  /** Skill tags with real evidence (student-growth-store skillsWithEvidence). */
  skillTags: string[]
}

/**
 * Explainable recommendations — max 3, ranked by the number of real
 * reasons, then catalog order. Already-saved careers are excluded
 * (recommendations suggest something NEW to explore). Every reason
 * is derived from real data the student can verify — never an
 * opaque "AI suggests".
 */
export function recommendationsFor(input: RecommendationInput): CareerRecommendation[] {
  if (input.interests.length === 0) return []

  const savedIds = new Set(input.saved.map((s) => s.careerId))
  const fields = new Set(fieldsOfInterests(input.interests))

  const scored: CareerRecommendation[] = []
  for (const career of CAREER_CATALOG) {
    if (savedIds.has(career.id)) continue
    const reasons: RecommendationReason[] = []

    // 1. Interest chips the student picked that point at this field.
    for (const chip of input.interests) {
      if ((INTEREST_FIELDS[chip] ?? []).includes(career.field)) {
        reasons.push({ text: `Because you picked “${chip}”` })
      }
    }
    // 2. Real strongest subjects (from the latest published result).
    for (const subject of input.strongestSubjects) {
      if (career.subjects.includes(subject)) {
        reasons.push({ text: `Because ${subject} is one of your strongest subjects` })
      }
    }
    // 3. Skill tags the student has real evidence for.
    for (const skill of input.skillTags) {
      if (career.skills.includes(skill)) {
        reasons.push({ text: `Because you’ve shown ${skill} in your work` })
      }
    }
    // 4. A related career the student already saved.
    for (const saved of input.saved) {
      if (career.relatedIds.includes(saved.careerId)) {
        const related = careerById(saved.careerId)
        if (related) {
          reasons.push({ text: `Because it’s related to ${related.title} — which you saved` })
        }
      }
    }

    // Dedupe identical reason lines (e.g. two chips hitting the same phrasing).
    const seen = new Set<string>()
    const unique: RecommendationReason[] = []
    for (const r of reasons) {
      if (!seen.has(r.text)) {
        seen.add(r.text)
        unique.push(r)
      }
    }
    if (unique.length > 0) scored.push({ career, reasons: unique })
  }

  return scored
    .sort((a, b) => b.reasons.length - a.reasons.length || CAREER_CATALOG.indexOf(a.career) - CAREER_CATALOG.indexOf(b.career))
    .slice(0, 3)
}
