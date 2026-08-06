'use client'

import { ArrowLeft, UserCheck, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AdmissionApplication } from '@/lib/store/admission-store'

interface IssuanceHeaderProps {
  app: AdmissionApplication
  isCompleted: boolean
  onBack: () => void
  onCompleteAndEnroll: () => void
}

export function IssuanceHeader({
  app,
  isCompleted,
  onBack,
  onCompleteAndEnroll,
}: IssuanceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="h-8 gap-1 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Admission Issuance Workspace: {app.applicantName}
            </h2>
            {isCompleted ? (
              <Badge className="bg-teal-600 text-white text-xs font-bold">
                ✓ Admission Issued & Enrolled
              </Badge>
            ) : (
              <Badge className="bg-emerald-600/10 text-emerald-800 border-emerald-300 text-xs font-semibold">
                Approved — Ready for Final Issuance
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate official admission letter, student portal credentials, fee receipts, and dispatch multi-channel onboarding notifications.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isCompleted && (
          <Button
            size="sm"
            onClick={onCompleteAndEnroll}
            className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5 shadow-md px-4"
          >
            <UserCheck className="h-4 w-4" />
            Complete Admission & Enroll Student
          </Button>
        )}

        {isCompleted && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print Complete Dossier
          </Button>
        )}
      </div>
    </div>
  )
}
