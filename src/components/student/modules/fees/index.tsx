'use client'

/**
 * Student Fees module — FEES-R (full production-grade redesign).
 *
 * A premium digital school finance desk, not "a page showing ₹9,500":
 *   · §2  minimal header — "My Fees" + period chip + financial status chip
 *          (no repeated school/class/session prose).
 *   · §4-5 FINANCIAL OVERVIEW — Balance Due as the hero actionable figure,
 *          visual payment progress, supporting figures, honest status line.
 *   · §6-7 FEE BREAKDOWN — derived live from the configured structure.
 *   · §13  PAYMENT HISTORY — scannable rows, official receipts.
 *   · §15  STATEMENT — official ledger statement (view / print / download).
 *   · §16  LEDGER TIMELINE — the story of every rupee, real dates only.
 *   · §17  no invented due dates — honest standing line instead.
 *   · §18-21 GET HELP + FEE REQUESTS — routed, persisted, trackable.
 *
 * ONE-LEDGER PRINCIPLE (preserved): every figure derives from the
 * students-store record (feeTotal/feePaid/scholarship) + the fee store's
 * transactions for STU-58. The payment dialog's honest two rails
 * (gateway-confirmed vs manual 'Under Verification' + Principal alert),
 * the structure-revision acknowledgement card, the fee_online_payments
 * feature gate and downloadReceiptA5 are all preserved unchanged.
 */

import { useEffect, useMemo, useState } from 'react'
import { IndianRupee } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import { type PayStage } from './data'
import { PaymentHistory } from './payment-history'
import { PaymentDialog } from './payment-dialog'
// STRUCT-REV — mid-session fee-structure acknowledgement (student side).
import { FeeRevisionApprovalCard } from './fee-revision-card'
import { DEMO_STUDENT_ID } from '../applications/student'
import { useStudentsStore } from '@/lib/store/students-store'
// PAY-REWORK-1 — real payment submission into the canonical fee ledger.
import { useFeeStore, CURRENT_ACADEMIC_YEAR, type FeeTransaction } from '@/lib/store/fee-store'
// SaaS-STAGE-2A §20 — the school's online-payment capability gates the
// student self-service rails (the fee-store rejects collectorRole 'self'
// when the sub-feature is off; the UI must never lead the student there).
import { useFeatureGate } from '@/lib/tenant/store'
import { useLiveAlerts } from '@/lib/store/live-alerts-store'
import { downloadReceiptA5 } from '@/components/principal/modules/fees/fee-receipt-a5'
// FEES-R — derived financial experience.
import {
  allocateToHeads,
  concessionOf,
  deriveApplicableHeads,
  feeTimelineEvents,
  financialStatusOf,
  sessionChipLabel,
} from './derive'
import { FinancialOverview, STATUS_CHIP_CLASS } from './financial-overview'
import { FeeBreakdown } from './fee-breakdown'
import { StatementDialog } from './statement-dialog'
import type { FeeStatementInput } from './statement-html'
import { HelpSection } from './help-section'
import { FeeQueriesSection } from './fee-queries-section'

export function FeesModule() {
  // STU-B — the demo student IS the canonical record (STU-58, Class 2-A).
  // Every fee figure on this page derives from the one roster, at the
  // fee-engine scale (₹9,500 total: ₹3,000 tuition + ₹500 management +
  // ₹6,000 transport — derived live in derive.ts, never hardcoded here).
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
  const paidPct = totalFee > 0 ? Math.min(100, Math.round((totalPaid / totalFee) * 100)) : 0
  const underReviewCount = myTransactions.filter((t) => t.status === 'Under Verification' || t.status === 'Pending').length
  const failedCount = myTransactions.filter((t) => t.status === 'Failed').length

  // §5 — the financial status, derived purely from the ledger state.
  const status = useMemo(
    () => financialStatusOf({ totalPaid, totalPending, underReviewCount }),
    [totalPaid, totalPending, underReviewCount],
  )

  // §6-7 — fee composition + per-head paid allocation + concession,
  // all derived from the configured structure and the real transactions.
  const optionalHeadApplicability = useFeeStore((s) => s.optionalHeadApplicability)
  const heads = useMemo(
    () => (student ? deriveApplicableHeads(student, optionalHeadApplicability) : []),
    [student, optionalHeadApplicability],
  )
  const paidByHead = useMemo(
    () => allocateToHeads(heads, myTransactions),
    [heads, myTransactions],
  )
  const concessions = useFeeStore((s) => s.concessions)
  const concession = useMemo(() => {
    if (!student) return { amount: 0, label: null }
    // Percent-basis concessions resolve against the module's annual-heads
    // total (the same composition the breakdown renders).
    const base = heads.reduce((sum, h) => sum + h.annual, 0)
    return concessionOf(student, concessions, base)
  }, [student, concessions, heads])

  // §16 — the compact ledger timeline (real dates only).
  const timeline = useMemo(
    () => feeTimelineEvents({ totalFee, txns: myTransactions }),
    [totalFee, myTransactions],
  )

  // §15 — the statement snapshot (assembled from the ONE ledger; the
  // closing balance is this module's own live derivation, never a second
  // frontend-invented balance).
  const statementInput = useMemo<FeeStatementInput | null>(() => {
    if (!student) return null
    return {
      session: CURRENT_ACADEMIC_YEAR,
      student: {
        name: student.name,
        admissionNo: student.admissionNo,
        classSection: `${student.className}-${student.section}`,
        rollNo: student.rollNo,
      },
      heads,
      concession,
      transactions: [...myTransactions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
      totalFee,
      totalPaid,
      outstanding: totalPending,
      asOn: new Date().toISOString().slice(0, 10),
    }
  }, [student, heads, concession, myTransactions, totalFee, totalPaid, totalPending])

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

  // §15 — statement dialog.
  const [statementOpen, setStatementOpen] = useState(false)
  // §21 — fee-request form dialog (shared with the Get-help routes).
  const [queryFormOpen, setQueryFormOpen] = useState(false)

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
  // collections), so the pay CTA is replaced by an intentional disabled
  // state that still surfaces the outstanding amount.
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
    <div className="space-y-5 sm:space-y-6">
      {/* §2 — minimal header: title + period chip + financial status chip.
          No school name, class or session prose — the workspace knows it. */}
      <SectionHeading
        title="My Fees"
        icon={<IndianRupee className="h-5 w-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {sessionChipLabel(CURRENT_ACADEMIC_YEAR)}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_CHIP_CLASS[status.tone]}`}
              role="status"
              aria-label={`Fee status: ${status.label}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {status.label}
            </span>
          </div>
        }
      />

      {/* STRUCT-REV — guardian acknowledgement request for a mid-session
          fee-structure revision affecting this student's class. */}
      <FeeRevisionApprovalCard canonicalStudentId={canonicalStudentId} />

      {/* §4-5 + §16 — the financial overview (balance hero, progress,
          supporting figures, ledger timeline) with the payment action. */}
      <FinancialOverview
        status={status}
        totalFee={totalFee}
        totalPaid={totalPaid}
        totalPending={totalPending}
        paidPct={paidPct}
        txnCount={myTransactions.length}
        timeline={timeline}
        failedCount={failedCount}
        onlinePaymentsEnabled={onlinePaymentsEnabled}
        onPay={() => setPayOpen(true)}
        onViewStatement={() => setStatementOpen(true)}
      />

      {/* §6-7 — the fee breakdown (structure-derived, honest concession). */}
      <FeeBreakdown
        heads={heads}
        paidByHead={paidByHead}
        concession={concession}
        totalFee={totalFee}
      />

      {/* §13 — payment history (compact rows, official receipts). */}
      <PaymentHistory
        totalPaid={totalPaid}
        transactions={myTransactions}
        receiptSettings={receiptSettings}
      />

      {/* §18-19/§45 — get help (progressive disclosure, three routes). */}
      <HelpSection onRaiseRequest={() => setQueryFormOpen(true)} />

      {/* §21 — fee requests (raise + track timelines). */}
      <FeeQueriesSection
        transactions={myTransactions}
        formOpen={queryFormOpen}
        onFormOpenChange={setQueryFormOpen}
      />

      {/* §15 — the official statement document. */}
      <StatementDialog
        open={statementOpen}
        onOpenChange={setStatementOpen}
        input={statementInput}
      />

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
