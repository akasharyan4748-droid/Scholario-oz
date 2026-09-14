'use client'

/**
 * records-list — the primary view of the Student Behavior module.
 *
 * One card: a header strip (title + honest count badge), a filter row
 * (student-name search + type chips with counts), then the record rows
 * in divide-y — scroll-capped at 560px with a thin scrollbar. Every row
 * is keyboard-focusable and opens the student's behavior profile sheet;
 * open concerns reveal a compact status selector on hover/focus so the
 * recorder or class teacher can close the loop without leaving the list.
 *
 * Positive recognition rows carry the same weight and craft as concern
 * rows — equal visual dignity by design.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlarmClock, Bell, ClipboardList, Loader2, Lock, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard, GradientAvatar } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { HubEmptyState } from '@/components/teacher/modules/shared/hub-stat-cards'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  BehaviorCategoryItem,
  BehaviorRecordItem,
  BehaviorStatus,
  BehaviorType,
  FollowUpItem,
} from '@/lib/teacher-hub-types'
import { completeFollowUp, patchBehaviorRecord } from './hooks'
import {
  PRIMARY_ACTION_CLASS,
  STATUS_CONFIG,
  TYPE_CONFIG,
  categoryLabelOf,
  dueState,
} from './shared'

type TypeFilter = 'all' | BehaviorType

// Thin-scrollbar utilities (scrollbar-width + webkit) — no global CSS needed.
const THIN_SCROLLBAR =
  '[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent'

// ─── the records card ────────────────────────────────────────────────

interface RecordsListProps {
  records: BehaviorRecordItem[]
  categories: BehaviorCategoryItem[]
  onOpenProfile: (studentId: string) => void
  /** quiet aggregate reload after a mutation */
  onReload: () => void
  /** open the Record Observation dialog (zero-records empty state) */
  onRecord: () => void
}

export function RecordsList({
  records,
  categories,
  onOpenProfile,
  onReload,
  onRecord,
}: RecordsListProps) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  /** optimistic overrides from inline status changes (cleared on each reload) */
  const [overrides, setOverrides] = useState<Record<string, BehaviorRecordItem>>({})

  // A fresh server payload is the truth — drop stale overrides with it.
  useEffect(() => {
    setOverrides((prev) => (Object.keys(prev).length > 0 ? {} : prev))
  }, [records])

  const effective = useMemo(
    () => records.map((r) => overrides[r.id] ?? r),
    [records, overrides],
  )

  const counts = useMemo(
    () => ({
      all: effective.length,
      positive: effective.filter((r) => r.type === 'positive').length,
      observation: effective.filter((r) => r.type === 'observation').length,
      concern: effective.filter((r) => r.type === 'concern').length,
    }),
    [effective],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return effective.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      return !q || r.student.name.toLowerCase().includes(q)
    })
  }, [effective, query, typeFilter])

  const handleStatusChange = useCallback(
    async (record: BehaviorRecordItem, status: BehaviorStatus) => {
      // Optimistic first — the row updates instantly, then quietly synced.
      setOverrides((prev) => ({ ...prev, [record.id]: { ...record, status } }))
      try {
        const updated = await patchBehaviorRecord(record.id, { status })
        setOverrides((prev) => ({ ...prev, [record.id]: updated }))
        toast.success('Status updated', {
          description: `${record.student.name} · ${STATUS_CONFIG[status].label}`,
        })
        onReload()
      } catch (e) {
        // Revert the optimistic override — the row returns to server truth.
        setOverrides((prev) => {
          if (prev[record.id]?.status === status) {
            const next = { ...prev }
            delete next[record.id]
            return next
          }
          return prev
        })
        toast.error(e instanceof Error ? e.message : 'Could not update the status.')
      }
    },
    [onReload],
  )

  const chips: { key: TypeFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'positive', label: 'Positive', count: counts.positive },
    { key: 'observation', label: 'Observation', count: counts.observation },
    { key: 'concern', label: 'Concern', count: counts.concern },
  ]

  return (
    <GlassCard className="overflow-hidden p-0">
      {/* header strip */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Recent Observations</h2>
          <Badge
            variant="secondary"
            className="h-5 px-2 text-[10px] font-medium tabular-nums"
          >
            {records.length}
          </Badge>
        </div>
        <p className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">newest first</p>
      </div>

      {/* filter row */}
      {records.length > 0 && (
        <div className="flex flex-col gap-2.5 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student…"
              aria-label="Search observations by student name"
              className="h-8 w-full rounded-lg border border-input bg-transparent py-1 pl-8 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter observations by type"
          >
            {chips.map((chip) => {
              const active = typeFilter === chip.key
              return (
                <button
                  key={chip.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTypeFilter(chip.key)}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-[11px] font-medium tabular-nums transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                  )}
                >
                  {chip.label}
                  <span className={cn('ml-1', active ? 'opacity-80' : 'opacity-70')}>
                    {chip.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* rows */}
      {records.length === 0 ? (
        <HubEmptyState
          icon={ClipboardList}
          title="No observations recorded"
          hint="Record a student observation when you need to document something important."
          action={
            <button type="button" onClick={onRecord} className={PRIMARY_ACTION_CLASS}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Record Observation
            </button>
          }
        />
      ) : (
        <div className={cn('max-h-[560px] divide-y divide-border/40 overflow-y-auto', THIN_SCROLLBAR)}>
          {visible.length === 0 ? (
            <p className="px-4 py-10 text-center text-xs text-muted-foreground">
              No records match this filter.
            </p>
          ) : (
            visible.map((record) => (
              <RecordRow
                key={record.id}
                record={record}
                categories={categories}
                onOpenProfile={onOpenProfile}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      )}
    </GlassCard>
  )
}

// ─── one record row ──────────────────────────────────────────────────

function RecordRow({
  record,
  categories,
  onOpenProfile,
  onStatusChange,
}: {
  record: BehaviorRecordItem
  categories: BehaviorCategoryItem[]
  onOpenProfile: (studentId: string) => void
  onStatusChange: (record: BehaviorRecordItem, status: BehaviorStatus) => Promise<void>
}) {
  const type = TYPE_CONFIG[record.type]
  const status = STATUS_CONFIG[record.status]
  const canManageStatus = record.type === 'concern' && record.status !== 'resolved'
  const openProfile = () => onOpenProfile(record.student.id)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openProfile()
        }
      }}
      aria-label={`Open behavior profile for ${record.student.name}`}
      className={cn(
        'group cursor-pointer border-l-4 px-4 py-3 outline-none transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring/40',
        type.border,
      )}
    >
      <div className="flex items-start gap-3">
        <GradientAvatar name={record.student.name} size="sm" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-medium text-foreground">{record.student.name}</p>
            <span className="truncate text-[11px] text-muted-foreground">
              Roll {record.student.rollNo ?? '—'} · {record.student.classLabel}
            </span>
            <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {categoryLabelOf(categories, record.category)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{record.description}</p>

          {/* footer meta line */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
            <span className="tabular-nums">{formatDate(record.date)}</span>
            <span className="truncate">By {record.recordedBy.name}</span>
            <span className={cn('inline-flex shrink-0 items-center gap-1 font-medium', status.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} aria-hidden="true" />
              {status.label}
            </span>
            {record.followUpDate && <FollowUpChip dueDate={record.followUpDate} />}
            {record.parentNotified && (
              <span className="inline-flex shrink-0 items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <Bell className="h-3 w-3" aria-hidden="true" />
                Parent notified
              </span>
            )}
            {record.privateNote && (
              <span
                className="inline-flex shrink-0 items-center gap-1"
                title="Staff-only note attached"
              >
                <Lock className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Staff-only note attached.</span>
                Staff note
              </span>
            )}
          </div>
        </div>

        {/* hover/focus reveal — compact status selector for open concerns */}
        {canManageStatus && (
          <div
            className="shrink-0 pt-0.5 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 group-active:opacity-100"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <StatusSelect record={record} onStatusChange={onStatusChange} />
          </div>
        )}
      </div>
    </div>
  )
}

/** Follow-up chip — amber when due (today/upcoming), rose when overdue. */
function FollowUpChip({ dueDate }: { dueDate: string }) {
  const state = dueState(dueDate)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 font-medium tabular-nums',
        state === 'overdue'
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-amber-600 dark:text-amber-400',
      )}
    >
      <AlarmClock className="h-3 w-3" aria-hidden="true" />
      {state === 'overdue' ? 'Overdue' : 'Due'} {formatDate(dueDate)}
    </span>
  )
}

/** Compact inline status selector (Open / Monitoring / Resolved). */
function StatusSelect({
  record,
  onStatusChange,
}: {
  record: BehaviorRecordItem
  onStatusChange: (record: BehaviorRecordItem, status: BehaviorStatus) => Promise<void>
}) {
  const [value, setValue] = useState<BehaviorStatus>(record.status)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(record.status)
  }, [record.status])

  const change = async (next: BehaviorStatus) => {
    if (next === record.status || saving) return
    setValue(next)
    setSaving(true)
    try {
      await onStatusChange(record, next)
    } catch {
      // The parent reverts its optimistic override — re-sync from the record.
      setValue(record.status)
    } finally {
      setSaving(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        value={value}
        disabled={saving}
        onChange={(e) => void change(e.target.value as BehaviorStatus)}
        aria-label={`Update status of ${record.student.name}'s concern`}
        className="h-7 rounded-lg border border-border bg-card px-1.5 text-[11px] font-medium text-foreground shadow-xs outline-none transition-colors hover:border-muted-foreground/40 focus-visible:border-ring disabled:opacity-60"
      >
        <option value="open">Open</option>
        <option value="monitoring">Monitoring</option>
        <option value="resolved">Resolved</option>
      </select>
      {saving && (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  )
}

// ─── follow-ups strip (secondary, only when open follow-ups exist) ───

export function FollowUpsStrip({
  followUps,
  onOpenProfile,
  onChanged,
}: {
  followUps: FollowUpItem[]
  onOpenProfile: (studentId: string) => void
  /** quiet aggregate reload after completing one */
  onChanged: () => void
}) {
  const [completingId, setCompletingId] = useState<string | null>(null)

  const handleComplete = async (id: string) => {
    setCompletingId(id)
    try {
      await completeFollowUp(id)
      toast.success('Follow-up completed')
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not complete the follow-up.')
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Open Follow-ups</h2>
          <Badge
            variant="secondary"
            className="h-5 px-2 text-[10px] font-medium tabular-nums"
          >
            {followUps.length}
          </Badge>
        </div>
      </div>
      <div className="divide-y divide-border/40">
        {followUps.map((f) => (
          <div
            key={f.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5"
          >
            {f.student ? (
              <button
                type="button"
                onClick={() => f.student && onOpenProfile(f.student.id)}
                className="max-w-[45%] truncate rounded text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
              >
                {f.student.name}
              </button>
            ) : (
              <span className="text-sm font-medium text-foreground">—</span>
            )}
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{f.reason}</span>
            <DueChip dueDate={f.dueDate} />
            <button
              type="button"
              onClick={() => void handleComplete(f.id)}
              disabled={completingId === f.id}
              className="inline-flex shrink-0 items-center gap-1 rounded text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-60 dark:text-emerald-400"
            >
              {completingId === f.id && (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              )}
              Complete
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/** Overdue rose / due today amber / plain date muted. */
function DueChip({ dueDate }: { dueDate: string }) {
  const state = dueState(dueDate)
  return (
    <span
      className={cn(
        'shrink-0 text-[11px] font-medium tabular-nums',
        state === 'overdue'
          ? 'text-rose-600 dark:text-rose-400'
          : state === 'today'
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-muted-foreground',
      )}
    >
      {state === 'overdue'
        ? `Overdue · ${formatDate(dueDate)}`
        : state === 'today'
          ? 'Due today'
          : formatDate(dueDate)}
    </span>
  )
}
