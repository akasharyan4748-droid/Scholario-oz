'use client'

/**
 * attendance/month-records — the chronological record list (§28, gen 2).
 *
 * A scannable rhythm, not a stack of bordered cards: each row is a date
 * block + a status-coloured left accent + the marker, separated by
 * hairline dividers (§34/§35). Scoped to the navigated month — the same
 * month the calendar shows — and clicking a row selects that day in the
 * calendar above. The list itself stays quiet so the calendar stays the
 * visual hero.
 */

import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import type { StudentAttendanceRecord } from '@/lib/store/student-attendance-store'
import { statusToken } from './status-tokens'
import { formatShortDate, formatWeekday, monthLabel, formatRecordedAt, type MonthCursor } from './date-utils'

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
        <CalendarCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-bold tracking-tight text-foreground">Records</h3>
        <span className="ml-auto text-[11px] font-medium tabular-nums text-muted-foreground">
          {monthLabel(cursor)} · {records.length}/{workingDays}
        </span>
      </div>

      {records.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-xs font-semibold text-foreground/70">No attendance recorded in this month</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Records appear here as your teachers mark daily attendance.
          </p>
        </div>
      ) : (
        <>
          <ul
            className="m-0 -mr-1 mt-2 max-h-[26rem] list-none divide-y divide-border/60 overflow-y-auto p-0 pr-1 salary-scroll"
            aria-label={`Attendance records — ${monthLabel(cursor)}`}
          >
            {shown.map((r) => {
              const token = statusToken(r.status)
              const isSelected = r.date === selected
              const time = formatRecordedAt(r.markedAt)
              return (
                <li key={r.date} className="first:pt-0">
                  <button
                    type="button"
                    onClick={() => onSelect(r.date)}
                    aria-pressed={isSelected || undefined}
                    aria-label={`${formatShortDate(r.date)}, ${formatWeekday(r.date)} — ${token.aria}${r.markedBy ? `, marked by ${r.markedBy}` : ''}`}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected ? 'bg-muted/60' : 'hover:bg-muted/40',
                    )}
                  >
                    {/* Status accent — a quiet left rail in the status colour */}
                    <span className={cn('absolute bottom-2 left-0 top-2 w-[3px] rounded-full', token.dot)} aria-hidden />

                    <span className="min-w-0 shrink-0 pl-1.5">
                      <span className="block text-xs font-bold tabular-nums text-foreground">
                        {formatShortDate(r.date)}
                      </span>
                      <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-muted-foreground/80">
                        {formatWeekday(r.date)}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1 text-right">
                      {r.markedBy && (
                        <span className="block truncate text-[11px] font-medium text-foreground/75">{r.markedBy}</span>
                      )}
                      {time && (
                        <span className="block truncate text-[10px] tabular-nums text-muted-foreground/80">{time}</span>
                      )}
                    </span>

                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                        token.chip,
                      )}
                    >
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
