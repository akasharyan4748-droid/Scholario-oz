'use client'

/**
 * vehicles-table — Vehicle fleet panel.
 *
 * Reads vehicles from the transport store. Columns:
 *   - Vehicle No (number plate + type badge)
 *   - Type
 *   - Capacity
 *   - Driver (driverName)
 *   - Route (routeName)
 *   - GPS (GpsBadge)
 *   - Status (VehicleStatusBadge)
 *   - Last / Next service (lg+)
 *
 * Search: filter by number / driverName / routeName / type.
 */

import { motion } from 'framer-motion'
import { Bus, Search, Wrench, CalendarClock, Route as RouteIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useTransportStore } from '@/lib/store/transport-store'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  TptPanel,
  TptEmptyState,
  VehicleStatusBadge,
  GpsBadge,
} from './transport-shared'

const TYPE_ACCENT: Record<string, string> = {
  Bus: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'Mini Bus': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
  Van: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
}

export function VehiclesTable({ search: externalSearch }: { search?: string }) {
  const vehicles = useTransportStore((s) => s.vehicles)
  const internalSearch = useTransportStore((s) => s.search)
  const setSearch = useTransportStore((s) => s.setSearch)

  const q = (externalSearch ?? internalSearch).trim().toLowerCase()

  const filtered = vehicles.filter((v) => {
    if (!q) return true
    return (
      v.number.toLowerCase().includes(q) ||
      v.driverName.toLowerCase().includes(q) ||
      v.routeName.toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q)
    )
  })

  return (
    <TptPanel
      title="Vehicle Fleet"
      subtitle={`${filtered.length} of ${vehicles.length} vehicles`}
      action={
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={externalSearch ?? internalSearch}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Number, driver, route, type"
            className="pl-8 h-8 w-44 sm:w-60 text-xs"
          />
        </div>
      }
      bodyClassName="p-0"
    >
      {filtered.length === 0 ? (
        <TptEmptyState
          icon={<Bus className="h-5 w-5" />}
          title="No vehicles found"
          description="Try adjusting your search."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Vehicle No</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden sm:table-cell">Type</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-center">Capacity</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden md:table-cell">Driver</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden lg:table-cell">Route</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">GPS</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-semibold text-[10px] uppercase tracking-wider hidden lg:table-cell">Last / Next Service</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v, i) => {
                const inMaintenance = v.status === 'Maintenance'
                const nextServiceOverdue =
                  !inMaintenance && new Date(v.nextService) < new Date()
                return (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            inMaintenance
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          )}
                        >
                          <Bus className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold tracking-tight">{v.number}</p>
                          <p className="text-[10px] text-muted-foreground sm:hidden">{v.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={cn('text-[10px] font-medium border', TYPE_ACCENT[v.type])}>
                        {v.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-sm tabular-nums">{v.capacity}</span>
                      <span className="text-[10px] text-muted-foreground ml-0.5">seats</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{v.driverName}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[180px]">
                        <RouteIcon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{v.routeName}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <GpsBadge active={v.gps} />
                    </TableCell>
                    <TableCell>
                      <VehicleStatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Wrench className="h-2.5 w-2.5" />
                          Last: {formatDate(v.lastService)}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] flex items-center gap-1',
                            nextServiceOverdue
                              ? 'text-rose-600 font-semibold'
                              : 'text-muted-foreground'
                          )}
                        >
                          <CalendarClock className="h-2.5 w-2.5" />
                          Next: {formatDate(v.nextService)}
                        </span>
                      </div>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </TptPanel>
  )
}
