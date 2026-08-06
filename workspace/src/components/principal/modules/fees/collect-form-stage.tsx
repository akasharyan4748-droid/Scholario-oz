'use client'

import { motion } from 'framer-motion'
import { Wallet, ShieldCheck, Sparkles } from 'lucide-react'
import {
  DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { students, type Student } from '@/lib/mock/students'
import { formatINR } from '@/lib/format'
import { paymentMethods, purposeOptions } from './data'

// Stage 1 of the Collect Payment dialog — the form where the principal
// selects student, amount, purpose and payment method. Shows the selected
// student's outstanding balance in a highlighted card. Triggers handlePay
// to move to the processing stage.
export function CollectFormStage({
  selectedStudent,
  onSelectStudent,
  amount,
  onAmountChange,
  purpose,
  onPurposeChange,
  method,
  onMethodChange,
  student,
  onPay,
}: {
  selectedStudent: string
  onSelectStudent: (id: string) => void
  amount: number
  onAmountChange: (v: number) => void
  purpose: string
  onPurposeChange: (v: string) => void
  method: string
  onMethodChange: (v: string) => void
  student: Student
  onPay: () => void
}) {
  return (
    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Wallet className="h-4 w-4" />
          </div>
          Collect Fee
        </DialogTitle>
        <DialogDescription>Select student & payment method to generate receipt</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="stu" className="text-xs">Student</Label>
            <Select value={selectedStudent} onValueChange={onSelectStudent}>
              <SelectTrigger id="stu" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.admissionNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amt" className="text-xs">Amount (₹)</Label>
            <Input
              id="amt"
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(Number(e.target.value))}
              className="font-display font-semibold tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="purp" className="text-xs">Purpose</Label>
          <Select value={purpose} onValueChange={onPurposeChange}>
            <SelectTrigger id="purp" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {purposeOptions.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Selected Student</p>
              <p className="font-semibold text-sm truncate">{student.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{student.admissionNo} · {student.className}-{student.section}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Outstanding</p>
              <p className="font-display text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatINR(student.feeTotal - student.feePaid)}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-2 block">Payment Method</label>
          <RadioGroup value={method} onValueChange={onMethodChange} className="gap-2">
            {paymentMethods.map((m) => (
              <label
                key={m.id}
                htmlFor={`m-${m.id}`}
                className={`relative flex items-center gap-3 rounded-xl border-2 p-2.5 cursor-pointer transition-all ${
                  method === m.id ? 'border-primary bg-primary/5' : 'border-border bg-card/40 hover:border-primary/40'
                }`}
              >
                <RadioGroupItem value={m.id} id={`m-${m.id}`} className="sr-only" />
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${m.gradient} text-white shadow-md`}>
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
                  <p className="text-[10px] text-muted-foreground">{m.desc}</p>
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
        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        <Button
          onClick={onPay}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white min-w-[140px]"
        >
          <Wallet className="h-3.5 w-3.5" /> Pay {formatINR(amount)}
        </Button>
      </DialogFooter>
    </motion.div>
  )
}
