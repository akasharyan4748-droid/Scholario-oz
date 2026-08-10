'use client'

/**
 * CompactTimeControls — inline 12-hour AM/PM time selection controls.
 *
 * Brief section 2-4: ONE single compact time picker. NO nested popovers.
 * The controls render directly (select dropdowns for Hour/Minute/AM-PM).
 * The parent popover manages the open/close state.
 *
 * Brief section 5: All controls must fit inside the parent popover —
 * no overflow, no clipping.
 *
 * Brief section 18: Same component for Period, Short Break, Lunch Break,
 * and Auto Timetable school day config.
 */

/** Parse "08:30 AM" → { hour: 8, minute: 30, period: 'AM' } */
export function parseTime(timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return { hour: 8, minute: 30, period: 'AM' }
  return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10), period: match[3].toUpperCase() as 'AM' | 'PM' }
}

/** Format { hour, minute, period } → "08:30 AM" */
export function formatTime(hour: number, minute: number, period: 'AM' | 'PM'): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM']

export interface CompactTimeControlsProps {
  value: string
  onChange: (newTime: string) => void
  label?: string
}

/**
 * Renders Hour : Minute AM/PM selects directly — NO popover wrapper.
 * Used inside a parent popover (TimeEditor) or inline (Auto Timetable dialog).
 */
export function CompactTimeControls({ value, onChange, label }: CompactTimeControlsProps) {
  const parsed = parseTime(value)

  return (
    <div className="space-y-0.5">
      {label && <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>}
      <div className="flex items-center gap-0.5">
        <select
          value={parsed.hour}
          onChange={(e) => onChange(formatTime(Number(e.target.value), parsed.minute, parsed.period))}
          className="h-6 w-8 text-[10px] rounded border border-border bg-card px-0.5 outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          aria-label="Hour"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
          ))}
        </select>
        <span className="text-[10px] text-muted-foreground">:</span>
        <select
          value={parsed.minute}
          onChange={(e) => onChange(formatTime(parsed.hour, Number(e.target.value), parsed.period))}
          className="h-6 w-8 text-[10px] rounded border border-border bg-card px-0.5 outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          aria-label="Minute"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
        <select
          value={parsed.period}
          onChange={(e) => onChange(formatTime(parsed.hour, parsed.minute, e.target.value as 'AM' | 'PM'))}
          className="h-6 w-9 text-[10px] rounded border border-border bg-card px-0.5 outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          aria-label="AM/PM"
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

/**
 * CompactTimeTrigger — a button that displays a time value.
 * When clicked, the PARENT controls the popover open/close.
 * Brief section 19: Used in Auto Timetable dialog for School Day Start/End.
 */
export function CompactTimeTrigger({ value, onClick }: {
  value: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between h-8 px-2 rounded-lg border border-border bg-card text-[11px] font-mono tabular-nums text-foreground hover:border-primary/40 transition-colors min-w-[72px]"
    >
      {value}
    </button>
  )
}
