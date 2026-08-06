'use client'

// Health & Wellness module entry point.
//
// The `HealthWellnessModule` named export is preserved here for any caller
// (e.g. principal-panel.tsx lazy import) — `import('./modules/health-wellness')`
// resolves to this file via the directory's `index.tsx`.
//
// The index owns the page-level state (active tab, records-tab search query,
// and selected student for the detail modal) and composes the KPI strip,
// charts row, tab bar, three tab views, and the detail modal.

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { HeartPulse, Plus } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { StudentHealth } from '@/lib/mock/health'
import { KpiRow } from './kpi-row'
import { ChartsRow } from './charts-row'
import { RecordsTab } from './records-tab'
import { VaccinationsTab } from './vaccinations-tab'
import { InfirmaryTab } from './infirmary-tab'
import { HealthDetailModal } from './health-detail-modal'
import { tabs, type Tab } from './data'

export function HealthWellnessModule() {
  const [tab, setTab] = useState<Tab>('records')
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentHealth | null>(null)

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Health & Wellness"
        subtitle="Student medical records, vaccinations & infirmary management"
        icon={<HeartPulse className="h-5 w-5" />}
        action={
          <button
            onClick={() => toast.success('Camp announced', { description: 'Health checkup camp scheduled for next week' })}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-rose-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> Health Camp
          </button>
        }
      />

      {/* KPI cards */}
      <KpiRow />

      {/* Charts */}
      <ChartsRow />

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
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
        {tab === 'records' && (
          <RecordsTab search={search} onSearchChange={setSearch} onSelectStudent={setSelectedStudent} />
        )}
        {tab === 'vaccinations' && <VaccinationsTab />}
        {tab === 'infirmary' && <InfirmaryTab />}
      </AnimatePresence>

      {/* Student health detail modal */}
      <AnimatePresence>
        {selectedStudent && (
          <HealthDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
