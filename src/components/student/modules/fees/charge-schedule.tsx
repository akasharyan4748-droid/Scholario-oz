'use client'

/**
 * ChargeSchedule — the student's REAL payment schedule (§8).
 *
 * The school's actual billing rhythm — monthly Tuition + Transport
 * instalments, the annual Management charge and per-exam fees — expanded
 * Apr→Mar from the SAME canonical allocation the account derives
 * (studentChargeSchedule). NOT an invented TERM 1/2/3 fiction: the
 * structure is whatever the school configured (§6 — never hardcode).
 *
 *   APR  MAY  JUN  JUL  AUG  SEP  OCT  NOV  DEC  JAN  FEB  MAR
 *   ✓    ✓    ✓    ✓    ~    ●    ○    ○    ○    ○    ○    ○
 *
 * Clicking a month reveals EXACTLY what that month charges (§6: "what
 * exactly is each charge for") — the April cell shows the management
 * charge and exam fees a flat "TERM" label would have hidden.
 */

import { useMemo, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { SectionLabel } from '../../shell/page-header'
import { GlassCard } from '@/components/shared/ui'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StudentChargeRow } from '@/lib/store/fee-store'
import { bucketByMonth, monthYearLabel, scheduleRowState, scheduleStateToken, shortDate, todayStr } from './fee-status'

interface ChargeScheduleProps {
  rows: StudentChargeRow[]
  graceDays: number
}

export function ChargeSchedule({ rows, graceDays }: ChargeScheduleProps) {
  const today = todayStr()
  const months = useMemo(() => bucketByMonth(rows, today, graceDays), [rows, today, graceDays])

  // Default selection: the CURRENT month if it has a bucket, else the
  // month of the first unpaid charge — always somewhere meaningful.
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const currentKey = today.slice(0, 7)
  const firstUnpaid = months.find((m) => m.remaining > 0)
  const effectiveKey = selectedKey ?? months.find((m) => m.key === currentKey)?.key ?? firstUnpaid?.key ?? months[0]?.key ?? null
  const selected = months.find((m) => m.key === effectiveKey) ?? null

  const settledCount = months.filter((m) => m.state === 'settled').length
  const remainingTotal = months.reduce((s, m) => s + m.remaining, 0)

  if (months.length === 0) {
    return (
      <section className="space-y-3" aria-labelledby="fees-schedule-label">
        <SectionLabel hint={undefined}>Payment Schedule</SectionLabel>
        <GlassCard hover={false} className="on-card px-6 py-10 text-center">
          <CalendarRange className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" aria-hidden />
          <p className="text-sm font-semibold">No fee schedule for your class yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Instalments appear here once the school publishes a fee structure for your class.
          </p>
        </GlassCard>
      </section>
    )
  }

  return (
    <section className="space-y-3" aria-labelledby="fees-schedule-label">
      <SectionLabel hint={`${months.length} periods · ${settledCount} settled`}>
        <span id="fees-schedule-label">Payment Schedule</span>
      </SectionLabel>

      <GlassCard hover={false} className="on-card p-4 sm:p-5">
        {/* ── The month strip — one glance, the whole year (§8) ── */}
        <div
          role="tablist"
          aria-label="Instalments by month"
          className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-12"
        >
          {months.map((m) => {
            const token = scheduleStateToken(m.state)
            const StateIcon = token.icon
            const isSel = m.key === effectiveKey
            const isCurrent = m.key === currentKey
            return (
              <button
                key={m.key}
                role="tab"
                aria-selected={isSel}
                aria-label={`${monthYearLabel(m.key)} — ${formatINR(m.amount)}${m.remaining > 0 ? `, ${formatINR(m.remaining)} remaining` : ', fully paid'}`}
                onClick={() => setSelectedKey(m.key)}
                className={cn(
                  'group relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSel ? 'border-transparent shadow-sm' : 'border-border/70 hover:border-foreground/25',
                  m.state === 'settled' && 'bg-emerald-500/[0.06]',
                  m.state === 'partial' && 'bg-amber-500/[0.06]',
                  m.state === 'overdue' && 'bg-rose-500/[0.07]',
                  m.state === 'due' && 'bg-muted/50',
                  m.state === 'upcoming' && 'bg-transparent',
                  isSel && m.state === 'settled' && 'ring-2 ring-emerald-500/70',
                  isSel && m.state === 'partial' && 'ring-2 ring-amber-500/70',
                  isSel && m.state === 'overdue' && 'ring-2 ring-rose-500/70',
                  isSel && (m.state === 'due' || m.state === 'upcoming') && 'ring-2 ring-foreground/35',
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-px left-1/2 h-1 w-6 -translate-x-1/2 rounded-b-full bg-primary" aria-hidden />
                )}
                <span className={cn('text-[11px] font-bold uppercase tracking-wide', isCurrent ? 'text-primary' : 'text-foreground/70')}>
                  {m.label}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-foreground">
                  {formatINR(m.amount)}
                </span>
                <span className={cn('inline-flex items-center gap-1 text-[9px] font-medium', token.text)}>
                  <StateIcon className="h-2.5 w-2.5" aria-hidden />
                  {m.remaining > 0 ? formatINR(m.remaining) : 'clear'}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Selected month — exactly what this period charges (§6) ── */}
        {selected && (
          <div className="mt-4 rounded-xl border border-border/70 bg-card/60 p-4" data-testid="fees-schedule-detail">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', scheduleStateToken(selected.state).rail)} aria-hidden />
                <p className="text-sm font-bold text-foreground">{monthYearLabel(selected.key)}</p>
                {selected.key === currentKey && (
                  <span className="rounded-full border border-primary/25 bg-primary/[0.07] px-2 py-0.5 text-[10px] font-semibold text-primary">Current</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                Due {shortDate(selected.dueDate)}
                {selected.remaining > 0 && selected.remaining < selected.amount && ` · ${formatINR(selected.remaining)} of ${formatINR(selected.amount)} remaining`}
              </p>
            </div>
            <div className="mt-3 divide-y divide-border/60">
              {selected.rows.map((row) => {
                const state = scheduleRowState(row, today, graceDays)
                const token = scheduleStateToken(state)
                const RowIcon = token.icon
                return (
                  <div key={`${row.feeHead}-${row.date}`} className="flex items-center gap-3 py-2.5">
                    <span className={cn('h-7 w-1 shrink-0 rounded-full', token.rail)} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">{row.feeHead}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{row.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-bold tabular-nums text-foreground">{formatINR(row.amount)}</p>
                      {row.remaining > 0 ? (
                        <p className={cn('inline-flex items-center gap-1 text-[10px] font-medium tabular-nums', token.text)}>
                          <RowIcon className="h-2.5 w-2.5" aria-hidden />
                          {formatINR(row.remaining)} left
                        </p>
                      ) : (
                        <p className="inline-flex items-center gap-1 text-[10px] font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                          <RowIcon className="h-2.5 w-2.5" aria-hidden />
                          Paid
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── One honest closing line (§35 — no paragraphs) ── */}
        <p className="mt-3 text-[11px] text-muted-foreground tabular-nums">
          {remainingTotal > 0
            ? `${formatINR(remainingTotal)} remains across ${months.filter((m) => m.remaining > 0).length} period${months.filter((m) => m.remaining > 0).length === 1 ? '' : 's'} · charges appear here as the school posts them`
            : 'Every instalment of this year is settled'}
        </p>
      </GlassCard>
    </section>
  )
}
