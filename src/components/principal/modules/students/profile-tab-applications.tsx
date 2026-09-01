'use client'

/**
 * ApplicationsTab — the student's Applications & Forms record inside the
 * Principal's Student Profile.
 *
 * Shows each application this student has submitted (Educational Tour
 * today) with its review status and ITS OWN payment/receipt history —
 * strictly the transactions bound to that application, never the rest of
 * the student's fee account. Tour money is separate from the annual core
 * fees (which live in the Fees tab).
 */

import { useMemo, useState } from 'react'
import { Bus, ClipboardList, Eye, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StudentRecord } from '@/lib/store/students-store'
import {
  useApplicationsStore, applicationPayments, combinedSubmissionStatus,
  deriveSubmissionPayment,
  type ApplicationSubmission, type SchoolApplication,
} from '@/lib/store/applications-store'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Section } from './shared'
import { SubmissionDocumentDialog } from '@/components/student/modules/applications/print-dialog'

function statusChipClass(status: ReturnType<typeof combinedSubmissionStatus>): string {
  switch (status) {
    case 'Approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
    case 'Paid · Under Review':
    case 'Under Review':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400'
    case 'Awaiting Payment':
    case 'Awaiting Verification':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
    case 'Correction Required':
    case 'Rejected':
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400'
    case 'Withdrawn':
      return 'border-border bg-muted/50 text-muted-foreground'
    default:
      return 'border-border bg-muted/40 text-foreground'
  }
}

export function ApplicationsTab({ student }: { student: StudentRecord }) {
  const applications = useApplicationsStore((s) => s.applications)
  const submissions = useApplicationsStore((s) => s.submissions)
  const [doc, setDoc] = useState<{ app: SchoolApplication; sub: ApplicationSubmission } | null>(null)

  const mine = useMemo(
    () => submissions
      .filter((s) => s.studentId === student.id)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [submissions, student.id],
  )
  const appById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications])

  if (mine.length === 0) {
    return (
      <Section title="Applications & Forms">
        <div className="rounded-lg border border-border bg-card/40 py-8 text-center">
          <ClipboardList className="h-6 w-6 mx-auto text-muted-foreground/40" />
          <p className="mt-2 text-xs text-muted-foreground">No applications submitted by this student yet.</p>
        </div>
      </Section>
    )
  }

  return (
    <div className="space-y-3">
      {mine.map((sub) => {
        const app = appById.get(sub.applicationId)
        if (!app) return null
        const combined = combinedSubmissionStatus(app, sub)
        const pay = deriveSubmissionPayment(app, sub)
        // ONLY payments belonging to THIS application.
        const history = applicationPayments(app).filter((t) => t.studentId === sub.studentId)
        return (
          <Section key={sub.id} title={app.title}>
            <div className="rounded-lg border border-border bg-card/40 divide-y divide-border/60">
              <div className="flex items-center gap-3 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Bus className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs font-semibold truncate">Educational Tour application</p>
                    <span className={cn('inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[9px] font-medium', statusChipClass(combined))}>
                      {combined}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Submitted {formatDate(sub.submittedAt)} · {sub.mode === 'Digital' ? 'Online form' : 'Paper (office)'}
                    {app.eventDate ? ` · Tour ${formatDate(app.eventDate)}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs font-bold tabular-nums">{app.payment.mode !== 'None' ? formatINR(app.payment.amount, true) : 'Free'}</p>
                  <p className={cn(
                    'text-[9px] font-medium',
                    pay.status === 'Paid' ? 'text-emerald-600 dark:text-emerald-400' : (pay.status === 'Not Paid' || pay.status === 'Awaiting Verification') ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                  )}>{pay.status}</p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px] shrink-0 gap-1" onClick={() => setDoc({ app, sub })}>
                  <Eye className="h-3 w-3" /> View
                </Button>
              </div>

              {app.payment.mode !== 'None' && (
                <div className="p-3">
                  <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3 w-3" /> Payment history — this application
                  </p>
                  {history.length === 0 ? (
                    <p className="mt-1.5 text-[10.5px] text-muted-foreground">
                      No payments recorded yet{pay.status === 'Awaiting Verification' ? ' beyond the pending receipt above' : ''}.
                    </p>
                  ) : (
                    <div className="mt-1.5 space-y-1">
                      {history.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/40 px-2.5 py-1.5">
                          <span className="flex min-w-0 items-center gap-2 text-xs">
                            <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="font-mono font-medium">{t.receiptNo}</span>
                            <span className="text-muted-foreground truncate">{formatDate(t.date)} · {t.mode}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium tabular-nums">
                            {formatINR(t.amount)}
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[8px] h-3.5 px-1',
                                t.status === 'Success' && 'border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400',
                                t.status === 'Under Verification' && 'border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-400',
                                t.status === 'Failed' && 'border-rose-200 text-rose-700 dark:border-rose-500/30 dark:text-rose-400',
                              )}
                            >
                              {t.status === 'Success' ? 'Paid' : t.status}
                            </Badge>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-[9px] text-muted-foreground">
                    Tour fees are separate from the annual fees shown in the Fees tab.
                  </p>
                </div>
              )}
            </div>
          </Section>
        )
      })}

      <SubmissionDocumentDialog
        open={!!doc}
        onOpenChange={(o) => { if (!o) setDoc(null) }}
        app={doc?.app ?? null}
        sub={doc?.sub ?? null}
      />
    </div>
  )
}
