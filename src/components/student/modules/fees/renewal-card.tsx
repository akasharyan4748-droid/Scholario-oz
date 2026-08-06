'use client'

import {
  RefreshCw, Clock, Printer,
} from 'lucide-react'
import { GlassCard, StatusBadge } from '@/components/shared/ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { RenewalStatus } from './data'

interface RenewalCardProps {
  status: RenewalStatus
  onOpenDialog: () => void
}

export function RenewalCard({ status, onOpenDialog }: RenewalCardProps) {
  return (
    <GlassCard className="p-4 sm:p-5 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/40 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs font-bold">
                New Session 2025–2026
              </Badge>
              {status === 'open' && (
                <StatusBadge status="Renewal Open" variant="primary" dot />
              )}
              {status === 'pending_cash' && (
                <StatusBadge status="Pending Cash Acceptance" variant="warning" dot />
              )}
              {status === 'approved' && (
                <StatusBadge status="Session Renewed & Promoted" variant="success" dot />
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold mt-1 text-foreground">
              Academic Session 2025–2026 Re-Admission & Renewal
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Promoted Class: <span className="font-semibold text-foreground font-mono">Class 11-A</span> · Annual Re-Admission Fee: <span className="font-bold text-emerald-400">₹65,000</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {status === 'open' && (
            <Button
              onClick={onOpenDialog}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Renew Session & Pay Fee
            </Button>
          )}
          {status === 'pending_cash' && (
            <Button
              variant="outline"
              onClick={onOpenDialog}
              className="w-full md:w-auto border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold gap-2"
            >
              <Clock className="h-4 w-4" /> View Cash Collection Slip
            </Button>
          )}
          {status === 'approved' && (
            <Button
              variant="outline"
              onClick={onOpenDialog}
              className="w-full md:w-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-bold gap-2"
            >
              <Printer className="h-4 w-4" /> Official Renewal Receipt
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
