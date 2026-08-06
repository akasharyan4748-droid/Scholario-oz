'use client'

import { motion } from 'framer-motion'
import { Receipt, Download } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { myTransactions } from './data'

interface PaymentHistoryProps {
  totalPaid: number
}

export function PaymentHistory({ totalPaid }: PaymentHistoryProps) {
  return (
    <GlassCard className="p-3 sm:p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Receipt className="h-4 w-4 text-cyan-500" /> Payment History
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{myTransactions.length} transactions · All successful</p>
        </div>
        <StatusBadge status={`${formatINR(totalPaid)} paid`} variant="success" dot />
      </div>
      <div className="overflow-x-auto -mx-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt No</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Purpose</TableHead>
              <TableHead className="hidden md:table-cell">Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myTransactions.map((t, i) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors"
              >
                <TableCell className="font-mono text-xs">{t.receiptNo}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{formatDate(t.date)}</TableCell>
                <TableCell className="hidden md:table-cell text-xs">{t.purpose}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                    {t.mode}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-display font-bold">{formatINR(t.amount)}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={t.status} variant="success" dot />
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => toast.success('Receipt downloaded', { description: `${t.receiptNo}.pdf` })}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
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
