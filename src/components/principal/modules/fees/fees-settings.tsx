'use client'

/**
 * FeesSettingsSection — Fee Management administrative settings.
 *
 * UX-SAL-1 (presentation-only rebuild): the settings page now follows the
 * Salary & Payroll Settings benchmark — ONE flat stack of compact cards,
 * no inner tab bar, no nested sub-navigation, no dev banners. The previous
 * 6-tab layout (with Payment Collection nesting 5 more sub-tabs) forced
 * two navigation levels for what is a preferences surface; every section
 * is now visible in one scroll, in practical order:
 *
 *   1. Payment Collection   — methods · bank accounts · UPI/QR · gateway
 *                             (see fees-settings-payment.tsx)
 *   2. Late Fee Rules       — per-month amount, grace period, max
 *   3. Concession Rules     — sibling / staff ward / scholarship %
 *   4. One-Time Entry Fees  — admission policy snapshot (read-only values)
 *   5. Receipt Settings     — prefix, paper, next number, footer, signature
 *   6. Controlled-Edit Policy + Notifications
 *
 * Fee Heads master catalogue and the Reconciliation ledger were removed
 * from Settings by product decision — head management lives in Fee
 * Structures (per-class config) and reconciliation lives with the
 * Transactions data, not on a preferences surface.
 *
 * Card anatomy mirrors Salary Settings: rounded-xl border bg-card p-4,
 * [10px] uppercase muted label + small muted icon, right-aligned action,
 * shadcn Switch toggles, label-left/control-right rows. All store
 * mutations, dirty-state Save flows and dialogs are behaviour-identical.
 */

import { useState } from 'react'
import {
  AlertTriangle, Gift,
  Receipt, Check, Archive,
  Lock, UserPlus, ShieldCheck, Bell,
} from 'lucide-react'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useFeeStore } from '@/lib/store/fee-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SettingsCard } from './fees-shared'
import { FeesPaymentCollectionSettings } from './fees-settings-payment'
import { toast } from 'sonner'

// RuleChip — tiny mono value chip summarising the live rule values.
function RuleChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 text-[10px] font-medium tabular-nums whitespace-nowrap">
      {children}
    </span>
  )
}

export function FeesSettingsSection() {
  return (
    // No page heading / banner — the "Settings" tab establishes context and
    // content starts immediately (Salary Settings benchmark).
    <div className="space-y-4">
      <FeesPaymentCollectionSettings />
      <LateFeeSettings />
      <ConcessionSettings />
      <AdmissionFeesCard />
      <ReceiptSettings />
      <PoliciesSettings />
      <NotificationsSettings />
    </div>
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

// ─── Receipt Settings ──────────────────────────────────────────────

function ReceiptSettings() {
  const settings = useFeeStore((s) => s.receiptSettings)
  const updateReceiptSettings = useFeeStore((s) => s.updateReceiptSettings)
  const receiptCounter = useFeeStore((s) => s.receiptCounter)
  const [local, setLocal] = useState(settings)
  const dirty = JSON.stringify(local) !== JSON.stringify(settings)

  return (
    <SettingsCard
      label="Receipt Settings"
      icon={<Receipt />}
      summary={`next ${local.prefix}${receiptCounter + 1}`}
      action={
        dirty ? (
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { updateReceiptSettings(local); toast.success('Receipt settings updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">Receipt Number Prefix</Label>
            <Input value={local.prefix} onChange={(e) => setLocal({ ...local, prefix: e.target.value })} className="h-8 text-xs font-mono mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Paper Size</Label>
            <select value={local.paperSize} onChange={(e) => setLocal({ ...local, paperSize: e.target.value as '80mm' | 'A5' })} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1">
              <option value="80mm">80mm Thermal</option>
              <option value="A5">A5 Half-Page</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="text-[11px]">Footer Message</Label>
          <Input value={local.footerMessage} onChange={(e) => setLocal({ ...local, footerMessage: e.target.value })} className="h-8 text-xs mt-1" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2.5">
          <p className="text-xs font-medium">Show authorized signature on receipts</p>
          <Switch checked={local.showAuthorizedSignature} onCheckedChange={(c) => setLocal({ ...local, showAuthorizedSignature: c })} aria-label="Show authorized signature" />
        </div>
      </div>
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

// ─── Notification Preferences — wired to the real alerts centre feed ───

function NotificationsSettings() {
  const autoAlertsEnabled = useLiveAlerts((s) => s.autoAlertsEnabled)
  const toggleAutoAlerts = useLiveAlerts((s) => s.toggleAutoAlerts)

  return (
    <SettingsCard label="Notifications" icon={<Bell />}>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium">Live finance alerts</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Approvals, collections, structure revisions and gateway events reach the alerts centre as they happen.
            </p>
          </div>
          <Switch checked={autoAlertsEnabled} onCheckedChange={toggleAutoAlerts} aria-label="Live finance alerts" />
        </div>
        <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-2.5">
          Critical financial confirmations (payments, receipts) always notify via toast regardless of this setting.
        </p>
      </div>
    </SettingsCard>
  )
}
