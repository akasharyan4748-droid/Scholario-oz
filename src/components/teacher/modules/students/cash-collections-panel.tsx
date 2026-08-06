'use client'

import { Banknote, CheckCircle2, Printer } from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { CashRequest } from './data'

export function CashCollectionsPanel({
  requests,
  onAccept,
}: {
  requests: CashRequest[]
  onAccept: (reqId: string, studentName: string, amount: number) => void
}) {
  return (
    <GlassCard className="p-4 sm:p-5 border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900/40 to-slate-900/40 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              New Session 2025–2026 Re-Admission Cash Collections
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Review cash given to Teacher <span className="font-semibold text-foreground">Ananya Sharma</span> by students/parents
            </p>
          </div>
        </div>
        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
          {requests.filter((r) => r.status === 'Pending Acceptance').length} Pending
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="p-3.5 rounded-xl border border-border/80 bg-card/60 flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{req.studentName}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">({req.admissionNo})</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Promoted to: <span className="font-semibold text-indigo-400">{req.promotedClass}</span>
                </p>
              </div>
              <StatusBadge
                status={req.status}
                variant={req.status === 'Accepted & Renewed' ? 'success' : 'warning'}
                dot
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <div>
                <span className="text-muted-foreground">Amount:</span>{' '}
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  ₹{req.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Mode:</span>{' '}
                <span className="font-medium text-foreground">{req.mode}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Receiver: <strong className="text-foreground">{req.receiver}</strong></span>
              <span>{req.date}</span>
            </div>

            {req.status === 'Pending Acceptance' ? (
              <Button
                size="sm"
                onClick={() => onAccept(req.id, req.studentName, req.amount)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Accept Cash (₹{req.amount.toLocaleString('en-IN')}) & Confirm Renewal
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast.success('Official Payment Receipt Printed & Issued', {
                    description: `Issued by Teacher Ananya Sharma · ${req.studentName} (${req.promotedClass})`,
                  })
                }
                className="w-full text-xs font-semibold gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Print Teacher Signed Receipt
              </Button>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
