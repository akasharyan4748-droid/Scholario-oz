'use client'

/**
 * CalendarModule — Student Calendar.
 *
 * Thin role-wrapper around the shared premium `CalendarWorkspace`.
 * Students get the same clean calendar (school events, exams,
 * holidays, filters, month navigation, day details) in read-only mode —
 * no Add Event, no event management. LR-1: no module heading — the
 * Notices tab bar above already says "Calendar"; the workspace's own
 * month navigation is the page's context.
 */

import { CalendarWorkspace } from '@/components/shared/calendar/calendar-workspace'

export function CalendarModule() {
  return <CalendarWorkspace canCreate={false} showHeading={false} />
}
