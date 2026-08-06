import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AdmissionStatus } from '@/lib/store/admission-store'

const STATUS_BADGE_MAP: Record<AdmissionStatus, { label: string; className: string }> = {
  Draft: { label: 'Draft', className: 'bg-muted/60 text-muted-foreground border-border' },
  Submitted: { label: 'Submitted', className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30' },
  'Under Review': { label: 'Under Review', className: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30' },
  'Need Correction': { label: 'Needs Correction', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  Resubmitted: { label: 'Resubmitted', className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30' },
  Approved: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  Rejected: { label: 'Rejected', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30' },
  Completed: { label: 'Enrolled', className: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30' },
  Archived: { label: 'Archived', className: 'bg-muted/60 text-muted-foreground border-border' },
}

export function StatusBadge({ status }: { status: AdmissionStatus }) {
  const cfg = STATUS_BADGE_MAP[status] || { label: status, className: '' }
  return <Badge variant="outline" className={cn('text-[10px]', cfg.className)}>{cfg.label}</Badge>
}
