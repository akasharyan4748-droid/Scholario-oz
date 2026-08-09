'use client'

/**
 * FiltersBar — compact scheduling control bar.
 *
 * Brief section 14 + 15 + 44: RESTORE explicit All Rooms filter.
 *   [ All Classes ] [ All Faculty ] [ All Rooms ]
 *   NO generic "Filters" button.
 */
import { SegmentedTabs } from '../shared/segmented-tabs'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
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
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Primary filters: Class + Faculty + Room (all explicit) */}
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

        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
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

      {/* Day selector */}
      <SegmentedTabs
        tabs={DAYS.map((d) => ({ value: d, label: d.slice(0, 3) }))}
        value={selectedDay}
        onValueChange={(v) => setSelectedDay(v as DayType)}
      />
    </div>
  )
}
