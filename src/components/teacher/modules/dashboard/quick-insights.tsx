'use client'

import { motion } from 'framer-motion'
import { TrendingUp, BookMarked, MessageSquareHeart, Award } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { cn } from '@/lib/utils'

interface QuickInsightsProps {
  /** live server: lessons planned today but not completed (null = loading) */
  lessonsPendingToday: number | null
  /** live server: unread parent messages (null = loading) */
  unreadParentMessages: number | null
  /** live server: share of parent-initiated conversations the teacher replied to */
  parentReplyRate: number | null
}

export function QuickInsights({ lessonsPendingToday, unreadParentMessages, parentReplyRate }: QuickInsightsProps) {
  const insights = [
    {
      label: 'Lessons Pending Today',
      value: lessonsPendingToday === null ? '…' : `${lessonsPendingToday}`,
      sub: lessonsPendingToday === null ? 'Loading curriculum' : lessonsPendingToday > 0 ? 'from your auto schedule' : 'all completed',
      icon: <BookMarked className="h-4 w-4" />,
      color: 'text-emerald-600 bg-emerald-500/10',
      trend: 'Live',
    },
    {
      label: 'Parent Reply Rate',
      value: parentReplyRate === null ? '—' : `${parentReplyRate}%`,
      sub: 'of parent conversations',
      icon: <MessageSquareHeart className="h-4 w-4" />,
      color: 'text-rose-600 bg-rose-500/10',
      trend: 'Live',
    },
    {
      label: 'Unread Parent Messages',
      value: unreadParentMessages === null ? '…' : `${unreadParentMessages}`,
      sub: unreadParentMessages === null ? 'Loading inbox' : unreadParentMessages > 0 ? 'awaiting your reply' : 'inbox clear',
      icon: <MessageSquareHeart className="h-4 w-4" />,
      color: 'text-amber-600 bg-amber-500/10',
      trend: 'Live',
    },
    {
      label: 'Class Avg Score',
      value: '87.4%',
      sub: 'Unit Test 3 · Demo School',
      icon: <Award className="h-4 w-4" />,
      color: 'text-violet-600 bg-violet-500/10',
      trend: 'Seeded',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold tracking-tight">My Teaching Insights</h3>
              <p className="text-[11px] text-muted-foreground">Live from your workspace</p>
            </div>
          </div>
          <StatusBadge status="Live" variant="success" dot />
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.33 + i * 0.07 }}
              whileHover={{ y: -2 }}
              className="group relative rounded-xl border border-border bg-card/40 p-3 hover:shadow-premium hover:border-amber-500/20 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', insight.color)}>
                  {insight.icon}
                </div>
                <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 text-emerald-600 bg-emerald-500/10">
                  {insight.trend}
                </span>
              </div>
              <p className="font-display text-xl font-bold tracking-tight">{insight.value}</p>
              <p className="text-[11px] font-medium text-foreground/80 mt-0.5">{insight.label}</p>
              <p className="text-[10px] text-muted-foreground">{insight.sub}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
