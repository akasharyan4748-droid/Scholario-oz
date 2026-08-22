'use client'

/**
 * FeesShell — Principal Fee Management workspace orchestrator.
 *
 * Visually converged to the Academics (Examinations + Attendance) canonical
 * pattern: a single PageTransition wrapper with one row of SegmentedTabs on
 * the left + action buttons on the right, then AnimatePresence tab content.
 *
 * The AppShell provides the scroll container + outer padding — this shell
 * does NOT add its own scroll wrapper (which previously caused double
 * scroll + double padding).
 *
 * Tabs:
 *   Overview · Collections · Student Accounts · Fee Structures ·
 *   Pending Dues · Transactions · Approvals · Reports · Settings
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/ui'
import { SegmentedTabs, type SegmentedTab } from '../shared/segmented-tabs'
import { useFeeData } from '@/lib/store/fee-store'
import { school } from '@/lib/mock/school'
import type { FeeTab } from './fees-shared'
import { FeesOverviewSection } from './fees-overview'
import { FeesCollectionsSection } from './fees-collections'
import { FeesStudentAccountsSection } from './fees-student-accounts'
import { FeesStructuresSection } from './fees-structures'
import { FeesPendingDuesSection } from './fees-pending-dues'
import { FeesTransactionsSection } from './fees-transactions'
import { FeesApprovalsSection } from './fees-approvals'
import { FeesReportsSection } from './fees-reports'
import { FeesSettingsSection } from './fees-settings'
import { CollectPaymentModal } from './fees-collect-payment'

// Static tab values used for keyboard-shortcut mapping (1–9 → tab index).
const TAB_VALUES: FeeTab[] = [
  'overview', 'collections', 'accounts', 'structures',
  'dues', 'transactions', 'approvals', 'reports', 'settings',
]

export function FeesShell() {
  const [tab, setTab] = useState<FeeTab>('overview')
  const [collectOpen, setCollectOpen] = useState(false)
  const [preselectStudentId, setPreselectStudentId] = useState<string | undefined>(undefined)
  const data = useFeeData(school.session)

  // Build tab list with optional badges for dues + approvals.
  const tabs: SegmentedTab[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'collections', label: 'Collections' },
    { value: 'accounts', label: 'Student Accounts' },
    { value: 'structures', label: 'Fee Structures' },
    { value: 'dues', label: 'Pending Dues', badge: data.analytics.pendingCount },
    { value: 'transactions', label: 'Transactions' },
    { value: 'approvals', label: 'Approvals', badge: data.analytics.pendingCashRequests },
    { value: 'reports', label: 'Reports' },
    { value: 'settings', label: 'Settings' },
  ]

  // Keyboard shortcuts: 1-9 switch tabs (kept for power users, not displayed).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '9') {
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

  return (
    <PageTransition className="space-y-4">
      {/* Tab row + right-side action buttons (Academics canonical layout) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="overflow-x-auto -mx-1 px-1 pb-1 max-w-full">
          <SegmentedTabs
            tabs={tabs}
            value={tab}
            onValueChange={(v) => setTab(v as FeeTab)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setTab('accounts')}
          >
            <Search className="h-3.5 w-3.5" /> Find Student
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => openCollect()}
          >
            <Plus className="h-3.5 w-3.5" /> Collect Payment
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'overview' && <FeesOverviewSection data={data} onNavigate={setTab} />}
          {tab === 'collections' && <FeesCollectionsSection data={data} onCollect={() => openCollect()} />}
          {tab === 'accounts' && <FeesStudentAccountsSection data={data} onCollect={(id) => openCollect(id)} />}
          {tab === 'structures' && <FeesStructuresSection data={data} />}
          {tab === 'dues' && <FeesPendingDuesSection data={data} onCollect={(id) => openCollect(id)} />}
          {tab === 'transactions' && <FeesTransactionsSection data={data} onCollect={() => openCollect()} />}
          {tab === 'approvals' && <FeesApprovalsSection data={data} />}
          {tab === 'reports' && <FeesReportsSection data={data} />}
          {tab === 'settings' && <FeesSettingsSection />}
        </motion.div>
      </AnimatePresence>

      <CollectPaymentModal
        open={collectOpen}
        onOpenChange={setCollectOpen}
        preselectStudentId={preselectStudentId}
      />
    </PageTransition>
  )
}
