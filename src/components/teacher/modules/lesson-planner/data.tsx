// Static data, types, and shared config for the Lesson Planner module.
//
// `statusConfig` maps a LessonPlan.status value to the StatusBadge variant +
// icon + label rendered on the weekly plan cards. `aiSuggestions` powers the
// AI Suggestions panel in the curriculum tab.

import { Circle, PlayCircle, CheckCircle2 } from 'lucide-react'

export const statusConfig = {
  planned: { variant: 'info' as const, icon: <Circle className="h-3 w-3" />, label: 'Planned' },
  'in-progress': { variant: 'warning' as const, icon: <PlayCircle className="h-3 w-3" />, label: 'In Progress' },
  completed: { variant: 'success' as const, icon: <CheckCircle2 className="h-3 w-3" />, label: 'Completed' },
}

export const aiSuggestions = [
  { text: 'Schedule remedial for Subtraction (borrowing) — 3 students below 60%.', tag: 'Remedial', color: 'text-rose-600 bg-rose-500/10' },
  { text: 'Multiplication tables unit starts next week — prepare flashcards.', tag: 'Prep', color: 'text-amber-600 bg-amber-500/10' },
  { text: 'Shapes unit can be combined with Art class for cross-curricular.', tag: 'Idea', color: 'text-violet-600 bg-violet-500/10' },
]
