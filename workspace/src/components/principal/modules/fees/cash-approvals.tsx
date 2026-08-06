'use client'

import { motion } from 'framer-motion'
import { Banknote, CheckCircle2, FileText } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { school } from '@/lib/mock/school'
import { formatINR } from '@/lib/format'
import { toast } from 'sonner'
import type { PrincipalCashRequest } from './data'

// Cash Collection & Re-Admission Approvals panel.
//
// Lists Principal Cash Requests submitted by Class Teachers for the active
// AY. Principal can either accept the pending cash (with toast confirmation)
// or, once collected/confirmed, view the principal-signed receipt. The
// requests array is owned by the parent component (so the Principal's
// acceptance is reflected in state) — passed in as props.
export function CashApprovals({
  requests,
  onAccept,
}: {
  requests: PrincipalCashRequest[]
  onAccept: (id: string, name: string, amt: number) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      <GlassCard className="p-4 sm:p-5 shadow-premium">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                Cash Collection & Re-Admission Approvals
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-mono">
                  Session 2025–26
                </Badge>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                Cash submitted to <span className="font-semibold text-foreground">{school.principal}</span> or Class Teachers
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {requests.map((req) => {
            const done = req.status.includes('Confirmed') || req.status.includes('Collected')
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card/50 p-3.5 space-y-2.5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{req.studentName}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">({req.admissionNo})</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Promoted to <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{req.promotedClass}</span>
                    </p>
                  </div>
                  <StatusBadge status={req.status} variant={done ? 'success' : 'warning'} dot />
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                  <div>
                    <span className="text-muted-foreground">Amount: </span>
                    <span className="font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatINR(req.amount)}</span>
                  </div>
                  <div className="text-right min-w-0 ml-2">
                    <span className="text-muted-foreground">Receiver: </span>
                    <span className="font-medium truncate">{req.receiver}</span>
                  </div>
                </div>

                {req.status === 'Pending Principal Acceptance' ? (
                  <Button
                    size="sm"
                    onClick={() => onAccept(req.id, req.studentName, req.amount)}
                    className="w-full h-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Accept Cash & Approve Re-Admission
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toast.success('Official Payment Receipt Issued', {
                        description: `Principal seal & signature attached · ${req.studentName} (${req.promotedClass})`,
                      })
                    }
                    className="w-full h-8 text-xs font-semibold gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" /> View Principal Signed Receipt
                  </Button>
                )}
              </motion.div>
            )
          })}
        </div>
      </GlassCard>
    </motion.div>
  )
}
