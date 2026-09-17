'use client'

/**
 * OfflineMethods — HOW TO PAY when not paying online (§11).
 *
 * Every method shown is ACTUALLY CONFIGURED by the school (fee-store's
 * bank accounts with their parent-facing instructions, UPI QR configs
 * and active payment modes) — nothing fabricated. When the school has
 * no offline rails configured either, the section collapses entirely
 * (§32 — no empty fake functionality).
 */

import { useState } from 'react'
import { Banknote, Building2, ChevronDown, Landmark, QrCode } from 'lucide-react'
import { SectionLabel } from '../../shell/page-header'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { BankAccount, PaymentModeConfig, UpiQrConfig } from '@/lib/store/fee-store'

interface OfflineMethodsProps {
  paymentModes: PaymentModeConfig[]
  bankAccounts: BankAccount[]
  upiQrConfigs: UpiQrConfig[]
  totalDue: number
}

export function OfflineMethods({ paymentModes, bankAccounts, upiQrConfigs, totalDue }: OfflineMethodsProps) {
  const [open, setOpen] = useState(false)

  const cashMode = paymentModes.find((m) => m.id === 'Cash' && m.active)
  const transferMode = paymentModes.find((m) => m.id === 'Bank Transfer' && m.active)
  const activeAccounts = bankAccounts.filter((b) => b.status === 'active')
  const primaryAccount = activeAccounts.find((b) => b.isPrimary) ?? activeAccounts[0]
  const upi = upiQrConfigs.find((q) => q.status === 'active')

  const hasAny = !!(cashMode || (transferMode && primaryAccount) || upi)
  if (!hasAny) return null

  return (
    <section className="space-y-3" aria-labelledby="fees-offline-label">
      <SectionLabel hint="configured by the school">Other Ways to Pay</SectionLabel>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 sm:px-5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" aria-hidden>
            <Landmark className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground">Pay at the school office or by transfer</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {totalDue > 0 ? `${formatINR(totalDue)} outstanding · ` : ''}office-verified methods from School Settings
            </p>
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
        </button>

        {open && (
          <div className="space-y-2.5 border-t border-border/60 px-4 py-4 sm:px-5">
            {cashMode && (
              <MethodRow
                icon={<Banknote className="h-3.5 w-3.5" aria-hidden />}
                cls="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                title="Cash"
                lines={['School fee counter · office hours', 'A paper receipt is issued on the spot']}
              />
            )}
            {upi && (
              <MethodRow
                icon={<QrCode className="h-3.5 w-3.5" aria-hidden />}
                cls="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                title={`UPI · ${upi.upiId}`}
                lines={[
                  `Payee: ${upi.payeeName}`,
                  upi.notes ?? 'Keep the UPI reference — the office verifies payments against it',
                ]}
              />
            )}
            {transferMode && primaryAccount && (
              <MethodRow
                icon={<Building2 className="h-3.5 w-3.5" aria-hidden />}
                cls="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                title={`Bank Transfer · ${primaryAccount.bankName}`}
                lines={[
                  `${primaryAccount.holderName} · A/C ${primaryAccount.accountNumber} · IFSC ${primaryAccount.ifsc}`,
                  primaryAccount.parentDisplayInstructions,
                ]}
              />
            )}
            <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
              Scholario staff never ask for your card number, CVV, UPI PIN or bank passwords. Keep every transfer reference safe —
              it is how the office matches your payment.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function MethodRow({ icon, cls, title, lines }: {
  icon: React.ReactNode
  cls: string
  title: string
  lines: Array<string | undefined>
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/25 p-3">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cls)} aria-hidden>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        {lines.filter((l): l is string => !!l).map((l) => (
          <p key={l} className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{l}</p>
        ))}
      </div>
    </div>
  )
}
