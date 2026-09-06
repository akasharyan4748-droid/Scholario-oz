'use client'

/**
 * AddEventDialog — focused, polished event creation, rendered as an
 * iOS glass card (strong frosted surface + blurred scrim).
 *
 * Only useful fields (spec): title, type, date, time (with an All-day
 * switch), optional location and optional notes. No technical fields.
 *
 * The type picker is a wrap-row of single-select glass pills carrying
 * the type dot — it doubles as a color preview and stays touch-friendly
 * on phones. Submitting goes through `useCalendarStore.addEvent` (the
 * same unified data source the grid reads), then the workspace
 * navigates to the event's month and selects the day so the new event
 * is immediately visible.
 */

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useCalendarStore, type CalendarEvent } from '@/lib/store/calendar-store'
import { ALL_TYPES, TYPE_TOKENS, typeColor } from './data'

export interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** ISO date used to prefill the form (selected day / month default). */
  defaultDate: string
  /** Called after the event is added — workspace navigates + selects. */
  onAdded: (event: CalendarEvent) => void
}

export function AddEventDialog({ open, onOpenChange, defaultDate, onAdded }: AddEventDialogProps) {
  const addEvent = useCalendarStore((s) => s.addEvent)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('Event')
  const [date, setDate] = useState(defaultDate)
  const [allDay, setAllDay] = useState(false)
  const [time, setTime] = useState('09:00')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [touched, setTouched] = useState(false)

  // Reset to a clean form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setTitle('')
      setType('Event')
      setDate(defaultDate)
      setAllDay(false)
      setTime('09:00')
      setLocation('')
      setNotes('')
      setTouched(false)
    }
  }, [open, defaultDate])

  const titleMissing = touched && !title.trim()

  const handleSubmit = () => {
    setTouched(true)
    const trimmed = title.trim()
    if (!trimmed) return

    const event = addEvent({
      date,
      title: trimmed,
      type,
      time: allDay ? '—' : time || '09:00',
      location: location.trim() || 'School Campus',
      description: notes.trim() || undefined,
    })

    toast.success('Event added', {
      description: `${trimmed} · ${allDay ? 'All day' : time}`,
    })

    onAdded(event)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cal-glass-dialog cal-glass-strong max-h-[92dvh] gap-0 overflow-y-auto rounded-2xl bg-transparent p-0 shadow-none sm:max-w-md">
        <DialogHeader className="space-y-1.5 px-5 pt-5 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="text-left">Add Event</DialogTitle>
          <DialogDescription>
            Create a school calendar event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4 sm:px-6">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="event-title" className="text-xs">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Day Function"
              autoFocus
              aria-invalid={titleMissing}
              className={cn(titleMissing && 'border-destructive/60 focus-visible:ring-destructive/20')}
            />
            {titleMissing && (
              <p className="text-[11px] text-destructive">Please give the event a title.</p>
            )}
          </div>

          {/* Type — single-select pills carrying the type color */}
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Event type">
              {ALL_TYPES.map((t) => {
                const selected = type === t
                const token = TYPE_TOKENS[t]
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setType(t)}
                    className={cn(
                      'flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.97]',
                      selected
                        ? cn(token.chipBg, token.text, 'cal-glass-chip')
                        : 'border-foreground/[0.09] bg-foreground/[0.03] text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground',
                    )}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: typeColor(t) }}
                      aria-hidden
                    />
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date + time */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Date <span className="text-destructive">*</span>
              </Label>
              <DatePicker value={date} onChange={setDate} placeholder="Select date" />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex h-9 items-center gap-2.5 rounded-lg border border-foreground/[0.08] bg-foreground/[0.03] px-3 shadow-[inset_0_1px_0_oklch(1_0_0/0.35)] dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.07)]">
                <Switch
                  id="all-day"
                  checked={allDay}
                  onCheckedChange={setAllDay}
                  aria-label="All day event"
                />
                <Label htmlFor="all-day" className="cursor-pointer text-xs text-muted-foreground">
                  All day
                </Label>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="event-time" className="text-xs">
                  Time
                </Label>
                <Input
                  id="event-time"
                  type="time"
                  value={time}
                  disabled={allDay}
                  onChange={(e) => setTime(e.target.value)}
                  className="disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="event-location" className="text-xs">
              Location <span className="font-normal text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="School Campus"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="event-notes" className="text-xs">
              Notes <span className="font-normal text-muted-foreground/60">(optional)</span>
            </Label>
            <Textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering about this event"
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-foreground/[0.08] px-5 py-4 sm:px-6">
          <Button variant="outline" className="rounded-full border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06]" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_-6px] shadow-primary/40 hover:bg-primary/90"
          >
            Add Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
