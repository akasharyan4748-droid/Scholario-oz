'use client'

/**
 * Learning (L2D) — shared client types mirroring the API contracts in
 * src/app/api/student/learning|flashcards|study-tasks|study-groups and
 * src/lib/learning.ts. Server is the source of truth; these types carry
 * ONLY what the routes actually return (no fabricated fields).
 */

export interface LearningMaterialCard {
  id: string
  title: string
  description: string | null
  subjectId: string | null
  subjectName: string | null
  className: string | null
  category: string
  status: string
  publishedAt: string | null
  originalName: string
  sizeBytes: number
  mimeType: string
  createdAt: string
  opened: boolean
  completed: boolean
  bookmarked: boolean
  lastOpenedAt: string | null
}

export interface LearningSubject {
  id: string
  name: string
  count: number
}

export interface LearningOverview {
  continueLearning: LearningMaterialCard | null
  forYou: LearningMaterialCard[]
  subjects: LearningSubject[]
  recent: LearningMaterialCard[]
  saved: LearningMaterialCard[]
  counts: {
    dueFlashcards: number
    activeTasks: number
    completedResources: number
  }
}

export interface LearningSearchResult {
  kind: 'material' | 'deck' | 'group' | 'task'
  id: string
  title: string
  subtitle: string
  tab?: string
}

export interface FlashcardDeckSummary {
  id: string
  name: string
  description: string | null
  subjectId: string | null
  subjectName: string | null
  totalCards: number
  dueCount: number
}

export interface FlashcardStudyCard {
  id: string
  front: string
  back: string
  position: number
  due: boolean
  dueAt: string | null
  intervalDays: number
  reps: number
}

export interface StudyTaskItem {
  id: string
  title: string
  subjectId: string | null
  subjectName: string | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
}

export interface StudyGroupSummary {
  id: string
  name: string
  description: string
  subjectId: string | null
  subjectName: string | null
  memberCount: number
  isMember: boolean
}

export interface StudyGroupQuestionItem {
  id: string
  question: string
  status: string
  createdAt: string
  isMine: boolean
  author: { name: string; classLabel: string | null } | null
}

export interface StudyGroupDetail {
  group: StudyGroupSummary
  questions: StudyGroupQuestionItem[]
  sharedResources: LearningMaterialCard[]
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'
