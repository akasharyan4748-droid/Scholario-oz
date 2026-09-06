'use client'

/**
 * EventDetailDialog — clean, focused read view for one calendar event,
 * rendered as an iOS glass card (strong frosted surface + blurred scrim).
 *
 * Progressive disclosure: the grid and lists stay light; full context
 * (date, time, location, notes, source) lives here and only appears
 * when the user asks for it by clicking an event.
 *
 * Events added at runtime (source 'user') can be removed from here —
 * the removal goes through `useCalendarStore.removeEvent` so the grid,
 * upcoming list and counts all stay consistent.
 */

import { Calendar, Clock, MapPin, NotebookText, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useCalendarStore, type CalendarEvent } from '@/lib/store/calendar-store'
import { SOURCE_META, formatFullDate, formatTimeLabel } from './data'
import { TypeBadge } from './primitives'

export interface EventDetailDialogProps {
  event: CalendarEvent | null
  onOpenChange: (open: boolean) => void
  /** Allow removing user-created events (principal/teacher). */
  canManage: boolean
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-foreground/[0.07] bg-foreground/[0.04] text-muted-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.4)] dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.07)]">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
        <p className="mt-0.5 text-[13px] font-medium leading-snug text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function EventDetailDialog({ event, onOpenChange, canManage }: EventDetailDialogProps) {
  const removeEvent = useCalendarStore((s) => s.removeEvent)
  const open = event !== null

  if (!event) {
    return <Dialog open={false} onOpenChange={onOpenChange} />
  }

  const isUserEvent = event.source === 'user'
  const description = event.description?.trim()

  const handleDelete = () => {
    removeEvent(event.id)
    onOpenChange(false)
    toast.success('Event removed', {
      description: `${event.title} · ${formatFullDate(event.date)}`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cal-glass-dialog cal-glass-strong max-w-[calc(100vw-1.5rem)] gap-0 rounded-2xl bg-transparent p-0 shadow-none sm:max-w-md">
        {/* Type + source */}
        <DialogHeader className="gap-2 px-5 pt-5 text-left sm:px-6 sm:pt-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={event.type} />
            <span className="inline-flex items-center rounded-full border border-foreground/[0.07] bg-foreground/[0.04] px-2 py-[3px] text-[10px] font-medium leading-none text-muted-foreground">
              {SOURCE_META[event.source]?.label ?? event.source}
            </span>
          </div>
          <DialogTitle className="pr-8 text-left text-lg leading-snug font-semibold tracking-tight">
            {event.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Event details for {event.title}
          </DialogDescription>
        </DialogHeader>

        {/* Meta */}
        <div className="space-y-3.5 px-5 py-4 sm:px-6">
          <MetaRow icon={Calendar} label="Date" value={formatFullDate(event.date)} />
          <MetaRow
            icon={Clock}
            label="Time"
            value={formatTimeLabel(event.time)}
          />
          {(event.location || event.source !== 'holiday') && (
            <MetaRow
              icon={MapPin}
              label="Location"
              value={event.location?.trim() || 'School Campus'}
            />
          )}
          {description && (
            <MetaRow icon={NotebookText} label="Notes" value={description} />
          )}
        </div>

        {isUserEvent && canManage && (
          <>
            <div className="mx-5 h-px bg-foreground/[0.08] sm:mx-6" aria-hidden />
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
              <p className="text-[11px] leading-tight text-muted-foreground">
                You added this event — it stays for this session.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 shrink-0 gap-1.5 rounded-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
