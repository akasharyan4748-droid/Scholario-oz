'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Search } from 'lucide-react'
import { GlassCard, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BehaviorRecord } from '@/lib/mock/behavior'
import { typeConfig, statusConfig } from './data'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  filterType: 'all' | 'positive' | 'concern' | 'incident'
  onFilterTypeChange: (t: 'all' | 'positive' | 'concern' | 'incident') => void
  filtered: BehaviorRecord[]
}

const FILTER_OPTIONS = ['all', 'positive', 'concern', 'incident'] as const

export function RecordsTab({ search, onSearchChange, filterType, onFilterTypeChange, filtered }: Props) {
  return (
    <motion.div key="rec" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-4">
      {/* Search + filter */}
      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by student or description…"
              className="w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-1.5">
            {FILTER_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => onFilterTypeChange(t)}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors',
                  filterType === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Records list */}
      <div className="space-y-2.5">
        {filtered.map((r, i) => {
          const cfg = typeConfig[r.type]
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <GlassCard className={cn('p-4 border-l-4', r.type === 'positive' && 'border-l-emerald-500', r.type === 'concern' && 'border-l-amber-500', r.type === 'incident' && 'border-l-rose-500')}>
                <div className="flex items-start gap-3">
                  <GradientAvatar name={r.studentName} initials={r.avatar} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{r.studentName}</p>
                      <span className="text-[11px] text-muted-foreground">Roll #{r.rollNo} · {r.className}</span>
                      <span className={cn('flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold', cfg.color)}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <StatusBadge status={statusConfig[r.status].label} variant={statusConfig[r.status].variant} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.category} · {formatDate(r.date)}</p>
                    <p className="text-sm mt-1.5 leading-relaxed">{r.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>By {r.reportedBy}</span>
                      {r.parentNotified && <span className="flex items-center gap-1 text-emerald-600"><MessageSquare className="h-2.5 w-2.5" /> Parent notified</span>}
                    </div>
                  </div>
                  <div className={cn('shrink-0 flex flex-col items-center justify-center rounded-lg px-3 py-1.5',
                    r.points > 0 ? 'bg-emerald-500/10' : r.points < 0 ? 'bg-rose-500/10' : 'bg-muted'
                  )}>
                    <span className={cn('font-display text-lg font-bold', r.points > 0 ? 'text-emerald-600' : r.points < 0 ? 'text-rose-600' : 'text-muted-foreground')}>
                      {r.points > 0 ? '+' : ''}{r.points}
                    </span>
                    <span className="text-[9px] text-muted-foreground">pts</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
