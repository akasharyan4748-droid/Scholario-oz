'use client'

/**
 * ConfirmationSummary — Step 3 final confirmation (Spec §9 STEP 3).
 *
 * Concise summary of the examination configuration before the Principal
 * clicks "Create Examination" (the only action that triggers DB creation).
 * Shows a compact version of the timetable + key metadata.
 */

import { Calendar, Clock, BookOpen, Users, Layers } from 'lucide-react'
import type { ConsolidatedTimetable } from '@/lib/exams/schedule/consolidate'
import { formatDateLong } from '@/lib/exams/format-helpers'

interface Props {
  examName: string
  examType: string
  academicSession: string
  classCount: number
  subjectCount: number
  dateRangeLabel: string
  papersPerDay: number
  startTime: string
  timetable: ConsolidatedTimetable
}

interface SummaryRow {
  icon: React.ReactNode
  label: string
  value: string
}

export function ConfirmationSummary({
  examName,
  examType,
  academicSession,
  classCount,
  subjectCount,
  dateRangeLabel,
  papersPerDay,
  startTime,
  timetable,
}: Props) {
  const rows: SummaryRow[] = [
    { icon: <BookOpen className="h-3.5 w-3.5" />, label: 'Examination', value: examName },
    { icon: <Layers className="h-3.5 w-3.5" />, label: 'Type', value: examType },
    { icon: <Calendar className="h-3.5 w-3.5" />, label: 'Academic Session', value: academicSession },
    { icon: <Users className="h-3.5 w-3.5" />, label: 'Classes', value: `${classCount} class${classCount === 1 ? '' : 'es'}` },
    { icon: <BookOpen className="h-3.5 w-3.5" />, label: 'Subjects', value: `${subjectCount} active` },
    { icon: <Calendar className="h-3.5 w-3.5" />, label: 'Date Range', value: dateRangeLabel },
    { icon: <Clock className="h-3.5 w-3.5" />, label: 'Start Time', value: startTime },
    { icon: <Layers className="h-3.5 w-3.5" />, label: 'Papers per Day', value: String(papersPerDay) },
  ]

  return (
    <div className="space-y-5">
      {/* Summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2"
          >
            <span className="text-muted-foreground shrink-0">{r.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{r.label}</p>
              <p className="text-sm font-semibold text-foreground truncate">{r.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Compact timetable */}
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Final Timetable</p>
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto max-h-64">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-muted/40">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted/40 px-2 py-1.5 text-left font-semibold text-[9px] uppercase tracking-wider text-muted-foreground border-b border-r border-border min-w-[80px]">
                    Date
                  </th>
                  {timetable.columns.map((col) => (
                    <th key={col.gradeLevel} className="px-2 py-1.5 text-center font-semibold text-[9px] uppercase tracking-wider text-muted-foreground border-b border-r border-border/60 last:border-r-0 min-w-[100px]">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timetable.rows.map((row) => (
                  <tr key={`${row.date}-${row.slotIndex}`} className="hover:bg-muted/20">
                    <td className="sticky left-0 z-[1] bg-card px-2 py-1.5 align-top border-b border-r border-border">
                      <span className="text-[10px] text-muted-foreground">{row.dayLabel}</span>
                      <p className="text-[11px] font-semibold text-foreground tabular-nums">{formatDateLong(row.date)}</p>
                    </td>
                    {row.cells.map((cell, colIdx) => (
                      <td key={`${row.date}-${row.slotIndex}-${colIdx}`} className="border-b border-r border-border/60 last:border-r-0 px-2 py-1.5 text-center align-middle">
                        {cell ? (
                          <span className="text-[11px] font-medium text-foreground">{cell.label}</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/30">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Click <span className="font-semibold text-foreground">Create Examination</span> to save this examination as a Draft.
      </p>
    </div>
  )
}
