'use client'

// Salary slip Sheet — per-employee payslip detail with bonus, download & pay actions.

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { Banknote, Gift, Download, CheckCircle2 } from 'lucide-react'
import { type SalaryRecord } from '@/lib/mock/finance'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { makeSlip, statusVariant } from './data'
import { SlipSection, InfoTile } from './shared'

export function PayslipSheet({
  selected,
  bonus,
  onBonusChange,
  onClose,
}: {
  selected: SalaryRecord | null
  bonus: number
  onBonusChange: (n: number) => void
  onClose: () => void
}) {
  const slip = selected ? makeSlip(selected) : null

  return (
    <Sheet open={!!selected} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-[calc(100vw-1.5rem)] sm:max-w-md overflow-y-auto">
        {selected && slip && (
          <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <GradientAvatar name={selected.name} size="lg" />
                <div>
                  <SheetTitle className="text-base">{selected.name}</SheetTitle>
                  <SheetDescription className="text-xs">
                    {selected.employeeId} · {selected.designation}
                  </SheetDescription>
                  <div className="mt-1.5">
                    <StatusBadge status={selected.status} variant={statusVariant[selected.status]} dot />
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="px-4 py-4 space-y-4">
              {/* Pay period + bank + PAN */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <InfoTile label="Pay Period" value={selected.month} />
                <InfoTile label="Pay Date" value={selected.paidOn === '—' ? 'Pending' : formatDate(selected.paidOn)} />
                <InfoTile label="Bank" value="HDFC · ••4821" />
                <InfoTile label="PAN" value={`AKJPI${selected.employeeId.slice(-2)}8F`} mono />
              </div>

              {/* Earnings */}
              <SlipSection
                title="Earnings"
                accent="emerald"
                items={slip.earnings}
                totalLabel="Gross Salary"
                totalAmount={selected.gross}
              />

              {/* Deductions */}
              <SlipSection
                title="Deductions"
                accent="rose"
                items={slip.deductions}
                totalLabel="Total Deductions"
                totalAmount={selected.deductions}
              />

              {/* Net pay */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-4 text-white">
                <p className="text-xs text-emerald-100">Net Pay (Credit)</p>
                <p className="font-display text-3xl font-extrabold mt-1">
                  <AnimatedCounter value={selected.net} format={(n) => formatINR(n)} />
                </p>
                <p className="text-[11px] text-emerald-100 mt-1 flex items-center gap-1.5">
                  <Banknote className="h-3 w-3" /> Credited to HDFC ••4821
                </p>
              </div>

              {/* Bonus + actions */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-xs font-semibold">Performance Bonus</p>
                      <p className="text-[10px] text-muted-foreground">Optional · festive / performance</p>
                    </div>
                  </div>
                  <Input
                    type="number"
                    placeholder="₹ 0"
                    value={bonus || ''}
                    onChange={(e) => onBonusChange(Number(e.target.value))}
                    className="w-28 h-8 text-sm font-display font-semibold"
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="border-t border-border p-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => toast.success('Slip downloaded', { description: `${selected.employeeId}-slip-dec-2025.pdf` })}
              >
                <Download className="h-3.5 w-3.5" /> Download Slip
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => {
                  toast.success('Salary paid 🎉', {
                    description: `${formatINR(selected.net + bonus)} disbursed to ${selected.name}.`,
                  })
                  onClose()
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Pay Salary
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
