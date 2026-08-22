'use client'

/**
 * CertificatesModule — Document Generation workspace.
 *
 * Header (NO duplicate title — the sidebar already says "Certificates"):
 *   "Document Generation" + contextual subtitle + summary pills.
 *
 * Three tabs:
 *   · Generate   — full document generation workflow with live preview
 *   · Templates  — manage per-doc-type templates
 *   · History    — searchable document history with actions
 *
 * KPI cards row (4): Documents Generated · Active Templates · This Month · Pending
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Sparkles, Calendar, Clock, Settings2, History as HistoryIcon, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import {
  CERT_PRINT_STYLES, CertKpiCard,
} from './cert-shared'
import { GenerateTab } from './generate-tab'
import { TemplatesTab } from './templates-tab'
import { HistoryTab } from './history-tab'

type Tab = 'generate' | 'templates' | 'history'

const TABS: Array<{ value: Tab; label: string; icon: React.ReactNode }> = [
  { value: 'generate', label: 'Generate', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { value: 'templates', label: 'Templates', icon: <Layers className="h-3.5 w-3.5" /> },
  { value: 'history', label: 'History', icon: <HistoryIcon className="h-3.5 w-3.5" /> },
]

export function CertificatesModule() {
  const [tab, setTab] = useState<Tab>('generate')
  const getKpis = useCertificatesStore((s) => s.getKpis)
  const documents = useCertificatesStore((s) => s.documents)
  const templates = useCertificatesStore((s) => s.templates)

  // Recompute KPIs from store data on every render (reconciles with mutations)
  const kpis = getKpis()
  // This month count is the only derived value not exposed on getKpis that
  // the summary pill wants — but getKpis already returns thisMonth, so we
  // reuse it.

  // Keyboard shortcuts: 1-3 switch tabs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '1') setTab('generate')
      if (e.key === '2') setTab('templates')
      if (e.key === '3') setTab('history')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-col h-full cert-shell">
      <style dangerouslySetInnerHTML={{ __html: CERT_PRINT_STYLES }} />

      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm no-print">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">
                Documents & Certificates
              </p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Document Generation</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline" size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setTab('templates')}
              >
                <Settings2 className="h-3.5 w-3.5" /> Manage Templates
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => setTab('generate')}
              >
                <Sparkles className="h-3.5 w-3.5" /> New Document
              </Button>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground flex-wrap">
            <span className="tabular-nums inline-flex items-center gap-1">
              <FileText className="h-2.5 w-2.5" /> Total Generated
              <span className="font-bold text-foreground">{kpis.total}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" /> This Month
              <span className="font-bold text-emerald-600">{kpis.thisMonth}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <Layers className="h-2.5 w-2.5" /> Templates Active
              <span className="font-bold text-cyan-600">{kpis.activeTemplates}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> Pending
              <span className="font-bold text-amber-600">{kpis.pending}</span>
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 pb-2 overflow-x-auto no-print">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 w-fit">
            {TABS.map((t) => (
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-print">
        {/* KPI cards row — always visible */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <CertKpiCard
            icon={<FileText className="h-4 w-4" />}
            label="Documents Generated"
            value={kpis.total}
            sub={`${documents.length} total records`}
            accent="emerald"
            delay={0}
            onClick={() => setTab('history')}
          />
          <CertKpiCard
            icon={<Layers className="h-4 w-4" />}
            label="Active Templates"
            value={kpis.activeTemplates}
            sub={`${templates.length} configured`}
            accent="cyan"
            delay={0.05}
            onClick={() => setTab('templates')}
          />
          <CertKpiCard
            icon={<Calendar className="h-4 w-4" />}
            label="This Month"
            value={kpis.thisMonth}
            sub="Generated this month"
            accent="teal"
            delay={0.1}
            onClick={() => setTab('history')}
          />
          <CertKpiCard
            icon={<Clock className="h-4 w-4" />}
            label="Pending Issue"
            value={kpis.pending}
            sub="Awaiting print / dispatch"
            accent="amber"
            delay={0.15}
            onClick={() => setTab('history')}
          />
        </div>

        {/* Active tab panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'generate' && <GenerateTab />}
            {tab === 'templates' && <TemplatesTab />}
            {tab === 'history' && <HistoryTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
