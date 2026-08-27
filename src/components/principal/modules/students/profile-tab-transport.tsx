'use client'

import { Bus, MapPin } from 'lucide-react'
import type { StudentRecord } from '@/lib/store/students-store'
import { Section, InfoRow } from './shared'

type Props = { student: StudentRecord }

export function TransportTab({ student }: Props) {
  return (
    <div className="space-y-4">
      <Section title="Transport Details">
        {student.transport ? (
          <div className="grid grid-cols-2 gap-2">
            <InfoRow icon={<Bus className="h-3.5 w-3.5" />} label="Route" value={student.transportRoute ?? 'Assigned'} />
            <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Status" value="Active" />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card/40 p-4 text-center">
            <Bus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Transport Not Opted</p>
            <p className="text-xs text-muted-foreground mt-1">This student does not use school transport.</p>
          </div>
        )}
      </Section>
    </div>
  )
}
