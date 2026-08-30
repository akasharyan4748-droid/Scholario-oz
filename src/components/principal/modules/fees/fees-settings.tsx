'use client'

/**
 * FeesSettingsSection — Fee Management module settings (FEE-SPECIFIC RULES
 * ONLY).
 *
 * ARCHITECTURE (FIN-CENTRAL-1): global payment infrastructure (methods,
 * bank accounts, UPI/QR, gateway) and school-wide receipts now live in the
 * CENTRAL Finance Settings (Finance Dashboard → Settings). They are
 * configured once at the school level and consumed here through the shared
 * fee-store — this page never duplicates them. A compact link card keeps
 * the central surface discoverable from Fee Management.
 *
 * What remains here is genuinely fee-specific:
 *
 *   1. Payment Channels & Receipts — pointer to the central Finance Settings
 *   2. Late Fee Rules       — per-month amount, grace period, max
 *   3. Concession Rules     — sibling / staff ward / scholarship %
 *   4. One-Time Entry Fees  — admission policy snapshot (read-only values)
 *   5. Controlled-Edit Policy — documents the ACTUAL structure versioning
 *
 * Card anatomy mirrors Salary Settings via the shared SettingsCard
 * primitive (modules/shared/settings-card.tsx): rounded-xl border bg-card
 * p-4, [10px] uppercase muted label + small muted icon, right-aligned
 * action, shadcn Switch toggles, label-left/control-right rows.
 */

import { useState } from 'react'
import {
  AlertTriangle, Gift,
  Check, Archive, CreditCard, ArrowUpRight,
  Lock, UserPlus, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useFeeStore } from '@/lib/store/fee-store'
import { useFocusStore } from '@/lib/store/focus-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
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

export function FeesSettingsSection({ onNavigate }: { onNavigate?: (moduleKey: string) => void } = {}) {
  return (
    // No page heading / banner — the "Settings" tab establishes context and
    // content starts immediately (Salary Settings benchmark).
    <div className="space-y-4">
      <CentralFinanceSettingsLink onNavigate={onNavigate} />
      <LateFeeSettings />
      <ConcessionSettings />
      <AdmissionFeesCard />
      <PoliciesSettings />
    </div>
  )
}

// ─── Central Finance Settings pointer — payment infrastructure and
// receipts are school-wide, not fee-specific. One compact card keeps the
// central surface discoverable without duplicating any configuration.

function CentralFinanceSettingsLink({ onNavigate }: { onNavigate?: (moduleKey: string) => void }) {
  const setFocus = useFocusStore((s) => s.setFocus)
  const gatewayConfig = useFeeStore((s) => s.gatewayConfig)
  const paymentModes = useFeeStore((s) => s.paymentModes)

  const open = () => {
    // Focus request makes the Finance Dashboard land on its Settings tab.
    setFocus({ type: 'finance-settings', id: 'finance-settings', title: 'Finance Settings', moduleKey: 'finance' })
    onNavigate?.('finance')
  }

  const enabledCount = paymentModes.filter((m) => m.active).length
  const summary = gatewayConfig
    ? `gateway ${gatewayConfig.provider} · ${gatewayConfig.environment}`
    : `${enabledCount} of ${paymentModes.length} methods enabled`

  return (
    <SettingsCard
      label="Payment Channels & Receipts"
      icon={<CreditCard />}
      summary={summary}
      action={
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={open}>
          Open Finance Settings <ArrowUpRight className="h-3 w-3" />
        </Button>
      }
    >
      <p className="text-[11px] text-muted-foreground">
        Payment methods, bank accounts, UPI/QR, the gateway and receipt numbering are configured once at the school level — in Finance → Finance Dashboard → Settings — and used by fee collection, additional collections and application payments.
      </p>
    </SettingsCard>
  )
}

// ─── Late Fee Rules ────────────────────────────────────────────────

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
        {/* Master switch */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium">Automatically apply to overdue accounts</p>
          <Switch checked={local.enabled} onCheckedChange={(c) => setLocal({ ...local, enabled: c })} aria-label="Enable late fee" />
        </div>
        <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-2.5">
          A student 3 months overdue is charged <span className="font-bold tabular-nums text-foreground">{formatINR(local.amountPerMonth * 3, true)}</span> late fee, capped at {formatINR(local.maxLateFee, true)}.
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
        {/* Toggles */}
        <div className="divide-y divide-border/60 rounded-lg border border-border/60">
          <div className="flex items-center justify-between gap-3 px-2.5 py-2">
            <p className="text-xs font-medium">Require Principal approval</p>
            <Switch checked={local.requiresApproval} onCheckedChange={(c) => setLocal({ ...local, requiresApproval: c })} aria-label="Require principal approval" />
          </div>
          <div className="flex items-center justify-between gap-3 px-2.5 py-2">
            <p className="text-xs font-medium">Enable concessions on student accounts</p>
            <Switch checked={local.enabled} onCheckedChange={(c) => setLocal({ ...local, enabled: c })} aria-label="Enable concessions" />
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

// ─── One-Time Entry Fees (admission policy snapshot) ──────────────
// Reads admissionPolicy ({enabled, boysAmount, girlsFreeAboveGrade}) from
// useFeeStore; the only editable control is the master Switch which calls
// updateAdmissionPolicy({ enabled }) (store action — no local draft state).
function AdmissionFeesCard() {
  const admissionPolicy = useFeeStore((s) => s.admissionPolicy)
  const updateAdmissionPolicy = useFeeStore((s) => s.updateAdmissionPolicy)

  const handleToggle = () => {
    const next = !admissionPolicy.enabled
    updateAdmissionPolicy({ enabled: next })
    toast.success(next ? 'One-time entry fees enabled' : 'One-time entry fees disabled')
  }

  return (
    <SettingsCard
      label="One-Time Entry Fees"
      icon={<UserPlus />}
      summary={admissionPolicy.enabled ? 'on' : 'off'}
      action={
        <Switch
          checked={admissionPolicy.enabled}
          onCheckedChange={handleToggle}
          aria-label="Enable one-time entry fees"
        />
      }
      className={cn(!admissionPolicy.enabled && 'opacity-70')}
    >
      <div className="divide-y divide-border/60 rounded-lg border border-border/60">
        <div className="flex items-center justify-between gap-3 px-2.5 py-2.5 text-xs">
          <p className="font-medium shrink-0">Admission Fee</p>
          <p className="text-[11px] text-muted-foreground text-right min-w-0">
            boys <span className="font-semibold tabular-nums text-foreground">{formatINR(admissionPolicy.boysAmount)}</span> one-time · girls free above Class{' '}
            <span className="font-semibold tabular-nums text-foreground">{admissionPolicy.girlsFreeAboveGrade}</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 px-2.5 py-2.5 text-xs">
          <p className="font-medium shrink-0">Registration Fee</p>
          <p className="text-[11px] text-muted-foreground text-right min-w-0">
            <span className="font-semibold tabular-nums text-foreground">₹300</span> at Class 9 &amp; 11 entry points
          </p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Charged only during admission events — never billed with monthly dues.
      </p>
    </SettingsCard>
  )
}

// ─── Controlled-Edit Policy — documents the ACTUAL version mechanics
// implemented across Fee Structures (publish → lock → window).

const POLICY_ROWS = [
  {
    icon: <Lock className="h-3.5 w-3.5 shrink-0 text-sky-600 mt-0.5" />,
    lead: 'Publish locks.',
    text: 'A fee structure is immutable once published for the current session — later changes open a controlled revision and create a new version, never overwriting the old one.',
  },
  {
    icon: <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />,
    lead: '60% guardian approval.',
    text: 'A revision affecting existing charges applies only after at least 60% of affected families approve, or when the window deadline passes.',
  },
  {
    icon: <Archive className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />,
    lead: 'Archive, never delete.',
    text: 'Published structures, recorded payments and issued receipts are part of the permanent financial record — archived, not removed.',
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
