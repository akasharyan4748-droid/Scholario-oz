'use client'

// ============================================================
// BADGE RULES — real rules over real data, nothing stored
// ------------------------------------------------------------
// A badge is NEVER a persisted "earned" flag. Every rule here is
// evaluated LIVE against the canonical stores (learning /
// attendance / results), so a badge's state always reflects what
// the student has actually done — and changes the moment the
// underlying data changes.
//
// Thresholds are honest against the demo tenant's REAL seed:
//   · Consistent Learner  ≥ 3-day streak      → real streak ~15 → EARNED
//   · Deck Master         ≥ 5 cards mastered  → real 5          → EARNED
//   · Attendance Star     ≥ 90% attendance    → real 96%        → EARNED
//   · Weekly Focus        ≥ 120 min/week      → real ~185       → EARNED
//   · Science Explorer    ≥ 2 Science resources completed → real 1 → UNEARNED (real progress)
//   · Class Topper        rank #1 in any published assessment  → real best #3 of 18 → UNEARNED (real note)
//
// NO XP, no coins, no leaderboard, no daily quests — those
// concepts were removed with the old mock gamification module.
// ============================================================

import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Flame, Layers, CalendarCheck2, Timer, FlaskConical, Trophy } from 'lucide-react'
import {
  useStudentLearningStore,
  streakOf,
  weeklyMinutes,
  subjectStatsOf,
  type StudySession,
  type PlannerTask,
  type LearningCard,
  type StreakInfo,
  type SubjectStat,
} from '@/lib/store/student-learning-store'
import {
  useStudentAttendanceStore,
  computeStats,
  studentRecords,
  type AttendanceStats,
} from '@/lib/store/student-attendance-store'
import { useMyResults } from '@/lib/store/student-results-store'

// ─── Context (everything a rule may look at — all REAL data) ─────

export interface BadgeContext {
  sessions: StudySession[]
  tasks: PlannerTask[]
  cards: LearningCard[]
  /** streakOf(sessions) — session-day semantics. */
  streak: StreakInfo
  /** computeStats(studentRecords(records, 'STU-58')). */
  attendance: AttendanceStats
  /** subjectStatsOf(resources, progress, cards). */
  subjectStats: SubjectStat[]
  /** Learning resources completed (pct ≥ 100). */
  completedResources: number
  /** weeklyMinutes(sessions) — the last 7 days. */
  weeklyMinutes: number
  /** Latest published assessment (null when none). */
  latest: { assessmentName: string; pct: number; rank: number | null; classSize: number } | null
  /** Best rank across published assessments (null when none). */
  bestRank: { rank: number; classSize: number; assessmentName: string } | null
}

// ─── Rule types ───────────────────────────────────────────────────

export type BadgeTier = 'common' | 'rare' | 'epic'

export interface BadgeProgress {
  current: number
  goal: number
  unit: string
}

export interface BadgeEval {
  earned: boolean
  /** Earned-state line (dateless, factual). */
  earnedHint?: string
  /** Unearned-state progress, when the metric is additive. */
  progress?: BadgeProgress
  /** Unearned-state factual note, when a bar doesn't fit (e.g. rank). */
  note?: string
}

export interface BadgeRule {
  id: string
  name: string
  /** One-line statement of the rule (what earns it). */
  description: string
  tier: BadgeTier
  icon: LucideIcon
  evaluate: (ctx: BadgeContext) => BadgeEval
}

// ─── The rules ────────────────────────────────────────────────────

export const BADGE_RULES: BadgeRule[] = [
  {
    id: 'consistent-learner',
    name: 'Consistent Learner',
    description: 'Study at least 3 days in a row',
    tier: 'common',
    icon: Flame,
    evaluate: (ctx) => ({
      earned: ctx.streak.current >= 3,
      earnedHint: `${ctx.streak.current}-day study streak`,
      progress: { current: ctx.streak.current, goal: 3, unit: 'days in a row' },
    }),
  },
  {
    id: 'deck-master',
    name: 'Deck Master',
    description: 'Master 5 flashcards through spaced repetition',
    tier: 'rare',
    icon: Layers,
    evaluate: (ctx) => {
      const mastered = ctx.cards.filter((c) => c.status === 'mastered').length
      return {
        earned: mastered >= 5,
        earnedHint: `${mastered} cards mastered`,
        progress: { current: mastered, goal: 5, unit: 'cards mastered' },
      }
    },
  },
  {
    id: 'attendance-star',
    name: 'Attendance Star',
    description: 'Keep your attendance at 90% or above',
    tier: 'common',
    icon: CalendarCheck2,
    evaluate: (ctx) => ({
      earned: ctx.attendance.total > 0 && ctx.attendance.percent >= 90,
      earnedHint: `${ctx.attendance.percent}% attendance`,
      progress: { current: ctx.attendance.percent, goal: 90, unit: '% attendance' },
    }),
  },
  {
    id: 'weekly-focus',
    name: 'Weekly Focus',
    description: 'Study 120 minutes or more in a week',
    tier: 'common',
    icon: Timer,
    evaluate: (ctx) => ({
      earned: ctx.weeklyMinutes >= 120,
      earnedHint: `${ctx.weeklyMinutes} min studied this week`,
      progress: { current: ctx.weeklyMinutes, goal: 120, unit: 'min this week' },
    }),
  },
  {
    id: 'science-explorer',
    name: 'Science Explorer',
    description: 'Complete 2 Science resources from your learning hub',
    tier: 'common',
    icon: FlaskConical,
    evaluate: (ctx) => {
      const completed = ctx.subjectStats.find((s) => s.subject === 'Science')?.resourcesCompleted ?? 0
      return {
        earned: completed >= 2,
        progress: { current: completed, goal: 2, unit: 'Science resources completed' },
      }
    },
  },
  {
    id: 'class-topper',
    name: 'Class Topper',
    description: 'Rank #1 in any published assessment',
    tier: 'epic',
    icon: Trophy,
    evaluate: (ctx) => ({
      earned: ctx.bestRank != null && ctx.bestRank.rank === 1,
      earnedHint: ctx.bestRank ? `Ranked #1 — ${ctx.bestRank.assessmentName}` : undefined,
      note:
        ctx.bestRank != null
          ? `Best rank so far: #${ctx.bestRank.rank} of ${ctx.bestRank.classSize}`
          : ctx.latest != null && ctx.latest.rank != null
            ? `Latest rank: #${ctx.latest.rank} of ${ctx.latest.classSize}`
            : undefined,
    }),
  },
]

// ─── Live context (the ONLY place badges touch the stores) ────────

const BADGE_STUDENT_ID = 'STU-58'

export function useBadgeContext(): BadgeContext {
  const sessions = useStudentLearningStore((s) => s.sessions)
  const tasks = useStudentLearningStore((s) => s.tasks)
  const cards = useStudentLearningStore((s) => s.cards)
  const resources = useStudentLearningStore((s) => s.resources)
  const progress = useStudentLearningStore((s) => s.progress)
  const records = useStudentAttendanceStore((s) => s.records)
  const my = useMyResults()

  return useMemo(() => {
    const subjectStats = subjectStatsOf(resources, progress, cards)
    let bestRank: BadgeContext['bestRank'] = null
    for (const [assessmentId, list] of my.standings) {
      const mine = list.find((s) => s.isMe)
      if (!mine) continue
      if (bestRank == null || mine.rank < bestRank.rank) {
        const assessment = my.published.find((p) => p.id === assessmentId)
        bestRank = { rank: mine.rank, classSize: list.length, assessmentName: assessment?.name ?? assessmentId }
      }
    }
    return {
      sessions,
      tasks,
      cards,
      streak: streakOf(sessions),
      attendance: computeStats(studentRecords(records, BADGE_STUDENT_ID)),
      subjectStats,
      completedResources: resources.filter((r) => (progress[r.id]?.pct ?? 0) >= 100).length,
      weeklyMinutes: weeklyMinutes(sessions),
      latest: my.latest
        ? {
            assessmentName: my.latest.assessment.name,
            pct: Math.round(my.latest.totals.pct * 10) / 10,
            rank: my.latest.rank,
            classSize: my.latest.classSize,
          }
        : null,
      bestRank,
    }
  }, [sessions, tasks, cards, resources, progress, records, my.standings, my.published, my.latest])
}

export interface EvaluatedBadge extends BadgeRule {
  result: BadgeEval
}

/** Evaluate every rule against a context (pure — render-safe). */
export function evaluateBadges(rules: BadgeRule[], ctx: BadgeContext): EvaluatedBadge[] {
  return rules.map((rule) => ({ ...rule, result: rule.evaluate(ctx) }))
}
