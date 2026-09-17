'use client'

/**
 * students/students-grid — the roster: search + status filters + the
 * student cards, all derived from the real class roster payload.
 *
 * SEARCH  name · roll number · admission number (case-insensitive).
 * FILTERS All / At Risk / Top Attendance — the At Risk and Top Attendance
 *         rules are defined and documented in ./shared (attendance
 *         < 75% or latest exam average < 40% · attendance ≥ 95%); the
 *         chips carry live counts so the labels are never arbitrary.
 *
 * Each card stays deliberately quiet (no CRM look): identity block, two
 * teacher-facing metrics (attendance %, latest exam average — em-dash
 * when the records do not exist), a status chip driven by the documented
 * thresholds, guardian line and the "View profile" affordance.
 */

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Search, User, Users } from 'lucide-react'
import { GlassCard, GradientAvatar, StatusBadge } from '@/components/shared/ui'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { HubEmptyState } from '../shared/hub-stat-cards'
import {
  DIRECTORY_FILTERS,
  attendanceToneClass,
  averageToneClass,
  matchesFilter,
  matchesSearch,
  statusOf,
  type DirectoryFilter,
} from './shared'
import type { DirectoryStudent } from './types'

const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent'

export function StudentsGrid({
  students,
  classLabel,
  onSelect,
}: {
  students: DirectoryStudent[]
  classLabel: string
  onSelect: (s: DirectoryStudent) => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<DirectoryFilter>('all')
  const reduce = useReducedMotion()

  const counts = useMemo(
    () => ({
      all: students.length,
      'at-risk': students.filter((s) => matchesFilter(s, 'at-risk')).length,
      'top-attendance': students.filter((s) => matchesFilter(s, 'top-attendance')).length,
    }),
    [students],
  )

  const filtered = useMemo(
    () => students.filter((s) => matchesSearch(s, search) && matchesFilter(s, filter)),
    [students, search, filter],
  )

  const searching = search.trim() !== '' || filter !== 'all'

  return (
    <GlassCard hover={false} className="p-3 sm:p-4 lg:p-5">
      {/* header: roster line + search */}
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">
            {classLabel} · {students.length} student{students.length === 1 ? '' : 's'}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Sorted by roll number</p>
        </div>
        <div className="relative w-full shrink-0 sm:w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, roll or admission no…"
            aria-label="Search students by name, roll or admission number"
            className="h-9 pl-8"
          />
        </div>
      </div>

      {/* filter chips — live counts, thresholds documented in ./shared */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1" role="group" aria-label="Status filter">
          {DIRECTORY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                'min-h-[36px] rounded-md px-3 text-xs font-medium transition-colors',
                filter === f.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
              <span className="ml-1 tabular-nums text-[10px] text-muted-foreground">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        {searching && filtered.length !== students.length && (
          <p className="text-[11px] text-muted-foreground">
            Showing {filtered.length} of {students.length}
          </p>
        )}
      </div>

      {/* the roster itself */}
      {students.length === 0 ? (
        <HubEmptyState
          icon={Users}
          title="No students in this class"
          hint="Active students enrolled in this class will appear here."
          className="py-8"
        />
      ) : filtered.length === 0 ? (
        <HubEmptyState
          icon={Search}
          title={
            search.trim() !== ''
              ? `No students match “${search.trim()}”`
              : filter === 'at-risk'
                ? 'No students are at risk in this class'
                : 'No students at 95% attendance or above yet'
          }
          hint={
            search.trim() !== ''
              ? 'Try a different name, roll or admission number.'
              : filter === 'at-risk'
                ? 'Students appear here when attendance drops below 75% or the latest exam average is under 40%.'
                : 'Students appear here once their attendance reaches 95%.'
          }
          className="py-8"
        />
      ) : (
        <div
          className={cn(
            'max-h-[720px] overflow-y-auto pr-1 -mr-1',
            THIN_SCROLLBAR,
          )}
          aria-label={`${classLabel} student cards`}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, i) => {
              const status = statusOf(s)
              const att = s.attendance.pct
              const avg = s.latestExam?.averagePct ?? null
              return (
                <motion.button
                  key={s.id}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.24), duration: 0.3 }}
                  whileHover={reduce ? undefined : { y: -2 }}
                  onClick={() => onSelect(s)}
                  aria-label={`View ${s.name}'s profile`}
                  className="rounded-xl border border-border bg-card/60 p-4 text-left transition-all hover:border-primary/30 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {/* identity */}
                  <div className="flex items-start gap-3">
                    <GradientAvatar name={s.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        Roll {s.rollNo ?? '—'} · {s.classLabel}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        Adm {s.admissionNo ?? '—'}
                      </p>
                    </div>
                    {status && (
                      <StatusBadge
                        status={status.label}
                        variant={status.key === 'at-risk' ? 'danger' : 'success'}
                        dot
                        className="shrink-0"
                      />
                    )}
                  </div>

                  {/* teacher-facing metrics */}
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Attendance
                      </p>
                      <p className={cn('font-display text-base font-bold tabular-nums', attendanceToneClass(att))}>
                        {att != null ? `${att}%` : '—'}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {s.attendance.records > 0 ? `${s.attendance.records} records` : 'No records yet'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Latest Avg
                      </p>
                      <p className={cn('font-display text-base font-bold tabular-nums', averageToneClass(avg))}>
                        {avg != null ? `${avg}%` : '—'}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {s.latestExam ? s.latestExam.examName : 'No marks yet'}
                      </p>
                    </div>
                  </div>

                  {/* footer */}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
                    <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{s.guardianName ?? 'Guardian not recorded'}</span>
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-primary">
                      View profile →
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
