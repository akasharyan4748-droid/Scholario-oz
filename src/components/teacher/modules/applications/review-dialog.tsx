'use client'

/**
 * ReviewDialog — the teacher's decision surface for ONE submission.
 *
 * What the teacher CAN do here (§2E):
 *   • read the student's answers, consent, document and payment state
 *   • Approve / Request correction / Reject — always through a REQUIRED
 *     note (one shared note field + confirm) → applications-store
 *     reviewSubmission(..., 'Teacher'). The store enforces its own gates
 *     (consent satisfied + payment Paid when the form charges); any gate
 *     error is surfaced to the user EXACTLY as the store returns it.
 *   • add a non-blocking review note (addReviewNote, 'Teacher')
 *   • mark a signed paper received (markDocumentReceived, 'Teacher')
 *
 * What it can NEVER do: collect / record / verify money, change charges,
 * or edit the application. Payment renders only as a read-only chip.
 */

import { useState } from 'react'
import {
  BadgeCheck, CheckCircle2, Download, FileSignature, FileText, Printer,
  ShieldCheck, StickyNote, UserCheck, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  useApplicationsStore, combinedSubmissionStatus, deriveSubmissionPayment, isConsentSatisfied,
} from '@/lib/store/applications-store'
import type { SchoolApplication, ApplicationSubmission } from '@/lib/store/applications-store'
import { useAuth } from '@/lib/store/auth-store'
import { formatINR, formatDate, initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ApplicationPrintDocument, printApplicationDocument, downloadApplicationDocument, applicationDocFileName,
} from '@/components/principal/modules/applications/application-print'
import { SubmissionStatusChip } from './review-detail'

type Decision = 'approve' | 'reject' | 'request_correction'

export function ReviewDialog({ app, sub, onClose }: {
  app: SchoolApplication
  sub: ApplicationSubmission
  onClose: () => void
}) {
  const reviewSubmission = useApplicationsStore((s) => s.reviewSubmission)
  const addReviewNote = useApplicationsStore((s) => s.addReviewNote)
  const markDocumentReceived = useApplicationsStore((s) => s.markDocumentReceived)
  const { user } = useAuth()
  const actor = user?.name ?? 'Teacher'

  const pay = deriveSubmissionPayment(app, sub)
  const consentOk = isConsentSatisfied(app, sub)
  const cs = combinedSubmissionStatus(app, sub)
  const decided = sub.status === 'Approved' || sub.status === 'Rejected' || sub.status === 'Withdrawn'

  // ONE note field + confirm, reused by all three decision buttons.
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [note, setNote] = useState('')
  const [docFile, setDocFile] = useState('')

  const confirmDecision = () => {
    if (!pendingDecision || !decisionNote.trim()) return
    const res = reviewSubmission(sub.id, pendingDecision, decisionNote, actor, 'Teacher')
    if (!res.success) {
      // Surface the store's gate message exactly — no sugar-coating.
      toast.error(res.error ?? 'Action failed')
      return
    }
    toast.success(
      pendingDecision === 'approve' ? 'Application approved'
        : pendingDecision === 'reject' ? 'Application rejected'
          : 'Correction requested',
      { description: `${sub.studentName} · recorded as ${actor} (Teacher)` },
    )
    onClose()
  }

  const submitDocReceived = () => {
    if (!docFile.trim()) return
    const res = markDocumentReceived(sub.id, docFile.trim(), actor, 'Teacher')
    if (!res.success) {
      toast.error(res.error ?? 'Could not record document')
      return
    }
    toast.success('Signed paper recorded', { description: `"${docFile.trim()}" kept on file for ${sub.studentName}.` })
    setDocFile('')
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[86vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm pr-6 flex-wrap">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-500/10 ring-1 ring-slate-500/20 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
              {initials(sub.studentName)}
            </span>
            {sub.studentName}
            <SubmissionStatusChip status={cs} />
          </DialogTitle>
          <DialogDescription className="text-xs">
            {app.title} · submitted {new Date(sub.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {sub.resubmissionCount > 0 ? ` · resubmitted ×${sub.resubmissionCount}` : ''}
          </DialogDescription>
        </DialogHeader>

        {/* ── Student identity block ── */}
        <div className="rounded-lg border border-border p-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[11px]">
          <IdentityLine label="Admission no." value={<span className="font-mono">{sub.admissionNo}</span>} />
          <IdentityLine label="Class / Section" value={`${sub.className} — ${sub.section}`} />
          <IdentityLine label="Guardian" value={sub.guardianName} />
          <IdentityLine label="Guardian phone" value={sub.guardianPhone} />
          <IdentityLine label="Submission mode" value={sub.mode === 'Digital' ? 'Online form' : 'Paper (recorded)'} />
          <IdentityLine label="Application" value={app.title} />
        </div>

        {/* ── Answers ── */}
        <div className="rounded-lg border border-border p-3 space-y-1.5">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Responses</p>
          {app.formFields.length === 0 && <p className="text-xs text-muted-foreground">This form asked no extra questions.</p>}
          {app.formFields.map((f) => {
            const raw = sub.answers[f.id]
            const text = raw === undefined || raw === ''
              ? '—'
              : typeof raw === 'boolean'
                ? (raw ? 'Yes' : 'No')
                : Array.isArray(raw)
                  ? (raw.length ? raw.join(', ') : '—')
                  : raw
            const attachment = sub.attachments?.[f.id]
            return (
              <div key={f.id} className="flex items-start justify-between gap-3 text-xs border-b border-dashed border-border/40 pb-1.5 last:border-b-0 last:pb-0">
                <span className="text-muted-foreground shrink-0 max-w-[55%]">{f.label}{f.required && <span className="text-rose-500 ml-0.5">*</span>}</span>
                <span className="font-medium text-right min-w-0 break-words">
                  {text}
                  {attachment && <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">📎 {attachment.name}</span>}
                </span>
              </div>
            )
          })}
          {sub.mode === 'Physical' && (
            <p className="text-[10px] text-muted-foreground pt-1">Paper submission — answers live on the signed physical document.</p>
          )}
        </div>

        {/* ── Consent · Payment (read-only) · Document status lines ── */}
        <div className="rounded-lg border border-border divide-y divide-border/60">
          <StatusLine
            icon={<ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
            label={`Guardian consent (${app.guardianConsent.method})`}
            value={
              !app.guardianConsent.required
                ? 'Not required'
                : consentOk
                  ? <>Given{sub.consentGivenAt ? ` · ${formatDate(sub.consentGivenAt)}` : ''}</>
                  : 'Pending'
            }
            tone={app.guardianConsent.required && !consentOk ? 'amber' : 'ok'}
          />
          <StatusLine
            icon={<BadgeCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
            label={`Payment — ${app.payment.feeHeadLabel || app.title} (read-only)`}
            value={
              app.payment.mode === 'None'
                ? 'No fee on this form'
                : `${pay.status} · expected ${formatINR(pay.expectedAmount)}${pay.status === 'Paid' ? ` · paid ${formatINR(pay.paidAmount)}` : ''}${pay.receiptNos.length ? ` · receipts ${pay.receiptNos.join(', ')}` : ''}${pay.pendingReceiptNo ? ` · ${pay.pendingReceiptNo} awaiting verification` : ''}`
            }
            tone={app.payment.mode !== 'None' && pay.status !== 'Paid' ? 'amber' : 'ok'}
          />
          <StatusLine
            icon={<FileSignature className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
            label="Signed document"
            value={
              sub.physicalDoc.status === 'Not Required'
                ? 'Not required'
                : sub.physicalDoc.status === 'Pending'
                  ? 'Pending — signed paper not yet received'
                  : `${sub.physicalDoc.status}${sub.physicalDoc.fileName ? ` · "${sub.physicalDoc.fileName}"` : ''}${sub.physicalDoc.receivedBy ? ` · by ${sub.physicalDoc.receivedBy}` : ''}`
            }
            tone={sub.physicalDoc.status === 'Pending' ? 'amber' : 'ok'}
          />
        </div>

        {/* ── Mark signed paper received (teacher-side, when awaited) ── */}
        {sub.physicalDoc.status === 'Pending' && (
          <div className="rounded-lg border border-violet-500/30 bg-violet-500/[0.06] p-3 space-y-2">
            <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">Signed paper round-trip</p>
            <p className="text-[10px] text-muted-foreground">
              Print the blank form, collect the guardian&apos;s signature, then record the scan file name here.
              Verification is done by the school office.
            </p>
            <div className="flex items-center gap-2">
              <Input
                className="h-8 flex-1 text-xs"
                placeholder="e.g. jaipur-signed-rahul.pdf"
                value={docFile}
                onChange={(e) => setDocFile(e.target.value)}
                aria-label="Scan file name"
              />
              <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" disabled={!docFile.trim()} onClick={submitDocReceived}>
                <FileSignature className="h-3 w-3" /> Mark received
              </Button>
            </div>
          </div>
        )}

        {/* ── Filled official document preview + print/download ── */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="rounded-md bg-card shadow-sm overflow-hidden">
            <ApplicationPrintDocument
              app={app}
              sub={sub}
              notes={sub.reviewNotes}
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2.5">
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => printApplicationDocument()}>
              <Printer className="h-3 w-3" /> Print
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={() => downloadApplicationDocument(applicationDocFileName({ app, sub }))}>
              <Download className="h-3 w-3" /> Download
            </Button>
          </div>
        </div>

        {/* ── Decisions ── */}
        {decided ? (
          <div className="rounded-lg border border-border p-3 flex items-center gap-2">
            {sub.status === 'Approved'
              ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              : <XCircle className={cn('h-4 w-4 shrink-0', sub.status === 'Rejected' ? 'text-rose-600' : 'text-muted-foreground')} />}
            <p className="text-xs">
              {sub.status === 'Approved' && <>Approved{sub.reviewedBy ? ` by ${sub.reviewedBy}` : ''}{sub.reviewedAt ? ` · ${formatDate(sub.reviewedAt)}` : ''}.</>}
              {sub.status === 'Rejected' && <>Rejected{sub.reviewedBy ? ` by ${sub.reviewedBy}` : ''}{sub.reviewedAt ? ` · ${formatDate(sub.reviewedAt)}` : ''}.</>}
              {sub.status === 'Withdrawn' && <>Withdrawn by the student — no review action is possible.</>}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border p-3 space-y-2.5">
            {!pendingDecision ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <DecisionBtn label="Approve" tone="emerald" onClick={() => { setPendingDecision('approve'); setDecisionNote('') }}>
                    <UserCheck className="h-3.5 w-3.5" />
                  </DecisionBtn>
                  <DecisionBtn label="Request correction" tone="amber" onClick={() => { setPendingDecision('request_correction'); setDecisionNote('') }}>
                    <StickyNote className="h-3.5 w-3.5" />
                  </DecisionBtn>
                  <DecisionBtn label="Reject" tone="rose" onClick={() => { setPendingDecision('reject'); setDecisionNote('') }}>
                    <XCircle className="h-3.5 w-3.5" />
                  </DecisionBtn>
                </div>
                {(app.guardianConsent.required && !consentOk) || (app.payment.mode === 'Required' && pay.status !== 'Paid') ? (
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    Approval needs guardian consent{app.payment.mode === 'Required' ? ' and completed payment' : ''} —
                    the school office handles anything still outstanding; your attempt will be recorded honestly if requirements are unmet.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-xs font-semibold">
                  {pendingDecision === 'approve' ? 'Approve' : pendingDecision === 'reject' ? 'Reject' : 'Request correction from'}
                  {' '}{sub.studentName} — a note is required:
                </p>
                <Textarea
                  className="min-h-[64px] text-xs"
                  placeholder={
                    pendingDecision === 'approve'
                      ? 'e.g. Verified participation and documents — approved for the tour.'
                      : pendingDecision === 'reject'
                        ? 'e.g. Cannot participate due to attendance shortfall.'
                        : 'e.g. Emergency contact number looks incomplete — please re-enter and resubmit.'
                  }
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  aria-label="Decision note (required)"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setPendingDecision(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className={cn(
                      'h-8 text-[11px] gap-1.5',
                      pendingDecision === 'approve' && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                      pendingDecision === 'reject' && 'bg-rose-600 hover:bg-rose-700 text-white',
                      pendingDecision === 'request_correction' && 'bg-amber-600 hover:bg-amber-700 text-white',
                    )}
                    disabled={!decisionNote.trim()}
                    onClick={confirmDecision}
                  >
                    {pendingDecision === 'approve' ? <UserCheck className="h-3.5 w-3.5" /> : pendingDecision === 'reject' ? <XCircle className="h-3.5 w-3.5" /> : <StickyNote className="h-3.5 w-3.5" />}
                    Confirm {pendingDecision === 'approve' ? 'approval' : pendingDecision === 'reject' ? 'rejection' : 'correction request'}
                  </Button>
                </div>
              </>
            )}

            {/* Add note action */}
            <div className="flex items-center gap-2 pt-1 border-t border-dashed border-border">
              <Input className="h-8 flex-1 text-xs" placeholder="Add a non-blocking note…" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Review note" />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] gap-1"
                disabled={!note.trim()}
                onClick={() => {
                  addReviewNote(sub.id, note, actor, 'Teacher')
                  setNote('')
                  toast.success('Note added', { description: 'Visible in the submission record.' })
                }}
              >
                <StickyNote className="h-3 w-3" /> Note
              </Button>
            </div>
          </div>
        )}

        {/* ── Review trail ── */}
        {sub.reviewNotes.length > 0 && (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Review trail</p>
            {sub.reviewNotes.map((n) => (
              <div key={n.id} className="text-[11px] border-l-2 border-border pl-2.5 py-0.5">
                <span className="font-semibold">{n.role} ({n.by}):</span> {n.note}
                <span className="ml-1.5 text-muted-foreground">· {new Date(n.at).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Reviewing participation only — money is handled by the school office.</span>
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Record {sub.id}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Small building blocks ─────────────────────────────────────────────

function IdentityLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  )
}

function StatusLine({ icon, label, value, tone }: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  tone?: 'ok' | 'amber'
}) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2 text-xs">
      <span className={cn('shrink-0', tone === 'amber' ? 'text-amber-600' : 'text-muted-foreground')}>{icon}</span>
      <span className="text-muted-foreground shrink-0 max-w-[45%]">{label}</span>
      <span className={cn('ml-auto text-right font-medium min-w-0', tone === 'amber' && 'text-amber-700 dark:text-amber-400')}>{value}</span>
    </div>
  )
}

function DecisionBtn({ children, label, tone, onClick }: {
  children: React.ReactNode
  label: string
  tone: 'emerald' | 'amber' | 'rose'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 h-8 rounded-md border text-[11px] font-semibold transition-colors',
        tone === 'emerald' && 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10',
        tone === 'amber' && 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10',
        tone === 'rose' && 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10',
      )}
    >
      {children} {label}
    </button>
  )
}
