'use client'

import { motion } from 'framer-motion'
import { Navigation } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { ProgressBar } from '@/components/shared/charts'
import { Button } from '@/components/ui/button'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { transportRoutes } from '@/lib/mock/operations'
import type { TransportRoute } from './data'

type Props = {
  onTrack: (route: TransportRoute) => void
}

export function RoutesTable({ onTrack }: Props) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Active Routes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Live status of all 6 routes</p>
        </div>
        <StatusBadge status="GPS Active on All" variant="success" dot />
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Route</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Vehicle</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Driver</TableHead>
              <TableHead className="font-semibold">Capacity</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">ETA</TableHead>
              <TableHead className="font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transportRoutes.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-accent/30 transition-colors"
              >
                <TableCell>
                  <p className="font-medium text-sm">{r.routeName}</p>
                  <p className="text-[11px] text-muted-foreground">{r.stops} stops</p>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">{r.vehicleNo}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <GradientAvatar name={r.driver} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{r.driver}</p>
                      <p className="text-[10px] text-muted-foreground">{r.driverPhone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-24">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="font-medium">{r.students}/{r.capacity}</span>
                      <span className="text-muted-foreground">{Math.round((r.students / r.capacity) * 100)}%</span>
                    </div>
                    <ProgressBar value={r.students} max={r.capacity} color={r.students >= r.capacity - 4 ? 'oklch(0.62 0.2 25)' : 'oklch(0.55 0.14 162)'} height={5} />
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={r.status}
                    variant={r.status === 'On Route' ? 'success' : r.status === 'At School' ? 'info' : 'warning'}
                    dot
                  />
                </TableCell>
                <TableCell className="text-sm font-medium">{r.eta}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => onTrack(r)}
                    disabled={r.status === 'Maintenance'}
                  >
                    <Navigation className="h-3 w-3" /> Track
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
