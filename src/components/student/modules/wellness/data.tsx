// Wellness module: shared config maps + tab type.
//
// No JSX render components live here — only the static maps (which hold small
// icon elements, hence the `.tsx` extension) and the `Tab` union type used by
// the orchestrator.

import {
  Droplets, Moon, Footprints, Activity, Smartphone, Brain,
} from 'lucide-react'

export type Tab = 'dashboard' | 'nutrition' | 'mood' | 'goals'

export const metricIcons: Record<string, React.ReactNode> = {
  water: <Droplets className="h-5 w-5" />,
  sleep: <Moon className="h-5 w-5" />,
  steps: <Footprints className="h-5 w-5" />,
  active: <Activity className="h-5 w-5" />,
  screen: <Smartphone className="h-5 w-5" />,
  meditation: <Brain className="h-5 w-5" />,
}

export const moodConfig = {
  energetic: { emoji: '⚡', label: 'Energetic', color: 'oklch(0.65 0.16 75)', bg: 'bg-amber-500/15' },
  happy: { emoji: '😄', label: 'Happy', color: 'oklch(0.55 0.14 162)', bg: 'bg-emerald-500/15' },
  calm: { emoji: '😊', label: 'Calm', color: 'oklch(0.7 0.15 200)', bg: 'bg-sky-500/15' },
  tired: { emoji: '😴', label: 'Tired', color: 'oklch(0.6 0.18 300)', bg: 'bg-violet-500/15' },
  stressed: { emoji: '😰', label: 'Stressed', color: 'oklch(0.62 0.2 25)', bg: 'bg-rose-500/15' },
}

export const goalCategoryConfig = {
  fitness: { color: 'from-emerald-500 to-teal-600', icon: '🏃' },
  nutrition: { color: 'from-amber-500 to-orange-600', icon: '🥗' },
  sleep: { color: 'from-violet-500 to-purple-600', icon: '😴' },
  mindfulness: { color: 'from-cyan-500 to-sky-600', icon: '🧘' },
}
