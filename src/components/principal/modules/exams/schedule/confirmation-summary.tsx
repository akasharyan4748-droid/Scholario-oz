'use client'

/**
 * ConfirmationSummary — Step 3 final confirmation.
 *
 * Concise metadata grid of the examination configuration before the Principal
 * clicks "Create Examination". The canonical timetable is rendered separately
 * by <OfficialTimetable> — NOT duplicated here.
 */

import { Calendar, Clock, BookOpen, Users, Layers } from 'lucide-react'

interface Props {
  examName: string
  examType: string
  academicSession: string
  classCount: number
  subjectCount: number
  dateRangeLabel: string
  papersPerDay: number
  startTime: string
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
  )
}
