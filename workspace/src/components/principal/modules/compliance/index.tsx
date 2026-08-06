'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, FileCheck, AlertTriangle, Star, Plus, FileText,
  CheckCircle2,
} from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartCard, AreaTrend, Donut } from '@/components/shared/charts'
import { complianceItems, auditLogs, complianceDocuments, complianceStats, type ComplianceItem } from '@/lib/mock/compliance'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { type Tab } from './data'
import { ComplianceTab } from './compliance-tab'
import { AuditsTab } from './audits-tab'
import { DocumentsTab } from './documents-tab'
import { ComplianceModal } from './compliance-modal'

export function ComplianceModule() {
  const [tab, setTab] = useState<Tab>('compliance')
  const [selected, setSelected] = useState<ComplianceItem | null>(null)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Compliance & Audit"
        subtitle="Accreditation, statutory compliance & audit management"
        icon={<ShieldCheck className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Audit scheduled', { description: 'External auditor notified' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Schedule Audit
          </button>
        }
      />

      {/* Hero compliance score */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-premium-lg"
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur ring-4 ring-white/30">
                <span className="font-display text-3xl font-extrabold">{complianceStats.complianceScore}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold shadow-lg ring-2 ring-white/40">
                A+
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-emerald-50 text-xs font-medium mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" /> Compliance Score · Grade A+
              </div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Excellent Compliance!</h2>
              <p className="text-emerald-50/90 text-sm mt-0.5">{complianceStats.compliant}/{complianceStats.totalItems} items compliant · {complianceStats.actionRequired} needs action</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
              <p className="text-2xl font-bold">{complianceStats.verifiedDocs}</p>
              <p className="text-[11px] text-emerald-50">Verified Docs</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-center">
              <p className="text-2xl font-bold">{complianceStats.upcomingAudits}</p>
              <p className="text-[11px] text-emerald-50">Upcoming</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Compliant Items" value={complianceStats.compliant} icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" trend={4} trendLabel={`of ${complianceStats.totalItems} total`} delay={0} />
        <KpiCard label="Action Required" value={complianceStats.actionRequired} icon={<AlertTriangle className="h-5 w-5" />} accent="rose" trendLabel="needs attention" delay={0.05} />
        <KpiCard label="Documents" value={complianceStats.verifiedDocs} suffix={`/${complianceStats.totalDocuments}`} icon={<FileText className="h-5 w-5" />} accent="violet" trendLabel="verified" delay={0.1} />
        <KpiCard label="Audit Rating" value={complianceStats.avgRating} decimals={1} icon={<Star className="h-5 w-5" />} accent="amber" trend={0.3} trendLabel={`${complianceStats.auditsThisYear} audits/yr`} delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <ChartCard title="Compliance Score Trend" subtitle="Monthly improvement" className="lg:col-span-2">
          <AreaTrend data={complianceStats.complianceTrend} xKey="month" yKey="score" color="oklch(0.55 0.14 162)" height={240} gradientId="compGrad" />
        </ChartCard>
        <ChartCard title="By Category" subtitle="Compliance distribution">
          <Donut data={complianceStats.categoryBreakdown} centerValue={`${complianceStats.totalItems}`} centerLabel="items" height={240} />
        </ChartCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'compliance' as Tab, label: 'Compliance Items', icon: <ShieldCheck className="h-3.5 w-3.5" />, count: complianceItems.length },
          { id: 'audits' as Tab, label: 'Audit Log', icon: <FileCheck className="h-3.5 w-3.5" />, count: auditLogs.length },
          { id: 'documents' as Tab, label: 'Documents', icon: <FileText className="h-3.5 w-3.5" />, count: complianceDocuments.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all',
              tab === t.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {t.icon}
            {t.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', tab === t.id ? 'bg-primary-foreground/20' : 'bg-muted')}>{t.count}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'compliance' && <ComplianceTab onSelect={setSelected} />}
        {tab === 'audits' && <AuditsTab />}
        {tab === 'documents' && <DocumentsTab />}
      </AnimatePresence>

      {/* Compliance detail modal */}
      <AnimatePresence>
        {selected && <ComplianceModal selected={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
