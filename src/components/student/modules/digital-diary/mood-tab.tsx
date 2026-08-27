'use client'

import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { moodCalendar, moodConfig } from '@/lib/mock/diary'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { moodInsights, WEEKDAYS } from './data'

// Mood tab — November mood calendar grid + mood insights row
export function MoodTab() {
  return (
    <motion.div
      key="mo"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Mood calendar */}
      <GlassCard className="p-3 sm:p-4 lg:p-5">
        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-500" /> November Mood Calendar
        </h3>
        <p className="text-xs text-muted-foreground mb-4">How you felt each school day</p>
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground pb-1">{d}</div>
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {moodCalendar.map((day, i) => {
            const mood = day.mood ? moodConfig[day.mood] : null
            const dayNum = new Date(day.date).getDate()
            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                className={cn(
                  'relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all',
                  mood ? mood.bg : 'bg-muted/40'
                )}
                title={`${formatDate(day.date)} — ${mood ? mood.label : 'No entry'}`}
              >
                <span className="text-xs font-semibold text-muted-foreground">{dayNum}</span>
                {mood && <span className="text-base leading-none mt-0.5">{mood.emoji}</span>}
              </motion.div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border">
          {Object.values(moodConfig).map((m) => (
            <span key={m.label} className="flex items-center gap-1.5 text-xs">
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-md', m.bg)}>{m.emoji}</span>
              <span className="text-muted-foreground">{m.label}</span>
            </span>
          ))}
        </div>
      </GlassCard>

      {/* Mood insights */}
      <div className="grid sm:grid-cols-3 gap-4">
        {moodInsights.map((insight, i) => (
          <motion.div key={insight.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard className="p-3 sm:p-4 lg:p-5">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-xl mb-3', insight.color)}>
                {insight.icon}
              </div>
              <p className="text-xs text-muted-foreground">{insight.label}</p>
              <p className="font-display text-lg font-bold mt-0.5">{insight.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{insight.sub}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
