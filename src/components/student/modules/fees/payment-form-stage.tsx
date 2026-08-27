'use client'

import { motion } from 'framer-motion'
import {
  IndianRupee, Wallet, ShieldCheck, Sparkles,
} from 'lucide-react'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { formatINR } from '@/lib/format'
import { paymentMethods, type PaymentStudentInfo } from './data'

export function PaymentFormStage({
  method, totalPending, student, onMethodChange, onCancel, onPay,
}: {
  method: string
  totalPending: number
  student: PaymentStudentInfo
  onMethodChange: (m: string) => void
  onCancel: () => void
  onPay: () => void
}) {
  return (
    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Wallet className="h-4 w-4" />
          </div>
          Pay Fees
        </DialogTitle>
        <DialogDescription>Choose a payment method to continue</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">Outstanding Amount</p>
              <p className="font-display text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatINR(totalPending)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-card/40 p-2">
              <p className="text-muted-foreground text-[10px]">Student</p>
              <p className="font-semibold truncate">{student.name}</p>
            </div>
            <div className="rounded-lg bg-card/40 p-2">
              <p className="text-muted-foreground text-[10px]">Admission No</p>
              <p className="font-semibold font-mono">{student.admissionNo}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-2 block">Select Payment Method</label>
          <RadioGroup value={method} onValueChange={onMethodChange} className="gap-2.5">
            {paymentMethods.map((m) => (
              <label
                key={m.id}
                htmlFor={`m-${m.id}`}
                className={`relative flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                  method === m.id ? 'border-primary bg-primary/5' : 'border-border bg-card/40 hover:border-primary/40'
                }`}
              >
                <RadioGroupItem value={m.id} id={`m-${m.id}`} className="sr-only" />
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${m.gradient} text-white shadow-md`}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{m.label}</p>
                    {m.badge && (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] py-0">
                        <Sparkles className="h-2.5 w-2.5" /> {m.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                </div>
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${method === m.id ? 'border-primary' : 'border-border'}`}>
                  {method === m.id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-card/40 border border-border p-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-[11px] text-muted-foreground">256-bit encrypted · PCI-DSS compliant · Powered by Razorpay</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={onPay}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white min-w-[140px]"
        >
          <Wallet className="h-3.5 w-3.5" /> Pay {formatINR(totalPending)}
        </Button>
      </DialogFooter>
    </motion.div>
  )
}
