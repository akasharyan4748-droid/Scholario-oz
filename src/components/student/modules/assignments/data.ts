// Student Assignments — shared constants.
//
// Subject → color map used by the assignment cards and submission dialog header.

export const subjectColors: Record<string, { bg: string; text: string; gradient: string }> = {
  Mathematics: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-400 to-purple-500' },
  English: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-400 to-teal-500' },
  Science: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500' },
  'Social Studies': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-400 to-red-500' },
}

export function subjectColor(subject: string) {
  return subjectColors[subject] ?? subjectColors.English
}
