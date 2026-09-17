/**
 * lesson-planner-types — the pure DTO contract for the Lesson Planner
 * (Automatic Curriculum Execution). Client-safe: no server imports.
 *
 * MENTAL MODEL (v3 architecture):
 *   Teacher picks Class + Subject → the system loads the school's adopted
 *   curriculum, auto-generates the teaching schedule (timetable-driven,
 *   holiday-aware) and surfaces TODAY'S LESSON. The teacher teaches, taps
 *   "Mark completed", and progress updates. No manual plan authoring.
 */

/** The ONLY statuses the Lesson Planner may surface (spec §23). */
export type LessonDisplayStatus =
  | 'UPCOMING'
  | 'TODAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NEEDS_RESCHEDULING'

export interface ScheduledTopicDTO {
  /** ScheduledCurriculumTopic id — the target for start/complete/flag intents */
  id: string
  /** 1-based position in the course */
  sequence: number
  topicName: string
  unitName: string
  unitOrder: number
  topicOrder: number
  description: string | null
  estimatedMinutes: number
  minutesAllocated: number
  /** YYYY-MM-DD (school-local) — the school day the topic starts on */
  plannedDate: string
  status: LessonDisplayStatus
  startedAt: string | null
  /** YYYY-MM-DD the topic was actually completed on */
  completedOn: string | null
  /** YYYY-MM-DD the topic was originally planned on before a reschedule flag */
  rescheduledFrom: string | null
  flagReason: string | null
}

export interface CurriculumUnitDTO {
  unitOrder: number
  unitName: string
  totalTopics: number
  completedTopics: number
  /** 0–100, rounded */
  percent: number
  topics: ScheduledTopicDTO[]
}

export interface PacingInfo {
  /** TIMETABLE = real periods drive pacing · FALLBACK = minutesPerPeriod/day */
  source: 'TIMETABLE' | 'FALLBACK'
  periodsPerWeek: number | null
  minutesPerWeek: number
}

export interface CurriculumStatsDTO {
  totalTopics: number
  completedTopics: number
  percentComplete: number
  minutesTotal: number
  minutesCompleted: number
  /** YYYY-MM-DD the last pending topic is projected to finish on */
  projectedEndDate: string | null
  /** null = pace cannot be judged · true = at/ahead of plan · false = behind */
  onTrack: boolean | null
  /** topics the plan expected done by now but aren't */
  behindBy: number
}

export interface CurriculumDTO {
  id: string
  board: string
  session: string
  versionLabel: string
  /** YYYY-MM-DD — when teaching began (schedule anchor) */
  startDate: string
  stats: CurriculumStatsDTO
  pacing: PacingInfo
  /** THE hero: first unfinished topic planned for today (or overdue-today) */
  today: ScheduledTopicDTO | null
  /** further topics planned on the same day as `today` */
  todayAlso: ScheduledTopicDTO[]
  /** teacher-flagged "couldn't teach this" topics (badge + reason kept) */
  needsRescheduling: ScheduledTopicDTO[]
  /** next ~8 pending topics strictly after today's slot */
  upcoming: ScheduledTopicDTO[]
  /** last ~5 completed topics (most recent first) */
  recent: ScheduledTopicDTO[]
  units: CurriculumUnitDTO[]
}

export interface SelectedScopeDTO {
  classId: string
  classLabel: string
  subjectId: string
  subjectName: string
  curriculum: CurriculumDTO | null
  /** present only when the school has no curriculum for this class+subject */
  unavailable: { reason: string } | null
}

export interface LessonAssignmentDTO {
  classId: string
  classLabel: string
  subjectId: string
  subjectName: string
  subjectCode: string | null
  hasCurriculum: boolean
  /** topics planned today that are not completed yet (badge / summary) */
  pendingToday: number
}

export interface LessonPlannerPayload {
  assignments: LessonAssignmentDTO[]
  selected: SelectedScopeDTO | null
}

/** Lightweight badge payload (sidebar / dashboard). */
export interface LessonPlannerSummary {
  assignments: LessonAssignmentDTO[]
  totalPendingToday: number
}

export const LESSON_INTENTS = ['start', 'complete', 'undo', 'flag', 'unflag'] as const
export type LessonIntent = (typeof LESSON_INTENTS)[number]
