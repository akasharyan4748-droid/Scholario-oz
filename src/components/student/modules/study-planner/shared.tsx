import type { StudyTask } from '@/lib/mock/study-planner'

export type Tab = 'tasks' | 'schedule' | 'pomodoro'

export const priorityConfig: Record<StudyTask['priority'], string> = {
  high: 'bg-rose-500/15 text-rose-600',
  medium: 'bg-amber-500/15 text-amber-600',
  low: 'bg-muted text-muted-foreground',
}

export const typeIcons: Record<string, string> = {
  Homework: '📝', Revision: '🔄', Project: '🔬', Reading: '📚', Practice: '✏️',
}

export const FOCUS_DURATION = 25 * 60
export const BREAK_DURATION = 5 * 60
