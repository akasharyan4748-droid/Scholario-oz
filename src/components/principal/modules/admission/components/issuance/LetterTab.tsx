'use client'

import { Button } from '@/components/ui/button'
import { OfficialAdmissionLetter } from '../../../OfficialAdmissionLetter'
import type { IssuanceArtifacts } from './letter-data'

interface LetterTabProps {
  artifacts: IssuanceArtifacts
  onBack: () => void
}

export function LetterTab({ artifacts, onBack }: LetterTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
        <span className="font-semibold">
          🛡️ Privacy Safeguard Active: Sensitive demographic details (Religion, Category, Blood Group, Gender, Aadhaar) are excluded from this printable letter.
        </span>
        <Button size="sm" variant="outline" onClick={() => window.print()} className="h-7 text-xs bg-white text-foreground">
          Print Letter
        </Button>
      </div>

      <OfficialAdmissionLetter data={artifacts.letterData} onClose={onBack} />
    </div>
  )
}
