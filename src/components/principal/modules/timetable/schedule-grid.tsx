'use client'

// Master Timetable Schedule Grid: a per-day table with one column per class
// and one row per period. Break rows span all columns; period rows render
// either the assigned slot card (with edit/delete on hover) or an
// "Assign Period" placeholder button.

import {
  CalendarDays, Coffee, MapPin, UserCheck, Edit2, Trash2, Plus,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import {
  CLASSES, PERIODS, type DayType, type TimetableSlot,
} from './data'

interface ScheduleGridProps {
  selectedDay: DayType
  selectedClass: string
  filteredSlots: TimetableSlot[]
  onEditSlot: (slot: TimetableSlot) => void
  onDeleteSlot: (id: string) => void
  onAssignPeriod: (day: DayType, period: number) => void
}

export function ScheduleGrid({
  selectedDay,
  selectedClass,
  filteredSlots,
  onEditSlot,
  onDeleteSlot,
  onAssignPeriod,
}: ScheduleGridProps) {
  const visibleClasses = CLASSES.filter(
    (c) => selectedClass === 'all' || selectedClass === c
  )

  return (
    <GlassCard className="p-4 sm:p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {selectedDay} Master Routine
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedClass === 'all' ? 'All Classes' : selectedClass} · 8 Academic Periods + Breaks
          </p>
        </div>
        <StatusBadge status="Tenant Isolated" variant="success" dot />
      </div>

      <div className="overflow-x-auto no-scrollbar border border-border/60 rounded-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
              <th className="p-3 w-32 shrink-0">Period / Time</th>
              {visibleClasses.map((cls) => (
                <th key={cls} className="p-3 min-w-[200px] border-l border-border/50 font-bold text-foreground">
                  {cls}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {PERIODS.map((p) => {
              if (p.isBreak) {
                return (
                  <tr key={`break-${p.number}`} className="bg-muted/30">
                    <td className="p-3 font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.time}</p>
                      </div>
                    </td>
                    <td
                      colSpan={visibleClasses.length}
                      className="p-3 text-center text-xs font-medium text-muted-foreground/80 italic border-l border-border/50 bg-amber-500/5"
                    >
                      — {p.name} ({p.time}) —
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={`period-${p.number}`} className="hover:bg-accent/30 transition-colors">
                  <td className="p-3 font-medium shrink-0">
                    <p className="font-bold text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.time}</p>
                  </td>

                  {visibleClasses.map((cls) => {
                    const slot = filteredSlots.find(
                      (s) => s.day === selectedDay && s.period === p.number && s.className === cls
                    )
                    return (
                      <td key={`${cls}-${p.number}`} className="p-2 border-l border-border/50 vertical-align-top">
                        {slot ? (
                          <div className="group relative rounded-xl border border-primary/20 bg-primary/5 p-2.5 transition-all hover:border-primary/40 hover:shadow-sm">
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-xs text-primary">{slot.subject}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => onEditSlot(slot)}
                                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted"
                                  title="Edit Slot"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => onDeleteSlot(slot.id)}
                                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                                  title="Remove Slot"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] font-medium text-foreground mt-1 flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-muted-foreground shrink-0" />
                              {slot.teacherName}
                            </p>

                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                              {slot.room}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAssignPeriod(selectedDay, p.number)}
                            className="w-full h-16 rounded-xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-all group"
                          >
                            <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-medium">Assign Period</span>
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
