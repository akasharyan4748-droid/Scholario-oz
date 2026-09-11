'use client'

/**
 * attendance/month-records — the chronological record list (§13, §17, §22).
 *
 * Scoped to the navigated month (the same month the calendar shows — one
 * selection, no duplicated "recent" card, §24). Rows carry the day, its
 * weekday and the marker; clicking a row selects that day in the calendar.
 * A working-day summary keeps calendar days and school days distinct (§17).
 */

import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { StudentAttendanceRecord } from '@/lib/store/student-attendance-store'
import { statusToken } from './status-tokens'
import { formatShortDate, formatWeekday, monthLabel, type MonthCursor } from './date-utils'

const PREVIEW_COUNT = 8

interface MonthRecordsProps {
  cursor: MonthCursor
  records: StudentAttendanceRecord[] // this month's records, newest first
  workingDays: number
  selected: string | null
  onSelect: (iso: string) => void
}

export function MonthRecords({ cursor, records, workingDays, selected, onSelect }: MonthRecordsProps) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? records : records.slice(0, PREVIEW_COUNT)

  return (
    <GlassCard hover={false} className="on-card flex flex-col p-4 sm:p-5">
      <div className="mb-1 flex items-center gap-2">
        <CalendarCheck className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-sm font-bold tracking-tight text-foreground">Records</h3>
      </div>
      <p className="mb-3.5 text-xs text-muted-foreground">
        {monthLabel(cursor)} · {workingDays} school day{workingDays === 1 ? '' : 's'} · {records.length} recorded
      </p>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-xs font-semibold text-foreground/70">No attendance recorded in this month</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Records appear here as your teachers mark daily attendance.
          </p>
        </div>
      ) : (
        <>
          <ul className="m-0 -mr-1 max-h-[26rem] list-none space-y-1 overflow-y-auto p-0 pr-1 salary-scroll" aria-label={`Attendance records — ${monthLabel(cursor)}`}>
            {shown.map((r) => {
              const token = statusToken(r.status)
              const isSelected = r.date === selected
              return (
                <li key={r.date}>
                  <button
                    type="button"
                    onClick={() => onSelect(r.date)}
                    aria-pressed={isSelected || undefined}
                    aria-label={`${formatShortDate(r.date)}, ${formatWeekday(r.date)} — ${token.aria}${r.markedBy ? `, marked by ${r.markedBy}` : ''}`}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected ? 'border-primary/25 bg-muted/50' : 'hover:bg-muted/40',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold tabular-nums text-foreground">
                        {formatShortDate(r.date)}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                        {formatWeekday(r.date)}
                        {r.markedBy ? ` · ${r.markedBy}` : ''}
                      </span>
                    </span>
                    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold', token.chip)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', token.dot)} aria-hidden />
                      {token.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {records.length > PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2.5 w-full rounded-lg py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {expanded ? 'Show fewer' : `Show all ${records.length} records`}
            </button>
          )}
        </>
      )}
    </GlassCard>
  )
}
