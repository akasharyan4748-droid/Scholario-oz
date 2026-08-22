'use client'

/**
 * FinanceShell — Principal's financial command center orchestrator.
 *
 * Tabs:
 *   Overview · Statements · Reports
 *
 * The global header already says "Finance Dashboard" so this shell uses a
 * distinct, contextual title ("Financial Overview") to avoid colliding
 * with the Fees module's "Financial Control Center" shell title.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, FileBarChart2, Download, Calendar,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFinanceData, FINANCE_PERIODS } from '@/lib/store/finance-store'
import { school } from '@/lib/mock/school'
import { FinanceOverviewSection } from './finance-overview'
import { FinanceStatementsSection } from './finance-statements'
import { FinanceReportsSection } from './finance-reports'
import { FINANCE_GLOBAL_STYLES } from './finance-shared'
import { toast } from 'sonner'

type FinanceTab = 'overview' | 'statements' | 'reports'

const TABS: Array<{ value: FinanceTab; label: string; icon: React.ReactNode }> = [
  { value: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { value: 'statements', label: 'Statements', icon: <FileText className="h-3.5 w-3.5" /> },
  { value: 'reports', label: 'Reports', icon: <FileBarChart2 className="h-3.5 w-3.5" /> },
]

export function FinanceShell() {
  const [tab, setTab] = useState<FinanceTab>('overview')
  const [periodId, setPeriodId] = useState('fy25-26')
  const [periodOpen, setPeriodOpen] = useState(false)
  const data = useFinanceData(periodId)

  // Keyboard shortcuts: 1-3 switch tabs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '3') {
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

  const pendingAlerts = data.alerts.length

  return (
    <div className="flex flex-col h-full finance-shell">
      <style dangerouslySetInnerHTML={{ __html: FINANCE_GLOBAL_STYLES }} />
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">Academic Year {school.academicYear}</p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Financial Overview</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Revenue, expenses, and financial statements across all modules.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Period selector */}
              <div className="relative">
                <button
                  onClick={() => setPeriodOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-card text-xs font-medium hover:border-primary/40 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {data.period.label}
                  <ChevronDown className={cn('h-3 w-3 transition-transform', periodOpen && 'rotate-180')} />
                </button>
                {periodOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
                    <div className="absolute right-0 mt-1 w-48 rounded-md border border-border bg-card shadow-md z-20 py-1">
                      {FINANCE_PERIODS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setPeriodId(p.id); setPeriodOpen(false) }}
                          className={cn(
                            'w-full text-left px-3 py-1.5 text-xs hover:bg-muted/40 transition-colors',
                            periodId === p.id && 'bg-primary/5 font-semibold',
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => toast.success('Financial summary exported', { description: `${data.period.label}-financial-summary.pdf` })}
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 pb-2 overflow-x-auto">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 w-max">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                aria-current={tab === t.value ? 'page' : undefined}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5',
                  tab === t.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.value === 'overview' && pendingAlerts > 0 && (
                  <span className="inline-flex items-center justify-center h-3.5 px-1 rounded-full text-[8px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    {pendingAlerts}
                  </span>
                )}
              </button>
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
            {tab === 'overview' && <FinanceOverviewSection data={data} onNavigate={setTab} />}
            {tab === 'statements' && <FinanceStatementsSection data={data} />}
            {tab === 'reports' && <FinanceReportsSection data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
