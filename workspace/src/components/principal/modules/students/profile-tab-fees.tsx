'use client'

import { AlertTriangle, BookOpen, Bus, IndianRupee, TrendingUp } from 'lucide-react'
import { StatusBadge } from '@/components/shared/ui'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StudentRecord } from '@/lib/store/students-store'
import { Metric, Section, InfoRow } from './shared'

type Props = { student: StudentRecord }

export function FeesTab({ student }: Props) {
  const balance = student.feeTotal - student.feePaid
  const feePct = Math.round((student.feePaid / student.feeTotal) * 100)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<IndianRupee className="h-3.5 w-3.5" />} label="Total" value={formatINR(student.feeTotal, true)} color="text-violet-600 dark:text-violet-400" />
        <Metric icon={<TrendingUp className="h-3.5 w-3.5" />} label="Paid" value={formatINR(student.feePaid, true)} color="text-emerald-600 dark:text-emerald-400" />
        <Metric icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Balance" value={formatINR(balance, true)} color="text-rose-600 dark:text-rose-400" />
      </div>
      <Section title="Payment Status">
        <div className="rounded-lg border border-border bg-card/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Total: {formatINR(student.feeTotal, true)}</span>
            {student.feeStatus === 'Paid' ? <StatusBadge status="Fully Paid" variant="success" dot /> : student.feeStatus === 'Partial' ? <StatusBadge status="Partial" variant="warning" dot /> : <StatusBadge status="Pending" variant="danger" dot />}
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className={cn('h-full rounded-full', student.feeStatus === 'Paid' ? 'bg-emerald-500' : student.feeStatus === 'Partial' ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${feePct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400">Paid {formatINR(student.feePaid, true)}</span>
            <span className="text-rose-600 dark:text-rose-400">Due {formatINR(balance, true)}</span>
          </div>
        </div>
      </Section>
      <Section title="Additional">
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={<Bus className="h-3.5 w-3.5" />} label="Transport" value={student.transport ? 'Yes' : 'Not opted'} />
          <InfoRow icon={<BookOpen className="h-3.5 w-3.5" />} label="Admission" value={formatDate(student.admissionDate)} />
        </div>
      </Section>
    </div>
  )
}
