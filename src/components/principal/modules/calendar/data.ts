import { calendarEvents } from '@/lib/mock/operations'

// Event type colors — per spec: Exam=red, Event=emerald, Holiday=amber, Meeting=violet, Competition=cyan
export const TYPE_COLORS: Record<string, string> = {
  Exam: 'oklch(0.62 0.2 25)',
  Event: 'oklch(0.55 0.14 162)',
  Holiday: 'oklch(0.7 0.16 75)',
  Meeting: 'oklch(0.6 0.18 300)',
  Competition: 'oklch(0.7 0.15 200)',
  Cultural: 'oklch(0.55 0.16 250)',
  General: 'oklch(0.55 0.02 160)',
}

export const ALL_TYPES = ['Exam', 'Event', 'Holiday', 'Meeting', 'Competition', 'Cultural', 'General']

// Build December 2025 calendar (1 = Sunday)
// Dec 1, 2025 = Sunday
export const YEAR = 2025
export const MONTH = 11 // 0-indexed = December
export const FIRST_DAY = new Date(YEAR, MONTH, 1).getDay() // 0 (Sunday)
export const DAYS_IN_MONTH = new Date(YEAR, MONTH + 1, 0).getDate() // 31

export const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }

export function dateStr(day: number) {
  return `${YEAR}-${pad(MONTH + 1)}-${pad(day)}`
}

export type CalendarEvent = (typeof calendarEvents)[number]
