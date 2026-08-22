'use client'

/**
 * AddEventDialog — real Add-Event form (audit fix #4).
 *
 * Changes vs. legacy:
 *   - On submit, calls `useCalendarStore.addEvent` (a real Zustand mutation)
 *     instead of just toasting "Event added". The new event is appended to
 *     the unified events list and the calendar grid re-renders to show it
 *     in the visible month + in the upcoming panel.
 *   - Defaults the date to the visible month's first day, the time to
 *     '09:00', and the type to 'Event'. These defaults make the form
 *     usable without forcing the user to type a date.
 *   - Validation now requires title + date; type is always set.
 *   - Location field added (optional). Defaults to 'School Campus'.
 *   - Closes the dialog and clears local form state on success.
 *   - On cancel, closes without mutating the store.
 */

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useCalendarStore } from '@/lib/store/calendar-store'
import { ALL_TYPES, MONTH_NAMES, pad } from './data'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Visible year/month, used to default the date picker. */
  year: number
  month: number
}

export function AddEventDialog({ open, onOpenChange, year, month }: Props) {
  const addEvent = useCalendarStore((s) => s.addEvent)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [type, setType] = useState<string>('Event')
  const [location, setLocation] = useState('School Campus')

  // Reset form whenever the dialog is opened.
  useEffect(() => {
    if (open) {
      setTitle('')
      // Default the date to the first day of the visible month.
      setDate(`${year}-${pad(month + 1)}-01`)
      setTime('09:00')
      setType('Event')
      setLocation('School Campus')
    }
  }, [open, year, month])

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      toast.error('Event title is required')
      return
    }
    if (!date) {
      toast.error('Event date is required')
      return
    }

    addEvent({
      date,
      title: trimmed,
      type,
      time: time || '09:00',
      location: location.trim() || 'School Campus',
    })

    toast.success('Event added', {
      description: `${trimmed} · ${type} · ${formatDateLabel(date)}`,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Add a custom event to the school calendar. User-added events appear in violet and persist for this session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Event Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Day Function"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <DatePicker value={date} onChange={setDate} placeholder="Select event date" />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Event Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Location (optional)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="School Campus"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            Add Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatDateLabel(dateStr: string): string {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return dateStr
  const monthIdx = parseInt(m[2], 10) - 1
  return `${parseInt(m[3], 10)} ${MONTH_NAMES[monthIdx]} ${m[1]}`
}
