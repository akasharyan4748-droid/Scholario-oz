'use client'

/**
 * actions — the ONE place Learning Hub resource actions and their feedback
 * live (spec §13 resource actions / §62 no dead buttons / §61 no fake stats).
 *
 * Every action writes the canonical `student-learning-store`; toasts report
 * what ACTUALLY happened (the real resulting percentage, the real task
 * created). Never XP, never fabricated AI insights.
 */

import { toast } from 'sonner'
import { useStudentLearningStore, type LearningResource } from '@/lib/store/student-learning-store'

/** Local-time YYYY-MM-DD — matches the store's task dueDate / session keys. */
export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** studyResource's default step (+25), mirrored for honest progress toasts. */
const STUDY_STEP = 25

export function useResourceActions() {
  const studyResource = useStudentLearningStore((s) => s.studyResource)
  const completeResource = useStudentLearningStore((s) => s.completeResource)
  const toggleBookmark = useStudentLearningStore((s) => s.toggleBookmark)
  const addTask = useStudentLearningStore((s) => s.addTask)

  return {
    /** Bump study progress; the toast reports the REAL resulting percentage. */
    study: (r: LearningResource) => {
      const current = useStudentLearningStore.getState().progress[r.id]?.pct ?? 0
      const next = Math.min(100, current + STUDY_STEP)
      studyResource(r.id)
      if (next >= 100) toast.success('Resource completed', { description: r.title })
      else toast.success(`Progress saved — ${next}%`, { description: r.title })
    },

    complete: (r: LearningResource) => {
      completeResource(r.id)
      toast.success('Marked complete', { description: r.title })
    },

    bookmark: (r: LearningResource) => {
      const wasSaved = useStudentLearningStore.getState().bookmarks.includes(r.id)
      toggleBookmark(r.id)
      if (wasSaved) toast.info('Removed from saved', { description: r.title })
      else toast.success('Saved for later', { description: r.title })
    },

    /** Resource → planner (the interconnected loop, §71). Lands on today. */
    addToPlanner: (r: LearningResource) => {
      addTask({
        title: r.title,
        subject: r.subject,
        topic: r.topic,
        type: 'study',
        priority: 'medium',
        durationMin: r.durationMin ?? 15,
        origin: 'resource',
        originRef: r.id,
      })
      toast.success("Added to today's plan", { description: r.title })
    },

    /** Weak-area revision topic → planner (§28 revision engine). */
    addRevision: (subject: string, topic: string) => {
      addTask({
        title: `Revise ${topic}`,
        subject,
        topic,
        type: 'revision',
        origin: 'revision',
        originRef: subject,
        durationMin: 15,
      })
      toast.success("Added to today's plan", { description: `Revise ${topic} · 15 min` })
    },
  }
}
