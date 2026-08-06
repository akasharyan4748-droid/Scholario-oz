'use client'

import { motion } from 'framer-motion'
import {
  CalendarDays, Users, MapPin, ArrowRight,
} from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { ChartCard, AreaTrend } from '@/components/shared/charts'
import { todaySchedule } from '@/lib/mock/academics'
import { performanceTrend } from './data'

interface TodayClassesProps {
  onNavigate: (key: string) => void
}

export function TodayClasses({ onNavigate }: TodayClassesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <GlassCard className="p-3 sm:p-4 lg:p-5 lg:col-span-2">
        <SectionHeading
          title="Today's Classes"
          subtitle="Wednesday · Class 2-A timetable"
          icon={<CalendarDays className="h-5 w-5" />}
          action={
            <button
              onClick={() => onNavigate('timetable')}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              View full week <ArrowRight className="h-3 w-3" />
            </button>
          }
          className="mb-4"
        />
        <div className="space-y-2.5">
          {todaySchedule.slice(0, 6).map((p, i) => {
            const isMine = p.teacher === 'Rohan Mehta'
            const isBreak = p.subject === 'Break' || p.subject === 'Lunch' || p.subject === 'Assembly'
            return (
              <motion.div
                key={`${p.time}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  isMine
                    ? 'border-primary/30 bg-primary/5'
                    : isBreak
                      ? 'border-border/50 bg-muted/30 opacity-70'
                      : 'border-border bg-card/40 hover:bg-accent/30'
                }`}
              >
                <div className={`flex flex-col items-center justify-center h-11 w-14 shrink-0 rounded-lg ${isMine ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <span className="text-[11px] font-bold leading-none">{p.time.split('–')[0]}</span>
                  <span className="text-[9px] uppercase mt-0.5">{p.time.split('–')[1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{p.subject}</p>
                    {isMine && <StatusBadge status="My Class" variant="primary" dot />}
                    {isBreak && <span className="text-[10px] text-muted-foreground italic">— Break —</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.teacher}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.room}</span>
                  </p>
                </div>
                {!isBreak && (
                  <StatusBadge
                    status={isMine ? 'Active' : 'Scheduled'}
                    variant={isMine ? 'success' : 'neutral'}
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </GlassCard>

      <ClassPerformanceChart />
    </div>
  )
}

function ClassPerformanceChart() {
  return (
    <ChartCard title="Class 2-A Performance" subtitle="Avg score trend (Mathematics)" action={<StatusBadge status="+10%" variant="success" dot />}>
      <AreaTrend data={performanceTrend} xKey="name" yKey="v" color="oklch(0.65 0.16 75)" height={200} gradientId="teacherPerf" />
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-400">88%</p>
          <p className="text-[10px] text-muted-foreground">Class Avg</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">96%</p>
          <p className="text-[10px] text-muted-foreground">Top Score</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <p className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">68%</p>
          <p className="text-[10px] text-muted-foreground">Lowest</p>
        </div>
      </div>
    </ChartCard>
  )
}
