// Static data, types, and shared config for the Student Mentoring module.
//
// `Tab` is the union of valid tab ids rendered in the module's tab strip.
// `moodConfig` maps a Mentee.mood value to the emoji + label + status-badge
// color shown on the mentee card and detail dialog header. `moodEmojiMap`
// converts a SessionLog.moodBefore/After key into the emoji shown in the
// session log row.

export type Tab = 'mentees' | 'groups' | 'sessions'

export const moodConfig = {
  thriving: { emoji: '🌟', label: 'Thriving', color: 'text-emerald-600 bg-emerald-500/10', variant: 'success' as const },
  stable: { emoji: '🙂', label: 'Stable', color: 'text-sky-600 bg-sky-500/10', variant: 'info' as const },
  'needs-support': { emoji: '🤗', label: 'Needs Support', color: 'text-amber-600 bg-amber-500/10', variant: 'warning' as const },
}

export const moodEmojiMap: Record<string, string> = {
  happy: '😄', energetic: '⚡', calm: '😊', tired: '😴', stressed: '😰',
}
