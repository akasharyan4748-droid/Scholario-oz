'use client'

import {
  CalendarCheck, BookOpen, Award, IndianRupee,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { formatINR } from '@/lib/format'
import { homeworks, examResults } from '@/lib/mock/academics'
import { attendanceTrend } from './data'

interface KpiGridProps {
  attendancePct: number
  pendingHomeworkCount: number
  feePending: number
}

export function KpiGrid({ attendancePct, pendingHomeworkCount, feePending }: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Attendance"
        value={attendancePct}
        suffix="%"
        icon={<CalendarCheck className="h-5 w-5" />}
        trend={1.4}
        trendLabel="Excellent record"
        accent="emerald"
        sparkline={attendanceTrend}
        sparkKey="v"
        delay={0}
      />
      <KpiCard
        label="Last Exam Score"
        value={examResults.percentage}
        suffix="%"
        decimals={1}
        icon={<Award className="h-5 w-5" />}
        trend={3.2}
        trendLabel="Unit Test 3"
        accent="violet"
        delay={0.05}
      />
      <KpiCard
        label="Pending Homework"
        value={pendingHomeworkCount}
        icon={<BookOpen className="h-5 w-5" />}
        trendLabel={`of ${homeworks.length} assigned`}
        accent="amber"
        delay={0.1}
      />
      <KpiCard
        label="Fees Pending"
        value={feePending}
        format={(n) => formatINR(n, true)}
        icon={<IndianRupee className="h-5 w-5" />}
        trendLabel="Pay before 15 Dec"
        accent="rose"
        delay={0.15}
      />
    </div>
  )
}
