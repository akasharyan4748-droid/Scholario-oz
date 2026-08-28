'use client'

/**
 * Single source of truth for application category visuals (icon + accent
 * tone). Used by the Principal home, teacher forms and any record views —
 * one map, zero drift.
 */

import {
  Bus, CalendarDays, ClipboardList, FlaskConical, Landmark, Tag,
  Trophy, Tent, FileText, Award, HandHeart, Sparkles, type LucideIcon,
} from 'lucide-react'
import type { ApplicationCategory } from '@/lib/store/applications-store'
import { cn } from '@/lib/utils'

export const CATEGORY_ICON: Record<ApplicationCategory, LucideIcon> = {
  Tour: Bus,
  Trip: Bus,
  Workshop: FlaskConical,
  Competition: Trophy,
  Camp: Tent,
  Event: CalendarDays,
  'Exam Application': FileText,
  'Board Form': Landmark,
  Transport: Sparkles,
  Activity: CalendarDays,
  Certificate: Award,
  Donation: HandHeart,
  Custom: ClipboardList,
}

/** Subtle per-category accent — chip surfaces only, never large fills. */
export const CATEGORY_TONE: Record<ApplicationCategory, string> = {
  Tour: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Trip: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Workshop: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  Competition: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Camp: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Event: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  'Exam Application': 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'Board Form': 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  Transport: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  Activity: 'bg-lime-500/10 text-lime-700 dark:text-lime-300',
  Certificate: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  Donation: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
  Custom: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
}

export function CategoryChip({ category, className }: { category: ApplicationCategory; className?: string }) {
  const Icon = CATEGORY_ICON[category]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold', CATEGORY_TONE[category], className)}>
      <Icon className="h-2.5 w-2.5" />
      {category}
    </span>
  )
}

/** Tag fallback kept for older call sites. */
export const CategoryIcon = CATEGORY_ICON
export { Tag }
