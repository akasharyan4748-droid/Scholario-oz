'use client'

/**
 * TeacherKpiCards (TWC-FE-4) — the four headline numbers, every one traced
 * to a real row behind the aggregate API:
 *
 *   • Classes Today   — the teacher's own timetable cells for today's weekday
 *   • Lessons Completed — average curriculum progress across her assignments
 *   • Unread Messages — Teacher Hub parent messages awaiting a reply
 *   • Open Concerns   — behavior records needing review; falls back to open
 *                       follow-ups, and when both are zero says so honestly
 *                       ("All caught up") instead of inventing pressure.
 */

import { AlarmClock, BookMarked, CalendarCheck, MessageSquareHeart, Shield } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import type { TeacherDashboardData } from './types'

interface TeacherKpiCardsProps {
  data: TeacherDashboardData
}

export function TeacherKpiCards({ data }: TeacherKpiCardsProps) {
  const periodsToday = data.today.periods.length

  const curriculum = data.curriculum
  const avgProgress =
    curriculum.length > 0
      ? Math.round(curriculum.reduce((s, c) => s + c.progress.pct, 0) / curriculum.length)
      : 0
  const completedTopics = curriculum.reduce((s, c) => s + c.progress.completed, 0)
  const totalTopics = curriculum.reduce((s, c) => s + c.progress.total, 0)

  // The fourth card is honest about priority: concerns first, then
  // follow-ups, and a quiet "all caught up" only when both are truly zero.
  const concernCard =
    data.hub.openConcerns > 0
      ? {
          label: 'Open Concerns',
          value: data.hub.openConcerns,
          icon: <Shield className="h-5 w-5" />,
          accent: 'rose' as const,
          trendLabel: 'Student Behavior · needs review',
        }
      : data.hub.openFollowUps > 0
        ? {
            label: 'Open Follow-ups',
            value: data.hub.openFollowUps,
            icon: <AlarmClock className="h-5 w-5" />,
            accent: 'amber' as const,
            trendLabel: 'Scheduled follow-ups pending',
          }
        : {
            label: 'Open Concerns',
            value: 0,
            icon: <Shield className="h-5 w-5" />,
            accent: 'emerald' as const,
            trendLabel: 'All caught up — nothing needs attention',
          }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <KpiCard
        label="Classes Today"
        value={periodsToday}
        icon={<CalendarCheck className="h-5 w-5" />}
        trendLabel={`${data.today.weekday} · teaching periods`}
        accent="amber"
        delay={0}
      />
      <KpiCard
        label="Lessons Completed"
        value={avgProgress}
        suffix="%"
        icon={<BookMarked className="h-5 w-5" />}
        trendLabel={
          totalTopics > 0
            ? `${completedTopics} of ${totalTopics} topics this term`
            : 'No curriculum mapped yet'
        }
        accent="emerald"
        delay={0.05}
      />
      <KpiCard
        label="Unread Messages"
        value={data.hub.unreadMessages}
        icon={<MessageSquareHeart className="h-5 w-5" />}
        trendLabel="From parents · Parent Connect"
        accent="sky"
        delay={0.1}
      />
      <KpiCard
        label={concernCard.label}
        value={concernCard.value}
        icon={concernCard.icon}
        trendLabel={concernCard.trendLabel}
        accent={concernCard.accent}
        delay={0.15}
      />
    </div>
  )
}
