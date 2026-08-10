'use client'

/**
 * CompactTimePicker — premium 12-hour AM/PM time picker.
 *
 * Brief section 1 + 2: NO manual typing. Uses dropdown selectors for
 * Hour / Minute / AM-PM. 12-hour format with 5-minute increments.
 *
 * Brief section 3: Same component for Period, Short Break, Lunch Break.
 *
 * Brief section 14: Compact — same size as the current popover.
 */
import { useState, useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Parse "08:30 AM" → { hour: 8, minute: 30, period: 'AM' } */
function parseTime(timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return { hour: 8, minute: 30, period: 'AM' }
  return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10), period: match[3].toUpperCase() as 'AM' | 'PM' }
}

/** Format { hour, minute, period } → "08:30 AM" */
function formatTime(hour: number, minute: number, period: 'AM' | 'PM'): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM']

export function CompactTimePicker({ value, onChange, label }: {
  value: string
  onChange: (newTime: string) => void
  label?: string
}) {
  const parsed = parseTime(value)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-0.5">
      {label && <label className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full h-7 px-2 rounded-md border border-border bg-card text-[10px] text-foreground hover:border-primary/40 transition-colors"
          >
            <span className="font-mono tabular-nums">{value}</span>
            <ChevronDown className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-32 p-2" align="start" sideOffset={4}>
          <div className="flex items-center gap-1">
            {/* Hour selector */}
            <select
              value={parsed.hour}
              onChange={(e) => onChange(formatTime(Number(e.target.value), parsed.minute, parsed.period))}
              className="h-7 text-[10px] rounded border border-border bg-card px-1 outline-none focus:ring-1 focus:ring-primary/30"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-[10px] text-muted-foreground">:</span>
            {/* Minute selector */}
            <select
              value={parsed.minute}
              onChange={(e) => onChange(formatTime(parsed.hour, Number(e.target.value), parsed.period))}
              className="h-7 text-[10px] rounded border border-border bg-card px-1 outline-none focus:ring-1 focus:ring-primary/30"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
            {/* AM/PM selector */}
            <select
              value={parsed.period}
              onChange={(e) => onChange(formatTime(parsed.hour, parsed.minute, e.target.value as 'AM' | 'PM'))}
              className="h-7 text-[10px] rounded border border-border bg-card px-1 outline-none focus:ring-1 focus:ring-primary/30"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-full mt-2 h-6 text-[9px] rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * TimeRangePicker — Start + End time picker pair.
 * Brief section 1: Used inside the TimeEditor popover for period/break time editing.
 */
export function TimeRangePicker({ start, end, onChange }: {
  start: string
  end: string
  onChange: (start: string, end: string) => void
}) {
  return (
    <div className="space-y-2">
      <CompactTimePicker label="Start" value={start} onChange={(newStart) => onChange(newStart, end)} />
      <CompactTimePicker label="End" value={end} onChange={(newEnd) => onChange(start, newEnd)} />
    </div>
  )
}
