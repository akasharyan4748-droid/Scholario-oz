'use client'

import {
  Trophy, BookOpen, Music, Users as UsersIcon, Sparkles, Zap,
} from 'lucide-react'
import type { PortfolioAchievement } from '@/lib/mock/portfolio'

export type Tab = 'showcase' | 'skills' | 'journey' | 'activities'

export const categoryConfig: Record<PortfolioAchievement['category'], { icon: React.ReactNode; color: string }> = {
  Academic: { icon: <BookOpen className="h-4 w-4" />, color: 'from-violet-500 to-purple-600' },
  Sports: { icon: <Trophy className="h-4 w-4" />, color: 'from-emerald-500 to-teal-600' },
  Cultural: { icon: <Music className="h-4 w-4" />, color: 'from-fuchsia-500 to-pink-600' },
  Leadership: { icon: <UsersIcon className="h-4 w-4" />, color: 'from-amber-500 to-orange-600' },
  Community: { icon: <Sparkles className="h-4 w-4" />, color: 'from-cyan-500 to-sky-600' },
  Skill: { icon: <Zap className="h-4 w-4" />, color: 'from-rose-500 to-red-600' },
}

export const levelConfig = {
  Class: { variant: 'neutral' as const, label: 'Class Level' },
  School: { variant: 'info' as const, label: 'School Level' },
  'Inter-School': { variant: 'primary' as const, label: 'Inter-School' },
  District: { variant: 'warning' as const, label: 'District Level' },
  State: { variant: 'success' as const, label: 'State Level' },
}
