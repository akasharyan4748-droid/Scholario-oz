'use client'

/**
 * CompactTimeControls — premium 12-hour AM/PM time selection.
 *
 * ONE layer only — NO nested Popover. Renders directly inside the parent
 * TimeEditor popover or Auto Timetable dialog.
 *
 * Uses styled <select> elements with native arrow hidden — looks like
 * Scholario button controls, NOT browser-default selects.
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

const selectClass =
  'h-7 text-[11px] font-medium rounded-md border border-border bg-card px-1 outline-none ' +
  'focus:ring-1 focus:ring-primary/30 cursor-pointer transition-colors hover:border-primary/40 ' +
  'appearance-none [-webkit-appearance:none] [-moz-appearance:none] text-center text-foreground'

export interface CompactTimeControlsProps {
  value: string
  onChange: (newTime: string) => void
  label?: string
}

export function CompactTimeControls({ value, onChange, label }: CompactTimeControlsProps) {
  const p = parseTime(value)

  return (
    <div className="space-y-0.5">
      {label && <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>}
      <div className="flex items-center gap-0.5">
        {/* Hour */}
        <div className="relative">
          <select
            value={p.hour}
            onChange={(e) => onChange(formatTime(Number(e.target.value), p.minute, p.period))}
            className={`${selectClass} w-9 pl-1 pr-3`}
            aria-label="Hour"
          >
            {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
          </select>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-[7px]">▾</span>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">:</span>
        {/* Minute */}
        <div className="relative">
          <select
            value={p.minute}
            onChange={(e) => onChange(formatTime(p.hour, Number(e.target.value), p.period))}
            className={`${selectClass} w-9 pl-1 pr-3`}
            aria-label="Minute"
          >
            {MINUTES.map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-[7px]">▾</span>
        </div>
        {/* AM/PM */}
        <div className="relative">
          <select
            value={p.period}
            onChange={(e) => onChange(formatTime(p.hour, p.minute, e.target.value as 'AM' | 'PM'))}
            className={`${selectClass} w-10 pl-1 pr-3`}
            aria-label="AM/PM"
          >
            {PERIODS.map((per) => <option key={per} value={per}>{per}</option>)}
          </select>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-[7px]">▾</span>
        </div>
      </div>
    </div>
  )
}
