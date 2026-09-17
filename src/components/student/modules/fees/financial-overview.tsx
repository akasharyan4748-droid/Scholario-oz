'use client'

/**
 * fees/financial-overview — the FINANCIAL OVERVIEW hero (FEES-R §4–5,
 * restructured by UX-3 §19/§20/§37).
 *
 * HEADER RULE (§19/§20): this card is the top of the Fees page — the
 * sidebar already says "Fees", so there is NO module title and NO
 * "Financial overview" heading. The card opens with ONE compact, quiet
 * contextual row — `2026–27  ·  ● Partially paid` (session label + the
 * page's ONLY financial status chip) — and then the BALANCE DUE hero,
 * which stays the single strongest number: ₹4,750 with the §20 line
 * `₹4,750 paid · ₹9,500 total` immediately under it and the payment
 * progress bar. Verbose standing sentences are gone (§39) — the under-hero
 * line says everything; a one-line hint appears only when a payment is
 * genuinely under review.
 *
 * NO-DUES STATE (§37): when nothing is pending, the hero is replaced by a
 * calm emerald "All fees paid" state (+ View statement) — never a giant ₹0
 * dashboard. The progress bar keeps the 100% context.
 *
 * The FINANCIAL TIMELINE (§16) lives inside the card — a compact
 * chronological story of the ledger (annual fee posted at session start,
 * each real payment on its real date, verification state included).
 */

import { AlertTriangle, CheckCircle2, FileText, Landmark, Receipt, Wallet } from 'lucide-react'
import { GlassCard } from '@/components/shared/ui'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatINR, formatDate } from '@/lib/format'
import { sessionChipLabel } from './derive'
import type { FinancialStatus, FeeTimelineEvent } from './derive'

const STATUS_CHIP_CLASS: Record<FinancialStatus['tone'], string> = {
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25',
}

const MARKER_CLASS: Record<FeeTimelineEvent['marker']['tone'], string> = {
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  neutral: 'bg-muted text-muted-foreground',
}

const MARKER_DOT: Record<FeeTimelineEvent['marker']['tone'], string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  neutral: 'bg-muted-foreground/60',
}

interface FinancialOverviewProps {
  /** Academic session label source, e.g. '2026-2027' → chip '2026–27'. */
  session: string
  status: FinancialStatus
  totalFee: number
  totalPaid: number
  totalPending: number
  paidPct: number
  txnCount: number
  timeline: FeeTimelineEvent[]
  /** Real failed attempts on the ledger (shown honestly, §5). */
  failedCount: number
  onlinePaymentsEnabled: boolean
  onPay: () => void
  onViewStatement: () => void
}

function MiniStat({ label, value, tone, icon }: { label: string; value: string; tone?: 'emerald' | 'amber'; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className={cn('flex h-5 w-5 items-center justify-center rounded-md', tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : tone === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground')} aria-hidden>
          {icon}
        </span>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className={cn(
        'font-display text-base sm:text-lg font-bold tabular-nums mt-1',
        tone === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' : tone === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-foreground',
      )}>{value}</p>
    </div>
  )
}

export function FinancialOverview({
  session, status, totalFee, totalPaid, totalPending, paidPct, txnCount, timeline,
  failedCount, onlinePaymentsEnabled, onPay, onViewStatement,
}: FinancialOverviewProps) {
  const settled = totalPending <= 0
  // Compact view: the most recent ledger events (full story → statement).
  const shown = timeline.length > 4 ? timeline.slice(-4) : timeline
  return (
    <GlassCard className="p-4 sm:p-5" data-testid="financial-overview">
      {/* ─── §19/§20 — the ONE compact contextual row (session · status) ── */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <p className="text-xs font-semibold tabular-nums text-muted-foreground">
          {sessionChipLabel(session)}
        </p>
        <span className="text-muted-foreground/50" aria-hidden>·</span>
        <span
          className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', STATUS_CHIP_CLASS[status.tone])}
          role="status"
          aria-label={`Fee status: ${status.label}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {status.label}
        </span>
      </div>

      {settled ? (
        /* ─── §37 NO-DUES — a calm all-clear, not a giant ₹0 dashboard ── */
        <div className="mt-4 flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          >
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl sm:text-3xl font-extrabold leading-tight text-emerald-600 dark:text-emerald-400">
              All fees paid
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Nothing pending for {sessionChipLabel(session)} · {formatINR(totalPaid)} received
            </p>
          </div>
        </div>
      ) : (
        /* ─── Hero: BALANCE DUE (§4/§20 — the actionable figure) ─────── */
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Balance due</p>
          <p className="font-display text-4xl sm:text-5xl font-extrabold tabular-nums leading-tight text-amber-600 dark:text-amber-500">
            <AnimatedCounter value={totalPending} format={(n) => formatINR(n)} />
          </p>
          {/* §20 — the compact line that says everything the old side text
              and verbose hints used to say, in one honest breath. */}
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{formatINR(totalPaid)} paid</span>
            <span aria-hidden> · </span>
            <span className="tabular-nums">{formatINR(totalFee)} total</span>
          </p>
          {/* §39 — a hint ONLY when it adds real information (a payment is
              in flight and not yet counted). */}
          {status.key === 'under-review' && (
            <p className="mt-0.5 text-xs text-cyan-700 dark:text-cyan-400">{status.hint}</p>
          )}
        </div>
      )}

      {/* ─── Visual payment progress (§4) ──────────────────────────── */}
      <div
        className="mt-4"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={paidPct}
        aria-label={`Payment progress — ${formatINR(totalPaid)} paid of ${formatINR(totalFee)}`}
      >
        <ProgressBar value={paidPct} color="oklch(0.62 0.15 155)" height={8} />
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            <span className="sr-only">Progress: </span>{paidPct}% paid
          </span>
          <span className="text-muted-foreground tabular-nums">{txnCount} {txnCount === 1 ? 'transaction' : 'transactions'}</span>
        </div>
      </div>

      {/* Honest failure note (§5) — only when the ledger really has one. */}
      {failedCount > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden />
          <p className="text-[11px] text-rose-700 dark:text-rose-300">
            {failedCount === 1 ? 'A previous payment attempt failed' : `${failedCount} previous payment attempts failed`} — no money moved. The balance is unaffected.
          </p>
        </div>
      )}

      {/* ─── Actions ───────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {!settled && onlinePaymentsEnabled && (
          <Button
            onClick={onPay}
            className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white sm:min-w-[180px]"
          >
            <Wallet className="h-4 w-4" /> Pay {formatINR(totalPending)}
          </Button>
        )}
        {!settled && !onlinePaymentsEnabled && (
          /* SaaS-STAGE-2A §20 — no online rails for this school: the honest
             disabled state, with the outstanding amount still visible. */
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
            <Landmark className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              Online payments are not enabled for your school — the balance of{' '}
              <span className="font-semibold text-foreground tabular-nums">{formatINR(totalPending)}</span>{' '}
              is payable at the school office.
            </span>
          </div>
        )}
        <Button
          variant="outline"
          onClick={onViewStatement}
          className="h-11 gap-1.5 border-violet-500/30 text-violet-700 hover:bg-violet-500/[0.06] hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
        >
          <FileText className="h-4 w-4" /> View fee statement
        </Button>
      </div>

      {/* ─── Supporting figures (§4 — compact, not equal hero cards) ── */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MiniStat label="Total payable" value={formatINR(totalFee)} icon={<Landmark className="h-3 w-3" />} />
        <MiniStat label="Paid" value={formatINR(totalPaid)} tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />} />
        <MiniStat label="Balance due" value={formatINR(totalPending)} tone={settled ? undefined : 'amber'} icon={<Wallet className="h-3 w-3" />} />
        <MiniStat label="Transactions" value={String(txnCount)} icon={<Receipt className="h-3 w-3" />} />
      </div>

      {/* ─── Financial timeline (§16) ──────────────────────────────── */}
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ledger timeline</h3>
          <button
            type="button"
            onClick={onViewStatement}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-violet-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 dark:text-violet-400"
          >
            Full statement <span aria-hidden>→</span>
          </button>
        </div>
        <ol className="mt-3 space-y-0" aria-label="Fee ledger timeline">
          {shown.map((ev, i) => (
            <li key={ev.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < shown.length - 1 && (
                <span className="absolute left-[7px] top-4 bottom-0 w-px bg-border" aria-hidden />
              )}
              <span className={cn('relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-card', MARKER_DOT[ev.marker.tone])} aria-hidden />
              <div className="min-w-0 flex-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-xs font-medium text-foreground">{ev.title}</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">{formatDate(ev.at)}</p>
                <p className="w-full">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', MARKER_CLASS[ev.marker.tone])}>
                    <span className="sr-only">Status: </span>{ev.marker.label}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </GlassCard>
  )
}
