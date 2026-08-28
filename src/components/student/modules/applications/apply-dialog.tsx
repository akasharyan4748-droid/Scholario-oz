'use client'

/**
 * ApplyDialog — the student's fill → submit → pay flow for one application.
 *
 * Steps (inside ONE dialog):
 *   1. form     — read-only student particulars (canonical record snapshot) +
 *                 every configured form field rendered by type + guardian
 *                 consent (digital checkbox / physical-signature notice).
 *   2. payment  — shown after a successful submit (or resubmit with money
 *                 outstanding, or opened directly for an awaiting-payment
 *                 submission). Money moves ONLY through fee-store
 *                 recordPayment() bound to the application's Additional
 *                 Charge; cash lands as "Under Verification" for the
 *                 Principal to verify — never marked paid locally.
 *
 * Idempotency: re-submitting an already-submitted form returns
 * existingSubmissionId from the store — we surface "You already applied"
 * and close instead of creating a duplicate.
 */

import { useEffect, useState } from 'react'
import {
  Banknote, CheckCircle2, CreditCard, FileUp, Info, ShieldCheck, Trash2,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useApplicationsStore, deriveSubmissionPayment,
  type ApplicationFormField, type ApplicationSubmission, type SchoolApplication,
} from '@/lib/store/applications-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { school } from '@/lib/mock/school'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { addAuditEvent, type StudentIdentityPair } from './student'

type PayMode = 'UPI' | 'Cash'

interface ApplyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: SchoolApplication | null
  /** Display + canonical identity pair resolved by the module. */
  identity: StudentIdentityPair | null
  /** Present when fixing a 'Correction Required' submission. */
  existingSubmission?: ApplicationSubmission | null
  /** 'payment' skips straight to the payment step (awaiting-payment rows). */
  initialStep?: 'form' | 'payment'
}

type Answers = Record<string, string | string[] | boolean>
type Attachments = Record<string, { name: string; size: number }>
type Errors = Record<string, string>

const EM_DASH = ' — '

function splitEmergencyContact(value: Answers[string]): { name: string; phone: string } {
  if (typeof value === 'string' && value.includes(EM_DASH)) {
    const [name = '', phone = ''] = value.split(EM_DASH)
    return { name, phone }
  }
  return { name: '', phone: '' }
}

export function ApplyDialog({ open, onOpenChange, app, identity, existingSubmission = null, initialStep = 'form' }: ApplyDialogProps) {
  const [step, setStep] = useState<'form' | 'payment'>(initialStep)
  const [answers, setAnswers] = useState<Answers>({})
  const [attachments, setAttachments] = useState<Attachments>({})
  const [emergency, setEmergency] = useState<Record<string, { name: string; phone: string }>>({})
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState<PayMode | null>(null)
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null)

  const isFixMode = !!existingSubmission

  // ── Reset / prefill whenever the dialog opens for an application ──
  useEffect(() => {
    if (!open || !app) return
    setStep(initialStep)
    setErrors({})
    setSubmitting(false)
    setPaying(null)
    if (existingSubmission) {
      setAnswers({ ...existingSubmission.answers })
      setAttachments(existingSubmission.attachments ? { ...existingSubmission.attachments } : {})
      setEmergency(Object.fromEntries(
        app.formFields
          .filter((f) => f.type === 'emergency-contact')
          .map((f) => [f.id, splitEmergencyContact(existingSubmission.answers[f.id])]),
      ))
      setConsentAccepted(!!existingSubmission.consentGivenAt)
      setActiveSubmissionId(existingSubmission.id)
    } else {
      setAnswers({})
      setAttachments({})
      setEmergency(Object.fromEntries(
        app.formFields
          .filter((f) => f.type === 'emergency-contact')
          .map((f) => [f.id, { name: '', phone: '' }]),
      ))
      setConsentAccepted(false)
      setActiveSubmissionId(null)
    }
  }, [open, app, existingSubmission, initialStep])

  const amount = app?.payment.amount ?? 0
  const needsPayment = !!app && app.payment.mode !== 'None'

  const closeDialog = () => {
    onOpenChange(false)
  }

  // ── Validation (required fields + digital guardian consent) ──
  const validate = (): boolean => {
    if (!app) return false
    const errs: Errors = {}
    for (const f of app.formFields) {
      const v = answers[f.id]
      if (f.type === 'emergency-contact') {
        const { name, phone } = emergency[f.id] ?? { name: '', phone: '' }
        if (f.required && (!name.trim() || !phone.trim())) {
          errs[f.id] = 'Enter both a contact name and a phone number.'
        }
        continue
      }
      if (f.type === 'file') {
        if (f.required && !attachments[f.id]) errs[f.id] = 'Please attach a file.'
        continue
      }
      if (f.type === 'signature' || f.type === 'declaration') {
        if (f.required && v !== true) errs[f.id] = 'Tick the acknowledgement to continue.'
        continue
      }
      if (f.type === 'checkbox' || f.type === 'multiselect') {
        if (f.required && (!Array.isArray(v) || v.length === 0)) errs[f.id] = 'Pick at least one option.'
        continue
      }
      if (f.type === 'yesno') {
        if (f.required && typeof v !== 'boolean') errs[f.id] = 'Choose Yes or No.'
        continue
      }
      if (f.required && (typeof v !== 'string' || !v.trim())) {
        errs[f.id] = 'This field is required.'
      }
    }
    if (app.guardianConsent.required && app.guardianConsent.method === 'Digital' && !consentAccepted) {
      errs.consent = 'Guardian consent is required before submitting.'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast.error('Please complete the highlighted fields.')
      return false
    }
    return true
  }

  // ── Submit (or resubmit after corrections) ──
  const handleSubmit = () => {
    if (!app || !identity || submitting) return
    if (initialStep !== 'payment' && !validate()) return

    setSubmitting(true)

    if (isFixMode && existingSubmission) {
      const res = useApplicationsStore.getState().resubmitSubmission(
        existingSubmission.id,
        answers,
        Object.keys(attachments).length ? attachments : undefined,
        identity.canonical.name,
      )
      setSubmitting(false)
      if (!res.success) {
        toast.error(res.error ?? 'Could not resubmit.')
        return
      }
      const updated = useApplicationsStore.getState().submissions.find((s) => s.id === existingSubmission.id)
      const pay = updated ? deriveSubmissionPayment(app, updated) : null
      if (needsPayment && (!pay || pay.status === 'Not Paid')) {
        setActiveSubmissionId(existingSubmission.id)
        setStep('payment')
        toast.info('Corrections submitted — one more step: payment.')
      } else {
        toast.success('Corrections submitted for review.')
        closeDialog()
      }
      return
    }

    const res = useApplicationsStore.getState().submitApplication({
      applicationId: app.id,
      student: identity.canonical,
      answers,
      attachments: Object.keys(attachments).length ? attachments : undefined,
      consentAccepted,
      submittedByRole: 'Student',
    })

    if (res.success && res.existingSubmissionId) {
      // Idempotent hit — the store refused to duplicate. Be honest + close.
      setSubmitting(false)
      toast.info('You already applied', {
        description: 'A submission for this form already exists — nothing was duplicated.',
      })
      closeDialog()
      return
    }
    if (!res.success || !res.submission) {
      setSubmitting(false)
      toast.error(res.error ?? 'Submission failed.')
      return
    }

    if (needsPayment) {
      setActiveSubmissionId(res.submission.id)
      setStep('payment')
      setSubmitting(false)
      toast.success('Application submitted — complete the payment to finish.', {
        description: formatINR(amount),
      })
    } else {
      setSubmitting(false)
      toast.success('Application submitted.', {
        description: 'Track its status under My submissions.',
      })
      closeDialog()
    }
  }

  // ── Payment — the ONLY way money moves (canonical fee store) ──
  const runPayment = (mode: PayMode) => {
    if (!app || !identity || paying) return
    if (!app.payment.chargeId) return // guarded in the UI
    setPaying(mode)
    const res = useFeeStore.getState().recordPayment({
      studentId: identity.canonical.id,
      amount: app.payment.amount,
      mode,
      purpose: `Application: ${app.title}`,
      feeHead: app.payment.feeHeadLabel || app.title,
      collectedBy: 'Student Self-Service',
      additionalChargeId: app.payment.chargeId,
      applicationId: app.id,
      ...(mode === 'UPI' ? { referenceNo: `UPI-${Date.now()}` } : {}),
    })
    setPaying(null)
    if (!res.success || !res.transaction) {
      toast.error(res.error ?? 'Payment could not be recorded.')
      return
    }
    const receipt = res.transaction.receiptNo
    addAuditEvent({
      applicationId: app.id,
      submissionId: activeSubmissionId ?? undefined,
      ts: new Date().toISOString(),
      actor: identity.canonical.name,
      actorRole: 'Student',
      action: 'payment.completed',
      message: mode === 'Cash'
        ? `Cash ${formatINR(app.payment.amount)} recorded for "${app.title}" — receipt ${receipt}, awaiting verification by the Principal.`
        : `Paid ${formatINR(app.payment.amount)} online (UPI ref ${res.transaction.referenceNo ?? '—'}) for "${app.title}" — receipt ${receipt}.`,
    })
    if (mode === 'Cash') {
      toast.info('Recorded — awaiting cash verification by the Principal', {
        description: `Receipt ${receipt} · ${formatINR(app.payment.amount)} · ${app.title}`,
      })
    } else {
      toast.success(`Payment successful — receipt ${receipt}`, {
        description: `${formatINR(app.payment.amount)} paid for ${app.title}.`,
      })
    }
    closeDialog()
  }

  const skipPayment = () => {
    toast.info('Payment skipped for now', {
      description: 'You can pay anytime from My submissions.',
    })
    closeDialog()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog() }}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-hidden flex flex-col">
        {app && identity && (
          <>
            <DialogHeader className="text-left shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="text-base leading-snug">{app.title}</DialogTitle>
                  <DialogDescription className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{app.category}</Badge>
                    <span>Deadline {formatDate(app.deadline)}</span>
                    {needsPayment && <span>· {formatINR(amount)}{app.payment.mode === 'Optional' ? ' (optional)' : ''}</span>}
                  </DialogDescription>
                </div>
                {step === 'payment' && (
                  <Badge variant="outline" className="shrink-0 text-[9px] h-4 px-1.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    Payment
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {step === 'form' ? (
              <div className="min-h-0 flex-1 overflow-y-auto -mx-1 px-1 space-y-4">
                {/* ── Official document header (PART 9) — the form reads as a
                    real school-issued document, not a SaaS card. ── */}
                <div className="rounded-lg border border-border bg-card px-3.5 py-3">
                  <div className="flex items-start justify-between gap-3 border-b border-dashed border-border pb-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold tracking-tight text-foreground leading-tight">{school.name}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{school.affiliation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">Form No.</p>
                      <p className="text-[10px] font-mono font-semibold">APPF-{app.id.slice(-8).toUpperCase()}</p>
                      <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Session</p>
                      <p className="text-[10px] font-semibold">{app.academicYear}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground">Official Application Form · {app.category}</p>
                  <p className="text-sm font-bold leading-tight mt-0.5">{app.title}</p>
                  {app.sourceRef?.label && <p className="text-[10px] text-muted-foreground mt-0.5">for {app.sourceRef.label}</p>}
                </div>

                {app.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground border-l-2 border-border pl-3"><span className="font-semibold text-foreground">Instructions: </span>{app.description}</p>
                )}

                {/* ── Student particulars (read-only, canonical record) ── */}
                <section className="rounded-lg border border-border bg-muted/25 px-3.5 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">1. Student particulars</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <Particular label="Name" value={identity.canonical.name} />
                    <Particular label="Admission no." value={identity.canonical.admissionNo} mono />
                    <Particular label="Class / Section" value={`${identity.canonical.className} — ${identity.canonical.section}`} />
                    <Particular label="Guardian" value={identity.canonical.guardianName} />
                    <Particular label="Guardian phone" value={identity.canonical.guardianPhone} />
                  </div>
                  <p className="mt-2 text-[9.5px] text-muted-foreground">Taken from the school record — corrections go through the office.</p>
                </section>

                {/* ── Dynamic form fields, grouped into their logical
                    sections (PART 13) with continuing numbering ── */}
                {app.formFields.length > 0 && (
                  <>{(() => {
                    const groups = new Map<string, typeof app.formFields>()
                    for (const f of app.formFields) {
                      const key = f.section ?? 'Application Details'
                      const arr = groups.get(key) ?? []
                      arr.push(f)
                      groups.set(key, arr)
                    }
                    let sectionNo = 1
                    return Array.from(groups.entries()).map(([section, fields]) => {
                      sectionNo += 1
                      return (
                        <section key={section} className="space-y-3.5">
                          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{sectionNo}. {section}</p>
                          {fields.map((f) => (
                            <FieldRenderer
                              key={f.id}
                              field={f}
                              value={answers[f.id]}
                              attachment={attachments[f.id]}
                              emergency={emergency[f.id] ?? { name: '', phone: '' }}
                              error={errors[f.id]}
                              onAnswer={(v) => {
                                setAnswers((prev) => ({ ...prev, [f.id]: v }))
                                setErrors((prev) => { if (!prev[f.id]) return prev; const next = { ...prev }; delete next[f.id]; return next })
                              }}
                              onEmergency={(v) => {
                                setEmergency((prev) => ({ ...prev, [f.id]: v }))
                                setAnswers((prev) => ({ ...prev, [f.id]: [v.name.trim(), v.phone.trim()].filter(Boolean).join(EM_DASH) }))
                                setErrors((prev) => { if (!prev[f.id]) return prev; const next = { ...prev }; delete next[f.id]; return next })
                              }}
                              onAttachment={(file) => {
                                setAttachments((prev) => {
                                  const next = { ...prev }
                                  if (file) next[f.id] = { name: file.name, size: file.size }
                                  else delete next[f.id]
                                  return next
                                })
                                setErrors((prev) => { if (!prev[f.id]) return prev; const next = { ...prev }; delete next[f.id]; return next })
                              }}
                            />
                          ))}
                        </section>
                      )
                    })
                  })()}</>
                )}

                {/* ── Guardian consent ── */}
                {app.guardianConsent.required && (
                  <section className="rounded-lg border border-border px-3.5 py-3">
                    <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" /> Guardian consent
                    </p>
                    {app.guardianConsent.method === 'Digital' ? (
                      <label
                        className={cn(
                          'mt-2 flex items-start gap-2.5 rounded-md p-2 -m-2 cursor-pointer',
                          errors.consent && 'ring-1 ring-rose-300 rounded-md',
                        )}
                      >
                        <Checkbox
                          checked={consentAccepted}
                          onCheckedChange={(c) => {
                            setConsentAccepted(c === true)
                            setErrors((prev) => { if (!prev.consent) return prev; const next = { ...prev }; delete next.consent; return next })
                          }}
                          className="mt-0.5"
                          aria-label="Guardian consent"
                        />
                        <span className="text-xs leading-relaxed">
                          {app.guardianConsent.statement ?? 'I give consent for my ward to participate.'}
                          <span className="block text-[9.5px] text-muted-foreground mt-0.5">
                            Tick to record digital consent from the guardian.
                          </span>
                        </span>
                      </label>
                    ) : (
                      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
                        Consent captured by guardian signature on the printed form.
                      </p>
                    )}
                    {errors.consent && <p className="mt-1 text-[10px] font-medium text-rose-600">{errors.consent}</p>}
                  </section>
                )}

                {app.physicalSignatureRequired && (
                  <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
                    A physical signature is required — print the submitted form, sign it and hand it to the school office.
                  </p>
                )}
              </div>
            ) : (
              /* ── Payment step ── */
              <div className="min-h-0 flex-1 overflow-y-auto space-y-4 py-1">
                <div className="rounded-lg border border-border bg-muted/25 px-4 py-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Amount payable</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{formatINR(amount)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{app.payment.feeHeadLabel || app.title}</p>
                </div>

                {app.payment.chargeId ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button onClick={() => runPayment('UPI')} disabled={paying !== null} className="h-9">
                      <CreditCard className="h-3.5 w-3.5" /> Pay Online {formatINR(amount)}
                    </Button>
                    <Button onClick={() => runPayment('Cash')} disabled={paying !== null} variant="outline" className="h-9">
                      <Banknote className="h-3.5 w-3.5" /> Pay by Cash {formatINR(amount)}
                    </Button>
                  </div>
                ) : (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    This form is not linked to a fee-ledger charge yet, so self-service payment is unavailable. Please pay at the school office.
                  </p>
                )}

                <div className="space-y-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
                  <p>· Online payments confirm instantly with a receipt.</p>
                  <p>· Cash is recorded as <span className="font-medium text-foreground">Under Verification</span> — the Principal verifies it in the payments queue.</p>
                </div>

                {app.payment.mode === 'Optional' && (
                  <button
                    type="button"
                    onClick={skipPayment}
                    className="mx-auto block text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            )}

            <DialogFooter className="shrink-0 border-t border-border pt-3 mt-1">
              {step === 'form' ? (
                <>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={closeDialog} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-8 text-xs" onClick={handleSubmit} disabled={submitting}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {submitting ? 'Submitting…' : needsPayment ? `Submit & Pay ${formatINR(amount)}` : 'Submit Application'}
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={closeDialog}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Small pieces ───────────────────────────────────────────────────────

function Particular({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('truncate font-medium text-foreground', mono && 'font-mono text-[10.5px]')}>{value}</p>
    </div>
  )
}

function ErrorLine({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-[10px] font-medium text-rose-600">{msg}</p>
}

interface FieldRendererProps {
  field: ApplicationFormField
  value: Answers[string]
  attachment?: { name: string; size: number }
  emergency: { name: string; phone: string }
  error?: string
  onAnswer: (v: Answers[string]) => void
  onEmergency: (v: { name: string; phone: string }) => void
  onAttachment: (file: File | null) => void
}

function FieldRenderer({ field, value, attachment, emergency, error, onAnswer, onEmergency, onAttachment }: FieldRendererProps) {
  const toggleOption = (opt: string) => {
    const current = Array.isArray(value) ? value : []
    onAnswer(current.includes(opt) ? current.filter((o) => o !== opt) : [...current, opt])
  }

  return (
    <div>
      <Label className="text-xs font-medium">
        {field.label}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {field.helpText && <p className="mt-0.5 text-[10px] text-muted-foreground">{field.helpText}</p>}

      <div className="mt-1.5">
        {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
          <Input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onAnswer(e.target.value)}
            className="h-8 text-xs"
            aria-label={field.label}
          />
        )}

        {field.type === 'longtext' && (
          <Textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onAnswer(e.target.value)}
            rows={3}
            className="text-xs min-h-[64px]"
            aria-label={field.label}
          />
        )}

        {field.type === 'dropdown' && (
          <Select value={typeof value === 'string' ? value : ''} onValueChange={(v) => onAnswer(v)}>
            <SelectTrigger className="h-8 text-xs" aria-label={field.label}><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent className="z-[70]">
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === 'radio' && (
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={(v) => onAnswer(v)}
            className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1.5"
            aria-label={field.label}
          >
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-1.5 text-xs">
                <RadioGroupItem value={opt} className="h-3.5 w-3.5" />
                {opt}
              </label>
            ))}
          </RadioGroup>
        )}

        {(field.type === 'checkbox' || field.type === 'multiselect') && (
          <div className="flex flex-wrap gap-1.5">
            {(field.options ?? []).map((opt) => {
              const active = Array.isArray(value) && value.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt)}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {field.type === 'yesno' && (
          <RadioGroup
            value={typeof value === 'boolean' ? (value ? 'yes' : 'no') : ''}
            onValueChange={(v) => onAnswer(v === 'yes')}
            className="mt-0.5 flex gap-x-4"
            aria-label={field.label}
          >
            <label className="flex cursor-pointer items-center gap-1.5 text-xs">
              <RadioGroupItem value="yes" className="h-3.5 w-3.5" /> Yes
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs">
              <RadioGroupItem value="no" className="h-3.5 w-3.5" /> No
            </label>
          </RadioGroup>
        )}

        {field.type === 'file' && (
          attachment ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
              <span className="flex min-w-0 items-center gap-1.5 text-[11px]">
                <FileUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{attachment.name}</span>
                <span className="shrink-0 text-muted-foreground">({Math.max(1, Math.round(attachment.size / 1024))} KB)</span>
              </span>
              <button type="button" onClick={() => onAttachment(null)} aria-label="Remove file" className="shrink-0 text-muted-foreground hover:text-rose-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <input
              type="file"
              onChange={(e) => onAttachment(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer rounded-md border border-input bg-transparent px-2 py-1.5 text-[11px] file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-[11px] file:font-medium hover:file:bg-muted/70"
              aria-label={field.label}
            />
          )
        )}

        {field.type === 'emergency-contact' && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={emergency.name}
              onChange={(e) => onEmergency({ ...emergency, name: e.target.value })}
              placeholder="Contact name"
              className="h-8 text-xs"
              aria-label={`${field.label} — name`}
            />
            <Input
              value={emergency.phone}
              onChange={(e) => onEmergency({ ...emergency, phone: e.target.value })}
              placeholder="Phone number"
              className="h-8 text-xs"
              aria-label={`${field.label} — phone`}
            />
          </div>
        )}

        {field.type === 'signature' && (
          <div className="rounded-md border border-dashed border-border bg-muted/25 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Signed physically on the printed form.
            </p>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs">
              <Checkbox
                checked={value === true}
                onCheckedChange={(c) => onAnswer(c === true)}
                className="mt-px"
                aria-label={field.label}
              />
              I understand a physical signature is required
            </label>
          </div>
        )}

        {field.type === 'declaration' && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-dashed border-border px-3 py-2.5">
            <Checkbox
              checked={value === true}
              onCheckedChange={(c) => onAnswer(c === true)}
              className="mt-0.5"
              aria-label={field.label}
            />
            <span className="text-xs leading-relaxed">
              {field.label}
              {field.helpText && <span className="block text-[9.5px] text-muted-foreground mt-0.5">{field.helpText}</span>}
            </span>
          </label>
        )}
      </div>
      <ErrorLine msg={error} />
    </div>
  )
}
