'use client'

/**
 * FeesSettingsSection — Fee Management module settings (FEE-SPECIFIC RULES
 * ONLY, Principal-first).
 *
 * The Principal reads this screen as "What can I control about fees?" —
 * short titles, live status, compact controls, minimal helper text. No
 * architecture descriptions, no routes, no implementation narration.
 * (The former "Payment Channels & Receipts" pointer card was removed:
 * payment infrastructure lives in central Finance Settings and was never
 * configurable here — pointing at it was developer-facing noise.)
 *
 * What lives here is genuinely fee-specific POLICY:
 *
 *   1. Late Fee Rules        — per-month amount, grace period, max, scope
 *   2. Concession Rules      — sibling / staff ward / scholarship %
 *   3. One-Time Entry Fees   — PERMISSION-GATED policy card (admission /
 *                              registration applicability; amounts stay in
 *                              their canonical sources — this card never
 *                              creates a second amount value)
 *   4. Controlled-Edit Policy — the actual structure versioning behaviour
 *
 * Permission model (Super Admin → school capability → Principal):
 *   fee_entry_policy_manage grants the One-Time Entry Fee EDIT controls.
 *   Without it the Principal sees the live policy read-only — no editable
 *   controls, no misleading "request" actions. The store action enforces
 *   the same capability (defence in depth), matching every other fee
 *   capability.
 *
 * Card anatomy mirrors Salary Settings via the shared SettingsCard
 * primitive (modules/shared/settings-card.tsx): one flat card per group,
 * clean rows, no box-inside-box nesting.
 */

import { useMemo, useState } from 'react'
import {
  AlertTriangle, Gift, Check, Archive, Lock, UserPlus, ShieldCheck, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useFeeStore } from '@/lib/store/fee-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useEffectiveFeeCapabilities } from '@/lib/tenant/store'
import { SettingsCard } from '../shared/settings-card'
import { toast } from 'sonner'

// RuleChip — tiny mono value chip summarising the live rule values.
function RuleChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 text-[10px] font-medium tabular-nums whitespace-nowrap">
      {children}
    </span>
  )
}

/** Non-interactive "view only" pill — makes a platform-restricted setting
 *  visible as such without implying any editable or requestable action. */
function ViewOnlyChip({ label = 'View only' }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border"
      title="Managed under a platform permission you have not been granted"
    >
      <Eye className="h-2.5 w-2.5" aria-hidden /> {label}
    </span>
  )
}

export function FeesSettingsSection() {
  return (
    // No page heading / banner — the "Settings" tab establishes context and
    // content starts immediately (Salary Settings benchmark).
    <div className="space-y-4">
      <LateFeeSettings />
      <ConcessionSettings />
      <EntryFeePolicyCard />
      <PoliciesSettings />
    </div>
  )
}

// ─── Late Fee Rules ────────────────────────────────────────────────
// Principal reading: ₹50/month · max ₹500 · 7-day grace · mandatory heads
// only · applied automatically. The engine consumes the exact same rule.

function LateFeeSettings() {
  const rule = useFeeStore((s) => s.lateFeeRule)
  const updateLateFeeRule = useFeeStore((s) => s.updateLateFeeRule)
  const [local, setLocal] = useState(rule)
  const dirty = JSON.stringify(local) !== JSON.stringify(rule)

  return (
    <SettingsCard
      label="Late Fee Rules"
      icon={<AlertTriangle />}
      summary={local.enabled ? 'on' : 'off'}
      action={
        dirty ? (
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { updateLateFeeRule(local); toast.success('Late fee rules updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {/* Live rule summary — current values at a glance (updates as fields change) */}
        <div className="flex items-center flex-wrap gap-1.5">
          <RuleChip>{formatINR(local.amountPerMonth, true)} / month</RuleChip>
          <RuleChip>max {formatINR(local.maxLateFee, true)}</RuleChip>
          <RuleChip>grace {local.gracePeriodDays}d</RuleChip>
          <RuleChip>{local.appliesTo === 'mandatory_only' ? 'mandatory heads' : 'all heads'}</RuleChip>
          <RuleChip>{local.enabled ? 'applied automatically' : 'manual — engine off'}</RuleChip>
        </div>
        {/* Rule inputs — 2-col grid of labeled fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">Amount per Month (₹)</Label>
            <Input type="number" value={local.amountPerMonth} onChange={(e) => setLocal({ ...local, amountPerMonth: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Grace Period (days)</Label>
            <Input type="number" value={local.gracePeriodDays} onChange={(e) => setLocal({ ...local, gracePeriodDays: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Max Late Fee (₹)</Label>
            <Input type="number" value={local.maxLateFee} onChange={(e) => setLocal({ ...local, maxLateFee: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Applies To</Label>
            <select value={local.appliesTo} onChange={(e) => setLocal({ ...local, appliesTo: e.target.value as 'mandatory_only' | 'all' })} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1">
              <option value="mandatory_only">Mandatory Heads Only</option>
              <option value="all">All Heads</option>
            </select>
          </div>
        </div>
        {/* Master switch — clean row, no nested bordered box */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium">Automatically apply to overdue accounts</p>
          <Switch checked={local.enabled} onCheckedChange={(c) => setLocal({ ...local, enabled: c })} aria-label="Enable late fee" />
        </div>
        {/* One short engine-behaviour line — the chips above carry the values. */}
        <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-2.5">
          Each instalment unpaid past the {local.gracePeriodDays}-day grace accrues{' '}
          <span className="font-semibold tabular-nums text-foreground">{formatINR(local.amountPerMonth, true)}</span>/month, capped{' '}
          <span className="font-semibold tabular-nums text-foreground">{formatINR(local.maxLateFee, true)}</span>.
          {local.appliesTo === 'mandatory_only' ? ' Optional and additional charges are never late-fee\u2019d.' : ' Applies to all heads.'}
        </p>
      </div>
    </SettingsCard>
  )
}

// ─── Concession Rules ──────────────────────────────────────────────

function ConcessionSettings() {
  const rule = useFeeStore((s) => s.concessionRule)
  const updateConcessionRule = useFeeStore((s) => s.updateConcessionRule)
  const [local, setLocal] = useState(rule)
  const dirty = JSON.stringify(local) !== JSON.stringify(rule)

  return (
    <SettingsCard
      label="Concession Rules"
      icon={<Gift />}
      summary={local.enabled ? 'on' : 'off'}
      action={
        dirty ? (
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { updateConcessionRule(local); toast.success('Concession rules updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {/* Live rule summary — discounts at a glance (updates as fields change) */}
        <div className="flex items-center flex-wrap gap-1.5">
          <RuleChip>sibling {local.siblingDiscountPct}%</RuleChip>
          <RuleChip>staff ward {local.staffWardDiscountPct}%</RuleChip>
          <RuleChip>scholarship {local.scholarshipDiscountPct}%</RuleChip>
          {local.requiresApproval && <RuleChip><span className="text-amber-600 font-semibold">principal approval</span></RuleChip>}
        </div>
        {/* Rule inputs — discount %s */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-[11px]">Sibling Discount (%)</Label>
            <Input type="number" value={local.siblingDiscountPct} onChange={(e) => setLocal({ ...local, siblingDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Staff Ward (%)</Label>
            <Input type="number" value={local.staffWardDiscountPct} onChange={(e) => setLocal({ ...local, staffWardDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Scholarship (%)</Label>
            <Input type="number" value={local.scholarshipDiscountPct} onChange={(e) => setLocal({ ...local, scholarshipDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums mt-1" />
          </div>
        </div>
        {/* Toggles — clean rows, no nested bordered container */}
        <div className="space-y-2 border-t border-border/60 pt-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium">Require Principal approval</p>
            <Switch checked={local.requiresApproval} onCheckedChange={(c) => setLocal({ ...local, requiresApproval: c })} aria-label="Require principal approval" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium">Enable concessions on student accounts</p>
            <Switch checked={local.enabled} onCheckedChange={(c) => setLocal({ ...local, enabled: c })} aria-label="Enable concessions" />
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

// ─── One-Time Entry Fees — PERMISSION-GATED policy card ───────────
//
// POLICY, not fee-head configuration: the Catalogue already defines fee
// heads, so this card never duplicates amounts. It answers:
//   · Is one-time entry fee collection enabled?
//   · Which fees apply, where, and to whom?
//   · Who is allowed to change this?
//
// Canonical amount sources (never duplicated here):
//   · Admission Fee  → admissionPolicy (the SAME value the admission
//     engine charges via admissionFeeFor() — this card is its only editor)
//   · Registration Fee → the published fee structures (catalogue head
//     fh-2 components) — DERIVED live below, so the card can never drift
//     from what structures actually charge.
//
// One-time stays one-time: the billing engine expands only frequency
// 'One-Time' heads into a single charge — this card changes policy
// fields, never frequency semantics.

function EntryFeePolicyCard() {
  const admissionPolicy = useFeeStore((s) => s.admissionPolicy)
  const updateAdmissionPolicy = useFeeStore((s) => s.updateAdmissionPolicy)
  const feeStructures = useFeeStore((s) => s.feeStructures)
  const perms = useEffectiveFeeCapabilities()
  const canManage = perms.fee_entry_policy_manage
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(admissionPolicy)

  // Registration Fee applicability is DERIVED from the live fee
  // structures (canonical source) — draft copies are excluded because a
  // draft charges nobody.
  const registration = useMemo(() => {
    const entries = feeStructures
      .filter((st) => !/draft/i.test(st.className))
      .flatMap((st) => st.components
        .filter((c) => c.active && (c.catalogueId === 'fh-2' || c.name === 'Registration Fee'))
        .map((c) => ({ className: st.className, amount: c.amount })))
    return {
      found: entries.length > 0,
      classes: Array.from(new Set(entries.map((e) => e.className))),
      amounts: Array.from(new Set(entries.map((e) => e.amount))),
    }
  }, [feeStructures])

  const startEdit = () => setDraft(admissionPolicy)

  const save = () => {
    if (!canManage) {
      // Defence in depth — the store action enforces the same capability.
      toast.error('Not permitted', { description: 'One-time entry fee policy management is disabled for your school by the platform configuration.' })
      return
    }
    updateAdmissionPolicy(draft)
    toast.success('One-time entry fee policy updated', {
      description: draft.enabled
        ? `Enabled — boys ${formatINR(draft.boysAmount)} one-time, girls free above Class ${draft.girlsFreeAboveGrade}. Applies to future admission events; recorded payments are unchanged.`
        : 'Disabled — no entry fees will be charged at future admission events. Recorded payments are unchanged.',
    })
    setEditing(false)
  }

  return (
    <SettingsCard
      label="One-Time Entry Fees"
      icon={<UserPlus />}
      summary={admissionPolicy.enabled ? 'enabled' : 'off'}
      action={
        editing ? (
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setEditing(false); setDraft(admissionPolicy) }}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={save}>
              <Check className="h-3 w-3" /> Save
            </Button>
          </div>
        ) : canManage ? (
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => { startEdit(); setEditing(true) }}>
            Edit applicability
          </Button>
        ) : (
          <ViewOnlyChip label="View only" />
        )
      }
    >
      <div className="space-y-3">
        {/* EDIT STATE — the policy fields, exactly what the admission
            engine consumes. Compact: one switch row + two inputs. */}
        {editing && canManage ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium">Collect one-time entry fees</p>
                <p className="text-[10px] text-muted-foreground">Charged only at admission events — never with recurring dues</p>
              </div>
              <Switch checked={draft.enabled} onCheckedChange={(c) => setDraft({ ...draft, enabled: c })} aria-label="Enable one-time entry fees" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Admission Fee — Boys (₹)</Label>
                <Input
                  type="number" min={0}
                  value={draft.boysAmount}
                  onChange={(e) => setDraft({ ...draft, boysAmount: Math.max(0, Number(e.target.value)) })}
                  className="h-8 text-xs tabular-nums mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px]">Girls Exempt Above Class</Label>
                <select
                  value={draft.girlsFreeAboveGrade}
                  onChange={(e) => setDraft({ ...draft, girlsFreeAboveGrade: Number(e.target.value) })}
                  className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>Class {n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* VIEW STATE — status · who can manage · applicability.
                Clean rows: no nested boxes, no paragraphs. */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px]">
              <span className="text-muted-foreground">Status
                <span className={cn('ml-1.5 font-semibold', admissionPolicy.enabled ? 'text-emerald-600' : 'text-muted-foreground')}>
                  {admissionPolicy.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </span>
              <span className="text-muted-foreground">Who can manage
                <span className="ml-1.5 font-semibold text-foreground">{canManage ? 'Principal' : 'Platform (Super Admin)'}</span>
              </span>
            </div>

            {/* Applicability — fee / amount / applies to / eligibility */}
            <div className="divide-y divide-border/40 border-t border-b border-border/40">
              <div className="py-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <p className="font-medium shrink-0">Admission Fee</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {formatINR(admissionPolicy.boysAmount)} <span className="tabular-nums">· one-time</span>
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  New admissions · boys; girls free above Class <span className="font-medium tabular-nums">{admissionPolicy.girlsFreeAboveGrade}</span>
                </p>
              </div>
              <div className="py-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <p className="font-medium shrink-0">Registration Fee</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {registration.found
                      ? (registration.amounts.length === 1 ? `${formatINR(registration.amounts[0])} · one-time` : 'per class structure · one-time')
                      : '—'}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {registration.found
                    ? `${registration.classes.join(' · ')} entry · all new entrants`
                    : 'Not set in any published fee structure'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* One honest scope line — where amounts live, and the one-time
            guarantee (engine rule, unchanged). */}
        <p className="text-[10px] text-muted-foreground">
          Amounts live in their canonical sources — admission in this policy, registration in the published fee structures — so they can never diverge.
          Entry fees are charged once and never become recurring dues.{canManage ? '' : ' Changes are managed by the platform (Super Admin).'}
        </p>
      </div>
    </SettingsCard>
  )
}

// ─── Controlled-Edit Policy — the ACTUAL version mechanics implemented
// across Fee Structures (publish → lock → window), as short rules.

const POLICY_ROWS = [
  {
    icon: <Lock className="h-3.5 w-3.5 shrink-0 text-sky-600 mt-0.5" />,
    lead: 'Publish locks.',
    text: 'A published structure is immutable — later changes open a controlled revision and create a new version; the old one is never overwritten.',
  },
  {
    icon: <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />,
    lead: '60% guardian approval.',
    text: 'A revision affecting existing charges applies only after 60% of affected families approve, or when the window deadline passes.',
  },
  {
    icon: <Archive className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />,
    lead: 'Archive, never delete.',
    text: 'Published structures, recorded payments and issued receipts are permanent financial records — archived, not removed.',
  },
]

function PoliciesSettings() {
  return (
    <SettingsCard label="Controlled-Edit Policy" icon={<ShieldCheck />}>
      <div className="space-y-2.5">
        {POLICY_ROWS.map((row) => (
          <div key={row.lead} className="flex items-start gap-2.5">
            {row.icon}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{row.lead}</span> {row.text}
            </p>
          </div>
        ))}
      </div>
    </SettingsCard>
  )
}
