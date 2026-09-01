'use client'

/**
 * TourSessionConfig — the "Use / Configure for Session" screen for the ONE
 * built-in form: Educational Tour — Parent Consent Form (TOUR-CONSENT-1 §2).
 *
 * This is NOT a form builder. The printed document is a fixed, ready-made
 * school template — only the information that genuinely changes per
 * session/tour is editable here:
 *   title · destination · tour dates · duration · fee (+ channel
 *   availability) · circular no./date · tour in-charge · accompanying
 *   staff · instructions · eligible classes · gender eligibility · deadline.
 *
 * The right pane shows the LIVE official A4 document updating as the office
 * types. Flow: Draft → Preview → Publish (Teachers submit for approval via
 * the existing teacher→Principal workflow; no new permission architecture).
 */

import { useMemo, useState } from 'react'
import {
  ArrowLeft, Bus, Check, CircleDot, Eye, FileDown, Printer, Rocket, Send, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  APPLICATION_TEMPLATES, useApplicationsStore,
  type SchoolApplication, type ApplicationCategory,
} from '@/lib/store/applications-store'
import { CURRENT_ACADEMIC_YEAR } from '@/lib/store/fee-store-data'
import { useTeachersStore } from '@/lib/store/teachers-store'
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
import { cn } from '@/lib/utils'
import { ApplicationPrintDocument, downloadApplicationDocument, printApplicationDocument } from './application-print'

type PayMode = 'Required' | 'Optional' | 'None'
type PayMethods = 'Online' | 'Cash' | 'Both'

interface FormState {
  title: string
  destination: string
  eventDate: string
  endDate: string
  duration: string
  circularNo: string
  circularDate: string
  inChargeTeacherId: string
  inChargeName: string
  accompanyingStaff: string
  description: string
  targetClassIds: string[]
  targetGenders: Array<'Male' | 'Female' | 'Other'>
  paymentMode: PayMode
  paymentMethods: PayMethods
  paymentAmount: number
  deadline: string
}

function defaults(): FormState {
  const t = APPLICATION_TEMPLATES.educational_tour
  return {
    title: 'Educational Tour',
    destination: '',
    eventDate: '',
    endDate: '',
    duration: '',
    circularNo: '',
    circularDate: '',
    inChargeTeacherId: '',
    inChargeName: '',
    accompanyingStaff: '',
    description: '',
    targetClassIds: [],
    targetGenders: [],
    paymentMode: 'Required',
    paymentMethods: 'Both',
    paymentAmount: t.defaultAmount,
    deadline: '',
  }
}

export function TourSessionConfig({
  editingId, onClose, onSaved, actorRole = 'Principal', teacherId,
}: {
  editingId?: string
  onClose: () => void
  onSaved: (id: string) => void
  actorRole?: 'Principal' | 'Teacher'
  teacherId?: string
}) {
  const applications = useApplicationsStore((s) => s.applications)
  const createApplication = useApplicationsStore((s) => s.createApplication)
  const updateApplication = useApplicationsStore((s) => s.updateApplication)
  const publishApplication = useApplicationsStore((s) => s.publishApplication)
  const submitForApproval = useApplicationsStore((s) => s.submitForApproval)
  const teachers = useTeachersStore((s) => s.teachers)
  const me = teachers.find((t) => t.id === teacherId)

  const existing = editingId ? applications.find((a) => a.id === editingId) : undefined
  const template = APPLICATION_TEMPLATES.educational_tour

  const [f, setF] = useState<FormState>(() => {
    if (!existing) return defaults()
    return {
      title: existing.title,
      destination: existing.destination ?? '',
      eventDate: existing.eventDate ?? '',
      endDate: existing.endDate ?? '',
      duration: existing.duration ?? '',
      circularNo: existing.circularNo ?? '',
      circularDate: existing.circularDate ?? '',
      inChargeTeacherId: existing.inChargeTeacherId ?? '',
      inChargeName: existing.inChargeName ?? '',
      accompanyingStaff: existing.accompanyingStaff ?? '',
      description: existing.description ?? '',
      targetClassIds: existing.targetClassIds,
      targetGenders: existing.targetGenders ?? [],
      paymentMode: existing.payment.mode,
      paymentMethods: existing.payment.methods ?? 'Both',
      paymentAmount: existing.payment.amount,
      deadline: existing.deadline || '',
    }
  })
  const [step, setStep] = useState<'draft' | 'preview'>('draft')
  const [savedId, setSavedId] = useState<string | undefined>(editingId)
  const [busy, setBusy] = useState(false)
  const patch = (p: Partial<FormState>) => setF((prev) => ({ ...prev, ...p }))

  const meName = actorRole === 'Teacher' ? (me?.name ?? 'Teacher') : 'Dr. Ananya Iyer'

  /** The LIVE synthesized application that drives the A4 preview. */
  const previewApp: SchoolApplication = useMemo(() => ({
    id: savedId ?? 'PREVIEW',
    title: f.title.trim() || 'Educational Tour',
    destination: f.destination.trim() || undefined,
    description: f.description.trim() || undefined,
    category: 'Tour' as ApplicationCategory,
    source: existing?.source ?? (actorRole === 'Teacher' ? 'Activity' : 'Custom'),
    templateKey: 'educational_tour',
    academicYear: existing?.academicYear ?? CURRENT_ACADEMIC_YEAR,
    targetClassIds: f.targetClassIds,
    targetGenders: f.targetGenders.length ? f.targetGenders : undefined,
    deadline: f.deadline || new Date().toISOString().slice(0, 10),
    eventDate: f.eventDate || undefined,
    endDate: f.endDate || undefined,
    duration: f.duration.trim() || undefined,
    circularNo: f.circularNo.trim() || undefined,
    circularDate: f.circularDate || undefined,
    participation: 'Optional',
    guardianConsent: { required: true, method: 'Physical Signature', statement: template.consentStatement },
    teacherApprovalRequired: true,
    physicalSignatureRequired: true,
    inChargeTeacherId: f.inChargeTeacherId || undefined,
    inChargeName: f.inChargeName || undefined,
    accompanyingStaff: f.accompanyingStaff.trim() || undefined,
    payment: {
      mode: f.paymentMode,
      amount: f.paymentAmount,
      feeHeadLabel: f.title.trim() || template.defaultLedgerLabel,
      ...(existing?.payment.chargeId ? { chargeId: existing.payment.chargeId } : {}),
      methods: f.paymentMethods,
    },
    formFields: existing?.formFields ?? template.fields.map((x) => ({ ...x })),
    status: existing?.status ?? 'Draft',
    createdBy: existing?.createdBy ?? meName,
    createdByRole: actorRole,
    approvalNotes: existing?.approvalNotes ?? [],
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [f, savedId, existing, template, actorRole, meName])

  const validate = (): string | null => {
    if (!f.title.trim()) return 'Give the tour a title.'
    if (f.targetClassIds.length === 0) return 'Pick at least one eligible class.'
    if (!f.deadline) return 'Set the last date to submit consent.'
    if (f.paymentMode !== 'None' && f.paymentAmount <= 0) return 'Enter the tour fee per student.'
    return null
  }

  const saveDraft = (): { ok: boolean; id?: string } => {
    const err = validate()
    if (err) { toast.error(err); return { ok: false } }
    const input = {
      title: f.title.trim(),
      destination: f.destination.trim() || undefined,
      description: f.description.trim() || undefined,
      category: 'Tour' as const,
      templateKey: 'educational_tour' as const,
      targetClassIds: f.targetClassIds,
      targetGenders: f.targetGenders.length ? f.targetGenders : undefined,
      deadline: f.deadline,
      eventDate: f.eventDate || undefined,
      endDate: f.endDate || undefined,
      duration: f.duration.trim() || undefined,
      circularNo: f.circularNo.trim() || undefined,
      circularDate: f.circularDate || undefined,
      accompanyingStaff: f.accompanyingStaff.trim() || undefined,
      participation: 'Optional' as const,
      guardianConsentRequired: true,
      guardianConsentMethod: 'Physical Signature' as const,
      consentStatement: template.consentStatement,
      teacherApprovalRequired: true,
      physicalSignatureRequired: true,
      inChargeTeacherId: f.inChargeTeacherId || undefined,
      inChargeName: f.inChargeName || undefined,
      paymentMode: f.paymentMode,
      paymentAmount: f.paymentAmount,
      paymentMethods: f.paymentMethods,
      paymentFeeHeadLabel: f.title.trim() || template.defaultLedgerLabel,
      formFields: template.fields.map((x) => ({ ...x })),
    }
    if (savedId) {
      const res = updateApplication(savedId, input, meName, { actorRole, teacherId })
      if (!res.success) { toast.error(res.error ?? 'Could not save.'); return { ok: false } }
      return { ok: true, id: savedId }
    }
    const res = createApplication(input, meName, { actorRole, teacherId })
    if (!res.success || !res.application) { toast.error(res.error ?? 'Could not save.'); return { ok: false } }
    setSavedId(res.application.id)
    return { ok: true, id: res.application.id }
  }

  const publish = () => {
    const id = saveDraft().id
    if (!id) return
    setBusy(true)
    try {
      const res = publishApplication(id, meName, { actorRole, teacherId })
      if (!res.success) { toast.error(res.error ?? 'Could not publish.'); return }
      toast.success('Tour published', { description: 'Eligible students have been notified — submissions are open.' })
      onSaved(id)
    } finally {
      setBusy(false)
    }
  }

  const submitForReview = () => {
    const id = saveDraft().id
    if (!id) return
    const res = submitForApproval(id, meName, 'Teacher', 'Tour consent form ready for review.', { teacherId })
    if (!res.success) { toast.error(res.error ?? 'Could not submit.'); return }
    toast.success('Sent to the Principal for approval')
    onSaved(id)
  }

  // ─── Step 2: full-width preview before publishing ───
  if (step === 'preview') {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => setStep('draft')}>
              <ArrowLeft className="h-3 w-3" /> Edit details
            </Button>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Preview — official A4 document
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline" size="sm" className="h-7 gap-1 text-[11px]"
              onClick={() => downloadApplicationDocument(`Educational-Tour-Consent-${(f.title || 'form').replace(/\W+/g, '-').slice(0, 32)}`)}
            >
              <FileDown className="h-3 w-3" /> Download
            </Button>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => printApplicationDocument()}>
              <Printer className="h-3 w-3" /> Print
            </Button>
            {actorRole === 'Principal' ? (
              <Button size="sm" className="h-7 gap-1 bg-emerald-600 text-[11px] text-white hover:bg-emerald-700" disabled={busy} onClick={publish}>
                <Rocket className="h-3 w-3" /> Publish now
              </Button>
            ) : (
              <Button size="sm" className="h-7 gap-1 bg-emerald-600 text-[11px] text-white hover:bg-emerald-700" disabled={busy} onClick={submitForReview}>
                <Send className="h-3 w-3" /> Submit for approval
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-muted/40 px-4 py-5">
          <div className="mx-auto w-fit rounded-sm border border-border bg-white shadow-md">
            <ApplicationPrintDocument app={previewApp} />
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 1: session setup + live A4 preview ───
  const label = 'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'
  const input = 'h-8 text-xs'

  return (
    <div className="flex h-full min-h-screen flex-col">
      {/* Header — fixed template identity + Draft → Preview → Publish */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={onClose}>
            <ArrowLeft className="h-3 w-3" /> Back
          </Button>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
            <Bus className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight">Educational Tour — Parent Consent Form</p>
            <p className="text-[10px] text-muted-foreground">Ready-made school template · set the session details, then publish</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">
            <CircleDot className="h-2.5 w-2.5" /> 1 · Draft
          </span>
          <span className="text-muted-foreground/50">→</span>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-muted-foreground">
            <Eye className="h-2.5 w-2.5" /> 2 · Preview
          </span>
          <span className="text-muted-foreground/50">→</span>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-muted-foreground">
            <Rocket className="h-2.5 w-2.5" /> 3 · Publish
          </span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        {/* ── Left: the session fields ── */}
        <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4">
          <section className="space-y-2.5">
            <p className={label}>Tour details</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2">
                <p className="mb-1 text-[10px] text-muted-foreground">Tour title</p>
                <Input className={input} value={f.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Educational Tour — Qutub Minar Heritage Walk" />
              </div>
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Destination</p>
                <Input className={input} value={f.destination} onChange={(e) => patch({ destination: e.target.value })} placeholder="Qutub Minar, New Delhi" />
              </div>
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Duration</p>
                <Input className={input} value={f.duration} onChange={(e) => patch({ duration: e.target.value })} placeholder="1 Day" />
              </div>
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Tour date</p>
                <DatePicker compact value={f.eventDate} onChange={(v) => patch({ eventDate: v })} placeholder="Select date" />
              </div>
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Return date <span className="normal-case text-muted-foreground/60">(if multi-day)</span></p>
                <DatePicker compact value={f.endDate} onChange={(v) => patch({ endDate: v })} placeholder="Same day" minDate={f.eventDate || undefined} />
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <p className={label}>Circular</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Circular / reference no.</p>
                <Input className={input} value={f.circularNo} onChange={(e) => patch({ circularNo: e.target.value })} placeholder="SCH/TOUR/2026-27/18" />
              </div>
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Circular date</p>
                <DatePicker compact value={f.circularDate} onChange={(v) => patch({ circularDate: v })} placeholder="Select date" />
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <p className={label}>Staff &amp; instructions</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Teacher / Tour in-charge</p>
                <select
                  className={cn(input, 'w-full rounded-md border border-input bg-background px-2')}
                  value={f.inChargeTeacherId}
                  onChange={(e) => {
                    const t = teachers.find((x) => x.id === e.target.value)
                    patch({ inChargeTeacherId: e.target.value || '', inChargeName: t?.name ?? '' })
                  }}
                >
                  <option value="">Select teacher…</option>
                  {teachers.filter((t) => t.status === 'Active').map((t) => (
                    <option key={t.id} value={t.id}>{t.name} · {t.designation}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Accompanying staff</p>
                <Input className={input} value={f.accompanyingStaff} onChange={(e) => patch({ accompanyingStaff: e.target.value })} placeholder="Ms. Meera Nair · Mr. Arjun Khan" />
              </div>
              <div className="col-span-2">
                <p className="mb-1 text-[10px] text-muted-foreground">Short tour information / instructions</p>
                <Textarea className="min-h-[56px] text-xs" value={f.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Itinerary summary, what the fee covers, conduct rules…" />
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <p className={label}>Eligibility</p>
            <div>
              <p className="mb-1.5 text-[10px] text-muted-foreground">Applicable classes <span className="text-rose-500">*</span></p>
              <div className="flex flex-wrap gap-1.5">
                {ACADEMIC_CLASSES.map((c) => {
                  const on = f.targetClassIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => patch({ targetClassIds: on ? f.targetClassIds.filter((x) => x !== c.id) : [...f.targetClassIds, c.id] })}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition-colors',
                        on ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border text-muted-foreground hover:bg-muted/60',
                      )}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[10px] text-muted-foreground">Gender eligibility <span className="normal-case text-muted-foreground/60">(optional)</span></p>
              <div className="flex gap-1.5">
                {([['Any', []], ['Boys only', ['Male']], ['Girls only', ['Female']]] as const).map(([lab, val]) => {
                  const on = JSON.stringify(f.targetGenders) === JSON.stringify([...val])
                  return (
                    <button
                      key={lab}
                      type="button"
                      onClick={() => patch({ targetGenders: [...val] })}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition-colors',
                        on ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border text-muted-foreground hover:bg-muted/60',
                      )}
                    >
                      {lab}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <p className={label}>Payment</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Tour fee</p>
                <div className="flex gap-1.5">
                  {(['Required', 'Optional', 'None'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => patch({ paymentMode: m })}
                      className={cn(
                        'flex-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition-colors',
                        f.paymentMode === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border text-muted-foreground hover:bg-muted/60',
                      )}
                    >
                      {m === 'Required' ? 'Required' : m === 'Optional' ? 'Optional' : 'No fee'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] text-muted-foreground">Amount per student (₹)</p>
                <Input
                  className={input} type="number" min={0} disabled={f.paymentMode === 'None'}
                  value={f.paymentAmount || ''} onChange={(e) => patch({ paymentAmount: Number(e.target.value) || 0 })}
                  placeholder="2500"
                />
              </div>
              <div className="col-span-2">
                <p className="mb-1 text-[10px] text-muted-foreground">Payment availability</p>
                <div className="flex gap-1.5">
                  {(['Online', 'Cash', 'Both'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={f.paymentMode === 'None'}
                      onClick={() => patch({ paymentMethods: m })}
                      className={cn(
                        'flex-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition-colors disabled:opacity-40',
                        f.paymentMethods === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border text-muted-foreground hover:bg-muted/60',
                      )}
                    >
                      {m === 'Both' ? 'Online + Cash' : m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <p className={label}>Deadline</p>
            <div className="max-w-[220px]">
              <p className="mb-1 text-[10px] text-muted-foreground">Last date to submit consent <span className="text-rose-500">*</span></p>
              <DatePicker compact value={f.deadline} onChange={(v) => patch({ deadline: v })} placeholder="Select date" />
            </div>
          </section>
        </div>

        {/* ── Right: live official A4 preview ── */}
        <div className="hidden min-h-0 flex-col border-l border-border bg-muted/40 lg:flex">
          <div className="flex items-center justify-between border-b border-border bg-background px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live preview · official A4 document</p>
            <p className="text-[9px] text-muted-foreground">fixed template — layout cannot be changed</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="mx-auto w-fit origin-top scale-[0.78] rounded-sm border border-border bg-white shadow-md xl:scale-90">
              <ApplicationPrintDocument app={previewApp} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer — Draft → Preview → Publish */}
      <div className="flex items-center justify-between gap-2 border-t border-border bg-background px-4 py-2.5">
        <p className="hidden text-[10px] text-muted-foreground sm:block">
          The printed form is a fixed school template — only these session details change.
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 gap-1 text-[11px]" onClick={() => { const r = saveDraft(); if (r.ok) { toast.success('Draft saved'); onClose() } }}>
            <Check className="h-3 w-3" /> Save draft
          </Button>
          <Button size="sm" className="h-8 gap-1 text-[11px]" onClick={() => { const r = saveDraft(); if (r.ok) setStep('preview') }}>
            <Eye className="h-3 w-3" /> Preview &amp; publish
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={onClose} aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
