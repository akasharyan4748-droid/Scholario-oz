'use client'

import { motion } from 'framer-motion'
import { MapPin, Users } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { weeklyTimetable } from '@/lib/mock/academics'
import { cn } from '@/lib/utils'
import { days, periodMeta, subjectColor } from './data'

interface Props {
  activeDay: string
  setActiveDay: (d: string) => void
  today: string
}

export function DaySchedule({ activeDay, setActiveDay, today }: Props) {
  return (
    <>
      {/* Day tabs */}
      <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg w-fit overflow-x-auto">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap relative',
              activeDay === d ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {d}
            {d === today && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
          </button>
        ))}
      </div>

      {/* Selected day's schedule */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">{activeDay} Schedule</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Class 2-A · Detailed period-wise breakdown</p>
          </div>
          <StatusBadge
            status={activeDay === today ? 'Today' : 'Scheduled'}
            variant={activeDay === today ? 'success' : 'neutral'}
            dot
          />
        </div>
        <div className="space-y-2">
          {weeklyTimetable[activeDay].map((p, i) => {
            const meta = periodMeta(p)
            const isMine = p.teacher === 'Rohan Mehta'
            const isBreak = p.subject === 'Break' || p.subject === 'Lunch' || p.subject === 'Assembly'
            return (
              <motion.div
                key={`${p.time}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                  isMine ? 'border-primary/30 bg-primary/5' : isBreak ? 'border-border/50 bg-muted/30 opacity-70' : 'border-border bg-card/40 hover:bg-accent/30'
                )}
              >
                <div className={cn(
                  'flex flex-col items-center justify-center h-12 w-16 shrink-0 rounded-lg',
                  isMine ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <span className="text-[11px] font-bold leading-none">{p.time.split('–')[0]}</span>
                  <span className="text-[9px] uppercase mt-0.5">{p.time.split('–')[1]}</span>
                </div>
                <div className={cn('shrink-0', isMine ? 'text-primary' : 'text-muted-foreground')}>
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{p.subject}</p>
                    {isMine && <StatusBadge status="My Class" variant="primary" dot />}
                    {isBreak && <span className="text-[10px] text-muted-foreground italic">— Break —</span>}
                  </div>
                  {!isBreak && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.teacher}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.room}</span>
                    </p>
                  )}
                </div>
                {!isBreak && (
                  <span className={cn(
                    'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium',
                    subjectColor[p.subject] ?? 'bg-muted text-muted-foreground border-border'
                  )}>
                    {p.subject}
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </>
  )
}
