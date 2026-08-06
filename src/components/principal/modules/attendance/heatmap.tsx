'use client'

// December 2025 attendance heatmap calendar — interactive day grid with
// legend + per-day detail panel. Color intensity reflects attendance rate.

import { motion } from 'framer-motion'
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { decemberCalendar, rateColor } from './data'
import { CalendarLegend, DayDetailCard } from './shared'

type HeatmapProps = {
  selectedDay: number | null
  setSelectedDay: (d: number | null) => void
}

export function AttendanceHeatmap({ selectedDay, setSelectedDay }: HeatmapProps) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            December 2025 — Attendance Heatmap
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Click a day to view details · Color-coded by attendance rate</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-semibold font-mono">DEC 2025</span>
          <Button size="icon" variant="ghost" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {decemberCalendar.map((cell, idx) => {
          if (cell.day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />
          }
          const isSelected = selectedDay === cell.day
          return (
            <motion.button
              key={cell.day}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(idx * 0.005, 0.4) }}
              whileHover={{ scale: 1.06 }}
              onClick={() => !cell.isWeekend && !cell.isHoliday && setSelectedDay(cell.day)}
              className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-xs font-semibold transition-all ${rateColor(cell.rate)} ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''} ${cell.isWeekend || cell.isHoliday ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span>{cell.day}</span>
              {cell.rate !== null && <span className="text-[9px] sm:text-[10px] font-bold leading-none mt-0.5">{cell.rate}%</span>}
              {cell.isHoliday && <span className="text-[8px] sm:text-[9px] leading-none mt-0.5">Holiday</span>}
              {cell.isWeekend && !cell.isHoliday && <span className="text-[8px] leading-none mt-0.5 opacity-60">Wknd</span>}
            </motion.button>
          )
        })}
      </div>

      <CalendarLegend />

      {/* Selected day details */}
      {selectedDay !== null && (
        <DayDetailCard selectedDay={selectedDay} />
      )}
    </GlassCard>
  )
}
