'use client'

import { Award, Calendar, Cake, Droplet, FileText, IdCard, User } from 'lucide-react'
import { formatINR, formatDate } from '@/lib/format'
import type { StudentRecord } from '@/lib/store/students-store'
import { Section, InfoRow } from './shared'

type Props = { student: StudentRecord }

export function OverviewTab({ student }: Props) {
  return (
    <div className="space-y-4">
      <Section title="Personal Information">
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={<Cake className="h-3.5 w-3.5" />} label="DOB" value={formatDate(student.dob)} />
          <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Gender" value={student.gender} />
          <InfoRow icon={<Droplet className="h-3.5 w-3.5" />} label="Blood" value={student.bloodGroup} />
          <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Admitted" value={formatDate(student.admissionDate)} />
          <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Prev School" value={student.previousSchool} />
          <InfoRow icon={<IdCard className="h-3.5 w-3.5" />} label="Category" value={student.category} />
        </div>
      </Section>
      {student.scholarship > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-3">
          <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <div><p className="text-sm font-medium">Scholarship Awarded</p><p className="text-xs text-muted-foreground">{formatINR(student.scholarship)} concession</p></div>
        </div>
      )}
      {student.achievements.length > 0 && (
        <Section title="Achievements">
          {student.achievements.map((ach, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 min-w-0"><p className="text-sm font-medium">{ach.title}</p><p className="text-[11px] text-muted-foreground">{ach.level} · {formatDate(ach.date)}</p></div>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}
