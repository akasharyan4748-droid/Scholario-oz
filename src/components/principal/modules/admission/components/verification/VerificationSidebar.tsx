'use client'

import { MessageSquare } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { GlassCard } from '@/components/shared/ui'
import type { AdmissionApplication } from '@/lib/store/admission-store'

interface VerificationSidebarProps {
  app: AdmissionApplication
  flaggedCount: number
  overallRemarks: string
  onOverallRemarksChange: (value: string) => void
}

export function VerificationSidebar({
  app,
  flaggedCount,
  overallRemarks,
  onOverallRemarksChange,
}: VerificationSidebarProps) {
  return (
    <GlassCard className="p-4 space-y-3 sticky top-6 border">
      <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-emerald-600" />
        Overall Officer Decision Notes
      </h4>
      <Textarea
        placeholder="Overall remarks for applicant or principal decision log..."
        value={overallRemarks}
        onChange={(e) => onOverallRemarksChange(e.target.value)}
        className="text-xs min-h-[90px]"
      />

      <div className="pt-2 border-t space-y-2">
        <span className="text-xs font-bold text-muted-foreground block">Verification Summary:</span>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Complete Sections:</span>
            <span className="font-bold text-emerald-600">{9 - flaggedCount} / 9</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Flagged for Correction:</span>
            <span className="font-bold text-amber-600">{flaggedCount} / 9</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t space-y-2">
        <span className="text-xs font-bold text-muted-foreground block">Audit Log History:</span>
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {(app.auditTrail || []).map((entry) => (
            <div key={entry.id} className="p-2 rounded bg-muted/40 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>{entry.action}</span>
                <span className="text-[10px] text-muted-foreground">{entry.timestamp}</span>
              </div>
              <p className="text-muted-foreground text-[10px]">{entry.notes}</p>
              <span className="text-[9px] text-emerald-700 font-mono">By: {entry.actor}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
