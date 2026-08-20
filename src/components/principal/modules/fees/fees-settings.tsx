'use client'

/**
 * FeesSettingsSection — Fee Management administrative settings.
 *
 * - Fee Heads (canonical list of fee head types — create / archive)
 * - Payment Modes (enable/disable, configure reference requirements)
 * - Late Fee Rules (per-month amount, grace period, max)
 * - Concession Rules (sibling / staff ward / scholarship discount %)
 * - Receipt Settings (prefix, start number, footer message, signature)
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon, IndianRupee, Smartphone, AlertTriangle, Gift,
  Receipt, ShieldCheck, Check, Plus, Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFeeStore, type PaymentMode } from '@/lib/store/fee-store'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel } from './fees-shared'
import { toast } from 'sonner'

type SettingsTab = 'fee-heads' | 'payment-modes' | 'late-fee' | 'concession' | 'receipt'

export function FeesSettingsSection() {
  const [tab, setTab] = useState<SettingsTab>('fee-heads')

  const TABS: Array<{ value: SettingsTab; label: string; icon: React.ReactNode }> = [
    { value: 'fee-heads', label: 'Fee Heads', icon: <IndianRupee className="h-3.5 w-3.5" /> },
    { value: 'payment-modes', label: 'Payment Modes', icon: <Smartphone className="h-3.5 w-3.5" /> },
    { value: 'late-fee', label: 'Late Fee Rules', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { value: 'concession', label: 'Concession Rules', icon: <Gift className="h-3.5 w-3.5" /> },
    { value: 'receipt', label: 'Receipt Settings', icon: <Receipt className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Version safety banner */}
      <div className="rounded-lg bg-sky-500/5 border border-sky-500/20 p-2.5 flex items-start gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground">
          <p className="font-semibold text-sky-700 dark:text-sky-300">Settings are version-safe</p>
          <p className="mt-0.5">Changes apply to <strong>new transactions</strong> only. Historical records remain unchanged for auditability.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
              tab === t.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'fee-heads' && <FeeHeadsSettings />}
      {tab === 'payment-modes' && <PaymentModesSettings />}
      {tab === 'late-fee' && <LateFeeSettings />}
      {tab === 'concession' && <ConcessionSettings />}
      {tab === 'receipt' && <ReceiptSettings />}
    </div>
  )
}

// ─── Fee Heads ──────────────────────────────────────────────────────

function FeeHeadsSettings() {
  const feeStructures = useFeeStore((s) => s.feeStructures)
  // Build canonical fee head list from all structures
  const allHeads = feeStructures.flatMap((s) => s.components.map((c) => ({ ...c, structure: s.className })))
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')

  return (
    <FeePanel
      title="Fee Heads"
      subtitle={`${allHeads.filter((h) => h.active).length} active · ${allHeads.filter((h) => !h.active).length} archived`}
      action={<Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}><Plus className="h-3 w-3" /> Add Head</Button>}
    >
      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mb-2">
          <div className="rounded-md border border-border bg-muted/20 p-2 flex items-center gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New fee head name…" className="h-7 text-xs flex-1" />
            <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => { toast.success('Fee head created', { description: `${newName} added to canonical registry.` }); setNewName(''); setShowAdd(false) }}>
              <Check className="h-3 w-3" /> Save
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}
      <div className="space-y-1">
        {allHeads.filter((h) => h.active).map((h) => (
          <div key={h.id} className="flex items-center gap-2 rounded-md hover:bg-muted/30 px-2 py-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <IndianRupee className="h-3.5 w-3.5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{h.name}</p>
              <p className="text-[9px] text-muted-foreground">{h.structure} · {h.frequency} · {h.mandatory ? 'Mandatory' : 'Optional'}</p>
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums">{formatINR(h.amount, true)}</span>
            <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1 text-amber-600" onClick={() => toast.info('Archive requires confirmation', { description: 'Historical transactions will be preserved.' })}>
              <Archive className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </FeePanel>
  )
}

// ─── Payment Modes ──────────────────────────────────────────────────

function PaymentModesSettings() {
  const paymentModes = useFeeStore((s) => s.paymentModes)
  const togglePaymentMode = useFeeStore((s) => s.togglePaymentMode)

  return (
    <FeePanel title="Payment Modes" subtitle="configure accepted payment methods">
      <div className="space-y-1.5">
        {paymentModes.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-md border border-border/60 px-2.5 py-2">
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1',
              m.active ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' : 'bg-muted text-muted-foreground ring-border',
            )}>
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{m.label}</p>
              <p className="text-[9px] text-muted-foreground">
                {m.requiresReference ? 'Requires reference number' : 'No reference required'}
                {m.requiresBankName && ' · Bank name required'}
                {m.requiresChequeDetails && ' · Cheque details required'}
              </p>
            </div>
            <button
              onClick={() => { togglePaymentMode(m.id); toast.success(`${m.label} ${m.active ? 'disabled' : 'enabled'}`) }}
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors shrink-0',
                m.active ? 'bg-emerald-600' : 'bg-muted-foreground/30',
              )}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow', m.active ? 'left-4.5' : 'left-0.5')}
                style={{ left: m.active ? '1.125rem' : '0.125rem' }}
              />
            </button>
          </div>
        ))}
      </div>
    </FeePanel>
  )
}

// ─── Late Fee Rules ────────────────────────────────────────────────

function LateFeeSettings() {
  const rule = useFeeStore((s) => s.lateFeeRule)
  const updateLateFeeRule = useFeeStore((s) => s.updateLateFeeRule)
  const [local, setLocal] = useState(rule)
  const dirty = JSON.stringify(local) !== JSON.stringify(rule)

  return (
    <FeePanel
      title="Late Fee Rules"
      subtitle="automatic late fee calculation policy"
      action={
        dirty && (
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { updateLateFeeRule(local); toast.success('Late fee rules updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Enable Late Fee</p>
            <p className="text-[10px] text-muted-foreground">Automatically apply late fee to overdue accounts</p>
          </div>
          <button
            onClick={() => setLocal({ ...local, enabled: !local.enabled })}
            className={cn('relative h-5 w-9 rounded-full transition-colors', local.enabled ? 'bg-emerald-600' : 'bg-muted-foreground/30')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', local.enabled ? 'left-4.5' : 'left-0.5')} style={{ left: local.enabled ? '1.125rem' : '0.125rem' }} />
          </button>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">Amount per Month (₹)</Label>
            <Input type="number" value={local.amountPerMonth} onChange={(e) => setLocal({ ...local, amountPerMonth: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Grace Period (days)</Label>
            <Input type="number" value={local.gracePeriodDays} onChange={(e) => setLocal({ ...local, gracePeriodDays: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Max Late Fee (₹)</Label>
            <Input type="number" value={local.maxLateFee} onChange={(e) => setLocal({ ...local, maxLateFee: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Applies To</Label>
            <select value={local.appliesTo} onChange={(e) => setLocal({ ...local, appliesTo: e.target.value as any })} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2">
              <option value="mandatory_only">Mandatory Heads Only</option>
              <option value="all">All Heads</option>
            </select>
          </div>
        </div>
        <div className="rounded-lg bg-muted/30 border border-border p-2.5 text-[10px] text-muted-foreground">
          <p>Preview: A student 3 months overdue will be charged <span className="font-bold tabular-nums">{formatINR(local.amountPerMonth * 3, true)}</span> late fee (capped at {formatINR(local.maxLateFee, true)}).</p>
        </div>
      </div>
    </FeePanel>
  )
}

// ─── Concession Rules ──────────────────────────────────────────────

function ConcessionSettings() {
  const rule = useFeeStore((s) => s.concessionRule)
  const updateConcessionRule = useFeeStore((s) => s.updateConcessionRule)
  const [local, setLocal] = useState(rule)
  const dirty = JSON.stringify(local) !== JSON.stringify(rule)

  return (
    <FeePanel
      title="Concession Rules"
      subtitle="approved concession categories & discounts"
      action={
        dirty && (
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { updateConcessionRule(local); toast.success('Concession rules updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Enable Concessions</p>
            <p className="text-[10px] text-muted-foreground">Allow fee concessions on student accounts</p>
          </div>
          <button
            onClick={() => setLocal({ ...local, enabled: !local.enabled })}
            className={cn('relative h-5 w-9 rounded-full transition-colors', local.enabled ? 'bg-emerald-600' : 'bg-muted-foreground/30')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', local.enabled ? 'left-4.5' : 'left-0.5')} style={{ left: local.enabled ? '1.125rem' : '0.125rem' }} />
          </button>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-[11px]">Sibling Discount (%)</Label>
            <Input type="number" value={local.siblingDiscountPct} onChange={(e) => setLocal({ ...local, siblingDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Staff Ward (%)</Label>
            <Input type="number" value={local.staffWardDiscountPct} onChange={(e) => setLocal({ ...local, staffWardDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
          <div>
            <Label className="text-[11px]">Scholarship (%)</Label>
            <Input type="number" value={local.scholarshipDiscountPct} onChange={(e) => setLocal({ ...local, scholarshipDiscountPct: Number(e.target.value) })} className="h-8 text-xs tabular-nums" />
          </div>
        </div>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Require Principal Approval</p>
            <p className="text-[10px] text-muted-foreground">Concessions must be approved by Principal before applying</p>
          </div>
          <button
            onClick={() => setLocal({ ...local, requiresApproval: !local.requiresApproval })}
            className={cn('relative h-5 w-9 rounded-full transition-colors', local.requiresApproval ? 'bg-emerald-600' : 'bg-muted-foreground/30')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', local.requiresApproval ? 'left-4.5' : 'left-0.5')} style={{ left: local.requiresApproval ? '1.125rem' : '0.125rem' }} />
          </button>
        </label>
      </div>
    </FeePanel>
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
    <FeePanel
      title="Receipt Settings"
      subtitle="receipt numbering, footer, signature"
      action={
        dirty && (
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => { updateReceiptSettings(local); toast.success('Receipt settings updated') }}>
            <Check className="h-3 w-3" /> Save
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">Receipt Number Prefix</Label>
            <Input value={local.prefix} onChange={(e) => setLocal({ ...local, prefix: e.target.value })} className="h-8 text-xs font-mono" />
          </div>
          <div>
            <Label className="text-[11px]">Paper Size</Label>
            <select value={local.paperSize} onChange={(e) => setLocal({ ...local, paperSize: e.target.value as any })} className="w-full h-8 text-xs rounded-md border border-border bg-background px-2">
              <option value="80mm">80mm Thermal</option>
              <option value="A5">A5 Half-Page</option>
            </select>
          </div>
        </div>
        <div className="rounded-md bg-muted/30 border border-border p-2.5">
          <p className="text-[10px] text-muted-foreground">Next receipt number will be:</p>
          <p className="font-mono text-base font-bold tabular-nums">{local.prefix}{receiptCounter + 1}</p>
        </div>
        <div>
          <Label className="text-[11px]">Footer Message</Label>
          <Input value={local.footerMessage} onChange={(e) => setLocal({ ...local, footerMessage: e.target.value })} className="h-8 text-xs" />
        </div>
        <label className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Show Authorized Signature</p>
            <p className="text-[10px] text-muted-foreground">Print Principal signature line on receipts</p>
          </div>
          <button
            onClick={() => setLocal({ ...local, showAuthorizedSignature: !local.showAuthorizedSignature })}
            className={cn('relative h-5 w-9 rounded-full transition-colors', local.showAuthorizedSignature ? 'bg-emerald-600' : 'bg-muted-foreground/30')}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', local.showAuthorizedSignature ? 'left-4.5' : 'left-0.5')} style={{ left: local.showAuthorizedSignature ? '1.125rem' : '0.125rem' }} />
          </button>
        </label>
      </div>
    </FeePanel>
  )
}
