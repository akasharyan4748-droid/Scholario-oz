'use client'

/**
 * TimeEditor — ONE compact popover with Start + End time controls.
 * NO nested popovers. Uses CompactTimeControls directly.
 */
import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CompactTimeControls } from './compact-time-picker'

export function TimeEditor({ time, onSave }: {
  time: string
  onSave: (newTime: string) => void
}) {
  const [open, setOpen] = useState(false)
  const parts = time.split(' - ')
  const [start, setStart] = useState(parts[0] || '08:30 AM')
  const [end, setEnd] = useState(parts[1] || '09:15 AM')

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
          <CompactTimeControls label="Start" value={start} onChange={setStart} />
          <CompactTimeControls label="End" value={end} onChange={setEnd} />
        </div>
        <Button size="sm" className="w-full h-7 text-[10px] mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
          Done
        </Button>
      </PopoverContent>
    </Popover>
  )
}
