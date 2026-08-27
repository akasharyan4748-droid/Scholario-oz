'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/ui'
import { formatDate, formatINR } from '@/lib/format'
import type { AdmissionApplication } from '@/lib/store/admission-store'
import type { IssuanceArtifacts } from './letter-data'

interface FeeReceiptTabProps {
  app: AdmissionApplication
  artifacts: IssuanceArtifacts
}

export function FeeReceiptTab({ app, artifacts }: FeeReceiptTabProps) {
  const { admissionNo } = artifacts
  const formData = app.formData

  return (
    <GlassCard className="p-6 max-w-2xl mx-auto space-y-6 border">
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h3 className="font-extrabold text-lg">Official Fee Receipt</h3>
          <p className="text-xs text-muted-foreground">Demo School of Scholario · Accounts Office</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold block">Receipt No: REC-2026-9921</span>
          <span className="text-xs text-muted-foreground">Date: {formatDate(new Date().toISOString().split('T')[0])}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Student Name</span>
          <span className="font-bold text-sm text-foreground">{formData.firstName} {formData.lastName}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Class & Section</span>
          <span className="font-bold text-foreground">{formData.className} - {formData.section}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Admission Number</span>
          <span className="font-mono font-bold">{admissionNo}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Payment Mode</span>
          <span className="font-semibold">{app.feeData?.paymentMethod || 'Online UPI / Bank Transfer'}</span>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden text-xs">
        <div className="grid grid-cols-12 p-2.5 bg-muted/60 font-bold uppercase text-[10px]">
          <div className="col-span-8">Fee Particulars</div>
          <div className="col-span-4 text-right">Amount (INR)</div>
        </div>
        <div className="divide-y p-2.5 space-y-1.5">
          <div className="flex justify-between"><span>Admission Fee (One-time)</span><span>₹15,000</span></div>
          <div className="flex justify-between"><span>Tuition Fee (Quarterly)</span><span>₹45,000</span></div>
          <div className="flex justify-between"><span>Annual Activity & Development</span><span>₹8,000</span></div>
          {formData.transportRequired && (
            <div className="flex justify-between"><span>Transport Fee (Quarterly)</span><span>₹18,000</span></div>
          )}
          <div className="flex justify-between text-emerald-600 font-semibold"><span>Early Bird Discount Concession</span><span>-₹10,000</span></div>
          <div className="flex justify-between font-extrabold text-sm pt-2 border-t">
            <span>Total Amount Paid</span>
            <span className="text-emerald-700 dark:text-emerald-300">{formatINR(76000)}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => window.print()} className="text-xs">
          <Printer className="h-3.5 w-3.5 mr-1" />
          Print Fee Receipt
        </Button>
      </div>
    </GlassCard>
  )
}
