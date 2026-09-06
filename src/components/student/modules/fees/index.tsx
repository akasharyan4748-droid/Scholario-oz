'use client'

import { useEffect, useMemo, useState } from 'react'
import { IndianRupee, Lock, Wallet } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import { type PayStage } from './data'
import { KpiSection } from './kpi-section'
import { OutstandingSection } from './outstanding-section'
import { PaymentHistory } from './payment-history'
import { PaymentDialog } from './payment-dialog'
// STRUCT-REV — mid-session fee-structure acknowledgement (student side).
import { FeeRevisionApprovalCard } from './fee-revision-card'
import { DEMO_STUDENT_ID } from '../applications/student'
import { useStudentsStore } from '@/lib/store/students-store'
// PAY-REWORK-1 — real payment submission into the canonical fee ledger.
import { useFeeStore, type FeeTransaction } from '@/lib/store/fee-store'
// SaaS-STAGE-2A §20 — the school's online-payment capability gates the
// student self-service rails (the fee-store rejects collectorRole 'self'
// when the sub-feature is off; the UI must never lead the student there).
import { useFeatureGate } from '@/lib/tenant/store'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { downloadReceiptA5 } from '@/components/principal/modules/fees/fee-receipt-a5'

export function FeesModule() {
  // STU-B — the demo student IS the canonical record (STU-58, Class 2-A).
  // Every fee figure on this page derives from the one roster, at the
  // fee-engine scale (₹9,500 total: ₹3,000 tuition + ₹500 management +
  // ₹6,000 transport).
  const student = useStudentsStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID))
  const canonicalStudentId = student?.id ?? ''
  const studentEmail = 'aarav.sharma@greenwood.edu.in'
  const totalFee = student?.feeTotal ?? 0
  // ONE ledger — the student's history is the fee store's transaction list
  // for this student (seed TXN020 + anything the student pays right here).
  // (Raw array + useMemo — zustand v5 selectors must return stable refs.)
  const allTransactions = useFeeStore((s) => s.transactions)
  const myTransactions = useMemo(
    () => allTransactions.filter((t) => t.studentId === DEMO_STUDENT_ID),
    [allTransactions],
  )
  // KPIs derive LIVE from the ledger (a payment made here counts
  // immediately; 'Under Verification' submissions are not paid yet).
  const totalPaid = myTransactions
    .filter((t) => t.status === 'Success')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalPending = Math.max(0, totalFee - totalPaid)
  const paidPct = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0

  const [payOpen, setPayOpen] = useState(false)
  const [stage, setStage] = useState<PayStage>('form')
  const [method, setMethod] = useState('upi')
  const [paidAmount, setPaidAmount] = useState(totalPending)
  // Refresh the default amount every time the dialog opens (a previous
  // payment may have changed the outstanding balance).
  useEffect(() => {
    if (payOpen) setPaidAmount(Math.max(0, totalFee - totalPaid))
  }, [payOpen])
  // PAY-REWORK-1 — the canonical acknowledgement of THIS submission.
  const [submittedRef, setSubmittedRef] = useState('')
  const [submittedTxn, setSubmittedTxn] = useState<FeeTransaction | null>(null)
  const recordPayment = useFeeStore((s) => s.recordPayment)
  const receiptSettings = useFeeStore((s) => s.receiptSettings)
  const gatewayConfig = useFeeStore((s) => s.gatewayConfig)
  const addAlert = useLiveAlerts((s) => s.addAlert)

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
  // SaaS-STAGE-2A §20 — school payment-channel policy. Student self-service
  // IS the online channel: without the fee_online_payments sub-feature there
  // are no payment rails for this student at all (offline modes are office
  // collections), so the pay CTA and gateway flow are replaced by an
  // intentional disabled state that still surfaces the outstanding amount.
  const onlinePaymentsEnabled = useFeatureGate().isSubFeatureEnabled('fee_online_payments')
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
        collectedBy: student?.name ?? 'Student',
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
            desc: `${student?.name ?? 'Student'} paid ${formatINR(paidAmount)} via ${gatewayConfig?.provider ?? 'gateway'} (${payMode}) · auto-confirmed, receipt ${result.transaction.receiptNo}.`,
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
            desc: `${student?.name ?? 'Student'} submitted ${formatINR(paidAmount)} via ${payMode} · ref ${reference || '—'}.`,
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

  return (
    <div className="space-y-6">
      <SectionHeading
        title="My Fees"
        subtitle="Academic Year 2026–2027 · Demo School of Scholario"
        icon={<IndianRupee className="h-5 w-5" />}
        action={
          totalPending > 0 && onlinePaymentsEnabled && (
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

      <KpiSection
        totalFee={totalFee}
        totalPaid={totalPaid}
        totalPending={totalPending}
        paidPct={paidPct}
        txnCount={myTransactions.length}
      />

      {onlinePaymentsEnabled ? (
        <OutstandingSection
          totalFee={totalFee}
          totalPending={totalPending}
          totalPaid={totalPaid}
          paidPct={paidPct}
          onPay={() => setPayOpen(true)}
        />
      ) : (
        /* SaaS-STAGE-2A §20 — no online rails for this school: compact
           disabled state (mirrors the premium empty states used across the
           fee surfaces) with the outstanding amount still visible. */
        <GlassCard className="p-4 border border-border">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground border border-border" aria-hidden>
              <Lock className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-[240px]">
              <h3 className="text-sm font-semibold text-foreground">Online payments unavailable</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xl">
                Online payments are not enabled for your school. Please contact the school office to pay by cash or other offline methods.
              </p>
            </div>
            <div className="shrink-0 rounded-lg bg-muted/40 border border-border px-3 py-1.5 text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Outstanding</p>
              <p className="text-sm font-bold tabular-nums">{formatINR(totalPending)}</p>
            </div>
          </div>
        </GlassCard>
      )}

      <PaymentHistory totalPaid={totalPaid} transactions={myTransactions} receiptSettings={receiptSettings} />

      {onlinePaymentsEnabled && (
        <PaymentDialog
          open={payOpen}
          stage={stage}
          method={method}
          paidAmount={paidAmount}
          totalPending={totalPending}
          student={{
            name: student?.name ?? 'Aarav Sharma',
            admissionNo: student?.admissionNo ?? 'DSO2024058',
            email: studentEmail,
            className: student?.className ?? 'Class 2',
            section: student?.section ?? 'A',
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
      )}
    </div>
  )
}
