'use client'

/**
 * TimeEditor — ONE compact popover with Start + End time controls.
 *
 * Brief 1.7 + 1.8: Single-row time edit cascades to subsequent rows.
 *
 * Brief 1.6: When the user changes ONLY the start time, the end time shifts
 *   by the same delta — preserving the row's `durationMin`. This matches the
 *   brief's example: "If school starts 08:30 → Period 1 is 08:30–09:15".
 *   Changing start to 07:30 should yield 07:30–08:15 (same 45-min duration),
 *   not 07:30–09:15 (105-min duration).
 *
 *   When the user changes ONLY the end time, the start stays put — this DOES
 *   change the duration (intentional — used to lengthen/shorten one period).
 */
import { useState, useMemo } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CompactTimeControls } from './compact-time-picker'
import { parseTimeToMinutes, formatMinutesToTime } from './time-engine'

export function TimeEditor({ time, onSave }: {
  time: string
  onSave: (newTime: string) => void
}) {
  const [open, setOpen] = useState(false)
  const parts = time.split(' - ')
  const initialStart = parts[0] || '08:30 AM'
  const initialEnd = parts[1] || '09:15 AM'
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)

  // Brief 1.6: preserve the row's original duration when only the start moves.
  const originalDurationMin = useMemo(() => {
    const s = parseTimeToMinutes(initialStart)
    const e = parseTimeToMinutes(initialEnd)
    return Math.max(5, e - s)
  }, [initialStart, initialEnd])

  const handleStartChange = (newStart: string) => {
    setStart(newStart)
    // Shift end by the same delta — preserves durationMin.
    const newStartMin = parseTimeToMinutes(newStart)
    const newEndMin = newStartMin + originalDurationMin
    setEnd(formatMinutesToTime(newEndMin))
  }

  // Changing end time only updates end (intentional — used to resize period).
  const handleEndChange = (newEnd: string) => {
    setEnd(newEnd)
  }

  const handleSave = () => {
    onSave(`${start} - ${end}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-[9px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
          title="Edit time"
        >
          <Clock className="h-2.5 w-2.5" />
          {time}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start" sideOffset={4} collisionPadding={8}>
        <div className="flex items-center gap-3">
          <CompactTimeControls label="Start" value={start} onChange={handleStartChange} />
          <CompactTimeControls label="End" value={end} onChange={handleEndChange} />
        </div>
        <Button size="sm" className="w-full h-7 text-[10px] mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
          Done
        </Button>
      </PopoverContent>
    </Popover>
  )
}
