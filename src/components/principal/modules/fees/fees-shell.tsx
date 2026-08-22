'use client'

/**
 * FeesShell — Principal Fee Management workspace orchestrator.
 *
 * The global header already says "Fee Management" so this shell does NOT
 * repeat the title. Instead the content area begins with the Academic
 * Year + an inline tab navigation grouped by concern.
 *
 * Tabs:
 *   Overview · Collections · Student Accounts · Fee Structures ·
 *   Pending Dues · Transactions · Approvals · Reports · Settings
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Banknote, Users, Layers, AlertCircle,
  ArrowLeftRight, ShieldCheck, FileBarChart2, Settings as SettingsIcon,
  Plus, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
import { FEES_GLOBAL_STYLES } from './fees-shared'

const TAB_GROUPS: Array<{ label: string; items: Array<{ value: FeeTab; label: string; icon: React.ReactNode }> }> = [
  {
    label: 'Operate',
    items: [
      { value: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
      { value: 'collections', label: 'Collections', icon: <Banknote className="h-3.5 w-3.5" /> },
      { value: 'accounts', label: 'Student Accounts', icon: <Users className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Administer',
    items: [
      { value: 'structures', label: 'Fee Structures', icon: <Layers className="h-3.5 w-3.5" /> },
      { value: 'dues', label: 'Pending Dues', icon: <AlertCircle className="h-3.5 w-3.5" /> },
      { value: 'transactions', label: 'Transactions', icon: <ArrowLeftRight className="h-3.5 w-3.5" /> },
      { value: 'approvals', label: 'Approvals', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    ],
  },
  {
    label: 'Insights',
    items: [
      { value: 'reports', label: 'Reports', icon: <FileBarChart2 className="h-3.5 w-3.5" /> },
      { value: 'settings', label: 'Settings', icon: <SettingsIcon className="h-3.5 w-3.5" /> },
    ],
  },
]

const TABS = TAB_GROUPS.flatMap((g) => g.items)

export function FeesShell() {
  const [tab, setTab] = useState<FeeTab>('overview')
  const [collectOpen, setCollectOpen] = useState(false)
  const [preselectStudentId, setPreselectStudentId] = useState<string | undefined>(undefined)
  const data = useFeeData(school.session)

  const tabBadges: Partial<Record<FeeTab, number>> = {
    dues: data.analytics.pendingCount,
    approvals: data.analytics.pendingCashRequests,
  }

  // Keyboard shortcuts: 1-9 switch tabs (kept for power users, not displayed).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1
        if (idx < TABS.length) {
          e.preventDefault()
          setTab(TABS[idx].value)
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
    <div className="flex flex-col h-full fees-shell">
      <style dangerouslySetInnerHTML={{ __html: FEES_GLOBAL_STYLES }} />
      {/* Header — contextual content (NOT a duplicate "Fee Management" title) */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">Academic Year {school.academicYear} · {data.accounts.length} students</p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Fee Collections &amp; Dues</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Collect payments, follow up on dues, verify cash, and audit fee transactions.</p>
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
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => openCollect()}
              >
                <Plus className="h-3.5 w-3.5" /> Collect Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 pb-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {TAB_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex items-center gap-2">
                {gi > 0 && <span className="text-muted-foreground/40 text-xs select-none" aria-hidden>•</span>}
                <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
                  {group.items.map((t) => {
                    const badge = tabBadges[t.value]
                    return (
                      <button
                        key={t.value}
                        onClick={() => setTab(t.value)}
                        aria-current={tab === t.value ? 'page' : undefined}
                        className={cn(
                          'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5',
                          tab === t.value
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                        {badge !== undefined && badge > 0 && (
                          <span className={cn(
                            'inline-flex items-center justify-center h-3.5 px-1 rounded-full text-[8px] font-bold tabular-nums',
                            tab === t.value ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground',
                          )}>
                            {badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
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
      </div>

      <CollectPaymentModal
        open={collectOpen}
        onOpenChange={setCollectOpen}
        preselectStudentId={preselectStudentId}
      />
    </div>
  )
}


