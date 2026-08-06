'use client'

import { motion } from 'framer-motion'
import { Calendar, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { Donut } from '@/components/shared/charts'
import { diaryStats, moodConfig, type DiaryEntry } from '@/lib/mock/diary'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

// Entries tab — journal list + Top Tags + Mood This Month summary
export function EntriesTab({ entries }: { entries: DiaryEntry[] }) {
  return (
    <motion.div
      key="en"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
    >
      {/* Entries list */}
      <div className="lg:col-span-2 space-y-3">
        {entries.map((entry, i) => {
          const mood = moodConfig[entry.mood]
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-3 sm:p-4 lg:p-5 hover:shadow-premium-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl', mood.bg)}>
                    {mood.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{entry.title}</h3>
                      <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium', mood.bg, mood.text)}>{mood.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> {formatDate(entry.date)}
                      {entry.subject && <span>· {entry.subject}</span>}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{entry.content}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      {/* Top tags + mood summary */}
      <div className="space-y-4">
        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" /> Top Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {diaryStats.topTags.map((t, i) => (
              <motion.span
                key={t.tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-1 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400"
              >
                #{t.tag} <span className="text-[10px] text-muted-foreground">{t.count}</span>
              </motion.span>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4 lg:p-5">
          <h3 className="font-semibold text-sm mb-3">Mood This Month</h3>
          <Donut data={diaryStats.moodDistribution} centerValue={`${diaryStats.avgMoodScore}`} centerLabel="avg / 5" height={180} />
          <div className="mt-3 space-y-1.5">
            {diaryStats.moodDistribution.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                  {m.name}
                </span>
                <span className="font-semibold">{m.value} days</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  )
}
