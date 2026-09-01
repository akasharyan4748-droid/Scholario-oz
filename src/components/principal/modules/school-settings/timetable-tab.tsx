'use client'

// Timetable tab — school day timing parameters used by the automatic
// schedule generator and attendance period engine. Backed by store.timetable.

import { Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { SettingsTab } from './shared'

export function TimetableTab() {
  const store = useSchoolSettingsStore()

  return (
    <SettingsTab
      icon={Clock}
      title="Timetable Engine Parameters"
      description="Parameters required for automatic schedule generation and attendance periods."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        <div>
          <Label className="text-xs font-semibold mb-1 block">School Start Time</Label>
          <Input
            value={store.timetable.startTime}
            onChange={(e) => store.updateTimetable({ startTime: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">School End Time</Label>
          <Input
            value={store.timetable.endTime}
            onChange={(e) => store.updateTimetable({ endTime: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Period Duration (Minutes)</Label>
          <Input
            type="number"
            value={store.timetable.periodDurationMinutes}
            onChange={(e) => store.updateTimetable({ periodDurationMinutes: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Lunch Break Start</Label>
          <Input
            value={store.timetable.lunchBreakStart}
            onChange={(e) => store.updateTimetable({ lunchBreakStart: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Lunch Break Duration (Mins)</Label>
          <Input
            type="number"
            value={store.timetable.lunchBreakDurationMinutes}
            onChange={(e) => store.updateTimetable({ lunchBreakDurationMinutes: Number(e.target.value) })}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold mb-1 block">Morning Assembly Duration (Mins)</Label>
          <Input
            type="number"
            value={store.timetable.assemblyDurationMinutes}
            onChange={(e) => store.updateTimetable({ assemblyDurationMinutes: Number(e.target.value) })}
          />
        </div>
      </div>
    </SettingsTab>
  )
}
