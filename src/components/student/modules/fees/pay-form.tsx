'use client'

/**
 * PayForm — Step 1–3 of the payment flow (§9/§11/§12).
 *
 * WHAT are you paying (targets derived from the canonical schedule —
 * never a made-up term structure), HOW (the school's configured rails:
 * gateway checkout when connected, honest reference-based submission
 * when not), and the transfer reference for manual rails.
 *
 * Scholario already knows who is paying — the form NEVER asks for
 * student details (§9: "Do not ask users to manually enter information
 * that Scholario already knows").
 */

import { useMemo, useState } from 'react'
import {
  Banknote, Building2, CreditCard, Landmark, Lock, QrCode, ShieldCheck, Smartphone, Wallet,
} from 'lucide-react'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MoneyInput } from '@/components/principal/modules/fees/money-input'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { nextDueLabel, type NextDue } from './fee-status'

export interface PayRequest {
  amount: number
  /** Store mode vocabulary ('UPI' | 'Card' | 'Net Banking' | 'Cash' | 'Bank Transfer'). */
  method: string
  reference: string
  /** Purpose written to the ledger transaction. */
  purpose: string
}

interface PayFormProps {
  totalDue: number
  nextDue: NextDue | null
  /** Fee heads covered by the next due date (for the honest purpose line). */
  nextDueCovers: string[]
  /** Active online payment modes from the school's configuration. */
  onlineModes: Array<{ id: string; label: string }>
  /** Gateway provider when the school's gateway is connected/test-mode. */
  gatewayProvider: string | null
  /** True when the gateway is in TEST MODE (honest Stripe-style badge). */
  gatewayTestMode: boolean
  studentName: string
  onPay: (req: PayRequest) => void
  onCancel: () => void
}

type WhatKind = 'next' | 'full' | 'custom'

const METHOD_ICON: Record<string, React.ReactNode> = {
  UPI: <Smartphone className="h-4 w-4" aria-hidden />,
  Card: <CreditCard className="h-4 w-4" aria-hidden />,
  'Net Banking': <Landmark className="h-4 w-4" aria-hidden />,
  'Bank Transfer': <Building2 className="h-4 w-4" aria-hidden />,
  Cash: <Banknote className="h-4 w-4" aria-hidden />,
}

export function PayForm({
  totalDue, nextDue, nextDueCovers, onlineModes, gatewayProvider, gatewayTestMode, studentName, onPay, onCancel,
}: PayFormProps) {
  const gateway = !!gatewayProvider
  const [what, setWhat] = useState<WhatKind>(nextDue ? 'next' : 'full')
  const [customAmount, setCustomAmount] = useState<number | null>(null)
  const [method, setMethod] = useState<string>(onlineModes[0]?.id ?? 'UPI')
  const [reference, setReference] = useState('')
  const needsRef = !gateway
  const refTooShort = needsRef && reference.trim().length < 4

  const amount = what === 'next' ? (nextDue?.amount ?? 0) : what === 'full' ? totalDue : (customAmount ?? 0)
  const amountValid = amount >= 1 && amount <= totalDue

  const purpose = useMemo(() => {
    if (what === 'next' && nextDue) {
      const covers = nextDueCovers.length > 0 ? nextDueCovers.join(' & ') : 'school fees'
      return `Instalment due — ${covers}`
    }
    if (what === 'full') return totalDue > 0 ? 'Fee balance payment' : 'Fee payment'
    return 'Fee payment (partial amount)'
  }, [what, nextDue, nextDueCovers, totalDue])

  const submit = () => {
    if (!amountValid) return
    onPay({ amount, method, reference: reference.trim(), purpose })
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-4 w-4" aria-hidden />
          </div>
          Pay Fees
        </DialogTitle>
        <DialogDescription>
          {studentName} · choose what to pay and how
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-3">
        {/* ── STEP 1 — What are you paying? (§9 — targets from the ledger) ── */}
        <fieldset>
          <legend className="mb-2 text-xs font-semibold">What are you paying?</legend>
          <div className="space-y-2">
            {nextDue && nextDue.amount < totalDue && (
              <WhatOption
                selected={what === 'next'}
                onSelect={() => setWhat('next')}
                title={`Next instalment · ${formatINR(nextDue.amount)}`}
                sub={nextDueLabel(nextDue)}
                badge={nextDue.kind === 'overdue' ? 'overdue' : nextDue.kind === 'grace' ? 'grace' : 'next'}
              />
            )}
            <WhatOption
              selected={what === 'full'}
              onSelect={() => setWhat('full')}
              title={`Full balance · ${formatINR(totalDue)}`}
              sub="Clears everything outstanding for the year"
              badge="clear all"
            />
            <div>
              <button
                type="button"
                onClick={() => setWhat('custom')}
                aria-pressed={what === 'custom'}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all',
                  what === 'custom' ? 'border-primary bg-primary/[0.05]' : 'border-border bg-card/50 hover:border-foreground/25',
                )}
              >
                <div>
                  <p className="text-sm font-semibold">Custom amount</p>
                  <p className="text-[11px] text-muted-foreground">Pay part of the balance now</p>
                </div>
                {what !== 'custom' && <span className="text-[11px] font-medium text-muted-foreground">Select to enter</span>}
              </button>
              {what === 'custom' && (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-card/50 p-2.5">
                  <span className="pl-1 text-xs font-semibold text-muted-foreground">Amount</span>
                  <MoneyInput
                    value={customAmount}
                    onChange={setCustomAmount}
                    min={1}
                    ariaLabel="Custom payment amount in rupees"
                    className="h-9"
                  />
                  {customAmount != null && customAmount > totalDue && (
                    <span className="shrink-0 text-[11px] font-medium text-rose-600">max {formatINR(totalDue)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* ── STEP 2 — How (§11 — the school's configured rails) ── */}
        <fieldset>
          <legend className="mb-2 text-xs font-semibold">Payment method</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
            {onlineModes.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                  method === m.id ? 'border-primary bg-primary/[0.05]' : 'border-border bg-card/50 hover:border-foreground/25',
                )}
              >
                <span className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  method === m.id ? 'bg-primary/10 text-primary' : 'bg-muted/70 text-muted-foreground',
                )} aria-hidden>
                  {METHOD_ICON[m.id] ?? <QrCode className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {gateway ? 'Instant confirmation' : 'Verified by the school office'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── STEP 3 — Reference (manual rails only, §12) ── */}
        {needsRef && (
          <div>
            <label htmlFor="pay-reference" className="mb-2 block text-xs font-semibold">Transaction reference</label>
            <input
              id="pay-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="UPI / UTR / slip number from your payment"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              The school office confirms your payment against this reference — usually the same day.
            </p>
          </div>
        )}

        {/* ── Honest security rails (§40) ── */}
        {gateway ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Secure checkout via <span className="font-semibold capitalize text-foreground">{gatewayProvider}</span> — the gateway confirms
              your payment and the official receipt is issued immediately. Card details are never stored in Scholario.
              {gatewayTestMode && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  <Lock className="h-2.5 w-2.5" aria-hidden /> test mode
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Your payment is recorded as <span className="font-medium text-foreground">under verification</span> — the office matches it to
              your reference, then the official receipt appears in Payment History.
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={submit}
          disabled={!amountValid || refTooShort}
          className="min-w-[150px]"
          data-testid="pay-submit"
        >
          {gateway ? <Landmark className="h-3.5 w-3.5" aria-hidden /> : <Wallet className="h-3.5 w-3.5" aria-hidden />}
          {gateway ? `Pay ${formatINR(amount)}` : `Submit ${formatINR(amount)}`}
        </Button>
      </DialogFooter>
    </div>
  )
}

function WhatOption({ selected, onSelect, title, sub, badge }: {
  selected: boolean
  onSelect: () => void
  title: string
  sub: string
  badge: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all',
        selected ? 'border-primary bg-primary/[0.05]' : 'border-border bg-card/50 hover:border-foreground/25',
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        {badge}
      </span>
    </button>
  )
}
