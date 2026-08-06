// Shared constants for the student homework module.

export const subjectColors: Record<string, { bg: string; text: string; gradient: string }> = {
  Mathematics: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-400 to-purple-500' },
  English: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-400 to-teal-500' },
  Science: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500' },
  Hindi: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', gradient: 'from-rose-400 to-pink-500' },
  'Art & Craft': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', gradient: 'from-fuchsia-400 to-pink-500' },
}

// Track submission status per homework id
export const initialSubmitted: Record<string, boolean> = {
  HW004: true, // Closed — Hindi
}
