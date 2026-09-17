'use client'

/** Roster grid: search + attendance filter + profile cards — real data. */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Phone } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { DirectoryStudent } from './hooks'

type Filter = 'all' | 'high' | 'at-risk'

export function StudentsGrid({
  students,
  onSelect,
}: {
  students: DirectoryStudent[]
  onSelect: (s: DirectoryStudent) => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    let list = students
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.rollNo ?? '').includes(search) ||
          (s.admissionNo ?? '').toLowerCase().includes(q),
      )
    }
    if (filter === 'high') list = list.filter((s) => (s.attendancePct ?? 0) >= 95)
    if (filter === 'at-risk') list = list.filter((s) => s.attendancePct != null && s.attendancePct < 90)
    return list
  }, [students, search, filter])

  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, roll, admission no…"
            className="pl-8 h-9"
            aria-label="Search students"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg" role="group" aria-label="Attendance filter">
          {([['all', 'All'], ['high', 'Top Attendees'], ['at-risk', 'At Risk']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                filter === k ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((s, i) => {
          const att = s.attendancePct
          return (
            <motion.button
              key={s.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              whileHover={{ y: -3 }}
              onClick={() => onSelect(s)}
              className="text-left rounded-2xl border border-border bg-card/40 p-4 hover:shadow-premium hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <GradientAvatar name={s.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Roll #{s.rollNo ?? '—'} · {s.admissionNo ?? '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{s.guardianName ?? 'Guardian details pending'}</p>
                </div>
                {att != null && (
                  <StatusBadge
                    status={att >= 95 ? 'Excellent' : att >= 90 ? 'Good' : 'At Risk'}
                    variant={att >= 95 ? 'success' : att >= 90 ? 'info' : 'warning'}
                    dot
                  />
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 mb-3">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">
                    Attendance {s.attendanceRecords > 0 ? `· ${s.attendanceRecords} records` : ''}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {att != null ? (
                      <>
                        <ProgressBar
                          value={att}
                          color={att > 95 ? 'oklch(0.55 0.14 162)' : att > 90 ? 'oklch(0.65 0.16 75)' : 'oklch(0.62 0.2 25)'}
                          height={4}
                          className="flex-1"
                        />
                        <span className="text-xs font-semibold">{att}%</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">No attendance recorded yet</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1 truncate">
                  <Phone className="h-2.5 w-2.5 shrink-0" /> {s.guardianPhone ?? '—'}
                </span>
                <span className="text-primary font-medium shrink-0">View profile →</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          {students.length === 0
            ? 'No students enrolled in this class yet.'
            : 'No students match your search.'}
        </div>
      )}
    </GlassCard>
  )
}
