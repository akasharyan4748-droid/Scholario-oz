'use client'

import { useMemo, useState } from 'react'
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
// STRUCT-REV — mid-session fee-structure acknowledgement (student side).
import { FeeRevisionApprovalCard } from './fee-revision-card'
import { resolveCanonicalStudent } from '../applications/student'
import { useStudentsStore } from '@/lib/store/students-store'
// PAY-REWORK-1 — real payment submission into the canonical fee ledger.
import { useFeeStore, type FeeTransaction } from '@/lib/store/fee-store'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { downloadReceiptA5 } from '@/components/principal/modules/fees/fee-receipt-a5'

export function FeesModule() {
  const student = getStudentById('STU-2024-018')!
  // STRUCT-REV — canonical twin id (the students-store record that fee
  // revisions acknowledge against). Roster is static in the demo session.
  const canonicalStudentId = useMemo(() => {
    const all = useStudentsStore.getState().students
    return (all.find((s) => s.admissionNo === student.admissionNo && s.status === 'Active')
      ?? resolveCanonicalStudent(all))?.id ?? ''
  }, [])
  const totalPaid = student.feePaid
  const totalPending = student.feeTotal - student.feePaid
  const totalFee = student.feeTotal
  const paidPct = Math.round((totalPaid / totalFee) * 100)

  const [payOpen, setPayOpen] = useState(false)
  const [stage, setStage] = useState<PayStage>('form')
  const [method, setMethod] = useState('upi')
  const [paidAmount, setPaidAmount] = useState(totalPending)
  // PAY-REWORK-1 — the canonical acknowledgement of THIS submission.
  const [submittedRef, setSubmittedRef] = useState('')
  const [submittedTxn, setSubmittedTxn] = useState<FeeTransaction | null>(null)
  const recordPayment = useFeeStore((s) => s.recordPayment)
  const receiptSettings = useFeeStore((s) => s.receiptSettings)
  const gatewayConfig = useFeeStore((s) => s.gatewayConfig)
  const addAlert = useLiveAlerts((s) => s.addAlert)

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

  // PAY-REWORK-1 + final spec §3 — the student/guardian submission lands in
  // the ONE fee ledger. TWO rails, honestly differentiated:
  //   • GATEWAY (connected/test_mode): the payment goes through the school's
  //     actual payment gateway — the GATEWAY confirms it, so the record is
  //     Paid automatically, the gateway transaction ID is stored and the
  //     official receipt is immediately available. NEVER queued for manual
  //     verification.
  //   • MANUAL (no gateway): reference-based submission → 'Under
  //     Verification' (collectorRole 'self'); the Principal verifies it
  //     against the reference before the receipt becomes official.
  const gatewayActive = !!gatewayConfig && (gatewayConfig.status === 'connected' || gatewayConfig.status === 'test_mode')
  const handlePay = (reference: string) => {
    const modeMap: Record<string, 'UPI' | 'Card' | 'Net Banking'> = { upi: 'UPI', card: 'Card', netbanking: 'Net Banking' }
    const payMode = modeMap[method] ?? 'UPI'
    const viaGateway = gatewayActive
    setSubmittedRef(reference)
    setStage('processing')
    setTimeout(() => {
      const result = recordPayment({
        studentId: canonicalStudentId,
        amount: paidAmount,
        mode: payMode,
        feeHead: 'Tuition',
        purpose: `Online fee payment ${viaGateway ? `via ${gatewayConfig?.provider} gateway` : 'submitted by student'} (${method.toUpperCase()})`,
        collectedBy: student.name,
        collectorRole: 'self',
        referenceNo: reference || undefined,
        ...(viaGateway
          ? {
              gateway: gatewayConfig?.provider,
              gatewayPaymentId: `pay_${Date.now().toString(36)}`,
              gatewayOrderId: `order_${Date.now().toString(36)}`,
              paymentSource: 'gateway' as const,
            }
          : {}),
      })
      if (result.success && result.transaction) {
        setSubmittedTxn(result.transaction)
        if (viaGateway) {
          // Gateway confirmed — notification flow works normally, but it is
          // NOT a verification request (the gateway itself confirmed it).
          addAlert({
            id: `alert-${Date.now()}`,
            severity: 'low',
            title: 'Gateway payment received',
            desc: `${student.name} paid ${formatINR(paidAmount)} via ${gatewayConfig?.provider ?? 'gateway'} (${payMode}) · auto-confirmed, receipt ${result.transaction.receiptNo}.`,
            color: 'emerald',
            navKey: 'fees',
            isNew: true,
            time: 'just now',
          })
        } else {
          // Principal-side alert — a manual transfer is waiting for verification.
          addAlert({
            id: `alert-${Date.now()}`,
            severity: 'high',
            title: 'Manual payment awaiting verification',
            desc: `${student.name} submitted ${formatINR(paidAmount)} via ${payMode} · ref ${reference || '—'}.`,
            color: 'amber',
            navKey: 'fees',
            isNew: true,
            time: 'just now',
          })
        }
      } else {
        toast.error('Could not submit payment', { description: result.error })
        setStage('form')
        return
      }
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
      setSubmittedRef('')
      setSubmittedTxn(null)
    }, 200)
  }

  // Receipt download — the A5 sheet renders the honest lifecycle state:
  // gateway-confirmed → OFFICIAL receipt; manual → PENDING VERIFICATION
  // acknowledgement until the office verifies.
  const handleReceiptDownload = () => {
    if (submittedTxn) {
      downloadReceiptA5(submittedTxn, receiptSettings)
      toast.success(submittedTxn.status === 'Success' ? 'Receipt downloaded' : 'Acknowledgement downloaded', { description: `${submittedTxn.receiptNo}.html` })
    } else {
      toast.success('Acknowledgement downloaded')
    }
  }

  const handlePaidComplete = () => {
    setPayOpen(false)
    setTimeout(() => {
      setStage('form')
      setMethod('upi')
      toast.success('Payment submitted', {
        description: `${formatINR(paidAmount)} via ${method.toUpperCase()} — awaiting confirmation by the school office.`,
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

      {/* STRUCT-REV — guardian acknowledgement request for a mid-session
          fee-structure revision affecting this student's class. */}
      <FeeRevisionApprovalCard canonicalStudentId={canonicalStudentId} />

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
        reference={submittedRef}
        receiptNo={submittedTxn?.receiptNo}
        gatewayProvider={gatewayActive ? gatewayConfig?.provider ?? null : null}
        confirmed={!!submittedTxn && submittedTxn.status === 'Success' && !!submittedTxn.gatewayPaymentId}
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
