'use client'

/**
 * OfficialTimetable — Step 2 preview (Spec §9 / §10 / §11).
 *
 * Renders the consolidated examination timetable as an official school
 * document. No drag/drop — this is a read-only presentation suitable for
 * eventual print/export.
 *
 * Header hierarchy:
 *   SCHOOL NAME
 *   EXAMINATION NAME
 *   Academic Session 2025–26
 *   EXAMINATION TIMETABLE
 *
 * Table:
 *   DAY / DATE | CLASS 6 | CLASS 8 | ... | CLASS 11 | CLASS 12
 *   with consolidated cells ("Maths / Biology" where streams differ).
 */

import { useMemo } from 'react'
import { GraduationCap, CalendarDays, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConsolidatedTimetable } from '@/lib/exams/schedule/consolidate'
import type { ScheduleRow } from '@/lib/exams/schedule/schedule-types'
import { formatDateLong } from '@/lib/exams/format-helpers'

export interface OfficialTimetableProps {
  timetable: ConsolidatedTimetable
  schoolName: string
  examName: string
  examType: string
  academicSession: string
  dateRangeLabel: string
  startTime: string
  papersPerDay: number
}

interface DateGroup {
  date: string
  dayLabel: string
  rows: Array<Omit<ScheduleRow, 'cells'> & { cells: ConsolidatedTimetable['rows'][number]['cells'] }>
}

function groupRowsByDate(
  rows: ConsolidatedTimetable['rows'],
): DateGroup[] {
  const groups: DateGroup[] = []
  for (const row of rows) {
    const last = groups[groups.length - 1]
    if (last && last.date === row.date) {
      last.rows.push(row)
    } else {
      groups.push({ date: row.date, dayLabel: row.dayLabel, rows: [row] })
    }
  }
  return groups
}

export function OfficialTimetable({
  timetable,
  schoolName,
  examName,
  examType,
  academicSession,
  dateRangeLabel,
  startTime,
  papersPerDay,
}: OfficialTimetableProps) {
  const dateGroups = useMemo(() => groupRowsByDate(timetable.rows), [timetable.rows])

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
      {/* ─── Document Header ─────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-border bg-gradient-to-br from-muted/40 to-transparent">
        <div className="flex items-center gap-2.5 mb-1">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold tracking-tight text-foreground">{schoolName}</h1>
        </div>
        <div className="ml-7.5 space-y-0.5">
          <p className="text-base font-semibold text-foreground">{examName}</p>
          <p className="text-xs text-muted-foreground">
            Academic Session {academicSession} · {examType}
          </p>
        </div>
        <div className="ml-7.5 mt-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="font-medium">{dateRangeLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">{startTime} · {papersPerDay} paper{papersPerDay === 1 ? '' : 's'}/day</span>
          </div>
        </div>
        <h2 className="ml-7.5 mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Examination Timetable
        </h2>
      </div>

      {/* ─── Timetable Table ──────────────────────────────────────────── */}
      {timetable.rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No examination dates in the selected window.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/30">
                <th className="sticky left-0 z-10 bg-muted/30 px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-r border-border min-w-[100px]">
                  Day / Date
                </th>
                {timetable.columns.map((col) => (
                  <th
                    key={col.gradeLevel}
                    className="px-3 py-2.5 text-center font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-r border-border/60 last:border-r-0 min-w-[120px]"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dateGroups.map((group) => (
                group.rows.map((row, slotWithinGroup) => (
                  <tr key={`${row.date}-${row.slotIndex}`} className="hover:bg-muted/20 transition-colors">
                    {/* Day/Date cell — row-spans across slots for this date */}
                    {slotWithinGroup === 0 && (
                      <td
                        rowSpan={group.rows.length}
                        className="sticky left-0 z-[1] bg-card px-3 py-3 align-top border-b border-r border-border"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-medium uppercase text-muted-foreground">{row.dayLabel}</span>
                          <span className="text-sm font-semibold text-foreground tabular-nums">{formatDateLong(row.date)}</span>
                          {group.rows.length > 1 && (
                            <span className="text-[9px] text-muted-foreground/70">
                              {group.rows.length} slots
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    {/* Subject cells — one per consolidated column */}
                    {row.cells.map((cell, colIdx) => (
                      <td
                        key={`${row.date}-${row.slotIndex}-${colIdx}`}
                        className="border-b border-r border-border/60 last:border-r-0 px-3 py-2.5 align-middle"
                      >
                        {cell ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-medium text-foreground text-center leading-tight">
                              {cell.label}
                            </span>
                            {cell.subjects.length > 0 && (
                              <span className="text-[9px] text-muted-foreground/70 font-mono">
                                {cell.subjects.map((s) => s.code).join(' / ')}
                              </span>
                            )}
                            {papersPerDay > 1 && (
                              <span className="text-[9px] text-muted-foreground/60 tabular-nums mt-0.5">
                                {row.startTime}–{row.endTime}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-[10px] text-muted-foreground/30">—</div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10px] text-muted-foreground">
          {timetable.rows.length} examination slot{timetable.rows.length === 1 ? '' : 's'} · Sundays skipped
        </p>
        <p className="text-[10px] text-muted-foreground/70 italic">
          Official examination timetable — generated by Scholario-OS
        </p>
      </div>
    </div>
  )
}
