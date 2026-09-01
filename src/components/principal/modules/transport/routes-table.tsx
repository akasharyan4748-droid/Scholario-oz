'use client'

/**
 * routes-table — Active routes panel.
 *
 * Reads routes from the transport store. Columns:
 *   - Route (name + stops)
 *   - Vehicle (vehicleNo)
 *   - Driver (driverName)
 *   - Capacity (enrolled/capacity with progress bar)
 *   - Status (RouteStatusBadge)
 *   - ETA
 *
 * Search: filter by name / vehicleNo / driverName.
 * State from useTransportStore.
 */

import { motion } from 'framer-motion'
import { Route as RouteIcon, Search, Bus, MapPin, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useTransportStore } from '@/lib/store/transport-store'
import type { Route } from '@/lib/store/transport-store'
import { cn } from '@/lib/utils'
import {
  TptPanel,
  TptEmptyState,
  RouteStatusBadge,
  TptPill,
} from './transport-shared'

export function RoutesTable({ search: externalSearch }: { search?: string }) {
  const routes = useTransportStore((s) => s.routes)
  const internalSearch = useTransportStore((s) => s.search)
  const setSearch = useTransportStore((s) => s.setSearch)

  // Use external search if provided, else fall back to store-driven search.
  const q = (externalSearch ?? internalSearch).trim().toLowerCase()

  const filtered = routes.filter((r) => {
    if (!q) return true
    return (
      r.name.toLowerCase().includes(q) ||
      r.vehicleNo.toLowerCase().includes(q) ||
      r.driverName.toLowerCase().includes(q) ||
      r.startPoint.toLowerCase().includes(q)
    )
  })

  return (
    <TptPanel
      title="Active Routes"
      subtitle={`${filtered.length} of ${routes.length} routes`}
      action={
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={externalSearch ?? internalSearch}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Route, vehicle, driver"
            className="pl-8 h-8 w-40 sm:w-56 text-xs"
          />
        </div>
      }
      bodyClassName="p-0"
    >
      {filtered.length === 0 ? (
        <TptEmptyState
          icon={<RouteIcon className="h-5 w-5" />}
          title="No routes found"
          description="Try adjusting your search."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Route</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">Vehicle</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden lg:table-cell">Driver</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Capacity</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden sm:table-cell">ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-accent/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <RouteIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 max-w-[260px]">
                        <p className="font-medium text-sm truncate">{r.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          {r.startPoint}
                          <span className="text-muted-foreground/40">→</span>
                          {r.destination}
                          <span className="text-muted-foreground/40">·</span>
                          {r.stops} stops
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                      <Bus className="h-3 w-3 text-muted-foreground" />
                      {r.vehicleNo}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">{r.driverName}</TableCell>
                  <TableCell>
                    <CapacityCell route={r} />
                  </TableCell>
                  <TableCell>
                    <RouteStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {r.status === 'Maintenance' || r.status === 'Inactive' ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {r.eta}
                      </span>
                    )}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </TptPanel>
  )
}

// ─── Capacity cell with progress bar ────────────────────────────────

function CapacityCell({ route }: { route: Route }) {
  const pct = Math.min(100, Math.round((route.enrolled / route.capacity) * 100))
  const full = route.enrolled >= route.capacity
  const near = route.enrolled >= route.capacity - 4
  const barColor = full
    ? 'bg-rose-500'
    : near
      ? 'bg-amber-500'
      : 'bg-emerald-500'
  return (
    <div className="w-28">
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="font-semibold tabular-nums">
          {route.enrolled}
          <span className="text-muted-foreground font-normal">/{route.capacity}</span>
        </span>
        <span
          className={cn(
            'tabular-nums',
            full ? 'text-rose-600 font-semibold' : near ? 'text-amber-600 font-semibold' : 'text-muted-foreground'
          )}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', barColor)}
        />
      </div>
      {full && (
        <TptPill accent="bg-rose-500/10 text-rose-700 dark:text-rose-300" className="mt-1">
          Full
        </TptPill>
      )}
    </div>
  )
}
