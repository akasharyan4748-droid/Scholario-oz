'use client'

import type { ReactNode } from 'react'
import { BookHeart, Smile, Target, Sparkles } from 'lucide-react'

// Tab definition type used by the Digital Diary module
export type Tab = 'entries' | 'mood' | 'goals' | 'reflections'

// Tab metadata used by the tab bar
export const diaryTabs: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'entries', label: 'My Journal', icon: <BookHeart className="h-3.5 w-3.5" /> },
  { id: 'mood', label: 'Mood Tracker', icon: <Smile className="h-3.5 w-3.5" /> },
  { id: 'goals', label: 'My Goals', icon: <Target className="h-3.5 w-3.5" /> },
  { id: 'reflections', label: 'Reflections', icon: <Sparkles className="h-3.5 w-3.5" /> },
]

// Goal category accent config (color gradient + emoji icon)
export const goalCategoryConfig = {
  academic: { color: 'from-violet-500 to-purple-600', icon: '🎓' },
  personal: { color: 'from-emerald-500 to-teal-600', icon: '🌟' },
  habit: { color: 'from-amber-500 to-orange-600', icon: '🔁' },
} as const

// Mood insights shown in the Mood Tracker tab
export const moodInsights = [
  { label: 'Happiest Day', value: 'Nov 28', sub: 'Maths + football 🎉', icon: '😄', color: 'from-emerald-500 to-teal-600' },
  { label: 'Most Common', value: 'Great', sub: '18 out of 38 days', icon: '✨', color: 'from-amber-500 to-orange-600' },
  { label: 'Improvement', value: '+12%', sub: 'mood vs last month', icon: '📈', color: 'from-violet-500 to-purple-600' },
]

// Weekday labels used by the mood calendar grid
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
