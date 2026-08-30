'use client'

/**
 * FeesShell — Principal Fee Management workspace.
 *
 * FINAL INFORMATION ARCHITECTURE (6 top-level sections):
 *   Overview · Payments · Transactions · Student Accounts · Fee Structures · Settings
 *
 * Clear responsibilities, no duplicated pages:
 *   Overview      — Insights (KPIs, trend, dues, recent payments, mode mix)
 *   Payments      — OPERATIONS: Collect Fee + cash verification queue
 *   Transactions  — The complete authoritative payment history (ledger)
 *   Student Accts — Per-student fee accounts
 *   Fee Structures— Configured fee rules
 *   Settings      — Configuration
 *
 * LAYOUT: follows the Academics canonical pattern (Attendance/Salary
 * shells) — one PageTransition wrapper, the SegmentedTabs row in NORMAL
 * document flow, and the page itself scrolling inside the AppShell
 * content area. No sticky bar, no internal scroll container.
 *
 * All numbers derive from the canonical useFeeData() hook.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/shared/ui'
import { SegmentedTabs, type SegmentedTab } from '../shared/segmented-tabs'
import { useFeeData } from '@/lib/store/fee-store'
import { useFocusStore } from '@/lib/store/focus-store'
import { toast } from 'sonner'
import { school } from '@/lib/mock/school'
import type { FeeTab } from './fees-shared'
import { FeesOverviewSection } from './fees-overview'
import { FeesStudentAccountsSection } from './fees-student-accounts'
import { FeesStructuresSection } from './fees-structures'
import { PaymentsSection } from './payments/payments-section'
import { FeesTransactionsSection } from './fees-transactions'
import { FeesSettingsSection } from './fees-settings'
import { CollectPaymentModal } from './fees-collect-payment'

// Static tab values used for keyboard-shortcut mapping (1–6 → tab index).
// MUST mirror the display order of the `tabs` array below.
const TAB_VALUES: FeeTab[] = ['overview', 'payments', 'transactions', 'accounts', 'structures', 'settings']

export function FeesShell({ onNavigate }: { onNavigate?: (moduleKey: string) => void }) {
  const [tab, setTab] = useState<FeeTab>('overview')
  const [collectOpen, setCollectOpen] = useState(false)
  const [preselectStudentId, setPreselectStudentId] = useState<string | undefined>(undefined)
  const [feeFocusStudent, setFeeFocusStudent] = useState<{ name: string; ts: number } | null>(null)
  const data = useFeeData(school.academicYear)

  // Deep-link: command palette fee results jump to the Student Accounts tab
  // and open the fee account workspace for the student named in the result
  // title ("<Fee title> — <Student name>"). Matched by name inside the
  // accounts section; a miss shows an honest directory toast there.
  const focus = useFocusStore((s) => s.focus)
  const clearFocus = useFocusStore((s) => s.clearFocus)
  const handledFocusTs = useRef<number | null>(null)
  useEffect(() => {
    if (!focus || focus.type !== 'fee' || handledFocusTs.current === focus.ts) return
    handledFocusTs.current = focus.ts
    clearFocus()
    const studentName = focus.title.split(' — ').slice(1).join(' — ').trim()
    if (!studentName) return
    setFeeFocusStudent({ name: studentName, ts: focus.ts })
    setTab('accounts')
  }, [focus?.ts])

  // Live verification count for the Payments tab badge — the Principal's
  // actionable queue (cash collections awaiting verification).
  const pendingVerification = data.analytics.pendingCashRequests

  // Primary navigation ORDER everywhere the tab bar renders:
  // Overview → Payments → Transactions → Student Accounts → Fee Structures → Settings
  const tabs: SegmentedTab[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'payments', label: 'Payments', badge: pendingVerification > 0 ? pendingVerification : undefined },
    { value: 'transactions', label: 'Transactions' },
    { value: 'accounts', label: 'Student Accounts' },
    { value: 'structures', label: 'Fee Structures' },
    { value: 'settings', label: 'Settings' },
  ]

  // Keyboard shortcuts: 1-6 switch tabs (kept for power users, not displayed).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '6') {
        const idx = Number(e.key) - 1
        if (idx < TAB_VALUES.length) {
          e.preventDefault()
          setTab(TAB_VALUES[idx])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const openCollect = (studentId?: string) => {
    setPreselectStudentId(studentId)
    setCollectOpen(true)
  }

  const closeCollect = () => {
    setCollectOpen(false)
    setPreselectStudentId(undefined)
  }

  return (
    <div data-testid="fees-module">
      <PageTransition className="space-y-4">
        {/* Tab row only — NO global action buttons. Each tab owns its actions.
            Normal document flow (Academics canonical layout): the row scrolls
            horizontally on narrow screens and never overlaps content. */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="overflow-x-auto -mx-1 px-1 pb-1 max-w-full">
            <SegmentedTabs
              tabs={tabs}
              value={tab}
              onValueChange={(v) => setTab(v as FeeTab)}
            />
          </div>
        </div>

        {/* Content — normal flow; the AppShell page scrolls naturally */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            {tab === 'overview' && <FeesOverviewSection data={data} onNavigate={setTab} />}
            {tab === 'accounts' && <FeesStudentAccountsSection data={data} onCollect={(id) => openCollect(id)} focusStudent={feeFocusStudent} />}
            {tab === 'structures' && <FeesStructuresSection data={data} onNavigate={onNavigate} />}
            {tab === 'payments' && <PaymentsSection data={data} onCollect={() => openCollect()} onOpenTransactions={() => setTab('transactions')} />}
            {tab === 'transactions' && <FeesTransactionsSection data={data} />}
            {tab === 'settings' && <FeesSettingsSection onNavigate={onNavigate} />}
          </motion.div>
        </AnimatePresence>
      </PageTransition>

      {/* Collect Fee — shared modal (Payments page + Student Accounts +
          any contextual "Record Payment" flow). */}
      <CollectPaymentModal
        open={collectOpen}
        onOpenChange={(open) => (open ? setCollectOpen(true) : closeCollect())}
        preselectStudentId={preselectStudentId}
      />
    </div>
  )
}
