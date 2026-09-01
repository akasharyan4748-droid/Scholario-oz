"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format, parseISO } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Optional map of YYYY-MM-DD → state label, used to render subtle day
 * indicators inside the calendar popover (Brief §13 — show the selected
 * date's state without overloading the calendar).
 *
 * Example:
 *   { '2025-12-08': 'submitted', '2025-12-10': 'draft' }
 */
export type DayState = 'submitted' | 'draft' | 'empty'

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange?: (dateString: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  compact?: boolean
  /** Map of YYYY-MM-DD → DayState — renders a subtle dot under each known day. */
  dayStateMap?: Record<string, DayState>
  /** Max selectable date (YYYY-MM-DD). Future dates beyond this are disabled. */
  maxDate?: string
  /** Min selectable date (YYYY-MM-DD). */
  minDate?: string
}

const STATE_DOT_COLOR: Record<DayState, string> = {
  submitted: 'bg-emerald-500',
  draft: 'bg-amber-500',
  empty: 'bg-muted-foreground/40',
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled = false,
  id,
  compact = false,
  dayStateMap,
  maxDate,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    try {
      const parsed = parseISO(value)
      return isNaN(parsed.getTime()) ? undefined : parsed
    } catch {
      return undefined
    }
  }, [value])

  // Build disabled date matcher for max/min
  const disabledMatcher = React.useMemo(() => {
    const max = maxDate ? parseISO(maxDate) : null
    const min = minDate ? parseISO(minDate) : null
    if (!max && !min) return undefined
    return (date: Date) => {
      if (max && date > max) return true
      if (min && date < min) return true
      return false
    }
  }, [maxDate, minDate])

  // Custom DayButton renders the day number + a subtle state dot if known.
  const CustomDayButton = React.useCallback(
    ({ day, ...props }: any) => {
      const dateStr = format(day.date, 'yyyy-MM-dd')
      const state = dayStateMap?.[dateStr]
      return (
        <button {...props} className={cn(props.className, 'relative')}>
          {day.date.getDate()}
          {state && (
            <span
              className={cn(
                'absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full',
                STATE_DOT_COLOR[state]
              )}
              aria-hidden
            />
          )}
        </button>
      )
    },
    [dayStateMap]
  )

  const handleSelect = (date?: Date) => {
    if (date) {
      const formatted = format(date, "yyyy-MM-dd")
      onChange?.(formatted)
    } else {
      onChange?.("")
    }
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal border-input bg-background/80 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all",
            compact ? "h-8 px-2.5 text-xs rounded-lg" : "h-9 px-3 text-sm rounded-lg",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className={cn("shrink-0 text-muted-foreground", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            <span className="truncate">
              {selectedDate ? format(selectedDate, "PPP") : placeholder}
            </span>
          </div>
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="ml-1 shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        className="z-[9999] w-auto p-2 bg-popover/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          captionLayout="dropdown"
          disabled={disabledMatcher}
          components={dayStateMap ? { DayButton: CustomDayButton } : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
