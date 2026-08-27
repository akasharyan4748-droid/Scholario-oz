'use client'

import {
  Edit3, AlertTriangle, XCircle, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AdmissionApplication } from '@/lib/store/admission-store'

interface VerificationHeaderProps {
  app: AdmissionApplication
  flaggedCount: number
  onOpenWizardToEdit: (appId: string) => void
  onNeedCorrection: () => void
  onReject: () => void
  onApprove: () => void
}

export function VerificationHeader({
  app,
  flaggedCount,
  onOpenWizardToEdit,
  onNeedCorrection,
  onReject,
  onApprove,
}: VerificationHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Applicant identity */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-display text-xl font-bold">
            {app.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-foreground">{app.applicantName}</h2>
              <Badge variant="outline" className="font-mono text-[10px]">{app.admissionNo}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span>Class <strong className="text-foreground">{app.className} — {app.section}</strong></span>
              <span className="text-border">·</span>
              <span className="font-mono">{app.academicSession}</span>
              <span className="text-border">·</span>
              <span>Submitted {app.submittedDate}</span>
            </div>
          </div>
        </div>

        {/* Right: Verification progress + decision actions */}
        <div className="flex flex-col items-stretch lg:items-end gap-2 shrink-0">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Verification:</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-emerald-600">{9 - flaggedCount}/9</span>
              <span className="text-muted-foreground">sections verified</span>
            </div>
            {flaggedCount > 0 && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] px-1.5 font-bold">
                {flaggedCount} flagged
              </Badge>
            )}
          </div>

          {/* Decision buttons — only 3 actions, clear hierarchy */}
          <div className="flex items-center gap-2">
            {app.status === 'Need Correction' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenWizardToEdit(app.id)}
                className="text-xs h-8 gap-1 border-amber-300 text-amber-800 dark:text-amber-300"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onNeedCorrection}
              className="text-xs h-8 gap-1 border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Need Correction
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              className="text-xs h-8 gap-1 border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              className="text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
