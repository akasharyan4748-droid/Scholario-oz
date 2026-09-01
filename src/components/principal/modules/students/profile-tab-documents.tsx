'use client'

import { CheckCircle2, Download, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StudentRecord } from '@/lib/store/students-store'
import { Section } from './shared'

type Props = { student: StudentRecord }

export function DocumentsTab({ student }: Props) {
  return (
    <div className="space-y-4">
      <Section title="Student Documents">
        <div className="space-y-2">
          {student.documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-3">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', doc.verified ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400')}>
                {doc.verified ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-[11px] text-muted-foreground">{doc.type} · Uploaded {formatDate(doc.uploadedDate)}</p>
              </div>
              <Badge variant={doc.verified ? 'default' : 'secondary'} className="text-[10px]">{doc.verified ? 'Verified' : 'Pending'}</Badge>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Download className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
