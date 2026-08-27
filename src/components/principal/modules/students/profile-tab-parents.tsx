'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import type { StudentRecord } from '@/lib/store/students-store'
import { Section } from './shared'

type Props = { student: StudentRecord }

export function ParentsTab({ student }: Props) {
  return (
    <div className="space-y-4">
      <Section title="Father / Guardian">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-white font-semibold text-sm">
              {student.fatherName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{student.fatherName}</p>
              <p className="text-[11px] text-muted-foreground">Father · Guardian</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {student.guardianPhone}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {student.guardianEmail}</div>
          </div>
        </div>
      </Section>
      <Section title="Mother">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white font-semibold text-sm">
              {student.motherName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{student.motherName}</p>
              <p className="text-[11px] text-muted-foreground">Mother</p>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Address">
        <div className="rounded-lg border border-border bg-card/40 p-3 flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div><p className="text-sm">{student.address}</p><p className="text-xs text-muted-foreground mt-0.5">{student.city}, {student.state}</p></div>
        </div>
      </Section>
    </div>
  )
}
