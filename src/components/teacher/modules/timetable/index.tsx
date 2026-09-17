'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { ModuleToolbar } from '../../teacher-panel/module-toolbar'
import { Button } from '@/components/ui/button'
import { todaySchedule } from '@/lib/mock/academics'
import { toast } from 'sonner'
import { TodaySchedule } from './today-schedule'
import { DaySchedule } from './day-schedule'
import { WeeklyGrid } from './weekly-grid'
import { TeachingLoad } from './teaching-load'

export function TimetableModule() {
  const [activeDay, setActiveDay] = useState('Wednesday')
  const today = 'Wednesday'
  const myPeriods = todaySchedule.filter((p) => p.teacher === 'Rohan Mehta')

  return (
    <div className="space-y-5">
      <ModuleToolbar
        context="Class 2-A · your teaching periods"
        action={
          <Button variant="outline" onClick={() => toast.success('Timetable exported', { description: 'Class 2-A weekly timetable · PDF' })}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        }
      />

      {/* Today's schedule highlight */}
      <TodaySchedule myPeriods={myPeriods} />

      {/* Day tabs + Selected day's schedule */}
      <DaySchedule activeDay={activeDay} setActiveDay={setActiveDay} today={today} />

      {/* Full week grid */}
      <WeeklyGrid today={today} />

      {/* Weekly teaching load + subject distribution */}
      <TeachingLoad today={today} />
    </div>
  )
}
