'use client'

import { GlassCard } from '@/components/shared/ui'
import type { IssuanceArtifacts } from './letter-data'
import type { AdmissionApplication } from '@/lib/store/admission-store'

interface IdentifiersMatrixProps {
  app: AdmissionApplication
  artifacts: IssuanceArtifacts
}

export function IdentifiersMatrix({ app, artifacts }: IdentifiersMatrixProps) {
  const { admissionNo, studentId, rollNo, regNo } = artifacts
  const formData = app.formData

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <GlassCard className="p-3.5 space-y-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Admission Number</span>
        <span className="font-mono font-extrabold text-sm text-foreground block">{admissionNo}</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Official Record</span>
      </GlassCard>

      <GlassCard className="p-3.5 space-y-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Student ID</span>
        <span className="font-mono font-extrabold text-sm text-foreground block">{studentId}</span>
        <span className="text-[10px] text-muted-foreground">Unique ERP UID</span>
      </GlassCard>

      <GlassCard className="p-3.5 space-y-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Class & Roll Number</span>
        <span className="font-bold text-sm text-foreground block">{formData.className} - Roll #{rollNo}</span>
        <span className="text-[10px] text-muted-foreground">Class Roster Allocated</span>
      </GlassCard>

      <GlassCard className="p-3.5 space-y-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground block">CBSE Reg. Reference</span>
        <span className="font-mono font-extrabold text-xs text-foreground block">{regNo}</span>
        <span className="text-[10px] text-muted-foreground">Board Portal Ready</span>
      </GlassCard>
    </div>
  )
}
