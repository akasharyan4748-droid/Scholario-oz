'use client'

import { useMemo, useState } from 'react'
import { Award } from 'lucide-react'
import { SectionHeading } from '@/components/shared/ui'
import { students } from '@/lib/mock/students'
import { CERTS, type CertType } from './data'
import { CertCardsGrid } from './cert-cards'
import { RecentlyGenerated } from './recently-generated'
import { GenerateDialog } from './generate-dialog'

/**
 * Certificates module — issue official school documents (bonafide, transfer,
 * character, ID card, fee receipt, migration) with authentic school branding.
 *
 * Composition root only: owns the active cert type + selected student state and
 * wires the cards grid, recently-generated log, and the generate dialog. The
 * certificate previews themselves live in `document-certs.tsx` / `card-certs.tsx`.
 */
export function CertificatesModule() {
  const [activeType, setActiveType] = useState<CertType | null>(null)
  const [studentId, setStudentId] = useState(students[0].id)

  const student = useMemo(
    () => students.find((s) => s.id === studentId) ?? students[0],
    [studentId],
  )

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Certificate Generation"
        subtitle="Issue official school documents with authentic branding"
        icon={<Award className="h-5 w-5" />}
      />

      <CertCardsGrid onGenerate={setActiveType} />

      <RecentlyGenerated />

      <GenerateDialog
        activeType={activeType}
        onClose={() => setActiveType(null)}
        student={student}
        studentId={studentId}
        onStudentIdChange={setStudentId}
      />
    </div>
  )
}

// Re-exported so callers can build cert metadata lookups without importing data.tsx directly.
export { CERTS, type CertType }
