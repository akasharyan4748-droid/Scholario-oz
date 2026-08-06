'use client'

import { motion } from 'framer-motion'
import { AlertCircle, Clock, Send, Wallet } from 'lucide-react'
import { GlassCard, StatusBadge, GradientAvatar } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatINR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { pendingDues } from './data'

// Pending Dues section — list of students with outstanding/partial fees.
// Each card shows outstanding, fine (computed as ₹500/mo), total due, last
// payment date, plus "Collect" (calls onCollect with the total) and "Remind"
// buttons. Status badge escalates with overdue months.
export function PendingDues({
  onCollect,
  onRemindAll,
}: {
  onCollect: (studentId: string, amount: number) => void
  onRemindAll: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
    >
      <GlassCard className="p-4 sm:p-5 shadow-premium">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold">Pending Dues</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{pendingDues.length} students with outstanding fees · ₹500/mo late fee</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemindAll}
            className="h-8"
          >
            <Send className="h-3.5 w-3.5" /> Remind All
          </Button>
        </div>

        <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
          {pendingDues.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card/40 p-3.5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <GradientAvatar name={d.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-semibold text-sm">{d.name}</p>
                    <Badge variant="secondary" className="bg-muted text-[10px] font-mono">{d.admissionNo}</Badge>
                    <Badge variant="outline" className="text-[10px]">{d.className}</Badge>
                    <StatusBadge
                      status={d.monthsOverdue >= 3 ? 'Severely overdue' : d.monthsOverdue >= 2 ? 'Overdue' : 'Due soon'}
                      variant={d.monthsOverdue >= 3 ? 'danger' : d.monthsOverdue >= 2 ? 'warning' : 'info'}
                      dot
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[10px] text-muted-foreground">Outstanding</p>
                      <p className="font-display font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums">{formatINR(d.outstanding)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[10px] text-muted-foreground">Fine ({d.monthsOverdue} mo)</p>
                      <p className="font-display font-bold text-sm text-amber-600 dark:text-amber-400 tabular-nums">{formatINR(d.fine)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[10px] text-muted-foreground">Total Due</p>
                      <p className="font-display font-bold text-sm tabular-nums">{formatINR(d.total)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[10px] text-muted-foreground">Last Payment</p>
                      <p className="font-medium text-xs flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{formatDate(d.lastPayment)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      className="h-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      onClick={() => onCollect(d.id, d.total)}
                    >
                      <Wallet className="h-3.5 w-3.5" /> Collect {formatINR(d.total, true)}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => toast.success('Reminder sent', { description: `SMS dispatched to ${d.guardian} for ${d.name}.` })}
                    >
                      <Send className="h-3.5 w-3.5" /> Remind
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
