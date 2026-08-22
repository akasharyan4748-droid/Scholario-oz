'use client'

/**
 * TransportModule — Principal Transport workspace orchestrator.
 *
 * The global sidebar already says "Transport", so the header here uses a
 * contextual title ("Transport Operations") — NO duplicate "Transport
 * Management" title.
 *
 * Layout:
 *   - Header: contextual title + Assign Student + Reports action buttons
 *   - Summary pill line: vehicles · routes · drivers · students · on road · in maintenance
 *   - Tab navigation: Routes · Vehicles · Users · Maintenance · Reports
 *   - KPI cards row (4 soft tinted cards — Vehicles, Routes, Drivers,
 *     Students Using Transport) — always visible, each clickable → tab
 *   - Active tab panel:
 *       * routes      → RoutesTable
 *       * vehicles    → VehiclesTable
 *       * users       → UnassignedStudentsBanner + AssignmentsTable
 *       * maintenance → MaintenancePanel
 *       * reports     → TransportReports (Route Distribution + Capacity Utilization)
 *   - Dialogs: AssignStudentDialog, ChangeRouteDialog, RemoveAssignmentConfirm
 *
 * State from `useTransportStore` + `useTransportData` hooks. Students come
 * from the canonical `useStudentsStore` — no duplicate student data lives
 * in the transport store.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bus, Route as RouteIcon, Users, Wrench, FileBarChart2, UserPlus,
  Navigation, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useTransportStore,
  useTransportData,
} from '@/lib/store/transport-store'
import type { TransportAssignment } from '@/lib/store/transport-store'
import { toast } from 'sonner'
import {
  TPT_GLOBAL_STYLES,
  TptKpiCard,
  type TptTab,
} from './transport-shared'
import { RoutesTable } from './routes-table'
import { VehiclesTable } from './vehicles-table'
import {
  AssignmentsTable,
  AssignStudentDialog,
  ChangeRouteDialog,
  RemoveAssignmentConfirm,
  UnassignedStudentsBanner,
} from './transport-users'
import { MaintenancePanel } from './maintenance-panel'
import { TransportReports } from './transport-charts'

const TABS: Array<{
  value: TptTab
  label: string
  icon: React.ReactNode
  badge?: number
  badgeTone?: 'rose' | 'amber' | 'default'
}> = [
  { value: 'routes', label: 'Routes', icon: <RouteIcon className="h-3.5 w-3.5" /> },
  { value: 'vehicles', label: 'Vehicles', icon: <Bus className="h-3.5 w-3.5" /> },
  { value: 'users', label: 'Users', icon: <Users className="h-3.5 w-3.5" /> },
  {
    value: 'maintenance',
    label: 'Maintenance',
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  { value: 'reports', label: 'Reports', icon: <FileBarChart2 className="h-3.5 w-3.5" /> },
]

export function TransportModule() {
  const [tab, setTab] = useState<TptTab>('routes')
  const [assignOpen, setAssignOpen] = useState(false)
  const [changeRouteOpen, setChangeRouteOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [changeRouteTarget, setChangeRouteTarget] = useState<TransportAssignment | null>(null)
  const [removeTarget, setRemoveTarget] = useState<TransportAssignment | null>(null)

  const data = useTransportData()
  const { analytics } = data

  // Build tab badges — maintenance shows due+overdue count in rose.
  const tabBadges: Partial<Record<TptTab, { count: number; tone: 'rose' | 'amber' | 'default' }>> = {
    maintenance: {
      count: analytics.maintenanceDue.length,
      tone: 'rose',
    },
    users: {
      count: analytics.unassignedStudents,
      tone: 'amber',
    },
  }

  // Keyboard shortcuts: 1-5 switch tabs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key >= '1' && e.key <= '5') {
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

  const openChangeRoute = (a: TransportAssignment) => {
    setChangeRouteTarget(a)
    setChangeRouteOpen(true)
  }

  const openRemove = (a: TransportAssignment) => {
    setRemoveTarget(a)
    setRemoveOpen(true)
  }

  return (
    <div className="flex flex-col h-full transport-shell">
      <style dangerouslySetInnerHTML={{ __html: TPT_GLOBAL_STYLES }} />

      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.14em]">
                School Transport
              </p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                Transport Operations
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setTab('reports')}
              >
                <FileBarChart2 className="h-3.5 w-3.5" /> Reports
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => setAssignOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" /> Assign Student
              </Button>
            </div>
          </div>

          {/* Summary pill line */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground flex-wrap">
            <span className="tabular-nums inline-flex items-center gap-1">
              <Bus className="h-2.5 w-2.5" /> Vehicles{' '}
              <span className="font-bold text-foreground">{analytics.totalVehicles}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <RouteIcon className="h-2.5 w-2.5" /> Routes{' '}
              <span className="font-bold text-foreground">{analytics.totalRoutes}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <Users className="h-2.5 w-2.5" /> Drivers{' '}
              <span className="font-bold text-foreground">{analytics.totalDrivers}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <Users className="h-2.5 w-2.5" /> Students{' '}
              <span className="font-bold text-violet-600">{analytics.studentsUsingTransport}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <Navigation className="h-2.5 w-2.5" /> On Road{' '}
              <span className="font-bold text-emerald-600">{analytics.onRoad}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <Wrench className="h-2.5 w-2.5" /> Maintenance{' '}
              <span className="font-bold text-rose-600">{analytics.inMaintenance}</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="tabular-nums inline-flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" /> Maintenance Due{' '}
              <span className="font-bold text-rose-600">{analytics.maintenanceDue.length}</span>
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 pb-2 overflow-x-auto">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 w-fit">
            {TABS.map((t) => {
              const badge = tabBadges[t.value]
              const isActive = tab === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5',
                    isActive
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {badge && badge.count > 0 && (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center h-3.5 px-1 rounded-full text-[8px] font-bold tabular-nums',
                        badge.tone === 'rose'
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                          : badge.tone === 'amber'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : isActive
                              ? 'bg-muted/80 text-muted-foreground'
                              : 'bg-muted/60 text-muted-foreground'
                      )}
                    >
                      {badge.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* KPI cards row — always visible */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <TptKpiCard
            icon={<Bus className="h-4 w-4" />}
            label="Total Vehicles"
            value={analytics.totalVehicles}
            sub={`${analytics.inMaintenance} in maintenance`}
            accent="emerald"
            delay={0}
            onClick={() => setTab('vehicles')}
          />
          <TptKpiCard
            icon={<RouteIcon className="h-4 w-4" />}
            label="Active Routes"
            value={analytics.totalRoutes}
            sub={`${analytics.onRoad} on road now`}
            accent="cyan"
            delay={0.05}
            onClick={() => setTab('routes')}
          />
          <TptKpiCard
            icon={<Users className="h-4 w-4" />}
            label="Drivers"
            value={analytics.totalDrivers}
            sub={`Operating ${analytics.totalVehicles} vehicles`}
            accent="amber"
            delay={0.1}
            onClick={() => setTab('vehicles')}
          />
          <TptKpiCard
            icon={<Users className="h-4 w-4" />}
            label="Students Using Transport"
            value={analytics.studentsUsingTransport}
            sub={
              analytics.unassignedStudents > 0
                ? `${analytics.unassignedStudents} awaiting assignment`
                : 'All assigned to routes'
            }
            accent="violet"
            delay={0.15}
            onClick={() => setTab('users')}
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
            className="space-y-4"
          >
            {tab === 'routes' && <RoutesTable />}
            {tab === 'vehicles' && <VehiclesTable />}
            {tab === 'users' && (
              <>
                <UnassignedStudentsBanner
                  unassignedCount={analytics.unassignedStudents}
                  onAssign={() => setAssignOpen(true)}
                />
                <AssignmentsTable
                  onAssign={() => setAssignOpen(true)}
                  onChangeRoute={openChangeRoute}
                  onRemove={openRemove}
                />
              </>
            )}
            {tab === 'maintenance' && (
              <MaintenancePanel
                onComplete={() => setTab('vehicles')}
              />
            )}
            {tab === 'reports' && <TransportReports />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <AssignStudentDialog open={assignOpen} onOpenChange={setAssignOpen} />
      <ChangeRouteDialog
        open={changeRouteOpen}
        onOpenChange={setChangeRouteOpen}
        assignment={changeRouteTarget}
      />
      <RemoveAssignmentConfirm
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        assignment={removeTarget}
      />
    </div>
  )
}
