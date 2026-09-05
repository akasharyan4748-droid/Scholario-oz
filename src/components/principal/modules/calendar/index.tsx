'use client'

/**
 * CalendarModule — Principal Calendar workspace.
 *
 * Thin role-wrapper around the shared premium `CalendarWorkspace`
 * (single calendar implementation for the whole app — no duplicate
 * systems). The Principal gets the full management experience:
 * Add Event, remove user-created events, filters, month navigation,
 * day details and event details.
 */

import { CalendarWorkspace } from '@/components/shared/calendar/calendar-workspace'

export function CalendarModule() {
  return <CalendarWorkspace canCreate />
}
