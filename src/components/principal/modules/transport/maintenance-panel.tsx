'use client'

/**
 * maintenance-panel — Vehicle service / maintenance view.
 *
 * Reads maintenance records from the transport store. Columns:
 *   - Vehicle (vehicleNo + type icon)
 *   - Service Type
 *   - Last Service
 *   - Next Service
 *   - Status (MaintenanceStatusBadge)
 *   - Issue (if any)
 *   - Action (Complete maintenance → completeMaintenance mutation)
 *
 * Stats strip: Due · Overdue · Scheduled · Completed counts.
 *
 * Mutations wired:
 *   - completeMaintenance(maintenanceId) — toast confirmation
 */

import { motion } from 'framer-motion'
import {
  Wrench, AlertTriangle, CalendarClock, CheckCircle2, Bus, CircleDot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useTransportStore } from '@/lib/store/transport-store'
import type { MaintenanceRecord, MaintenanceStatus } from '@/lib/store/transport-store'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  TptPanel,
  TptEmptyState,
  TptPill,
  MaintenanceStatusBadge,
} from './transport-shared'

// ─── MaintenancePanel ────────────────────────────────────────────────

interface MaintenancePanelProps {
  onComplete?: (record: MaintenanceRecord) => void
}

export function MaintenancePanel({ onComplete }: MaintenancePanelProps) {
  const maintenance = useTransportStore((s) => s.maintenance)
  const completeMaintenance = useTransportStore((s) => s.completeMaintenance)
  const vehicles = useTransportStore((s) => s.vehicles)

  // Sort: Overdue → Due → Scheduled → Completed.
  const statusOrder: Record<MaintenanceStatus, number> = {
    Overdue: 0,
    Due: 1,
    Scheduled: 2,
    Completed: 3,
  }
  const sorted = [...maintenance].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  )

  const dueCount = maintenance.filter((m) => m.status === 'Due').length
  const overdueCount = maintenance.filter((m) => m.status === 'Overdue').length
  const scheduledCount = maintenance.filter((m) => m.status === 'Scheduled').length
  const completedCount = maintenance.filter((m) => m.status === 'Completed').length

  const handleComplete = (record: MaintenanceRecord) => {
    completeMaintenance(record.id)
    toast.success('Maintenance completed', {
      description: `${record.vehicleNo} · ${record.type} marked complete — next service scheduled.`,
    })
    onComplete?.(record)
  }

  return (
    <div className="space-y-3">
      {/* Stats strip — soft tinted mini-cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MaintStatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Overdue"
          value={overdueCount}
          sub="Immediate action"
          accent="rose"
        />
        <MaintStatCard
          icon={<CircleDot className="h-4 w-4" />}
          label="Due"
          value={dueCount}
          sub="Service window open"
          accent="amber"
        />
        <MaintStatCard
          icon={<CalendarClock className="h-4 w-4" />}
          label="Scheduled"
          value={scheduledCount}
          sub="Upcoming services"
          accent="cyan"
        />
        <MaintStatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completed"
          value={completedCount}
          sub="Service history"
          accent="emerald"
        />
      </div>

      {/* Maintenance table */}
      <TptPanel
        title="Maintenance & Service Schedule"
        subtitle={`${maintenance.length} records · ${overdueCount} overdue · ${dueCount} due now`}
        bodyClassName="p-0"
      >
        {sorted.length === 0 ? (
          <TptEmptyState
            icon={<Wrench className="h-5 w-5" />}
            title="No maintenance records"
            description="Vehicles needing service will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Vehicle</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Service Type</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">Last Service</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">Next Service</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden lg:table-cell">Issue / Notes</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((m, i) => {
                  const vehicle = vehicles.find((v) => v.id === m.vehicleId)
                  const overdue = m.status === 'Overdue'
                  const due = m.status === 'Due'
                  const isCompleted = m.status === 'Completed'
                  return (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        'hover:bg-accent/30 transition-colors',
                        overdue && 'bg-rose-500/[0.04] dark:bg-rose-500/[0.06]'
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                              overdue
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                : due
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                  : isCompleted
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                            )}
                          >
                            <Bus className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-semibold tracking-tight">{m.vehicleNo}</p>
                            {vehicle && (
                              <p className="text-[10px] text-muted-foreground">{vehicle.type}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-medium">{m.type}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(m.lastService)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span
                          className={cn(
                            'text-xs',
                            overdue ? 'text-rose-600 font-semibold' : 'text-muted-foreground'
                          )}
                        >
                          {formatDate(m.nextService)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <MaintenanceStatusBadge status={m.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {m.issue ? (
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 italic max-w-[240px]">
                            "{m.issue}"
                          </p>
                        ) : isCompleted ? (
                          <span className="text-[11px] text-emerald-600 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> No issues
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isCompleted ? (
                          <TptPill accent="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Done
                          </TptPill>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-[10px] h-7 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                            onClick={() => handleComplete(m)}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Complete
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </TptPanel>
    </div>
  )
}

// ─── Local MaintStatCard ────────────────────────────────────────────

interface StatProps {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  accent: 'emerald' | 'rose' | 'amber' | 'cyan'
}

function MaintStatCard({ icon, label, value, sub, accent }: StatProps) {
  const accentMap = {
    emerald: {
      bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      ring: 'ring-emerald-500/20',
      card: 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/20',
    },
    rose: {
      bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
      ring: 'ring-rose-500/20',
      card: 'bg-rose-500/[0.04] dark:bg-rose-500/[0.06] border-rose-500/20',
    },
    amber: {
      bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      ring: 'ring-amber-500/20',
      card: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border-amber-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
      ring: 'ring-cyan-500/20',
      card: 'bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06] border-cyan-500/20',
    },
  }
  const a = accentMap[accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('rounded-xl border p-3.5', a.card)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider truncate">
            {label}
          </p>
          <p className="font-display text-lg font-bold tabular-nums mt-1 leading-none">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</p>}
        </div>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1',
            a.bg,
            a.ring
          )}
        >
          {icon}
        </span>
      </div>
    </motion.div>
  )
}
