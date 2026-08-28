'use client'

/**
 * SalaryHistorySection — the complete audit trail, compact.
 * Every row: icon + title / detail / date · by actor. Filters by kind.
 */

import { useMemo, useState } from 'react'
import { History } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useSalaryStore, type AuditAction } from '@/lib/store/salary-store'
import { CompactEmpty } from './salary-shared'
import { AuditRow } from './salary-overview'

type Filter = 'all' | 'payments' | 'salaries' | 'structures'

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'payments', label: 'Payments' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'structures', label: 'Structures' },
]

const GROUPS: Record<Filter, AuditAction[]> = {
  all: [],
  payments: ['payment.recorded', 'payment.confirmed', 'payment.not_received', 'payment.reversed', 'payment.followed_up'],
  salaries: ['salary.change_requested', 'salary.change_accepted', 'salary.change_declined', 'adjustment.added', 'editing.enabled', 'editing.expired'],
  structures: ['structure.created', 'structure.updated', 'structure.archived', 'structure.restored'],
}

export function SalaryHistorySection() {
  const audit = useSalaryStore((s) => s.audit)
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return audit
    const allowed = new Set(GROUPS[filter])
    return audit.filter((a) => allowed.has(a.action))
  }, [audit, filter])

  return (
    <div className="space-y-3">
      {/* Filter row — the "History" tab already establishes context, so
          no page heading (UX-REFINE); filters lead directly. */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                filter === f.value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <CompactEmpty icon={<History className="h-3.5 w-3.5" />}>No history yet</CompactEmpty>
        ) : (
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto salary-scroll">
            <div className="divide-y divide-border">
              {filtered.map((a) => (
                <AuditRow key={a.id} action={a.action} title={a.title} detail={a.detail} actor={a.actor} timestamp={a.timestamp} />
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">{filtered.length} records</p>
    </div>
  )
}
