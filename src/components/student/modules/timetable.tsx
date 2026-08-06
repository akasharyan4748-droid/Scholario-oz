'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, MapPin, User, Sparkles, Coffee, UtensilsCrossed } from 'lucide-react'
import { GlassCard, SectionHeading, StatusBadge } from '@/components/shared/ui'
import { weeklyTimetable, todaySchedule } from '@/lib/mock/academics'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const subjectColors: Record<string, { bg: string; text: string; gradient: string; ring: string }> = {
  English: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-400 to-teal-500', ring: 'ring-emerald-500/30' },
  Mathematics: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-400 to-purple-500', ring: 'ring-violet-500/30' },
  Science: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-500/30' },
  Hindi: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', gradient: 'from-rose-400 to-pink-500', ring: 'ring-rose-500/30' },
  'Art & Craft': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', gradient: 'from-fuchsia-400 to-pink-500', ring: 'ring-fuchsia-500/30' },
  Library: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-400 to-sky-500', ring: 'ring-cyan-500/30' },
  'Computer Science': { bg: 'bg-lime-500/10', text: 'text-lime-600 dark:text-lime-400', gradient: 'from-lime-400 to-green-500', ring: 'ring-lime-500/30' },
  'Social Studies': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-400 to-red-500', ring: 'ring-orange-500/30' },
  Music: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-400 to-fuchsia-500', ring: 'ring-purple-500/30' },
  'Physical Education': { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', gradient: 'from-sky-400 to-blue-500', ring: 'ring-sky-500/30' },
  Assembly: { bg: 'bg-muted', text: 'text-muted-foreground', gradient: 'from-slate-400 to-slate-500', ring: 'ring-slate-500/20' },
  Break: { bg: 'bg-muted/60', text: 'text-muted-foreground', gradient: 'from-slate-300 to-slate-400', ring: 'ring-slate-300/30' },
  Lunch: { bg: 'bg-muted/60', text: 'text-muted-foreground', gradient: 'from-slate-300 to-slate-400', ring: 'ring-slate-300/30' },
}

function PeriodCard({ period, isToday, index }: { period: typeof todaySchedule[number]; isToday?: boolean; index: number }) {
  const sc = subjectColors[period.subject] ?? subjectColors.English
  const isBreak = period.subject === 'Break' || period.subject === 'Lunch'
  const isAssembly = period.subject === 'Assembly'

  if (isBreak) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/20 p-2.5"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {period.subject === 'Lunch' ? <UtensilsCrossed className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{period.subject}</p>
          <p className="text-[11px] text-muted-foreground">{period.time}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      className={`group relative flex items-center gap-3 rounded-xl border p-3 hover:shadow-premium transition-all ${
        isAssembly ? 'border-border bg-card/30' : `${sc.bg} border-transparent ring-1 ${sc.ring}`
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${sc.gradient} text-white shadow-md`}>
        <span className="text-[10px] font-bold leading-tight text-center">
          {period.time.split('–')[0].trim().replace(':', '.')}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${isAssembly ? 'text-muted-foreground' : sc.text}`}>{period.subject}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
          {!isAssembly && (
            <>
              <span className="flex items-center gap-0.5"><User className="h-3 w-3" /> {period.teacher}</span>
              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {period.room}</span>
            </>
          )}
          {isAssembly && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> School Ground</span>}
        </div>
      </div>
      {isToday && (
        <StatusBadge status="Today" variant="primary" dot />
      )}
    </motion.div>
  )
}

export function TimetableModule() {
  const [activeDay, setActiveDay] = useState('Wednesday')
  const days = Object.keys(weeklyTimetable)
  const currentDay = days.find((d) => d === activeDay) ?? 'Wednesday'

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Timetable"
        subtitle="Class 2-A · Academic Year 2024–2025"
        icon={<CalendarDays className="h-5 w-5" />}
        action={<StatusBadge status="Wednesday is today" variant="primary" dot />}
      />

      {/* Today's classes highlighted */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" /> Today's Classes
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Wednesday · 7 periods + breaks</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">08:00 AM – 02:15 PM</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {todaySchedule.map((p, i) => (
            <PeriodCard key={i} period={p} isToday index={i} />
          ))}
        </div>
      </GlassCard>

      {/* Full weekly grid */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" /> Weekly Timetable
        </h3>
        <Tabs defaultValue="Wednesday" value={activeDay} onValueChange={setActiveDay}>
          <TabsList className="bg-card/60 backdrop-blur w-full justify-start overflow-x-auto no-scrollbar h-auto flex-wrap">
            {days.map((d) => (
              <TabsTrigger key={d} value={d} className="flex-1 min-w-[80px]">
                {d.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          {days.map((day) => (
            <TabsContent key={day} value={day} className="mt-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {weeklyTimetable[day].map((p, i) => (
                  <PeriodCard key={i} period={p} isToday={day === 'Wednesday'} index={i} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </GlassCard>

      {/* Subject color legend + teacher list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4">Subject Color Legend</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(subjectColors)
              .filter(([k]) => !['Break', 'Lunch', 'Assembly'].includes(k))
              .map(([subject, c], i) => (
                <motion.div
                  key={subject}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card/40 p-2"
                >
                  <div className={`h-3 w-3 shrink-0 rounded-full bg-gradient-to-br ${c.gradient}`} />
                  <span className="text-xs font-medium truncate">{subject}</span>
                </motion.div>
              ))}
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-4">My Teachers</h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {[
              { subject: 'Mathematics', name: 'Rohan Mehta', role: 'Class Teacher' },
              { subject: 'English', name: 'Deepa Menon', role: 'Subject Teacher' },
              { subject: 'Science', name: 'Kavita Joshi', role: 'Subject Teacher' },
              { subject: 'Hindi', name: 'Meera Krishnan', role: 'Subject Teacher' },
              { subject: 'Social Studies', name: 'Vikram Singh', role: 'Subject Teacher' },
              { subject: 'Computer Science', name: 'Arjun Kapoor', role: 'Subject Teacher' },
              { subject: 'Art & Craft', name: 'Faisal Ahmed', role: 'Subject Teacher' },
              { subject: 'Music', name: 'Lakshmi Venkat', role: 'Subject Teacher' },
              { subject: 'Physical Education', name: 'Sanjay Reddy', role: 'Subject Teacher' },
              { subject: 'Library', name: 'Geeta Sharma', role: 'Librarian' },
            ].map((t, i) => {
              const sc = subjectColors[t.subject] ?? subjectColors.English
              return (
                <motion.div
                  key={t.subject}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-2.5"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${sc.gradient} text-white text-[10px] font-bold`}>
                    {t.subject.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.subject} · {t.role}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
