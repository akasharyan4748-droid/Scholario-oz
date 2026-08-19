'use client'

// Salary records table for the current payroll cycle.

import { motion } from 'framer-motion'
import { Download, FileText, ChevronRight } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { salaryRecords, type SalaryRecord } from '@/lib/mock/finance'
import { school } from '@/lib/mock/school'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { statusVariant } from './data'

export function PayrollRun({ onRowClick }: { onRowClick: (r: SalaryRecord) => void }) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Salary Records — Current Month
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {salaryRecords.length} of {school.totalTeachers + school.totalStaff} employees · click row for slip
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success('Payroll register exported', { description: 'payroll-december-2025.xlsx' })}
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>
      <div className="overflow-x-auto -mx-2 max-h-[30rem] overflow-y-auto custom-scroll">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="hidden md:table-cell">Designation</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Gross</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Deductions</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="hidden xl:table-cell">Paid On</TableHead>
              <TableHead className="text-right">Slip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salaryRecords.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onRowClick(r)}
                className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <GradientAvatar name={r.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{r.employeeId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className="text-xs">{r.designation}</Badge>
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell text-muted-foreground text-sm">{formatINR(r.gross)}</TableCell>
                <TableCell className="text-right hidden lg:table-cell text-rose-600 dark:text-rose-400 text-sm">- {formatINR(r.deductions)}</TableCell>
                <TableCell className="text-right font-display font-bold">{formatINR(r.net)}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={r.status} variant={statusVariant[r.status]} dot />
                </TableCell>
                <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                  {r.paidOn === '—' ? <span className="italic">Pending</span> : formatDate(r.paidOn)}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRowClick(r) }}
                    className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs gap-1"
                  >
                    View Slip <ChevronRight className="h-3 w-3" />
                  </button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
