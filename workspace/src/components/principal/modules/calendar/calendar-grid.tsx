'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ALL_TYPES, TYPE_COLORS, WEEK_DAYS, type CalendarEvent } from './data'

interface Props {
  cells: (number | null)[]
  eventsByDay: Record<number, CalendarEvent[]>
  selectedDay: number | null
  onSelectDay: (day: number) => void
  today: number
}

export function CalendarGrid({ cells, eventsByDay, selectedDay, onSelectDay, today }: Props) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-bold">December 2025</h2>
          <StatusBadge status="Academic Year 2025–26" variant="primary" />
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toast.info('Viewing November 2025')}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toast.info('Viewing January 2025')}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_DAYS.map((w) => (
          <div key={w} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{w}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="aspect-square" />
          const dayEvents = eventsByDay[day] ?? []
          const isToday = day === today
          const isSelected = day === selectedDay
          return (
            <motion.button
              key={day}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.005, duration: 0.3 }}
              whileHover={{ y: -2, scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectDay(day)}
              className={`relative aspect-square rounded-xl border p-1.5 flex flex-col items-start transition-all ${
                isSelected ? 'border-primary bg-primary/10 shadow-sm' :
                isToday ? 'border-primary/50 bg-primary/5' :
                'border-border hover:border-primary/30 hover:bg-accent/40'
              }`}
            >
              <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>{day}</span>
              {dayEvents.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-0.5 w-full">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_COLORS[e.type] }} />
                  ))}
                  {dayEvents.length > 3 && <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                </div>
              )}
              {dayEvents.length > 0 && (
                <div className="absolute inset-x-1 bottom-1 hidden">
                  <span className="text-[8px] truncate">{dayEvents[0].title}</span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-x-4 gap-y-2">
        {ALL_TYPES.map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLORS[t] }} />
            {t}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
