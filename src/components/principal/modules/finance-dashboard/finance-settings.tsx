'use client'

/**
 * FinanceSettingsSection — CENTRAL Finance Settings.
 *
 * ARCHITECTURE (FIN-CENTRAL-1): global financial infrastructure is
 * configured ONCE at the school level, logically owned by the Finance
 * Dashboard (there is deliberately NO separate "Finance Settings" sidebar
 * module — this tab IS the centralized capability). One flat stack in the
 * Salary & Payroll Settings anatomy, clustered by group:
 *
 *   PAYMENT & COLLECTION — methods · bank accounts · UPI/QR · gateway
 *                          (see finance-settings-payment.tsx)
 *   RECEIPTS             — numbering, format, behaviour (one school-wide
 *                          numbering stream used by fee collections,
 *                          additional collections and application payments)
 *   ALERTS               — live finance alert preferences
 *
 * Module-specific business rules stay inside their modules: fee rules
 * (late fees, concessions, entry fees, controlled-edit policy) in
 * Fee Management → Settings; payroll rules in Salary & Payroll → Settings.
 *
 * Data ownership is unchanged — configuration lives in the shared
 * fee-store and is consumed by every payment flow (fee collections,
 * additional collections, UPI collect, application payments).
 */

import { useState } from 'react'
import { Receipt, Check, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useFeeStore } from '@/lib/store/fee-store'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { SettingsCard, SettingsGroupLabel } from '../shared/settings-card'
import { FinancePaymentCollectionSettings } from './finance-settings-payment'
import { toast } from 'sonner'

export function FinanceSettingsSection() {
  return (
    // No page heading — the "Settings" tab establishes context and content
    // starts immediately (Fee/Salary Settings benchmark).
    <div className="space-y-3 max-w-7xl mx-auto">
      <SettingsGroupLabel>Payment &amp; Collection</SettingsGroupLabel>
      <FinancePaymentCollectionSettings />

      <SettingsGroupLabel>Receipts</SettingsGroupLabel>
      <FinanceReceiptsSettings />

      <SettingsGroupLabel>Alerts</SettingsGroupLabel>
      <FinanceAlertsSettings />
    </div>
  )
}

// ─── Receipts — school-wide numbering + format + behaviour ─────────
// One numbering stream (prefix + counter) backs fee receipts, additional
// collections and application payments alike.

function FinanceReceiptsSettings() {
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

// ─── Alerts — live finance alert preferences (alerts centre feed) ──

function FinanceAlertsSettings() {
  const autoAlertsEnabled = useLiveAlerts((s) => s.autoAlertsEnabled)
  const toggleAutoAlerts = useLiveAlerts((s) => s.toggleAutoAlerts)

  return (
    <SettingsCard label="Finance Alerts" icon={<Bell />}>
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
