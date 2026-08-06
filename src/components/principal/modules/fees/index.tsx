'use client'

// Fee Management module — modular composition root.
//
// The original monolithic `fees.tsx` (1178 lines) has been split across
// focused files inside this directory. This `index.tsx` is the entry point
// that re-exports the public `FeesModule` symbol used by `principal-panel.tsx`
// and composes the sub-sections in their original visual order. No UI/UX was
// changed in the refactor — only the file layout.

import { useMemo, useState } from 'react'
import { IndianRupee, Send, Download, Plus } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { feeStructures, feeTransactions, feeAnalytics } from '@/lib/mock/finance'
import { students } from '@/lib/mock/students'
import { school } from '@/lib/mock/school'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'

import { HeroSummaryBanner } from './shared'
import { KpiRow } from './kpi-row'
import { ChartsRow1, ChartsRow2 } from './charts'
import { CashApprovals } from './cash-approvals'
import { FeeStructures } from './fee-structures'
import { TransactionsTable } from './transactions'
import { PendingDues } from './pending-dues'
import { CollectDialog } from './collect-dialog'
import {
  pendingDues, type PayStage, type PrincipalCashRequest,
} from './data'

export function FeesModule() {
  // Filters for the transactions table
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Collect Payment dialog state — 4-stage flow
  const [payOpen, setPayOpen] = useState(false)
  const [stage, setStage] = useState<PayStage>('form')
  const [method, setMethod] = useState('UPI')
  const [selectedStudent, setSelectedStudent] = useState(students[0].id)
  const [amount, setAmount] = useState(students[0].feeTotal - students[0].feePaid)
  const [purpose, setPurpose] = useState('Annual Fee — Q3')

  // Fee Structures — which category card is expanded (first open by default)
  const [expandedStructure, setExpandedStructure] = useState<string | null>(feeStructures[0].id)

  // Session 2025-2026 Principal Cash Requests (approval flow preserved)
  const [principalCashRequests, setPrincipalCashRequests] = useState<PrincipalCashRequest[]>([
    {
      id: 'PCASH-01',
      studentName: 'Aarav Sharma',
      admissionNo: 'DSO2025018',
      class: 'Class 10-A',
      promotedClass: 'Class 11-A',
      amount: 65000,
      receiver: `${school.principal} (Principal)`,
      date: '2025-03-28',
      status: 'Pending Principal Acceptance',
    },
    {
      id: 'PCASH-02',
      studentName: 'Vihaan Joshi',
      admissionNo: 'DSO2025035',
      class: 'Class 10-A',
      promotedClass: 'Class 11-A',
      amount: 65000,
      receiver: 'Ananya Sharma (Class Teacher)',
      date: '2025-03-27',
      status: 'Collected by Teacher',
    },
  ])

  const handlePrincipalAcceptCash = (id: string, name: string, amt: number) => {
    setPrincipalCashRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Confirmed by Principal' } : r))
    )
    toast.success('Principal Cash Collection Confirmed!', {
      description: `Collected ${formatINR(amt)} cash from ${name}. Session 2025–2026 Re-Admission approved.`,
    })
  }

  const filteredTxns = useMemo(() => {
    return feeTransactions.filter((t) => {
      const q = search.toLowerCase()
      const matchesSearch = !q || t.studentName.toLowerCase().includes(q) || t.receiptNo.toLowerCase().includes(q) || t.admissionNo.toLowerCase().includes(q)
      const matchesMode = modeFilter === 'all' || t.mode === modeFilter
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      return matchesSearch && matchesMode && matchesStatus
    })
  }, [search, modeFilter, statusFilter])

  const handleSelectStudent = (id: string) => {
    const s = students.find((x) => x.id === id) ?? students[0]
    setSelectedStudent(id)
    setAmount(s.feeTotal - s.feePaid)
  }

  const handlePay = () => {
    if (amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setStage('processing')
    setTimeout(() => {
      setStage('success')
      setTimeout(() => setStage('receipt'), 1800)
    }, 2200)
  }

  const handleCloseDialog = () => {
    if (stage === 'processing') return
    setPayOpen(false)
    setTimeout(() => setStage('form'), 200)
  }

  const handleDone = () => {
    const s = students.find((x) => x.id === selectedStudent) ?? students[0]
    setPayOpen(false)
    setTimeout(() => setStage('form'), 200)
    toast.success('Fee collected successfully', {
      description: `${formatINR(amount)} from ${s.name} via ${method}. Receipt emailed.`,
    })
  }

  const openCollectFor = (studentId: string, amt: number) => {
    setSelectedStudent(studentId)
    setAmount(amt)
    setStage('form')
    setPayOpen(true)
  }

  const student = students.find((x) => x.id === selectedStudent) ?? students[0]
  const receiptNo = `RCP-2025-${Math.floor(1000 + Math.random() * 9000)}`
  // YoY delta between the first and last month of the monthly fee analytics
  // series, expressed in millions of ₹. Rendered as the badge on ChartsRow1.
  const yoyDelta = ((feeAnalytics.monthly[8].collected - feeAnalytics.monthly[0].collected) / 1e6).toFixed(1)

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ============ SECTION HEADING ============ */}
      <SectionHeading
        title="Fee Management"
        subtitle="Academic Year 2025–2026 · Collections, dues & receipts"
        icon={<IndianRupee className="h-5 w-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Reminders dispatched', { description: `SMS sent to ${pendingDues.length} guardians with outstanding dues.` })}
              className="h-9"
            >
              <Send className="h-3.5 w-3.5" /> Remind
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Report exported', { description: 'fees-report-2025-26.xlsx · ready to download.' })}
              className="h-9"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button
              size="sm"
              onClick={() => { setStage('form'); setPayOpen(true) }}
              className="h-9 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" /> Collect Payment
            </Button>
          </div>
        }
      />

      <HeroSummaryBanner />
      <KpiRow />
      <ChartsRow1 yoyDelta={yoyDelta} />
      <ChartsRow2 />
      <CashApprovals requests={principalCashRequests} onAccept={handlePrincipalAcceptCash} />
      <FeeStructures expandedId={expandedStructure} onExpand={setExpandedStructure} />
      <TransactionsTable
        search={search}
        setSearch={setSearch}
        modeFilter={modeFilter}
        setModeFilter={setModeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        filteredTxns={filteredTxns}
      />
      <PendingDues
        onCollect={openCollectFor}
        onRemindAll={() => toast.success('Bulk reminders sent', { description: `SMS dispatched to ${pendingDues.length} guardians.` })}
      />
      <CollectDialog
        open={payOpen}
        stage={stage}
        selectedStudent={selectedStudent}
        amount={amount}
        purpose={purpose}
        method={method}
        student={student}
        receiptNo={receiptNo}
        onSelectStudent={handleSelectStudent}
        onAmountChange={setAmount}
        onPurposeChange={setPurpose}
        onMethodChange={setMethod}
        onPay={handlePay}
        onDone={handleDone}
        onOpenChange={(o) => !o && handleCloseDialog()}
      />
    </div>
  )
}

export default FeesModule
