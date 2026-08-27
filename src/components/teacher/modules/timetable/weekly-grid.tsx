'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Clock } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/shared/ui'
import { weeklyTimetable } from '@/lib/mock/academics'
import { cn } from '@/lib/utils'
import { days, dayShort, subjectColor } from './data'

interface Props {
  today: string
}

export function WeeklyGrid({ today }: Props) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <SectionHeading
        title="Weekly Timetable"
        subtitle="All periods · Monday to Friday"
        icon={<CalendarDays className="h-5 w-5" />}
        className="mb-4"
      />
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] text-muted-foreground border-b border-border">
              <th className="px-2 py-2 font-medium sticky left-0 bg-card z-10">Time</th>
              {days.map((d) => (
                <th key={d} className={cn('px-2 py-2 font-medium min-w-[120px]', d === today && 'text-primary')}>
                  {dayShort[d]}
                  {d === today && <span className="block text-[9px] font-normal text-emerald-600">Today</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Use Wednesday's time slots as canonical periods (all days have same slots) */}
            {weeklyTimetable.Wednesday.map((_, idx) => {
              const time = weeklyTimetable.Wednesday[idx].time
              return (
                <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors">
                  <td className="px-2 py-2 font-mono text-[10px] text-muted-foreground sticky left-0 bg-card z-10 whitespace-nowrap">
                    <Clock className="h-2.5 w-2.5 inline mr-1" />
                    {time}
                  </td>
                  {days.map((d) => {
                    const p = weeklyTimetable[d][idx]
                    const isMine = p.teacher === 'Rohan Mehta'
                    const isBreak = p.subject === 'Break' || p.subject === 'Lunch' || p.subject === 'Assembly'
                    return (
                      <td key={d} className="px-1.5 py-1.5">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className={cn(
                            'rounded-md border px-2 py-1.5 text-[10px] leading-tight',
                            isBreak ? 'border-border/40 bg-muted/20 text-muted-foreground italic text-center' :
                            isMine ? 'border-primary/40 bg-primary/10 text-primary font-semibold' :
                            subjectColor[p.subject] ?? 'border-border bg-muted/30 text-muted-foreground'
                          )}
                        >
                          {!isBreak && <p className="font-semibold truncate">{p.subject}</p>}
                          {isBreak ? p.subject : (
                            <>
                              <p className="text-[9px] opacity-70 truncate">{p.teacher.split(' ').slice(-1)[0]}</p>
                              <p className="text-[9px] opacity-70 truncate">{p.room}</p>
                            </>
                          )}
                        </motion.div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border flex-wrap text-[10px]">
        <span className="text-muted-foreground font-medium">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border-2 border-primary/40 bg-primary/10" />
          My periods
        </span>
        {['Mathematics', 'English', 'Science', 'Hindi'].map((s) => (
          <span key={s} className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5', subjectColor[s])}>
            {s}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border/40 bg-muted/20" />
          Break
        </span>
      </div>
    </GlassCard>
  )
}
