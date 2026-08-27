import { BookOpen, Coffee, Sun, Utensils } from 'lucide-react'
import type { Period } from '@/lib/mock/academics'

export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
export const dayShort: Record<string, string> = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' }

export function periodMeta(p: Period) {
  if (p.subject === 'Assembly') return { icon: <Sun className="h-3.5 w-3.5" />, color: 'amber' }
  if (p.subject === 'Break') return { icon: <Coffee className="h-3.5 w-3.5" />, color: 'slate' }
  if (p.subject === 'Lunch') return { icon: <Utensils className="h-3.5 w-3.5" />, color: 'slate' }
  return { icon: <BookOpen className="h-3.5 w-3.5" />, color: 'primary' }
}

export const subjectColor: Record<string, string> = {
  Mathematics: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  English: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  Science: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  Hindi: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'Social Studies': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  'Computer Science': 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  'Art & Craft': 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
  Music: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
  Library: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'Physical Education': 'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30',
}
