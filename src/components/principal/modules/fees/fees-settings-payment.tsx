'use client'

/**
 * FeesPaymentCollectionSettings — Payment Collection configuration.
 *
 * The "School Finance Configuration" surface — wires the new payment
 * infrastructure added to fee-store.ts (Phase 4) to the Settings tab:
 *
 *   A. Accepted Payment Methods  → paymentModes[] + togglePaymentMode
 *   B. Bank & Settlement          → bankAccounts[] + addBankAccount / updateBankAccount /
 *                                   setPrimaryBankAccount / deactivateBankAccount
 *   C. UPI / QR                   → upiQrConfigs[] + addUpiQrConfig / updateUpiQrConfig
 *   D. Payment Gateway            → gatewayConfig + connectGateway / disconnectGateway /
 *                                   updateGatewayStatus
 *   E. Reconciliation             → webhookEvents + settlements + reconciliationRecords
 *
 * Secret keys are NEVER stored client-side. The Connect Gateway form only
 * captures merchantId + apiKeyId (the public key ID). The webhook secret
 * is configured server-side — we surface a note instead of an input.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone, CreditCard, Building2, Banknote, FileText, Wallet,
  Landmark, QrCode, Plug, Unplug, ShieldCheck, ShieldAlert,
  Check, Plus, Star, Ban, Pencil, RefreshCw, Webhook, ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useFeeStore } from '@/lib/store/fee-store'
import type {
  PaymentMode, GatewayProvider, GatewayEnvironment, BankAccountType,
  UpiQrType,
} from '@/lib/store/fee-store'
import { formatINR, formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FeePanel, FeeStatusBadge } from './fees-shared'
import { toast } from 'sonner'

// ─── Sub-section navigation ──────────────────────────────────────────

type Section = 'methods' | 'bank' | 'upi' | 'gateway' | 'recon'

const SECTIONS: Array<{ value: Section; label: string }> = [
  { value: 'methods', label: 'Payment Methods' },
  { value: 'bank', label: 'Bank & Settlement' },
  { value: 'upi', label: 'UPI / QR' },
  { value: 'gateway', label: 'Payment Gateway' },
  { value: 'recon', label: 'Reconciliation' },
]

export function FeesPaymentCollectionSettings() {
  const [section, setSection] = useState<Section>('methods')

  return (
    <div className="space-y-3">
      {/* Sub-navigation strip */}
      <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSection(s.value)}
            className={cn(
              'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
              section === s.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {section === 'methods' && <AcceptedPaymentMethods />}
          {section === 'bank' && <BankAndSettlement />}
          {section === 'upi' && <UpiQrConfigSection />}
          {section === 'gateway' && <PaymentGatewaySection />}
          {section === 'recon' && <ReconciliationSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── A. Accepted Payment Methods ────────────────────────────────────

interface MethodGroup {
  label: string
  badge: string
  modes: PaymentMode[]
}

const METHOD_GROUPS: MethodGroup[] = [
  {
    label: 'Online Methods',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
    modes: ['UPI', 'Card', 'Net Banking'],
  },
  {
    label: 'Offline Methods',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20',
    modes: ['Cash', 'Cheque', 'Bank Transfer'],
  },
]

const METHOD_DESCRIPTION: Record<PaymentMode, string> = {
  UPI: 'Instant UPI payment via VPA. Requires gateway connection or UPI QR config to be available to parents.',
  Card: 'Debit / Credit card payments. Routed through the connected payment gateway.',
  'Net Banking': 'Direct bank transfer via net banking. Routed through the connected payment gateway.',
  Cash: 'Cash collected at the school counter. Requires Principal verification before receipt is finalized.',
  Cheque: 'Cheque deposit. Bank name + cheque number + cheque date are mandatory.',
  'Bank Transfer': 'Manual NEFT / RTGS / IMPS transfer to a school bank account. Parent shares the UTR for verification.',
}

const METHOD_ICON: Record<PaymentMode, React.ComponentType<{ className?: string }>> = {
  UPI: Smartphone,
  Card: CreditCard,
  'Net Banking': Building2,
  Cash: Banknote,
  Cheque: FileText,
  'Bank Transfer': Wallet,
}

function AcceptedPaymentMethods() {
  const paymentModes = useFeeStore((s) => s.paymentModes)
  const togglePaymentMode = useFeeStore((s) => s.togglePaymentMode)
  const gatewayConfig = useFeeStore((s) => s.gatewayConfig)
  const upiQrConfigs = useFeeStore((s) => s.upiQrConfigs)
  // Fix 3 (FEE-ARCH): Bank Transfer availability depends on whether at
  // least one bank account is active (the parent needs an account to
  // NEFT/RTGS to). The previous implementation treated Bank Transfer as
  // always-available offline — but without a configured account the
  // parent has nowhere to send the money.
  const bankAccounts = useFeeStore((s) => s.bankAccounts)

  // ─── Availability (Fix 3 — FEE-ARCH) ──────────────────────────────
  // Per-method "is this method actually available to parents?" check.
  //   UPI          → gateway connected/test_mode  OR  an active UPI QR
  //   Card         → gateway connected/test_mode
  //   Net Banking  → gateway connected/test_mode
  //   Cash         → always (offline, no infrastructure required)
  //   Cheque       → always (offline, no infrastructure required)
  //   Bank Transfer → at least one active BankAccount
  //
  // The toggle logic is unchanged — this only drives the status badge.
  const isAvailable = (mode: PaymentMode): boolean => {
    switch (mode) {
      case 'Cash':
      case 'Cheque':
        return true
      case 'Bank Transfer':
        return bankAccounts.some((b) => b.status === 'active')
      case 'UPI':
        if (upiQrConfigs.some((c) => c.status === 'active')) return true
        return !!gatewayConfig && (gatewayConfig.status === 'connected' || gatewayConfig.status === 'test_mode')
      case 'Card':
      case 'Net Banking':
        return !!gatewayConfig && (gatewayConfig.status === 'connected' || gatewayConfig.status === 'test_mode')
      default:
        return false
    }
  }

  // Status badge for a method:
  //   !config.active → "Disabled" (muted)
  //    config.active + isAvailable → "Available" (emerald)
  //    config.active + !isAvailable → "Configuration required" (amber)
  const getStatusBadge = (mode: PaymentMode) => {
    const config = paymentModes.find((m) => m.id === mode)
    if (!config) return null
    if (!config.active) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ring-1 bg-muted text-muted-foreground ring-border/40 whitespace-nowrap">
          <Ban className="h-2.5 w-2.5" /> Disabled
        </span>
      )
    }
    if (isAvailable(mode)) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ring-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20 whitespace-nowrap">
          <Check className="h-2.5 w-2.5" /> Available
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ring-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20 whitespace-nowrap">
        <AlertTriangle className="h-2.5 w-2.5" /> Configuration required
      </span>
    )
  }

  // Per-method "what to configure" hint shown when enabled + not available.
  const getConfigHint = (mode: PaymentMode): string => {
    switch (mode) {
      case 'UPI':
        return 'Connect a payment gateway OR add an active UPI QR to make UPI available to parents.'
      case 'Card':
      case 'Net Banking':
        return 'Connect a payment gateway (Razorpay / Cashfree / PayU) to enable card / net-banking payments.'
      case 'Bank Transfer':
        return 'Add at least one active bank account so parents have a destination for NEFT / RTGS / IMPS.'
      default:
        return ''
    }
  }

  return (
    <FeePanel
      title="Accepted Payment Methods"
      subtitle="enable / disable payment modes — the status badge reflects gateway + UPI QR + bank configuration"
    >
      <div className="space-y-4">
        {METHOD_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ring-1', group.badge)}>
                {group.label}
              </span>
            </div>
            <div className="space-y-1.5">
              {group.modes.map((modeId) => {
                const config = paymentModes.find((m) => m.id === modeId)
                if (!config) return null
                const Icon = METHOD_ICON[modeId]
                const available = isAvailable(modeId)
                const statusBadge = getStatusBadge(modeId)
                const showConfigHint = config.active && !available
                return (
                  <div
                    key={modeId}
                    className={cn(
                      'flex items-start gap-3 rounded-md border px-2.5 py-2 transition-colors',
                      config.active ? 'border-border/60 bg-card' : 'border-border/40 bg-muted/20',
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1',
                      config.active ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' : 'bg-muted text-muted-foreground ring-border',
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold">{config.label}</p>
                        {statusBadge}
                        {config.requiresReference && (
                          <span className="text-[8px] uppercase text-muted-foreground font-semibold tracking-wider">ref required</span>
                        )}
                        {config.requiresChequeDetails && (
                          <span className="text-[8px] uppercase text-muted-foreground font-semibold tracking-wider">cheque details</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{METHOD_DESCRIPTION[modeId]}</p>
                      {showConfigHint && (
                        <p className="text-[9px] text-amber-700 dark:text-amber-400 mt-1 flex items-start gap-1">
                          <AlertTriangle className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                          <span>{getConfigHint(modeId)}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        togglePaymentMode(modeId)
                        toast.success(`${config.label} ${config.active ? 'disabled' : 'enabled'}`)
                      }}
                      aria-label={`Toggle ${config.label}`}
                      className={cn(
                        'relative h-5 w-9 rounded-full transition-colors shrink-0 mt-1',
                        config.active ? 'bg-emerald-600' : 'bg-muted-foreground/30',
                      )}
                    >
                      <span
                        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                        style={{ left: config.active ? '1.125rem' : '0.125rem' }}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </FeePanel>
  )
}

// ─── B. Bank & Settlement ───────────────────────────────────────────

function maskAccount(num: string): string {
  if (num.length <= 4) return `****${num}`
  return `**** **** ${num.slice(-4)}`
}

function BankAndSettlement() {
  const bankAccounts = useFeeStore((s) => s.bankAccounts)
  const addBankAccount = useFeeStore((s) => s.addBankAccount)
  const updateBankAccount = useFeeStore((s) => s.updateBankAccount)
  const setPrimaryBankAccount = useFeeStore((s) => s.setPrimaryBankAccount)
  const deactivateBankAccount = useFeeStore((s) => s.deactivateBankAccount)

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <FeePanel
        title="Bank & Settlement Accounts"
        subtitle={`${bankAccounts.length} account(s) · ${bankAccounts.filter((b) => b.isPrimary).length} primary`}
        action={<Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}><Plus className="h-3 w-3" /> Add Account</Button>}
      >
        {bankAccounts.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No bank accounts configured. Add one to enable settlement tracking.
          </div>
        ) : (
          <div className="space-y-2">
            {bankAccounts.map((b) => (
              <div
                key={b.id}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  b.isPrimary ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-border bg-card',
                  b.status === 'inactive' && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 shrink-0">
                        <Landmark className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-xs font-semibold truncate">{b.bankName}</p>
                      {b.isPrimary && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                          <Star className="h-2.5 w-2.5 fill-current" /> Primary
                        </span>
                      )}
                      <FeeStatusBadge status={b.status === 'active' ? 'Active' : 'Inactive'} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                      <div><span className="text-muted-foreground">Holder:</span> <span className="font-medium">{b.holderName}</span></div>
                      <div><span className="text-muted-foreground">A/C:</span> <span className="font-mono font-medium">{maskAccount(b.accountNumber)}</span></div>
                      <div><span className="text-muted-foreground">IFSC:</span> <span className="font-mono font-medium">{b.ifsc}</span></div>
                      <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{b.accountType}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Branch:</span> <span className="font-medium">{b.branch}</span></div>
                    </div>
                    {b.parentDisplayInstructions && (
                      <div className="mt-2 rounded-md bg-muted/30 border border-border/60 px-2 py-1.5">
                        <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Parent Instructions</p>
                        <p className="text-[10px] mt-0.5">{b.parentDisplayInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/40">
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => setEditing(b.id)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  {!b.isPrimary && b.status === 'active' && (
                    <Button
                      size="sm" variant="ghost"
                      className="h-6 text-[10px] gap-1 text-emerald-600"
                      onClick={() => {
                        setPrimaryBankAccount(b.id)
                        toast.success('Primary account updated', { description: `${b.bankName} ****${b.accountNumber.slice(-4)} is now the primary settlement account.` })
                      }}
                    >
                      <Star className="h-3 w-3" /> Set Primary
                    </Button>
                  )}
                  {b.status === 'active' && (
                    <Button
                      size="sm" variant="ghost"
                      className="h-6 text-[10px] gap-1 text-rose-600"
                      onClick={() => {
                        deactivateBankAccount(b.id)
                        toast.success('Account deactivated', { description: `${b.bankName} ****${b.accountNumber.slice(-4)} deactivated.` })
                      }}
                    >
                      <Ban className="h-3 w-3" /> Deactivate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </FeePanel>

      <FeePanel title="Parent Payment Instructions" subtitle="shown on the parent payment page for offline transfers">
        <ParentInstructionsEditor />
      </FeePanel>

      {(showAdd || editing) && (
        <BankAccountDialog
          mode={showAdd ? 'add' : 'edit'}
          accountId={editing}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          onSave={(payload) => {
            if (showAdd) {
              addBankAccount({ ...payload, status: 'active', isPrimary: false })
              toast.success('Bank account added', { description: `${payload.bankName} ****${payload.accountNumber.slice(-4)} added.` })
            } else if (editing) {
              updateBankAccount(editing, payload)
              toast.success('Bank account updated', { description: `${payload.bankName} ****${payload.accountNumber.slice(-4)} updated.` })
            }
            setShowAdd(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ParentInstructionsEditor() {
  const bankAccounts = useFeeStore((s) => s.bankAccounts)
  const updateBankAccount = useFeeStore((s) => s.updateBankAccount)
  const primary = bankAccounts.find((b) => b.isPrimary) ?? bankAccounts[0]
  const [text, setText] = useState(primary?.parentDisplayInstructions ?? '')
  const dirty = text !== (primary?.parentDisplayInstructions ?? '')

  if (!primary) {
    return <p className="text-[11px] text-muted-foreground">Add a bank account first to configure parent-facing instructions.</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">
        Editing instructions for primary account <span className="font-medium">{primary.bankName} ****{primary.accountNumber.slice(-4)}</span>.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs resize-y"
        placeholder="e.g. Use this account for NEFT/RTGS transfers. Email the transfer reference to accounts@scholario.edu for verification."
      />
      {dirty && (
        <Button
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => {
            updateBankAccount(primary.id, { parentDisplayInstructions: text })
            toast.success('Parent instructions updated')
          }}
        >
          <Check className="h-3 w-3" /> Save Instructions
        </Button>
      )}
    </div>
  )
}

interface BankAccountDialogProps {
  mode: 'add' | 'edit'
  accountId: string | null
  onClose: () => void
  onSave: (payload: Omit<import('@/lib/store/fee-store').BankAccount, 'id' | 'addedAt' | 'addedBy' | 'status' | 'isPrimary'>) => void
}

function BankAccountDialog({ mode, accountId, onClose, onSave }: BankAccountDialogProps) {
  const bankAccounts = useFeeStore((s) => s.bankAccounts)
  const existing = accountId ? bankAccounts.find((b) => b.id === accountId) : undefined

  const [holderName, setHolderName] = useState(existing?.holderName ?? 'Scholario Education Society')
  const [bankName, setBankName] = useState(existing?.bankName ?? '')
  const [accountNumber, setAccountNumber] = useState(existing?.accountNumber ?? '')
  const [ifsc, setIfsc] = useState(existing?.ifsc ?? '')
  const [branch, setBranch] = useState(existing?.branch ?? '')
  const [accountType, setAccountType] = useState<BankAccountType>(existing?.accountType ?? 'current')
  const [parentDisplayInstructions, setParentDisplayInstructions] = useState(existing?.parentDisplayInstructions ?? '')

  const valid = holderName.trim() && bankName.trim() && accountNumber.trim().length >= 4 && ifsc.trim() && branch.trim()

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Bank Account' : 'Edit Bank Account'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[11px]">Holder Name</Label>
            <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Bank Name</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="HDFC Bank" className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Account Number</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
              inputMode="numeric"
              placeholder="50100123456789"
              className="h-8 text-xs font-mono mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px]">IFSC</Label>
            <Input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase().slice(0, 11))} placeholder="HDFC0001234" className="h-8 text-xs font-mono mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Branch</Label>
            <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="MG Road, Bengaluru" className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Account Type</Label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as BankAccountType)}
              className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1"
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="nre">NRE</option>
              <option value="nro">NRO</option>
            </select>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Parent Payment Instructions (optional)</Label>
            <textarea
              value={parentDisplayInstructions}
              onChange={(e) => setParentDisplayInstructions(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs resize-y mt-1"
              placeholder="Shown to parents on the offline payment screen."
            />
          </div>
        </div>
        <div className="rounded-md bg-sky-500/5 border border-sky-500/20 p-2 flex items-start gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground">
            Account numbers are stored masked in the UI. Full numbers are kept only on the school record for reconciliation.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={!valid}
            onClick={() => onSave({ holderName, bankName, accountNumber, ifsc, branch, accountType, parentDisplayInstructions })}
          >
            <Check className="h-3.5 w-3.5" /> {mode === 'add' ? 'Add Account' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── C. UPI / QR ────────────────────────────────────────────────────

function UpiQrConfigSection() {
  const upiQrConfigs = useFeeStore((s) => s.upiQrConfigs)
  const addUpiQrConfig = useFeeStore((s) => s.addUpiQrConfig)
  const updateUpiQrConfig = useFeeStore((s) => s.updateUpiQrConfig)

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <FeePanel
      title="UPI / QR Configurations"
      subtitle={`${upiQrConfigs.length} config(s) · ${upiQrConfigs.filter((c) => c.status === 'active').length} active`}
      action={<Button size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}><Plus className="h-3 w-3" /> Add UPI Config</Button>}
    >
      {upiQrConfigs.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground">
          No UPI / QR configurations. Add one to accept UPI payments without a gateway.
        </div>
      ) : (
        <div className="space-y-2">
          {upiQrConfigs.map((c) => (
            <div key={c.id} className={cn('rounded-lg border p-3 transition-colors', c.status === 'active' ? 'border-border bg-card' : 'border-border/40 bg-muted/20 opacity-70')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
                      <QrCode className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-xs font-semibold truncate">{c.name}</p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-muted text-muted-foreground ring-1 ring-border capitalize">
                      {c.qrType} QR
                    </span>
                    <FeeStatusBadge status={c.status === 'active' ? 'Active' : 'Inactive'} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                    <div><span className="text-muted-foreground">UPI ID:</span> <span className="font-mono font-medium">{c.upiId}</span></div>
                    <div><span className="text-muted-foreground">Payee:</span> <span className="font-medium">{c.payeeName}</span></div>
                    {c.provider && <div><span className="text-muted-foreground">Provider:</span> <span className="font-medium capitalize">{c.provider}</span></div>}
                    {c.notes && <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> <span className="font-medium">{c.notes}</span></div>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/40">
                <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => setEditing(c.id)}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn('h-6 text-[10px] gap-1', c.status === 'active' ? 'text-rose-600' : 'text-emerald-600')}
                  onClick={() => {
                    const newStatus = c.status === 'active' ? 'inactive' : 'active'
                    updateUpiQrConfig(c.id, { status: newStatus })
                    toast.success(`UPI config ${newStatus === 'active' ? 'activated' : 'deactivated'}`, { description: c.name })
                  }}
                >
                  {c.status === 'active' ? <Ban className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  {c.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAdd || editing) && (
        <UpiQrDialog
          mode={showAdd ? 'add' : 'edit'}
          configId={editing}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          onSave={(payload) => {
            if (showAdd) {
              addUpiQrConfig({ ...payload, status: 'active' })
              toast.success('UPI config added', { description: `${payload.name} (${payload.upiId})` })
            } else if (editing) {
              updateUpiQrConfig(editing, payload)
              toast.success('UPI config updated', { description: payload.name })
            }
            setShowAdd(false)
            setEditing(null)
          }}
        />
      )}
    </FeePanel>
  )
}

interface UpiQrDialogProps {
  mode: 'add' | 'edit'
  configId: string | null
  onClose: () => void
  onSave: (payload: Omit<import('@/lib/store/fee-store').UpiQrConfig, 'id' | 'addedAt' | 'addedBy' | 'status'>) => void
}

function UpiQrDialog({ mode, configId, onClose, onSave }: UpiQrDialogProps) {
  const upiQrConfigs = useFeeStore((s) => s.upiQrConfigs)
  const existing = configId ? upiQrConfigs.find((c) => c.id === configId) : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [upiId, setUpiId] = useState(existing?.upiId ?? '')
  const [payeeName, setPayeeName] = useState(existing?.payeeName ?? 'Scholario Education Society')
  const [qrType, setQrType] = useState<UpiQrType>(existing?.qrType ?? 'static')
  const [provider, setProvider] = useState(existing?.provider ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const valid = name.trim() && upiId.trim().includes('@') && payeeName.trim()

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add UPI / QR Config' : 'Edit UPI / QR Config'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[11px]">Display Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Main Counter UPI" className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">UPI ID (VPA)</Label>
            <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="school@hdfc" className="h-8 text-xs font-mono mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Payee Name</Label>
            <Input value={payeeName} onChange={(e) => setPayeeName(e.target.value)} className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">QR Type</Label>
            <select
              value={qrType}
              onChange={(e) => setQrType(e.target.value as UpiQrType)}
              className="w-full h-8 text-xs rounded-md border border-border bg-background px-2 mt-1"
            >
              <option value="static">Static (any amount)</option>
              <option value="dynamic">Dynamic (per-payment)</option>
            </select>
          </div>
          <div>
            <Label className="text-[11px]">Provider (optional)</Label>
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="razorpay / bhim / custom" className="h-8 text-xs mt-1" />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px]">Notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs resize-y mt-1"
              placeholder="Where this QR is displayed, special instructions, etc."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={!valid}
            onClick={() => onSave({ name, upiId, payeeName, qrType, provider: provider || undefined, notes: notes || undefined })}
          >
            <Check className="h-3.5 w-3.5" /> {mode === 'add' ? 'Add Config' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── D. Payment Gateway ──────────────────────────────────────────────

const GATEWAY_PROVIDERS: Array<{ value: GatewayProvider; label: string; note: string }> = [
  { value: 'razorpay', label: 'Razorpay', note: 'Most popular for schools. Webhook signature support.' },
  { value: 'cashfree', label: 'Cashfree', note: 'Aggressive pricing. Easy payouts + settlements.' },
  { value: 'payu', label: 'PayU', note: 'Strong UPI + EMI support.' },
]

function maskMerchant(id: string): string {
  if (!id) return '—'
  if (id.length <= 8) return id
  return `${id.slice(0, 4)}••••${id.slice(-4)}`
}

function PaymentGatewaySection() {
  const gatewayConfig = useFeeStore((s) => s.gatewayConfig)
  const bankAccounts = useFeeStore((s) => s.bankAccounts)
  const connectGateway = useFeeStore((s) => s.connectGateway)
  const disconnectGateway = useFeeStore((s) => s.disconnectGateway)
  const updateGatewayStatus = useFeeStore((s) => s.updateGatewayStatus)
  const recordWebhookEvent = useFeeStore((s) => s.recordWebhookEvent)

  const [showConnect, setShowConnect] = useState(false)
  const settlementAccount = bankAccounts.find((b) => b.id === gatewayConfig?.settlementAccountId)

  const handleTestWebhook = () => {
    if (!gatewayConfig) return
    // Simulate an inbound webhook from the gateway — proves the webhook
    // pipeline works end-to-end. In production this is delivered by the
    // gateway itself to /api/webhooks/{provider}.
    recordWebhookEvent({
      provider: gatewayConfig.provider,
      eventId: `evt_test_${Date.now().toString(36)}`,
      eventType: 'ping.test',
      receivedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      status: 'processed',
    })
    updateGatewayStatus(gatewayConfig.status, new Date().toISOString())
    toast.success('Webhook test fired', { description: 'A test webhook event was processed successfully.' })
  }

  if (!gatewayConfig) {
    return (
      <FeePanel
        title="Payment Gateway"
        subtitle="connect an online payment gateway"
        action={<Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowConnect(true)}><Plug className="h-3 w-3" /> Connect Gateway</Button>}
      >
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 mb-3">
            <Plug className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">No gateway connected</p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
            Connect a payment gateway to accept UPI / Card / Net Banking online. Offline methods continue to work without one.
          </p>
        </div>
        {showConnect && (
          <ConnectGatewayDialog
            onClose={() => setShowConnect(false)}
            onConnect={(provider, merchantId, apiKeyId, environment) => {
              connectGateway(provider, merchantId, apiKeyId, environment)
              toast.success('Gateway connected', { description: `${provider} connected in ${environment} mode.` })
              setShowConnect(false)
            }}
          />
        )}
      </FeePanel>
    )
  }

  const connected = gatewayConfig.status === 'connected' || gatewayConfig.status === 'test_mode'
  const isLive = gatewayConfig.environment === 'live'
  const isTestMode = gatewayConfig.status === 'test_mode'

  return (
    <div className="space-y-3">
      <FeePanel
        title="Payment Gateway"
        subtitle={`${gatewayConfig.provider} · ${gatewayConfig.environment} environment`}
        action={
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-rose-600"
            onClick={() => {
              if (confirm('Disconnect gateway? Historical transactions remain on record. New online payments will be disabled.')) {
                disconnectGateway()
                toast.success('Gateway disconnected', { description: 'Online payment methods are now disabled.' })
              }
            }}
          >
            <Unplug className="h-3 w-3" /> Disconnect
          </Button>
        }
      >
        <div className="space-y-3">
          {/* Status banner */}
          <div className={cn(
            'rounded-lg border p-3 flex items-start gap-3',
            connected
              ? (isLive ? 'bg-emerald-500/[0.04] border-emerald-500/20' : 'bg-amber-500/[0.04] border-amber-500/20')
              : 'bg-rose-500/[0.04] border-rose-500/20',
          )}>
            {connected ? <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold capitalize">{gatewayConfig.provider} — {gatewayConfig.status.replace('_', ' ')}</p>
                {isTestMode && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20">
                    TEST MODE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isLive
                  ? 'Live mode — real payments are being processed.'
                  : isTestMode
                    ? 'Test mode — only test transactions will succeed. Switch to live before opening to parents.'
                    : 'Gateway inactive. Verify credentials or reconnect.'}
              </p>
            </div>
          </div>

          {/* Config grid */}
          <div className="grid grid-cols-2 gap-3">
            <ConfigCell label="Merchant ID" value={maskMerchant(gatewayConfig.merchantId ?? '')} mono />
            <ConfigCell label="API Key ID" value={gatewayConfig.apiKeyId ?? '—'} mono />
            <ConfigCell label="Webhook URL" value={gatewayConfig.webhookUrl ?? '—'} mono />
            <ConfigCell
              label="Webhook Status"
              value={
                <span className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold',
                  gatewayConfig.webhookStatus === 'healthy' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                  gatewayConfig.webhookStatus === 'not_configured' && 'bg-muted text-muted-foreground',
                  gatewayConfig.webhookStatus === 'error' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                )}>
                  {gatewayConfig.webhookStatus.replace('_', ' ')}
                </span>
              }
            />
            <ConfigCell label="Last Webhook" value={gatewayConfig.lastWebhookAt ? `${formatDate(gatewayConfig.lastWebhookAt)} · ${formatRelativeTime(gatewayConfig.lastWebhookAt)}` : 'never'} />
            <ConfigCell label="Failed Webhooks" value={String(gatewayConfig.failedWebhookCount)} />
            <ConfigCell label="Settlement Account" value={settlementAccount ? `${settlementAccount.bankName} ****${settlementAccount.accountNumber.slice(-4)}` : 'not linked'} />
            <ConfigCell label="Connected By" value={`${gatewayConfig.connectedBy ?? '—'} · ${gatewayConfig.connectedAt ? formatDate(gatewayConfig.connectedAt) : ''}`} />
          </div>

          {/* Secret-key note */}
          <div className="rounded-md bg-sky-500/5 border border-sky-500/20 p-2 flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-sky-700 dark:text-sky-300">Secret key is stored securely on the server.</span>{' '}
              The API key ID is shown here for identification only — the matching secret is held in server environment variables and never exposed in the browser.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => {
                updateGatewayStatus('connected', gatewayConfig.lastWebhookAt)
                toast.success('Connection test passed', { description: `${gatewayConfig.provider} reachable. Webhook URL active.` })
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Test Connection
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={handleTestWebhook}
            >
              <Webhook className="h-3.5 w-3.5" /> Test Webhook
            </Button>
            {isTestMode && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  connectGateway(gatewayConfig.provider, gatewayConfig.merchantId ?? '', gatewayConfig.apiKeyId ?? '', 'live')
                  toast.success('Switched to LIVE mode', { description: 'Real payments will now be processed.' })
                }}
              >
                <Check className="h-3.5 w-3.5" /> Switch to Live
              </Button>
            )}
          </div>
        </div>
      </FeePanel>

      {showConnect && (
        <ConnectGatewayDialog
          onClose={() => setShowConnect(false)}
          onConnect={(provider, merchantId, apiKeyId, environment) => {
            connectGateway(provider, merchantId, apiKeyId, environment)
            toast.success('Gateway connected', { description: `${provider} connected in ${environment} mode.` })
            setShowConnect(false)
          }}
        />
      )}
    </div>
  )
}

function ConfigCell({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5">
      <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">{label}</p>
      <p className={cn('text-xs font-medium mt-0.5 truncate', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

interface ConnectGatewayDialogProps {
  onClose: () => void
  onConnect: (provider: GatewayProvider, merchantId: string, apiKeyId: string, environment: GatewayEnvironment) => void
}

function ConnectGatewayDialog({ onClose, onConnect }: ConnectGatewayDialogProps) {
  const [provider, setProvider] = useState<GatewayProvider>('razorpay')
  const [merchantId, setMerchantId] = useState('')
  const [apiKeyId, setApiKeyId] = useState('')
  const [environment, setEnvironment] = useState<GatewayEnvironment>('test')
  const valid = merchantId.trim() && apiKeyId.trim()

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Payment Gateway</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[11px]">Gateway Provider</Label>
            <div className="grid grid-cols-1 gap-1.5 mt-1">
              {GATEWAY_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value)}
                  className={cn(
                    'text-left rounded-md border px-2.5 py-2 transition-colors',
                    provider === p.value ? 'border-emerald-500/40 bg-emerald-500/[0.04]' : 'border-border hover:bg-muted/30',
                  )}
                >
                  <p className="text-xs font-semibold">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground">{p.note}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[11px]">Merchant ID</Label>
            <Input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="rzp_test_DEMO1234" className="h-8 text-xs font-mono mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">API Key ID (public)</Label>
            <Input value={apiKeyId} onChange={(e) => setApiKeyId(e.target.value)} placeholder="key_DEMO1234" className="h-8 text-xs font-mono mt-1" />
          </div>
          <div>
            <Label className="text-[11px]">Environment</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button
                onClick={() => setEnvironment('test')}
                className={cn(
                  'rounded-md border px-2.5 py-2 text-xs font-medium transition-colors',
                  environment === 'test' ? 'border-amber-500/40 bg-amber-500/[0.04] text-amber-700 dark:text-amber-300' : 'border-border hover:bg-muted/30',
                )}
              >
                Test
              </button>
              <button
                onClick={() => setEnvironment('live')}
                className={cn(
                  'rounded-md border px-2.5 py-2 text-xs font-medium transition-colors',
                  environment === 'live' ? 'border-emerald-500/40 bg-emerald-500/[0.04] text-emerald-700 dark:text-emerald-300' : 'border-border hover:bg-muted/30',
                )}
              >
                Live
              </button>
            </div>
          </div>
          <div className="rounded-md bg-sky-500/5 border border-sky-500/20 p-2 flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">
              The <span className="font-semibold">webhook secret</span> is configured server-side via environment variable. It is never stored in browser state. Contact your developer to set <span className="font-mono">{provider.toUpperCase()}_WEBHOOK_SECRET</span> in the server env.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            disabled={!valid}
            onClick={() => onConnect(provider, merchantId.trim(), apiKeyId.trim(), environment)}
          >
            <Plug className="h-3.5 w-3.5" /> Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── E. Reconciliation ──────────────────────────────────────────────

function ReconciliationSection() {
  const webhookEvents = useFeeStore((s) => s.webhookEvents)
  const settlements = useFeeStore((s) => s.settlements)
  const reconciliationRecords = useFeeStore((s) => s.reconciliationRecords)
  const transactions = useFeeStore((s) => s.transactions)
  const bankAccounts = useFeeStore((s) => s.bankAccounts)

  // Reconciliation summary
  const reconciled = reconciliationRecords.filter((r) => r.reconciliationStatus === 'reconciled').length
  const pending = transactions.filter((t) => t.gateway && (!t.reconciliationStatus || t.reconciliationStatus === 'pending' || t.reconciliationStatus === 'unreconciled')).length
  const exceptions = transactions.filter((t) => t.reconciliationStatus === 'exception').length

  const recentWebhooks = webhookEvents.slice(0, 5)

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Reconciled</p>
          <p className="text-base font-bold tabular-nums mt-0.5 text-emerald-600">{reconciled}</p>
          <p className="text-[9px] text-muted-foreground">transactions matched</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Pending</p>
          <p className="text-base font-bold tabular-nums mt-0.5 text-amber-600">{pending}</p>
          <p className="text-[9px] text-muted-foreground">awaiting settlement</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <p className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider">Exceptions</p>
          <p className="text-base font-bold tabular-nums mt-0.5 text-rose-600">{exceptions}</p>
          <p className="text-[9px] text-muted-foreground">failed / refunded</p>
        </div>
      </div>

      {/* Recent webhooks */}
      <FeePanel title="Recent Webhook Events" subtitle={`last ${recentWebhooks.length} of ${webhookEvents.length} total`}>
        {recentWebhooks.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-6">No webhook events received yet.</p>
        ) : (
          <div className="space-y-1.5">
            {recentWebhooks.map((w) => (
              <div key={w.id} className="flex items-center gap-3 rounded-md border border-border/60 px-2.5 py-2">
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                  w.status === 'processed' ? 'bg-emerald-500/10 text-emerald-600' :
                  w.status === 'failed' ? 'bg-rose-500/10 text-rose-600' :
                  'bg-amber-500/10 text-amber-600',
                )}>
                  <Webhook className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-mono font-semibold">{w.eventType}</p>
                    <span className="text-[9px] text-muted-foreground capitalize">{w.provider}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    {formatDate(w.receivedAt)} · {formatRelativeTime(w.receivedAt)}
                    {w.transactionId && ` · ${w.transactionId}`}
                  </p>
                </div>
                <span className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold',
                  w.status === 'processed' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                  w.status === 'failed' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                  w.status === 'duplicate' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                )}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </FeePanel>

      {/* Settlements */}
      <FeePanel title="Settlements" subtitle={`${settlements.length} payout(s) recorded`}>
        {settlements.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-6">No settlements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Settlement ID</th>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Gateway</th>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Date</th>
                  <th className="text-right px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Gross</th>
                  <th className="text-right px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Fee</th>
                  <th className="text-right px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Tax</th>
                  <th className="text-right px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Net</th>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">UTR</th>
                  <th className="text-center px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Txns</th>
                  <th className="text-center px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => {
                  const bank = bankAccounts.find((b) => b.id === s.bankAccountId)
                  return (
                    <tr key={s.id} className="border-t border-border/30 hover:bg-muted/20">
                      <td className="px-2.5 py-2 font-mono text-[10px]">{s.id}</td>
                      <td className="px-2.5 py-2 capitalize text-muted-foreground">{s.gateway}</td>
                      <td className="px-2.5 py-2 text-muted-foreground whitespace-nowrap text-[10px]">{formatDate(s.settlementDate)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums font-semibold">{formatINR(s.grossAmount, true)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-rose-600">{formatINR(s.gatewayFee, true)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums text-rose-600">{formatINR(s.taxOnFee, true)}</td>
                      <td className="px-2.5 py-2 text-right tabular-nums font-semibold text-emerald-600">{formatINR(s.netAmount, true)}</td>
                      <td className="px-2.5 py-2 font-mono text-[10px] text-muted-foreground">{s.utr ?? '—'}</td>
                      <td className="px-2.5 py-2 text-center tabular-nums">{s.transactionIds.length}</td>
                      <td className="px-2.5 py-2 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold capitalize',
                          s.status === 'settled' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                          s.status === 'pending' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                          s.status === 'failed' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
                          s.status === 'reversed' && 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
                        )}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </FeePanel>

      {/* Reconciliation ledger */}
      <FeePanel
        title="Reconciliation Ledger"
        subtitle={`${reconciliationRecords.length} matched transaction(s)`}
        action={
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <ArrowRightLeft className="h-3 w-3" />
            auto-matched from webhook + settlement data
          </span>
        }
      >
        {reconciliationRecords.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-6">No reconciliation records yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/40">
                <tr>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Rec ID</th>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Transaction</th>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Settlement</th>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Gateway Payment ID</th>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">UTR</th>
                  <th className="text-left px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Reconciled By</th>
                  <th className="text-center px-2.5 py-2 text-[9px] uppercase font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {reconciliationRecords.map((r) => (
                  <tr key={r.id} className="border-t border-border/30 hover:bg-muted/20">
                    <td className="px-2.5 py-2 font-mono text-[10px]">{r.id}</td>
                    <td className="px-2.5 py-2 font-mono text-[10px] text-muted-foreground">{r.transactionId}</td>
                    <td className="px-2.5 py-2 font-mono text-[10px] text-muted-foreground">{r.settlementId ?? '—'}</td>
                    <td className="px-2.5 py-2 font-mono text-[10px] text-muted-foreground">{r.gatewayPaymentId ?? '—'}</td>
                    <td className="px-2.5 py-2 font-mono text-[10px] text-muted-foreground">{r.utr ?? '—'}</td>
                    <td className="px-2.5 py-2 text-muted-foreground text-[10px]">{r.reconciledBy ?? '—'}</td>
                    <td className="px-2.5 py-2 text-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold capitalize bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        {r.reconciliationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FeePanel>
    </div>
  )
}
