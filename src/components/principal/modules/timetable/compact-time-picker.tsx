'use client'

/**
 * CompactTimeControls — premium 12-hour AM/PM time selection.
 * ONE seamless control (not 3 separate boxes). Uses styled <select> elements
 * inside a single bordered container with ONE chevron.
 *
 * ONE layer only — NO nested Popover. Renders directly inside the parent
 * TimeEditor popover or Auto Timetable dialog.
 */

export function parseTime(timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return { hour: 8, minute: 30, period: 'AM' }
  return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10), period: match[3].toUpperCase() as 'AM' | 'PM' }
}

export function formatTime(hour: number, minute: number, period: 'AM' | 'PM'): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM']

const innerSelectClass =
  'h-7 text-[11px] font-medium bg-transparent border-0 outline-none cursor-pointer ' +
  'appearance-none [-webkit-appearance:none] [-moz-appearance:none] text-center text-foreground ' +
  'hover:text-primary transition-colors px-0.5'

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
      {/* ONE seamless bordered container with 3 borderless selects + single chevron */}
      <div className="flex items-center h-7 rounded-md border border-border bg-card hover:border-primary/40 transition-colors overflow-hidden">
        <select
          value={p.hour}
          onChange={(e) => onChange(formatTime(Number(e.target.value), p.minute, p.period))}
          className={innerSelectClass}
          style={{ width: '26px' }}
          aria-label="Hour"
        >
          {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
        </select>
        <span className="text-[11px] text-muted-foreground font-medium -mx-0.5">:</span>
        <select
          value={p.minute}
          onChange={(e) => onChange(formatTime(p.hour, Number(e.target.value), p.period))}
          className={innerSelectClass}
          style={{ width: '26px' }}
          aria-label="Minute"
        >
          {MINUTES.map((m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
        </select>
        <select
          value={p.period}
          onChange={(e) => onChange(formatTime(p.hour, p.minute, e.target.value as 'AM' | 'PM'))}
          className={innerSelectClass}
          style={{ width: '32px' }}
          aria-label="AM/PM"
        >
          {PERIODS.map((per) => <option key={per} value={per}>{per}</option>)}
        </select>
        {/* Single chevron at the right edge of the container */}
        <span className="pointer-events-none pr-1.5 text-muted-foreground text-[8px]">▾</span>
      </div>
    </div>
  )
}
