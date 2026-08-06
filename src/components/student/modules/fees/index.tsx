'use client'

import { useState } from 'react'
import { IndianRupee, Wallet } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { getStudentById } from '@/lib/mock/students'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import {
  initialRenewalReceiptData,
  type PayStage,
  type RenewalStatus,
  type RenewalPayType,
  type RenewalReceiver,
  type RenewalStage,
  type RenewalReceiptData,
} from './data'
import { RenewalCard } from './renewal-card'
import { KpiSection } from './kpi-section'
import { OutstandingSection } from './outstanding-section'
import { PaymentHistory } from './payment-history'
import { PaymentDialog } from './payment-dialog'
import { RenewalDialog } from './renewal-dialog'

export function FeesModule() {
  const student = getStudentById('STU-2024-018')!
  const totalPaid = student.feePaid
  const totalPending = student.feeTotal - student.feePaid
  const totalFee = student.feeTotal
  const paidPct = Math.round((totalPaid / totalFee) * 100)

  const [payOpen, setPayOpen] = useState(false)
  const [stage, setStage] = useState<PayStage>('form')
  const [method, setMethod] = useState('upi')
  const [paidAmount, setPaidAmount] = useState(totalPending)

  // New Academic Session Renewal State
  const [renewalStatus, setRenewalStatus] = useState<RenewalStatus>('open')
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false)
  const [renewalPayType, setRenewalPayType] = useState<RenewalPayType>('online')
  const [renewalReceiver, setRenewalReceiver] = useState<RenewalReceiver>('Ananya Sharma (Class Teacher)')
  const [renewalStage, setRenewalStage] = useState<RenewalStage>('form')
  const [renewalReceiptData, setRenewalReceiptData] = useState<RenewalReceiptData>(initialRenewalReceiptData)

  const handleProcessRenewal = () => {
    setRenewalStage('processing')
    setTimeout(() => {
      const modeText = renewalPayType === 'online' ? `Online (${method.toUpperCase()})` : 'Cash Collection'
      const statusText = renewalPayType === 'online' ? 'Confirmed & Promoted' : 'Pending Acceptance by ' + renewalReceiver

      setRenewalReceiptData({
        receiptNo: `RCP-2025-RNW-${Math.floor(1000 + Math.random() * 9000)}`,
        txnId: `TXN2025-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split('T')[0],
        amount: 65000,
        mode: modeText,
        receiver: renewalPayType === 'online' ? 'Online Gateway' : renewalReceiver,
        status: statusText,
      })

      if (renewalPayType === 'cash') {
        setRenewalStatus('pending_cash')
      } else {
        setRenewalStatus('approved')
      }

      setRenewalStage('receipt')
    }, 2000)
  }

  const handlePay = () => {
    setStage('processing')
    setTimeout(() => {
      setStage('success')
      setTimeout(() => {
        setStage('receipt')
      }, 1800)
    }, 2200)
  }

  const handleCloseDialog = () => {
    if (stage === 'processing') return
    setPayOpen(false)
    setTimeout(() => {
      setStage('form')
      setMethod('upi')
      setPaidAmount(totalPending)
    }, 200)
  }

  const handleReceiptDownload = () => {
    toast.success('Receipt downloaded', {
      description: `RCP-2024-1018C.pdf · ${formatINR(paidAmount)} via ${method.toUpperCase()}`,
    })
  }

  const handlePaidComplete = () => {
    setPayOpen(false)
    setTimeout(() => {
      setStage('form')
      setMethod('upi')
      toast.success('Payment successful! 🎉', {
        description: `${formatINR(paidAmount)} paid. Receipt sent to ${student.email}.`,
      })
    }, 200)
  }

  const handleSimulateAccept = () => {
    setRenewalStatus('approved')
    setRenewalReceiptData((prev) => ({
      ...prev,
      status: 'Cash Received & Renewal Confirmed',
    }))
    toast.success('Simulated Acceptance: Cash Received by Staff!')
  }

  const handleOpenRenewalDialog = () => {
    setRenewalStage('form')
    setRenewalDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Fees"
        subtitle="Academic Year 2024–2025 · Demo School of Scholario"
        icon={<IndianRupee className="h-5 w-5" />}
        action={
          totalPending > 0 && (
            <Button
              onClick={() => setPayOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
            >
              <Wallet className="h-3.5 w-3.5" /> Pay Now
            </Button>
          )
        }
      />

      <RenewalCard status={renewalStatus} onOpenDialog={handleOpenRenewalDialog} />

      <KpiSection
        totalFee={totalFee}
        totalPaid={totalPaid}
        totalPending={totalPending}
        paidPct={paidPct}
      />

      <OutstandingSection
        totalFee={totalFee}
        totalPending={totalPending}
        totalPaid={totalPaid}
        paidPct={paidPct}
        onPay={() => setPayOpen(true)}
      />

      <PaymentHistory totalPaid={totalPaid} />

      <PaymentDialog
        open={payOpen}
        stage={stage}
        method={method}
        paidAmount={paidAmount}
        totalPending={totalPending}
        student={{
          name: student.name,
          admissionNo: student.admissionNo,
          email: student.email,
          className: student.className,
          section: student.section,
        }}
        onOpenChange={(o) => !o && handleCloseDialog()}
        onMethodChange={setMethod}
        onPay={handlePay}
        onDownload={handleReceiptDownload}
        onComplete={handlePaidComplete}
      />

      <RenewalDialog
        open={renewalDialogOpen}
        stage={renewalStage}
        status={renewalStatus}
        payType={renewalPayType}
        receiver={renewalReceiver}
        receiptData={renewalReceiptData}
        method={method}
        student={{ name: student.name, admissionNo: student.admissionNo }}
        onOpenChange={setRenewalDialogOpen}
        onPayTypeChange={setRenewalPayType}
        onReceiverChange={setRenewalReceiver}
        onProcess={handleProcessRenewal}
        onSimulateAccept={handleSimulateAccept}
      />
    </div>
  )
}
