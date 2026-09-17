/**
 * curriculum-types — DTOs for the automated curriculum execution workspace.
 */

export type LessonExecutionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'POSTPONED' | 'SKIPPED'

export type LessonAction = 'start' | 'complete' | 'postpone' | 'skip'

/** one (class, subject) the teacher actively teaches */
export interface TeachingAssignmentRef {
  classId: string
  classLabel: string
  subjectId: string
  subjectName: string
}

export interface CurriculumRef {
  id: string
  board: string
  academicSession: string
  classLevel: string
  subjectName: string
  version: number
}

export interface ScheduledTopicDTO {
  id: string
  unitId: string
  unitTitle: string
  unitSequence: number
  sequence: number
  title: string
  estimatedMinutes: number
  learningOutcomes: string[]
  /** execution state; PLANNED = not yet touched */
  status: LessonExecutionStatus
  /** actual completion time (COMPLETED) */
  completedAt: string | null
  /** the teaching day this topic occupies — actual for completed, projected for upcoming */
  scheduledDate: string | null
  period: number | null
  isToday: boolean
  /** set when the topic was postponed from today to the next slot */
  postponedTo: { date: string; period: number | null } | null
}

export interface CurriculumUnitDTO {
  id: string
  sequence: number
  title: string
  estimatedMinutes: number
  topics: ScheduledTopicDTO[]
  completedTopics: number
}

export interface TodayLessonDTO {
  topic: ScheduledTopicDTO
  /** period number of today's slot */
  period: number
  slotMinutes: number
  /** PLANNED → startable; IN_PROGRESS → completable; COMPLETED → done state */
  state: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'POSTPONED'
  /** when POSTPONED — where the lesson moved */
  movedTo: { date: string; period: number | null } | null
  /** remaining lessons later today (later slots), for the completed state */
  nextLessonToday: { topicTitle: string; period: number } | null
}

export interface UpNextItemDTO {
  date: string
  kind: 'lesson' | 'holiday'
  /** lessons only */
  topic?: ScheduledTopicDTO
  period?: number | null
  slotMinutes?: number
  isToday?: boolean
  /** holidays only */
  holidayTitle?: string
}

export interface CurriculumExecutionPayload {
  teacherName: string
  today: string
  assignments: TeachingAssignmentRef[]
  /** number of the teacher's assignments with a lesson due today (sidebar badge) */
  dueTodayCount: number
  /** the selected context — null when the teacher has no assignments */
  selected: {
    classId: string
    classLabel: string
    subjectId: string
    subjectName: string
    curriculum: CurriculumRef | null
    timetable: {
      periodsPerWeek: number
      minutesPerWeek: number
      /** 'timetable' = real slots; 'default' = Mon–Fri 45 min/day fallback */
      source: 'timetable' | 'default'
    } | null
    todayLesson: TodayLessonDTO | null
    /** why today has no lesson, when todayLesson is null */
    todayNote: string | null
    upNext: UpNextItemDTO[]
    units: CurriculumUnitDTO[]
    progress: {
      completedTopics: number
      skippedTopics: number
      totalTopics: number
      remainingTopics: number
      percent: number
      completedMinutes: number
      totalMinutes: number
    }
  } | null
}
