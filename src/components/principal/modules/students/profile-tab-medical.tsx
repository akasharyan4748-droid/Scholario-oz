'use client'

import { Phone, Stethoscope, User } from 'lucide-react'
import type { StudentRecord } from '@/lib/store/students-store'
import { Section, InfoRow } from './shared'

type Props = { student: StudentRecord }

export function MedicalTab({ student }: Props) {
  return (
    <div className="space-y-4">
      <Section title="Medical Information">
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3">
          <Stethoscope className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <p className="text-sm">{student.medical}</p>
        </div>
      </Section>
      <Section title="Emergency Contact">
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Guardian" value={student.guardianName} />
          <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={student.guardianPhone} />
        </div>
      </Section>
    </div>
  )
}
