'use client'

/**
 * CertificatesModule — Document Generation workspace.
 *
 * Header (Academics-quality — no duplicate title, no storytelling subtitle,
 * no summary pills, no header buttons that duplicate the tab nav):
 *   · small eyebrow → short h1 → meta strip with concrete numbers.
 *   · tab nav (Generate · Templates · History) IS the navigation.
 *
 * Each metric has ONE home:
 *   · Total / This Month / Pending  → History tab stats line.
 *   · Active Templates / total      → Templates tab filter chips.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Layers, History as HistoryIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCertificatesStore } from '@/lib/store/certificates-store'
import { CERT_PRINT_STYLES } from './cert-shared'
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

  // Meta strip — concrete numbers, no storytelling subtitle.
  const meta = [
    `${kpis.total} generated`,
    `${kpis.activeTemplates}/${templates.length} templates`,
    `${kpis.thisMonth} this month`,
    kpis.pending > 0 ? `${kpis.pending} pending` : null,
    `AY ${documents.length ? new Date().getFullYear() : new Date().getFullYear()}`,
  ].filter(Boolean) as string[]

  return (
    <div className="flex flex-col h-full cert-shell">
      <style dangerouslySetInnerHTML={{ __html: CERT_PRINT_STYLES }} />

      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm no-print">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">
                Documents &amp; Certificates
              </p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Document Generation</h1>
            </div>
            {/* No header buttons — tab nav IS the navigation. */}
          </div>

          {/* Meta strip — concrete numbers only, no duplicate summary pills. */}
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
            {meta.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground/40">·</span>}
                <span className="tabular-nums">{m}</span>
              </span>
            ))}
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

      {/* Main content — single active tab panel. No KPI card row (duplicates metrics). */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-print">
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
