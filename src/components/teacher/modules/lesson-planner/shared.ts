'use client'

/**
 * lesson-planner/shared — status config, calendar-day formatters and small
 * pure helpers for the Lesson Planner module. No fetching, no mock data:
 * every value that ends up on screen comes from the API payload (types in
 * ./api). Day-keys ("2026-09-17") are calendar dates, so they are parsed as
 * LOCAL midnight — never UTC — to keep date-fns formatting stable.
 */

import { format, isSameDay, isSameMonth } from 'date-fns'
import type { LessonPlanPayload, ScheduledTopic, TopicStatus, UnitProgress } from './api'

// ─── Status config ──────────────────────────────────────────────────────

export interface TopicStatusConfig {
  label: string
  /** Full chip recipe (base size — hero overrides via cn/tailwind-merge). */
  chip: string
}

/** Status chip tones: completed=emerald · today=amber · in-progress=sky ·
 * needs-rescheduling=rose · upcoming=muted. */
export const TOPIC_STATUS: Record<TopicStatus, TopicStatusConfig> = {
  completed: {
    label: 'Completed',
    chip: 'rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400',
  },
  today: {
    label: 'Today',
    chip: 'rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400',
  },
  'in-progress': {
    label: 'In progress',
    chip: 'rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400',
  },
  'needs-rescheduling': {
    label: 'Behind schedule',
    chip: 'rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400',
  },
  upcoming: {
    label: 'Upcoming',
    chip: 'rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground',
  },
}

/** Thin scrollbar utilities (scrollbar-width + webkit) — no global CSS needed. */
export const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent'

// ─── Calendar-day helpers ───────────────────────────────────────────────

/** "2026-09-17" → local-midnight Date (null when malformed). */
export function parseDayKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const d = new Date(`${key}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Today as a local calendar-day key ("2026-09-17"). */
export function todayKeyLocal(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** "2026-09-17" → "Thu, 17 Sep" (hero date heading). */
export function formatDayHeading(key: string): string {
  const d = parseDayKey(key)
  return d ? format(d, 'EEE, d MMM') : key
}

/** "2026-09-17" → "17 Sep". */
export function formatDayShort(key: string): string {
  const d = parseDayKey(key)
  return d ? format(d, 'd MMM') : key
}

/** "2026-04-01" → "1 Apr 2026" (schedule-basis session start). */
export function formatDayLong(key: string): string {
  const d = parseDayKey(key)
  return d ? format(d, 'd MMM yyyy') : key
}

/**
 * Compact scheduled window: "2026-09-11".."2026-09-17" → "11–17 Sep",
 * cross-month → "29 Sep – 3 Oct", single day → "17 Sep".
 */
export function formatDayRange(start: string, end: string): string {
  const s = parseDayKey(start)
  const e = parseDayKey(end)
  if (!s || !e) return '—'
  if (isSameDay(s, e)) return format(e, 'd MMM')
  if (isSameMonth(s, e)) return `${format(s, 'd')}–${format(e, 'd MMM')}`
  return `${format(s, 'd MMM')} – ${format(e, 'd MMM')}`
}

// ─── Unit grouping ──────────────────────────────────────────────────────

export interface UnitSection {
  key: string
  unitNo: number
  unitName: string
  topics: ScheduledTopic[]
}

/** Group scheduled topics into unit sections, preserving schedule order. */
export function groupByUnit(topics: ScheduledTopic[]): UnitSection[] {
  const map = new Map<string, UnitSection>()
  for (const t of topics) {
    const key = `${t.unitNo}|${t.unitName}`
    let section = map.get(key)
    if (!section) {
      section = { key, unitNo: t.unitNo, unitName: t.unitName, topics: [] }
      map.set(key, section)
    }
    section.topics.push(t)
  }
  return [...map.values()]
}

// ─── Optimistic completion ──────────────────────────────────────────────

/**
 * Pure optimistic toggle for ONE topic: flips its status/completedOn and
 * recomputes progress + unit counts so every visible number stays coherent
 * for the moment before the plan refetch lands (server = truth). Undoing a
 * completion restores "today" for the current topic (the scheduler would
 * re-derive it) and "upcoming" otherwise — the refetch corrects both.
 */
export function applyCompletion(
  plan: LessonPlanPayload,
  topicId: string,
  completed: boolean,
): LessonPlanPayload {
  const isTodayTopic = plan.today.topic?.id === topicId
  const nextStatus: TopicStatus = completed
    ? 'completed'
    : isTodayTopic
      ? 'today'
      : 'upcoming'

  const topics = plan.topics.map((t) =>
    t.id === topicId
      ? { ...t, status: nextStatus, completedOn: completed ? todayKeyLocal() : null }
      : t,
  )

  const completedCount = topics.filter((t) => t.status === 'completed').length
  const unitMap = new Map<string, UnitProgress>()
  for (const t of topics) {
    const key = `${t.unitNo}|${t.unitName}`
    const u = unitMap.get(key) ?? {
      unitNo: t.unitNo,
      unitName: t.unitName,
      total: 0,
      completed: 0,
    }
    u.total += 1
    if (t.status === 'completed') u.completed += 1
    unitMap.set(key, u)
  }

  const todayTopic = plan.today.topic
    ? (topics.find((t) => t.id === plan.today.topic?.id) ?? null)
    : null

  return {
    ...plan,
    topics,
    progress: {
      completed: completedCount,
      total: topics.length,
      pct:
        topics.length > 0
          ? Math.round((completedCount / topics.length) * 100)
          : 0,
    },
    units: [...unitMap.values()].sort((a, b) => a.unitNo - b.unitNo),
    today: { ...plan.today, topic: todayTopic },
  }
}
