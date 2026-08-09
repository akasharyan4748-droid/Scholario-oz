'use client'

/**
 * FiltersBar — compact scheduling control bar.
 *
 * Brief section 3: Primary filters (Class / Faculty) prominent.
 *   Secondary filters (Room / Day) accessible via "Filters ▾" popover.
 *   Room is NOT removed — just visually secondary.
 *
 * Brief section 27: Day selector remains as SegmentedTabs (always visible
 *   because day navigation is fundamental to timetable viewing).
 */
import { Filter } from 'lucide-react'
import { SegmentedTabs } from '../shared/segmented-tabs'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { teachers } from '@/lib/mock/teachers'
import { CLASSES, DAYS, ROOMS, type DayType } from './data'

interface FiltersBarProps {
  selectedClass: string
  setSelectedClass: (v: string) => void
  selectedTeacher: string
  setSelectedTeacher: (v: string) => void
  selectedRoom: string
  setSelectedRoom: (v: string) => void
  selectedDay: DayType
  setSelectedDay: (d: DayType) => void
}

export function FiltersBar({
  selectedClass,
  setSelectedClass,
  selectedTeacher,
  setSelectedTeacher,
  selectedRoom,
  setSelectedRoom,
  selectedDay,
  setSelectedDay,
}: FiltersBarProps) {
  const hasSecondaryFilters = selectedRoom !== 'all'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Primary filters: Class + Faculty */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Faculty</SelectItem>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} · {t.department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Secondary filters popover (Room) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 text-xs gap-1.5 ${hasSecondaryFilters ? 'border-primary/40 text-primary' : ''}`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {hasSecondaryFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start" sideOffset={4}>
            <p className="text-[10px] font-semibold text-foreground mb-2">More Filters</p>
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Room / Lab</label>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger className="h-7 w-full text-[10px] mt-0.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {ROOMS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasSecondaryFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-[10px] mt-2"
                onClick={() => setSelectedRoom('all')}
              >
                Clear filters
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Day selector — always visible (primary navigation) */}
      <SegmentedTabs
        tabs={DAYS.map((d) => ({
          value: d,
          label: d.slice(0, 3),
        }))}
        value={selectedDay}
        onValueChange={(v) => setSelectedDay(v as DayType)}
      />
    </div>
  )
}
