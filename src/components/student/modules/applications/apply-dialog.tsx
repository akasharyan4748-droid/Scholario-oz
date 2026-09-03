'use client'

/**
 * ApplyDialog — the student's Educational Tour application.
 *
 * POLISH-1 design contract: the ONLINE experience is deliberately DIFFERENT
 * from the printed A4 document — a premium, spacious, stepped application
 * flow (Tour → Student → Parent → Health → Consent → Review → Submit →
 * Payment), not a miniature of the official form.
 *
 *   • one clear step at a time, slim progress rail, touch-friendly inputs
 *   • student particulars are AUTO-FILLED from the school record (read-only)
 *   • the student only enters what the school genuinely needs: emergency
 *     contact, food preference, motion sickness, medical note
 *   • REVIEW before submit, with an Edit shortcut back into each section
 *     (edits never restart the form)
 *   • payment is optional per the tour rules: submitting without paying
 *     keeps the application as SUBMITTED — UNPAID (never rejected, never
 *     deleted); paying later upgrades the SAME submission
 *
 * MONEY RULE: payments go through fee-store recordPayment() only, bound to
 * the application's Additional Charge + applicationId — tour money is
 * separate from the student's annual fees and lands in the normal ledger.
 *
 * Idempotency: re-submitting an already-submitted form returns
 * existingSubmissionId from the store — we surface "You already applied"
 * and close instead of creating a duplicate.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Banknote, CheckCircle2, ChevronLeft, CreditCard, FileUp, Pencil, Trash2,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import {
  useApplicationsStore, deriveSubmissionPayment,
  type ApplicationFormField, type ApplicationSubmission, type SchoolApplication,
} from '@/lib/store/applications-store'
import { useFeeStore } from '@/lib/store/fee-store'
import { SignaturePad, signatureComplete, type SignatureValue } from '@/components/shared/signature-pad/signature-pad'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { addAuditEvent, type StudentIdentityPair } from './student'

type PayMode = 'UPI' | 'Cash'
type StepKey = 'tour' | 'student' | 'parent' | 'health' | 'consent' | 'review' | 'payment'

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

/** Editable wizard steps (payment lives outside the rail). */
const RAIL: { key: Exclude<StepKey, 'payment'>; label: string; hint: string }[] = [
  { key: 'tour', label: 'Tour', hint: 'Everything the school has announced about this tour.' },
  { key: 'student', label: 'Student', hint: 'Confirm your school record details.' },
  { key: 'parent', label: 'Parent', hint: 'Guardian details and an emergency contact for the trip.' },
  { key: 'health', label: 'Health', hint: 'Care information the escorting staff should know.' },
  { key: 'consent', label: 'Consent', hint: 'The guardian consent and signature.' },
  { key: 'review', label: 'Review', hint: 'Check everything, then submit.' },
]

function splitEmergencyContact(value: Answers[string]): { name: string; phone: string } {
  if (typeof value === 'string' && value.includes(EM_DASH)) {
    const [name = '', phone = ''] = value.split(EM_DASH)
    return { name, phone }
  }
  return { name: typeof value === 'string' ? value : '', phone: '' }
}

export function ApplyDialog({ open, onOpenChange, app, identity, existingSubmission = null, initialStep = 'form' }: ApplyDialogProps) {
  const [step, setStep] = useState<StepKey>(initialStep === 'payment' ? 'payment' : 'tour')
  const [answers, setAnswers] = useState<Answers>({})
  const [attachments, setAttachments] = useState<Attachments>({})
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [signature, setSignature] = useState<SignatureValue | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState<PayMode | null>(null)
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null)

  const isFixMode = !!existingSubmission

  const amount = app?.payment.amount ?? 0
  const needsPayment = !!app && app.payment.mode !== 'None'
  const isTour = !!app && (app.category === 'Tour' || app.category === 'Trip' || app.templateKey === 'educational_tour')
  const availability = app?.paymentAvailability ?? 'Both'

  // ── Field routing: which editable fields belong to which step ──
  const parentFields = useMemo(
    () => (app?.formFields ?? []).filter((f) => (f.section ?? '').toLowerCase().includes('parent') || (f.section ?? '').toLowerCase().includes('guardian')),
    [app],
  )
  const healthFields = useMemo(
    () => (app?.formFields ?? []).filter((f) => !parentFields.includes(f)),
    [app, parentFields],
  )
  const rail = useMemo(
    () => RAIL.filter((r) => (r.key === 'health' ? healthFields.length > 0 : true)),
    [healthFields.length],
  )
  const stepIndex = rail.findIndex((r) => r.key === step)
  const currentRail = rail[stepIndex]

  // ── Reset / prefill whenever the dialog opens for an application ──
  useEffect(() => {
    if (!open || !app) return
    setStep(initialStep === 'payment' ? 'payment' : 'tour')
    setErrors({})
    setSubmitting(false)
    setPaying(null)
    if (existingSubmission) {
      setAnswers({ ...existingSubmission.answers })
      setAttachments(existingSubmission.attachments ? { ...existingSubmission.attachments } : {})
      const em = splitEmergencyContact(existingSubmission.answers['t-emergency'])
      setEmergencyName(em.name)
      setEmergencyPhone(em.phone)
      setConsentAccepted(!!existingSubmission.consentGivenAt)
      setActiveSubmissionId(existingSubmission.id)
    } else {
      setAnswers({})
      setAttachments({})
      setEmergencyName('')
      setEmergencyPhone('')
      setConsentAccepted(false)
      setSignature(null)
      setActiveSubmissionId(null)
    }
  }, [open, app, existingSubmission, initialStep])

  const closeDialog = () => {
    onOpenChange(false)
  }

  const setAnswer = (id: string, v: Answers[string]) => {
    setAnswers((prev) => ({ ...prev, [id]: v }))
    setErrors((prev) => { if (!prev[id]) return prev; const next = { ...prev }; delete next[id]; return next })
  }

  // ── Validation — collected fresh per step, plain-English messages ──
  const collectErrors = (keys: StepKey[]): Errors => {
    if (!app) return {}
    const errs: Errors = {}
    for (const key of keys) {
      if (key === 'parent') {
        const emergencyField = parentFields.find((f) => f.id === 't-emergency')
        if (emergencyField?.required) {
          if (!emergencyName.trim()) errs['t-emergency-name'] = 'Enter the contact person’s name.'
          if (emergencyPhone.replace(/\D/g, '').length < 10) errs['t-emergency-phone'] = 'Enter a valid 10-digit mobile number.'
        }
        for (const f of parentFields) {
          if (f.id === 't-emergency') continue
          const v = answers[f.id]
          if (f.required && (v === undefined || v === '' || (Array.isArray(v) && v.length === 0))) {
            errs[f.id] = 'This field is required.'
          }
        }
      }
      if (key === 'health') {
        for (const f of healthFields) {
          const v = answers[f.id]
          if (f.type === 'yesno') {
            if (f.required && typeof v !== 'boolean') errs[f.id] = 'Please choose one.'
            continue
          }
          if (f.type === 'longtext' && !f.required) continue
          if (f.required && (v === undefined || v === '' || (Array.isArray(v) && v.length === 0))) {
            errs[f.id] = 'This field is required.'
          }
        }
      }
      if (key === 'consent') {
        if (app.guardianConsent.required && app.guardianConsent.method === 'Digital' && !consentAccepted) {
          errs.consent = 'Guardian consent is required before submitting.'
        }
        if (
          !isFixMode && app.guardianConsent.required && app.guardianConsent.method === 'Digital'
          && app.guardianConsent.signatureRequired !== false
          && !signatureComplete(signature)
        ) {
          errs.signature = 'Capture the guardian’s signature (draw or type) to continue.'
        }
      }
    }
    return errs
  }

  const validateStep = (key: StepKey): boolean => {
    const errs = collectErrors([key])
    setErrors((prev) => {
      const next = { ...prev, ...errs }
      for (const k of Object.keys(errs)) if (!errs[k]) delete next[k]
      return next
    })
    return Object.values(errs).some(Boolean) === false
  }

  // Full validation before the final submit — jumps to the first step that
  // still has errors so nothing is silently blocked.
  const validateAll = (): boolean => {
    const order: StepKey[] = ['parent', 'health', 'consent']
    const per = order.map((k) => collectErrors([k]))
    const all: Errors = Object.assign({}, ...per)
    setErrors(all)
    if (Object.keys(all).length === 0) return true
    for (let i = 0; i < order.length; i++) {
      if (Object.values(per[i]).some(Boolean)) { setStep(order[i]); break }
    }
    return false
  }

  const goNext = () => {
    if (!validateStep(step)) return
    const next = rail[stepIndex + 1]
    if (next) setStep(next.key)
  }

  const joinedEmergency = () => [emergencyName.trim(), emergencyPhone.trim()].filter(Boolean).join(EM_DASH)

  // ── Submit (or resubmit after corrections) — reached from review ──
  const handleSubmit = () => {
    if (!app || !identity || submitting) return
    if (initialStep !== 'payment' && !validateAll()) {
      toast.error('A few details are still missing.')
      return
    }

    setSubmitting(true)

    if (isFixMode && existingSubmission) {
      const res = useApplicationsStore.getState().resubmitSubmission(
        existingSubmission.id,
        { ...answers, 't-emergency': joinedEmergency() },
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
      answers: { ...answers, 't-emergency': joinedEmergency() },
      attachments: Object.keys(attachments).length ? attachments : undefined,
      consentAccepted,
      signature: signatureComplete(signature) ? signature ?? undefined : undefined,
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
      description: 'Your application stays on record — pay anytime from My submissions.',
    })
    closeDialog()
  }

  const paymentMethodNote =
    availability === 'Online' ? 'Online payment only'
      : availability === 'Cash' ? 'Cash at school only'
        : 'Pay online or cash at school — or pay later'

  // ── Step content ──
  const tourStep = (
    <div className="space-y-5">
      <StepHeading title="Tour information" hint={RAIL[0].hint} />
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <KV label="Destination" value={app?.destination ?? 'To be announced'} wide={!app?.destination} />
        <KV label={isTour ? 'Tour dates' : 'Event date'} value={app?.eventDate ? (app.tourEndDate ? `${formatDate(app.eventDate)} – ${formatDate(app.tourEndDate)}` : formatDate(app.eventDate)) : 'To be announced'} />
        <KV label="Duration" value={app?.durationDays || '—'} />
        <KV label="Last date to apply" value={app ? formatDate(app.deadline) : '—'} />
        <KV label={isTour ? 'Tour in-charge' : 'In-charge'} value={app?.inChargeName ?? 'To be assigned'} />
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
        <p className="text-[11px] text-muted-foreground">Fee per student</p>
        <p className="text-xl font-bold tabular-nums tracking-tight">{needsPayment ? formatINR(amount) : 'Free'}</p>
      </div>
      {app?.tourInstructions && (
        <p className="text-xs leading-relaxed text-muted-foreground border-l-2 border-border pl-3.5">{app.tourInstructions}</p>
      )}
    </div>
  )

  const studentStep = (
    <div className="space-y-5">
      <StepHeading title="Student details" hint={RAIL[1].hint} />
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <KV label="Name" value={identity?.canonical.name ?? ''} wide />
        <KV label="Admission no." value={identity?.canonical.admissionNo ?? ''} mono />
        <KV label="Class / section" value={identity ? `${identity.canonical.className} — ${identity.canonical.section}` : ''} />
        <KV label="Roll no." value={identity?.canonical.rollNo ?? ''} />
      </div>
      <p className="text-[11px] text-muted-foreground">Taken from the school record — corrections go through the office.</p>
    </div>
  )

  const parentStep = (
    <div className="space-y-5">
      <StepHeading title="Parent / guardian" hint={RAIL[2].hint} />
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <KV label="Guardian name" value={identity?.canonical.guardianName ?? ''} />
        <KV label="Guardian phone" value={identity?.canonical.guardianPhone ?? ''} mono />
      </div>
      <div className="space-y-2.5 border-t border-border pt-4">
        <Label className="text-xs font-medium">
          Emergency contact for the tour<span className="text-rose-500 ml-0.5">*</span>
        </Label>
        <p className="text-[11px] text-muted-foreground -mt-1">An adult reachable during the trip.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Input
              value={emergencyName}
              onChange={(e) => { setEmergencyName(e.target.value); setErrors((p) => ({ ...p, 't-emergency-name': '' })) }}
              placeholder="Contact name"
              aria-label="Emergency contact name"
              aria-invalid={!!errors['t-emergency-name']}
            />
            <FieldError msg={errors['t-emergency-name'] || undefined} />
          </div>
          <div className="space-y-1">
            <Input
              value={emergencyPhone}
              onChange={(e) => { setEmergencyPhone(e.target.value); setErrors((p) => ({ ...p, 't-emergency-phone': '' })) }}
              placeholder="Mobile number"
              inputMode="tel"
              aria-label="Emergency contact phone"
              aria-invalid={!!errors['t-emergency-phone']}
            />
            <FieldError msg={errors['t-emergency-phone'] || undefined} />
          </div>
        </div>
      </div>
      {/* any other parent-section fields (legacy non-tour forms) */}
      {parentFields.filter((f) => f.id !== 't-emergency').map((f) => (
        <SimpleField
          key={f.id}
          field={f}
          value={answers[f.id]}
          attachment={attachments[f.id]}
          error={errors[f.id]}
          onChange={(v) => setAnswer(f.id, v)}
          onAttachment={(file) => setAttachments((prev) => {
            const next = { ...prev }
            if (file) next[f.id] = { name: file.name, size: file.size }
            else delete next[f.id]
            return next
          })}
        />
      ))}
    </div>
  )

  const healthStep = (
    <div className="space-y-6">
      <StepHeading title="Health & care" hint={RAIL[3].hint} />
      {(() => {
        const meal = healthFields.find((f) => f.id === 't-meal')
        const motion = healthFields.find((f) => f.id === 't-motion')
        const medical = healthFields.find((f) => f.id === 't-medical')
        const others = healthFields.filter((f) => !['t-meal', 't-motion', 't-medical'].includes(f.id))
        return (
          <>
            {meal && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Food preference<span className="text-rose-500 ml-0.5">*</span>
                </Label>
                <Segmented
                  value={typeof answers['t-meal'] === 'string' ? answers['t-meal'] : ''}
                  options={(meal.options ?? []).map((o) => ({ value: o, label: o }))}
                  onChange={(v) => setAnswer('t-meal', v)}
                  ariaLabel="Food preference"
                />
                <FieldError msg={errors['t-meal']} />
              </div>
            )}
            {motion && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  {motion.label}<span className="text-rose-500 ml-0.5">*</span>
                </Label>
                <Segmented
                  two
                  value={answers['t-motion'] === undefined ? '' : answers['t-motion'] ? 'yes' : 'no'}
                  options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                  onChange={(v) => setAnswer('t-motion', v === 'yes')}
                  ariaLabel={motion.label}
                />
                <FieldError msg={errors['t-motion']} />
              </div>
            )}
            {medical && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">{medical.label}</Label>
                <Textarea
                  value={typeof answers['t-medical'] === 'string' ? answers['t-medical'] : ''}
                  onChange={(e) => setAnswer('t-medical', e.target.value)}
                  placeholder="Allergies, medication, doctor's advice…"
                  className="min-h-[72px]"
                  aria-label={medical.label}
                />
                <p className="text-[11px] text-muted-foreground">{medical.helpText}</p>
              </div>
            )}
            {others.map((f) => (
              <SimpleField
                key={f.id}
                field={f}
                value={answers[f.id]}
                attachment={attachments[f.id]}
                error={errors[f.id]}
                onChange={(v) => setAnswer(f.id, v)}
                onAttachment={(file) => setAttachments((prev) => {
                  const next = { ...prev }
                  if (file) next[f.id] = { name: file.name, size: file.size }
                  else delete next[f.id]
                  return next
                })}
              />
            ))}
          </>
        )
      })()}
    </div>
  )

  const consentStep = (
    <div className="space-y-5">
      <StepHeading title="Consent" hint={RAIL[4].hint} />
      {app?.guardianConsent.required && (
        <>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-muted/40 px-4 py-3.5">
            <Checkbox
              checked={consentAccepted}
              onCheckedChange={(c) => { setConsentAccepted(c === true); setErrors((p) => ({ ...p, consent: '' })) }}
              className="mt-0.5"
              aria-label="Guardian consent"
            />
            <span className="text-xs leading-relaxed font-medium">
              {app.guardianConsent.statement ?? 'I give consent for my ward to participate.'}
            </span>
          </label>
          <FieldError msg={errors.consent || undefined} />
          {app.guardianConsent.method === 'Digital'
            && app.guardianConsent.signatureRequired !== false && !isFixMode && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Guardian signature</Label>
              <SignaturePad
                value={signature}
                onChange={(v) => { setSignature(v); setErrors((p) => ({ ...p, signature: '' })) }}
                defaultSigner={identity?.canonical.guardianName}
                error={errors.signature || undefined}
              />
            </div>
          )}
        </>
      )}
      {app?.physicalSignatureRequired && (
        <p className="text-[11px] text-muted-foreground">
          After submitting, print the form from <span className="font-medium text-foreground">My submissions</span>, have the guardian sign it and hand it to the school office.
        </p>
      )}
    </div>
  )

  const reviewStep = (
    <div className="space-y-1">
      <StepHeading title="Review application" hint={RAIL[5].hint} />
      <div className="mt-2 -mx-1">
        {([
          {
            title: 'Tour', step: 'tour' as const, rows: [
              ['Tour', app?.title ?? ''],
              ['Destination', app?.destination ?? '—'],
              ['Dates', app?.eventDate ? (app?.tourEndDate ? `${formatDate(app.eventDate)} – ${formatDate(app.tourEndDate)}` : formatDate(app.eventDate)) : '—'],
              ['Fee', needsPayment ? formatINR(amount) : 'Free'],
            ] as [string, string][],
          },
          {
            title: 'Student', step: 'student' as const, rows: [
              ['Name', identity?.canonical.name ?? ''],
              ['Class', identity ? `${identity.canonical.className} — ${identity.canonical.section}` : ''],
              ['Admission no.', identity?.canonical.admissionNo ?? ''],
            ] as [string, string][],
          },
          {
            title: 'Parent / guardian', step: 'parent' as const, rows: [
              ['Guardian', identity?.canonical.guardianName ?? ''],
              ['Emergency contact', [emergencyName.trim(), emergencyPhone.trim()].filter(Boolean).join(EM_DASH) || '—'],
            ] as [string, string][],
          },
          {
            title: 'Health & care', step: 'health' as const, rows: [
              ['Food preference', typeof answers['t-meal'] === 'string' ? answers['t-meal'] : '—'],
              ['Motion sickness', answers['t-motion'] === undefined ? '—' : answers['t-motion'] ? 'Yes' : 'No'],
              ['Medical note', typeof answers['t-medical'] === 'string' && answers['t-medical'] ? answers['t-medical'] : 'None'],
            ] as [string, string][],
          },
          {
            title: 'Consent', step: 'consent' as const, rows: [
              ['Guardian consent', consentAccepted ? 'Given' : '—'],
              ['Signature', signatureComplete(signature)
                ? `${signature!.mode === 'drawn' ? 'Drawn' : 'Typed'} — ${signature!.signerName || identity?.canonical.guardianName || 'guardian'}`
                : 'Not required'],
            ] as [string, string][],
          },
          {
            title: 'Payment', step: null, rows: [
              ['Amount', needsPayment ? formatINR(amount) : 'Free'],
              ['Method', paymentMethodNote],
              ['Due', needsPayment ? 'Pay now or later — unpaid submissions stay recorded.' : '—'],
            ] as [string, string][],
          },
        ]).map((sec) => (
          <div key={sec.title} className="border-b border-border/70 last:border-b-0 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{sec.title}</p>
              {sec.step && (
                <button
                  type="button"
                  onClick={() => setStep(sec.step!)}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Edit ${sec.title}`}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {sec.rows.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground shrink-0">{k}</span>
                  <span className="text-xs font-medium text-right truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {app?.physicalSignatureRequired && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          After submitting, print the form from <span className="font-medium text-foreground">My submissions</span>, have the guardian sign it and hand it to the school office.
        </p>
      )}
    </div>
  )

  const paymentStep = (
    <div className="space-y-4">
      <StepHeading title="Payment" hint="Finish in one step, or pay later — your place is already recorded." />
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
        <p className="text-[11px] text-muted-foreground">{app?.payment.feeHeadLabel || app?.title}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight">{formatINR(amount)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Collected separately from annual school fees — linked to this application only.</p>
      </div>

      {app?.payment.chargeId ? (
        <div className="grid gap-2.5">
          {(availability === 'Both' || availability === 'Online') && (
            <PayOption
              onClick={() => runPayment('UPI')}
              disabled={paying !== null}
              busy={paying === 'UPI'}
              busyLabel="Processing…"
              icon={<CreditCard className="h-4 w-4" />}
              iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              title={`Pay online — ${formatINR(amount)}`}
              sub="UPI · instant confirmation with a receipt"
            />
          )}
          {(availability === 'Both' || availability === 'Cash') && (
            <PayOption
              onClick={() => runPayment('Cash')}
              disabled={paying !== null}
              busy={paying === 'Cash'}
              busyLabel="Recording…"
              icon={<Banknote className="h-4 w-4" />}
              iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              title={`Cash at school — ${formatINR(amount)}`}
              sub="Recorded now; the Principal verifies it in the payments queue"
            />
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          This form is not linked to a fee collection yet — please pay at the school office.
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Pay later is always fine — the application stays <span className="font-medium text-foreground">Submitted · payment pending</span> until paid.
      </p>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog() }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {app && identity && (
          <>
            <DialogHeader className="text-left shrink-0 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="text-base leading-snug">{app.title}</DialogTitle>
                  <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">{isTour ? 'Educational Tour' : 'School Form'}</Badge>
                    <span>Apply by {formatDate(app.deadline)}</span>
                    {needsPayment && <span>· {formatINR(amount)}</span>}
                  </DialogDescription>
                </div>
                {isFixMode && (
                  <Badge variant="outline" className="shrink-0 text-[9px] h-4 px-1.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    Correction
                  </Badge>
                )}
              </div>
              {/* slim progress rail (payment sits outside it) */}
              {step !== 'payment' && (
                <div>
                  <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={rail.length} aria-valuenow={stepIndex + 1} aria-label="Application progress">
                    {rail.map((r, i) => (
                      <button
                        key={r.key}
                        type="button"
                        disabled={i > stepIndex}
                        aria-label={`Step ${i + 1}: ${r.label}`}
                        onClick={() => { if (i <= stepIndex) setStep(r.key) }}
                        className="group flex-1 outline-none"
                      >
                        <span className={cn(
                          'block h-1 rounded-full transition-colors',
                          i < stepIndex ? 'bg-primary/60' : i === stepIndex ? 'bg-primary' : 'bg-border',
                        )} />
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Step {stepIndex + 1} of {rail.length} · <span className="font-medium text-foreground">{currentRail?.label}</span>
                  </p>
                </div>
              )}
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-0.5 py-1">
              {step === 'tour' && tourStep}
              {step === 'student' && studentStep}
              {step === 'parent' && parentStep}
              {step === 'health' && healthStep}
              {step === 'consent' && consentStep}
              {step === 'review' && reviewStep}
              {step === 'payment' && paymentStep}
            </div>

            <DialogFooter className="shrink-0 border-t border-border pt-3">
              {step === 'payment' ? (
                <div className="flex w-full items-center justify-between gap-2">
                  <button type="button" onClick={skipPayment} className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline">
                    Pay later
                  </button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={closeDialog}>Close</Button>
                </div>
              ) : step === 'review' ? (
                <>
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setStep(rail[Math.max(0, stepIndex - 1)].key)} disabled={submitting}>
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </Button>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSubmit} disabled={submitting}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {submitting ? 'Submitting…' : 'Submit Application'}
                  </Button>
                </>
              ) : (
                <>
                  {stepIndex > 0 && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setStep(rail[Math.max(0, stepIndex - 1)].key)}>
                      <ChevronLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                  )}
                  {step === 'tour' ? (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={closeDialog}>Cancel</Button>
                  ) : null}
                  <Button size="sm" className="h-8 text-xs" onClick={goNext}>Continue</Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Small pieces ───────────────────────────────────────────────────────

function StepHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}

function KV({ label, value, mono, wide }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <div className={cn('min-w-0', wide && 'col-span-2')}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('truncate text-sm font-medium', mono && 'font-mono text-[13px]')}>{value || '—'}</p>
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[10.5px] font-medium text-rose-600">{msg}</p>
}

function Segmented({ value, options, onChange, ariaLabel, two }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  ariaLabel: string
  /** two-option groups (Yes/No) stay 2-up at every width */
  two?: boolean
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('grid gap-1.5', two ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
      {options.map((o, i) => {
        const active = value === o.value
        const lastFull = !two && options.length === 3 && i === options.length - 1
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-9 min-w-0 truncate rounded-lg border px-2 text-[13px] font-medium transition-colors',
              lastFull && 'col-span-2 sm:col-span-1',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function PayOption({ onClick, disabled, busy, busyLabel, icon, iconClass, title, sub }: {
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  busyLabel: string
  icon: React.ReactNode
  iconClass: string
  title: string
  sub: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
    >
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconClass)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{sub}</span>
      </span>
      {busy && <span className="text-[11px] font-medium text-primary animate-pulse">{busyLabel}</span>}
    </button>
  )
}

/**
 * SimpleField — compact fallback renderer for editable fields that are not
 * one of the tour's premium controls (dropdown → select, yesno → segmented,
 * longtext → textarea, text/number → input, date → compact DatePicker,
 * emergency-contact → name + phone, file → compact upload chip).
 */
function SimpleField({ field, value, error, onChange, attachment, onAttachment }: {
  field: ApplicationFormField
  value: Answers[string]
  error?: string
  attachment?: { name: string; size: number }
  onChange: (v: Answers[string]) => void
  onAttachment?: (file: File | null) => void
}) {
  const emergencyParts = splitEmergencyContact(value)
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">
        {field.label}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {field.helpText && <p className="-mt-1 text-[11px] text-muted-foreground">{field.helpText}</p>}
      {field.type === 'emergency-contact' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            value={emergencyParts.name}
            onChange={(e) => onChange([e.target.value.trim(), emergencyParts.phone.trim()].filter(Boolean).join(EM_DASH))}
            placeholder="Contact name"
            aria-label={`${field.label} — name`}
          />
          <Input
            value={emergencyParts.phone}
            onChange={(e) => onChange([emergencyParts.name.trim(), e.target.value.trim()].filter(Boolean).join(EM_DASH))}
            placeholder="Mobile number"
            inputMode="tel"
            aria-label={`${field.label} — phone`}
          />
        </div>
      )}
      {field.type === 'file' && (
        attachment && onAttachment ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="flex min-w-0 items-center gap-1.5 text-xs">
              <FileUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">{attachment.name}</span>
              <span className="shrink-0 text-muted-foreground">({Math.max(1, Math.round(attachment.size / 1024))} KB)</span>
            </span>
            <button type="button" onClick={() => onAttachment(null)} aria-label="Remove file" className="shrink-0 text-muted-foreground hover:text-rose-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : onAttachment ? (
          <input
            type="file"
            onChange={(e) => onAttachment(e.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-md border border-input bg-transparent px-2.5 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium hover:file:bg-muted/70"
            aria-label={field.label}
          />
        ) : null
      )}
      {field.type === 'signature' && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-muted/40 px-4 py-3">
          <Checkbox checked={value === true} onCheckedChange={(c) => onChange(c === true)} className="mt-0.5" aria-label={field.label} />
          <span className="text-xs leading-relaxed">Signed physically on the printed form.</span>
        </label>
      )}
      {field.type === 'dropdown' && (
        <Select value={typeof value === 'string' ? value : ''} onValueChange={(v) => onChange(v)}>
          <SelectTrigger aria-label={field.label} className="h-9 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent className="z-[70]">
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt} className="text-sm">{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {field.type === 'yesno' && (
        <Segmented
          two
          value={value === undefined ? '' : value ? 'yes' : 'no'}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
          onChange={(v) => onChange(v === 'yes')}
          ariaLabel={field.label}
        />
      )}
      {field.type === 'longtext' && (
        <Textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[72px] text-sm"
          aria-label={field.label}
        />
      )}
      {(field.type === 'text' || field.type === 'number') && (
        <Input
          type={field.type === 'number' ? 'number' : 'text'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          aria-label={field.label}
        />
      )}
      {field.type === 'date' && (
        <DatePicker
          compact
          value={typeof value === 'string' ? value : ''}
          onChange={(v) => onChange(v)}
          placeholder="Select date"
        />
      )}
      {field.type === 'declaration' && (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-muted/40 px-4 py-3">
          <Checkbox checked={value === true} onCheckedChange={(c) => onChange(c === true)} className="mt-0.5" aria-label={field.label} />
          <span className="text-xs leading-relaxed">{field.label}</span>
        </label>
      )}
      {['checkbox', 'multiselect', 'radio'].includes(field.type) && (
        <div className="flex flex-wrap gap-1.5">
          {(field.options ?? []).map((opt) => {
            const active = field.type === 'radio' ? value === opt : Array.isArray(value) && value.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (field.type === 'radio') { onChange(opt); return }
                  const current = Array.isArray(value) ? value : []
                  onChange(active ? current.filter((o) => o !== opt) : [...current, opt])
                }}
                className={cn(
                  'h-8 rounded-full border px-3 text-xs font-medium transition-colors',
                  active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60',
                )}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}
      <FieldError msg={error} />
    </div>
  )
}
