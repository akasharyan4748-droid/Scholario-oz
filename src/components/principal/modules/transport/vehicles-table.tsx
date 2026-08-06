'use client'

import { motion } from 'framer-motion'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { vehicles } from '@/lib/mock/operations'

export function VehiclesTable() {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Vehicle Fleet</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{vehicles.length} vehicles registered</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Vehicle No</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Capacity</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Driver</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Route</TableHead>
              <TableHead className="font-semibold">GPS</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Last Service</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v, i) => (
              <motion.tr
                key={v.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-accent/30 transition-colors"
              >
                <TableCell className="font-mono text-xs font-medium">{v.number}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{v.type}</Badge></TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{v.capacity} seats</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{v.driver}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{v.route}</TableCell>
                <TableCell>
                  {v.gps ? <StatusBadge status="Active" variant="success" dot /> : <StatusBadge status="Off" variant="neutral" />}
                </TableCell>
                <TableCell>
                  <StatusBadge status={v.status} variant={v.status === 'Active' ? 'success' : 'warning'} dot />
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{new Date(v.lastService).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
