'use client'

/**
 * ApplicationBuilder — the Principal's form composer (APPS-IA-1 GENERAL).
 *
 * The builder starts from a TEMPLATE (tour · workshop · sports consent ·
 * general blank) but every template is fully editable: questions can be
 * removed and new ones added (§28 basic builder — no Typeform clone).
 * Identity sections are always auto-filled from the school record.
 *
 * Sections (compact, Salary & Payroll benchmark):
 *   1. Form identity  — template picker (new forms) / title / description
 *   2. Who            — target classes (+ specific students override) + in-charge
 *   3. Dates          — start · deadline · event date · lock (compact DatePicker)
 *   4. Participation  — optional/mandatory · consent · approvals · signature
 *   5. Payment        — none | required | optional → LINK an existing
 *                      Additional Collection or create one at publish (§13)
 *   6. Form contents  — the questions (editable: remove + add)
 *
 * Money config is frozen after publication (the linked Additional Charge
 * owns the amount) and the UI says so once.
 */

import { useMemo, useState } from 'react'
import {
  useApplicationsStore, APPLICATION_TEMPLATES,
  type SchoolApplication, type ApplicationFormField, type PaymentModeConfig,
  type ApplicationTemplateKey, type FormPurpose,
} from '@/lib/store/applications-store'
import { useFeeStore, type AdditionalCharge } from '@/lib/store/fee-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useTeachersStore } from '@/lib/store/teachers-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
import { MoneyInput } from '../fees/money-input'
import { formatINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Bus, ClipboardList, FlaskConical, Lock, ShieldCheck, Trophy, Users, Plus, Trash2, FileText } from 'lucide-react'

/** Stream variants (11 PCM/PCB…) collapse into single chips. */
const UNIQUE_CLASSES = (() => {
  const seen = new Set<string>()
  return ACADEMIC_CLASSES.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
})()

/** Template picker visuals (APPS-IA-1 §7/§18 — tour is ONE type). */
const TEMPLATE_META: Array<{ key: ApplicationTemplateKey; icon: typeof Bus }> = [
  { key: 'educational_tour', icon: Bus },
  { key: 'workshop_registration', icon: FlaskConical },
  { key: 'sports_consent', icon: Trophy },
  { key: 'general_application', icon: ClipboardList },
]

// ─── Builder state ─────────────────────────────────────────────────────

export interface BuilderResult {
  title: string
  destination?: string
  description?: string
  category: SchoolApplication['category']
  templateKey: ApplicationTemplateKey
  formPurpose?: FormPurpose
  targetClassIds: string[]
  targetSectionNames: string[]
  targetStudentIds: string[]
  startDate?: string
  deadline: string
  eventDate?: string
  lockDate?: string
  participation: 'Optional' | 'Mandatory'
  guardianConsentRequired: boolean
  guardianConsentMethod: 'Digital' | 'Physical Signature'
  consentStatement?: string
  teacherApprovalRequired: boolean
  physicalSignatureRequired: boolean
  inChargeTeacherId?: string
  inChargeName?: string
  paymentMode: PaymentModeConfig
  paymentAmount: number
  paymentFeeHeadLabel: string
  /** Explicitly linked Additional Collection (§13) — empty = create at publish. */
  paymentChargeId?: string
  formFields: ApplicationFormField[]
}

const TEMPLATE = APPLICATION_TEMPLATES.educational_tour

function freshDraft(fixedInCharge?: { id: string; name: string }): BuilderResult {
  return {
    title: '',
    destination: '',
    description: '',
    category: TEMPLATE.category,
    templateKey: TEMPLATE.key,
    targetClassIds: [],
    targetSectionNames: [],
    targetStudentIds: [],
    deadline: '',
    participation: 'Optional',
    guardianConsentRequired: true,
    guardianConsentMethod: 'Digital',
    consentStatement: TEMPLATE.consentStatement,
    teacherApprovalRequired: true,
    physicalSignatureRequired: false,
    inChargeTeacherId: fixedInCharge?.id,
    inChargeName: fixedInCharge?.name,
    paymentMode: 'Required',
    paymentAmount: TEMPLATE.defaultAmount,
    paymentFeeHeadLabel: TEMPLATE.defaultLedgerLabel,
    formFields: TEMPLATE.fields.map((f) => ({ ...f })),
  }
}

function fromApp(app: SchoolApplication): BuilderResult {
  return {
    title: app.title,
    destination: app.destination,
    description: app.description,
    category: app.category,
    templateKey: app.templateKey ?? 'general_application',
    formPurpose: app.formPurpose,
    targetClassIds: app.targetClassIds,
    targetSectionNames: app.targetSectionNames ?? [],
    targetStudentIds: app.targetStudentIds ?? [],
    startDate: app.startDate,
    deadline: app.deadline,
    eventDate: app.eventDate,
    lockDate: app.lockDate,
    participation: app.participation,
    guardianConsentRequired: app.guardianConsent.required,
    guardianConsentMethod: app.guardianConsent.method,
    consentStatement: app.guardianConsent.statement,
    teacherApprovalRequired: app.teacherApprovalRequired,
    physicalSignatureRequired: app.physicalSignatureRequired,
    inChargeTeacherId: app.inChargeTeacherId,
    inChargeName: app.inChargeName,
    paymentMode: app.payment.mode,
    paymentAmount: app.payment.amount,
    paymentFeeHeadLabel: app.payment.feeHeadLabel,
    paymentChargeId: app.payment.chargeId,
    formFields: app.formFields.map((f) => ({ ...f })),
  }
}

interface Props {
  /** Editing an existing application vs creating a fresh draft. */
  editing?: SchoolApplication
  onClose: () => void
  onSaved: () => void
  /** TEACHER mode: the creator is the in-charge — the ownership select is
   *  locked and saving goes through the teacher permission path. */
  teacherMode?: boolean
  fixedInCharge?: { id: string; name: string }
}

export function ApplicationBuilder({ editing, onClose, onSaved, teacherMode, fixedInCharge }: Props) {
  const createApplication = useApplicationsStore((s) => s.createApplication)
  const updateApplication = useApplicationsStore((s) => s.updateApplication)
  const teachers = useTeachersOptions()
  const publishedMoneyLocked = editing?.status === 'Published'
  // PART 7 — structural safe-edit lock: a published form that has already
  // received responses must never silently change its question set (the
  // historical answers would dangle). Safe fields (title/description/
  // deadline) stay editable.
  const editingResponseCount = useApplicationsStore(
    (s) => (editing ? s.submissions.filter((sub) => sub.applicationId === editing.id && sub.status !== 'Withdrawn').length : 0),
  )
  const questionsLocked = editing?.status === 'Published' && editingResponseCount > 0

  const [form, setForm] = useState<BuilderResult>(() => editing ? fromApp(editing) : freshDraft(fixedInCharge))

  const patch = (p: Partial<BuilderResult>) => setForm((f) => ({ ...f, ...p }))

  // ── Template switching (new forms only): apply the template's defaults —
  // the Principal can then edit anything (§18: tour is just one type).
  const applyTemplate = (key: ApplicationTemplateKey) => {
    const t = APPLICATION_TEMPLATES[key]
    setForm((f) => ({
      ...f,
      category: t.category,
      templateKey: key,
      consentStatement: f.consentStatement === APPLICATION_TEMPLATES[f.templateKey].consentStatement ? t.consentStatement : f.consentStatement,
      paymentMode: t.defaultAmount > 0 ? f.paymentMode : 'None',
      paymentAmount: t.defaultAmount > 0 ? (f.paymentAmount || t.defaultAmount) : 0,
      paymentFeeHeadLabel: t.defaultLedgerLabel,
      destination: key === 'educational_tour' ? (f.destination ?? '') : '',
      formFields: t.fields.map((field) => ({ ...field })),
    }))
  }

  // ── §13 OPTIONAL LINKING: charges available to link — live or draft
  // collections that are NOT already the financial engine of another
  // published form (one charge, one live form — no duplicate money).
  const chargeCandidates = useChargeCandidates(editing)
  const [linkChoice, setLinkChoice] = useState<'create' | 'link'>(
    () => (editing?.payment.chargeId && chargeCandidates.some((c) => c.id === editing.payment.chargeId)) ? 'link' : 'create',
  )
  const linkedCharge = form.paymentChargeId ? chargeCandidates.find((c) => c.id === form.paymentChargeId) : undefined

  const chooseCharge = (id: string) => {
    const c = chargeCandidates.find((x) => x.id === id)
    if (!c) { patch({ paymentChargeId: undefined }); return }
    patch({
      paymentChargeId: c.id,
      paymentAmount: c.allowCustomAmount ? c.amount : c.amount,
      paymentFeeHeadLabel: c.name,
    })
  }

  const toggleClass = (id: string) => {
    const next = form.targetClassIds.includes(id)
      ? form.targetClassIds.filter((c) => c !== id)
      : [...form.targetClassIds, id]
    patch({ targetClassIds: next })
  }

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error('Give this form a title.')
      return
    }
    if (!form.targetClassIds.length && !form.targetStudentIds.length) {
      toast.error('Select at least one target class or specific students.')
      return
    }
    if (!form.deadline) {
      toast.error('Set a submission deadline.')
      return
    }
    if (form.paymentMode !== 'None' && !(form.paymentAmount > 0)) {
      toast.error('Enter the charge amount per student.')
      return
    }
    const actor = teacherMode ? (fixedInCharge?.name ?? '') : 'Dr. Ananya Iyer'
    const opts = teacherMode ? { actorRole: 'Teacher' as const, teacherId: fixedInCharge?.id } : undefined
    if (editing) {
      const res = updateApplication(editing.id, form, actor, opts)
      if (!res.success) {
        toast.error('Could not save changes', { description: res.error })
        return
      }
      toast.success('Changes saved')
      onSaved()
      return
    }
    const res = createApplication({ ...form, paymentChargeId: linkChoice === 'link' ? form.paymentChargeId : undefined }, actor, opts)
    if (!res.success || !res.application) {
      toast.error('Could not create the form', { description: res.error })
      return
    }
    toast.success(teacherMode ? 'Draft created — submit it for Principal approval' : 'Draft created', {
      description: teacherMode
        ? 'Your form needs Principal approval before it can be published.'
        : linkChoice === 'link' && form.paymentChargeId
          ? `Linked to the "${linkedCharge?.name ?? 'existing'}" collection — payments land there, never duplicated.`
          : `Open "${res.application.title}" to review, then Publish when ready.`,
    })
    onSaved()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-foreground truncate">
              {editing ? `Edit — ${editing.title}` : 'New Form'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {editing ? 'Applications, consent and registration — responses and payments stay separated.' : 'Start from a template — then edit anything.'}{publishedMoneyLocked ? ' · money configuration locked at publish' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-7 text-[11px]" onClick={handleSave}>
            {editing ? 'Save Changes' : 'Create Draft'}
          </Button>
        </div>
      </div>

      {/* 0 — Template picker (new forms only, §9/§18) */}
      {!editing && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">What is this form for?</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TEMPLATE_META.map(({ key, icon: Icon }) => {
              const t = APPLICATION_TEMPLATES[key]
              const selected = form.templateKey === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  aria-pressed={selected}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30',
                  )}
                >
                  <Icon className={cn('h-4 w-4', selected ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-xs font-semibold leading-tight">{t.label}</span>
                  <span className="text-[9.5px] text-muted-foreground leading-snug">{t.tagline}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            A template pre-fills sensible questions — every question stays editable below, and student particulars are always auto-filled from the school record.
          </p>
        </div>
      )}

      {/* 1 — Form identity */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Form Identity</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Form title</Label>
            <Input
              className="h-9 text-xs"
              placeholder='e.g. "Educational Tour — Jaipur" or "Sports Participation Consent"'
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          {form.category === 'Tour' || form.category === 'Trip' ? (
            <div className="space-y-1">
              <Label className="text-xs">Destination</Label>
              <Input
                className="h-9 text-xs"
                placeholder="e.g. Jaipur, Rajasthan"
                value={form.destination ?? ''}
                onChange={(e) => patch({ destination: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Form purpose</Label>
              <Select
                value={form.formPurpose ?? (form.templateKey === 'educational_tour' || form.templateKey === 'sports_consent' ? 'Consent' : form.templateKey === 'workshop_registration' ? 'Registration' : 'Application')}
                onValueChange={(v) => patch({ formPurpose: v as FormPurpose })}
              >
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[70]">
                  {(['Application', 'Consent', 'Registration', 'Permission', 'Information', 'Other'] as const).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="md:col-span-2 space-y-1">
            <Label className="text-xs">Description <span className="text-muted-foreground">(shown to applicants)</span></Label>
            <Textarea
              className="min-h-[60px] text-xs"
              placeholder={APPLICATION_TEMPLATES[form.templateKey].descriptionPlaceholder}
              value={form.description ?? ''}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 2 — Who + 3 — Dates side by side on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Who Can Apply</p>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {UNIQUE_CLASSES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleClass(c.id)}
                aria-pressed={form.targetClassIds.includes(c.id)}
                className={cn(
                  'px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors',
                  form.targetClassIds.includes(c.id)
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground',
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
          {form.targetClassIds.length > 0 && (
            <p className="text-[10px] text-muted-foreground">{form.targetClassIds.length} class{form.targetClassIds.length === 1 ? '' : 'es'} selected</p>
          )}
          <SpecificStudentsPicker
            selectedIds={form.targetStudentIds ?? []}
            onChange={(ids) => patch({ targetStudentIds: ids })}
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">Teacher in-charge</Label>
              {teacherMode ? (
                <Input className="h-9 text-xs" value={fixedInCharge?.name ?? ''} readOnly aria-label="In-charge (you)" />
              ) : (
                <Select
                  value={form.inChargeTeacherId ?? ''}
                  onValueChange={(v) => {
                    const t = teachers.find((x) => x.teacherId === v)
                    patch({ inChargeTeacherId: v || undefined, inChargeName: t?.name })
                  }}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Assign…" /></SelectTrigger>
                  <SelectContent className="z-[70] max-h-60">
                    {teachers.map((t) => (
                      <SelectItem key={t.teacherId} value={t.teacherId} className="text-xs">{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1 flex flex-col justify-end pb-0.5">
              <span className="text-[10px] text-muted-foreground">
                {teacherMode ? 'You are the in-charge — submissions appear under Application Reviews.' : 'Reviews submissions from their own account.'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Dates</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Opens <span className="text-muted-foreground">(applications open from)</span></Label>
              <DatePicker compact value={form.startDate ?? ''} onChange={(v) => patch({ startDate: v || undefined })} placeholder="Select date" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Submission deadline</Label>
              <DatePicker compact value={form.deadline} onChange={(v) => patch({ deadline: v })} placeholder="Select date" minDate={form.startDate || undefined} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{form.category === 'Tour' || form.category === 'Trip' ? 'Departure / tour date' : 'Event date'} <span className="text-muted-foreground">(optional)</span></Label>
              <DatePicker compact value={form.eventDate ?? ''} onChange={(v) => patch({ eventDate: v || undefined })} placeholder="Select date" minDate={form.startDate || undefined} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lock date <span className="text-muted-foreground">(optional)</span></Label>
              <DatePicker compact value={form.lockDate ?? ''} onChange={(v) => patch({ lockDate: v || undefined })} placeholder="Select date" minDate={form.deadline || form.startDate || undefined} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Chronology is enforced — the deadline can never precede the opening date, and the lock date never precedes the deadline. After the deadline passes the application locks automatically; records stay.
          </p>
        </div>
      </div>

      {/* 4 — Participation + 5 — Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Participation &amp; Approvals</p>
          <ToggleRow
            label="Participation"
            hint={form.participation === 'Optional' ? 'Students may opt out.' : 'All eligible students are expected to take part.'}
          >
            <Segmented
              value={form.participation}
              options={['Optional', 'Mandatory']}
              onChange={(v) => patch({ participation: v as 'Optional' | 'Mandatory' })}
            />
          </ToggleRow>
          <ToggleRow
            label="Guardian consent"
            hint={form.guardianConsentRequired ? 'Required before approval counts.' : 'Not needed for this form.'}
          >
            <Switch checked={form.guardianConsentRequired} onCheckedChange={(v) => patch({ guardianConsentRequired: v })} />
          </ToggleRow>
          {form.guardianConsentRequired && (
            <>
              <ToggleRow label="Consent method" hint="">
                <Segmented
                  value={form.guardianConsentMethod}
                  options={['Digital', 'Physical Signature']}
                  onChange={(v) => patch({
                    guardianConsentMethod: v as 'Digital' | 'Physical Signature',
                    physicalSignatureRequired: v === 'Physical Signature' ? true : form.physicalSignatureRequired,
                  })}
                />
              </ToggleRow>
              <div className="space-y-1">
                <Label className="text-xs">Consent statement</Label>
                <Textarea
                  className="min-h-[52px] text-xs"
                  placeholder="I permit my ward to participate…"
                  value={form.consentStatement ?? ''}
                  onChange={(e) => patch({ consentStatement: e.target.value })}
                />
              </div>
            </>
          )}
          <ToggleRow
            label="Teacher approval"
            hint={form.teacherApprovalRequired ? 'The assigned in-charge reviews each submission.' : 'Auto-submitted without review.'}
          >
            <Switch checked={form.teacherApprovalRequired} onCheckedChange={(v) => patch({ teacherApprovalRequired: v })} />
          </ToggleRow>
          <ToggleRow
            label="Physical signature / stamp flow"
            hint={form.physicalSignatureRequired ? 'Printable form carries signature + stamp areas; office verifies.' : 'No paper round-trip required.'}
          >
            <Switch checked={form.physicalSignatureRequired} onCheckedChange={(v) => patch({ physicalSignatureRequired: v })} />
          </ToggleRow>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Fee &amp; Collection</p>
          <ToggleRow
            label="Payment required?"
            hint={
              form.paymentMode === 'None' ? 'This form collects responses only — no money.'
                : form.paymentMode === 'Required' ? `Every applicant pays ${formatINR(form.paymentAmount)}.`
                  : 'Payment is offered; participation can exist without paying.'
            }
          >
            <Segmented
              value={form.paymentMode}
              options={['None', 'Required', 'Optional'] as const}
              labelFor={(o) => o === 'None' ? 'No' : o === 'Required' ? 'Yes' : 'Optional'}
              onChange={(v) => patch({ paymentMode: v, paymentAmount: v === 'None' ? 0 : Math.max(500, form.paymentAmount || 0) })}
            />
          </ToggleRow>
          {form.paymentMode !== 'None' && !publishedMoneyLocked && chargeCandidates.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Collection</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setLinkChoice('create'); patch({ paymentChargeId: undefined }) }}
                  aria-pressed={linkChoice === 'create'}
                  className={cn(
                    'rounded-lg border p-2.5 text-left transition-all',
                    linkChoice === 'create'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <p className="text-[11px] font-semibold">Create new collection</p>
                  <p className="text-[9.5px] text-muted-foreground mt-0.5">One charge is created in Fee Management when this form is published.</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setLinkChoice('link'); if (!form.paymentChargeId) chooseCharge(chargeCandidates[0].id) }}
                  aria-pressed={linkChoice === 'link'}
                  className={cn(
                    'rounded-lg border p-2.5 text-left transition-all',
                    linkChoice === 'link'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <p className="text-[11px] font-semibold">Link existing collection</p>
                  <p className="text-[9.5px] text-muted-foreground mt-0.5">Reuse a collection you already created — payments never duplicate.</p>
                </button>
              </div>
              {linkChoice === 'link' && (
                <Select value={form.paymentChargeId ?? ''} onValueChange={chooseCharge}>
                  <SelectTrigger className="h-9 text-xs" aria-label="Link an existing collection"><SelectValue placeholder="Pick a collection…" /></SelectTrigger>
                  <SelectContent className="z-[70] max-h-60">
                    {chargeCandidates.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} · {formatINR(c.amount)}{c.status === 'Draft' ? ' · draft' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {linkChoice === 'link' && linkedCharge && (
                <p className="text-[10px] text-muted-foreground">
                  Linked to <span className="font-medium text-foreground">{linkedCharge.name}</span> — {formatINR(linkedCharge.amount)} per student, due {formatDate(linkedCharge.dueDate)}.
                  {linkedCharge.status === 'Draft' ? ' Publishing this form publishes the collection too.' : ''} Payments recorded once, in Fee Management → Payments.
                </p>
              )}
            </div>
          )}
          {form.paymentMode !== 'None' && !publishedMoneyLocked && (linkChoice === 'create' || chargeCandidates.length === 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount per student</Label>
                <MoneyInput value={form.paymentAmount} onChange={(v) => patch({ paymentAmount: v ?? 0 })} placeholder="2500" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ledger label</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder={form.title || 'School Form'}
                  value={form.paymentFeeHeadLabel}
                  onChange={(e) => patch({ paymentFeeHeadLabel: e.target.value })}
                />
              </div>
            </div>
          )}
          {publishedMoneyLocked && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3 mt-0.5 shrink-0" />
              <span>Amount {formatINR(editing!.payment.amount)} — the linked collection owns these numbers now. Duplicate this draft to change them.</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            The form collects responses; the collection collects the money. Payments land in the normal fee ledger (cash goes through verification) and never touch the students&apos; annual fees. A form without payment works perfectly on its own.
          </p>
        </div>
      </div>

      {/* 6 — Form questions (editable §28: template pre-fills, Principal edits.
            PART 7: locked while a published form holds responses — the
            historical answers must never dangle) */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Form Questions</p>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">{form.formFields.length} question{form.formFields.length === 1 ? '' : 's'}</Badge>
        </div>
        {questionsLocked ? (
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[10px] text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold">Questions are locked</span> — {editingResponseCount} response{editingResponseCount === 1 ? '' : 's'} already
              received; removing or re-typing a question would invalidate them. Title, description, deadline and other safe
              details stay editable. Duplicate this form to build a new question set.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
            <Users className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Student particulars (name, admission no., class/section, guardian details) are captured
              automatically from the school record at submission — applicants never re-type them, and they cannot edit the master record here.
            </span>
          </div>
        )}
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {form.formFields.map((f) => {
            const options = f.options?.length ? ` · ${f.options.join(' / ')}` : ''
            return (
              <div key={f.id} className="flex items-start gap-2.5 px-3 py-2 group">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {f.section?.includes('Consent') ? <ShieldCheck className="h-3 w-3" /> : <ClipboardList className="h-3 w-3" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{f.label}{f.required && <span className="text-rose-500"> *</span>}</p>
                  <p className="text-[10px] text-muted-foreground">{f.section}{options}{f.helpText ? ` · ${f.helpText}` : ''}</p>
                </div>
                <Badge variant="outline" className="text-[8px] h-4 px-1.5 shrink-0 uppercase">{f.type === 'emergency-contact' ? 'name + phone' : f.type}</Badge>
                {!questionsLocked && (
                  <button
                    type="button"
                    onClick={() => patch({ formFields: form.formFields.filter((x) => x.id !== f.id) })}
                    className="shrink-0 h-6 w-6 rounded-md text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove question ${f.label}`}
                  >
                    <Trash2 className="h-3 w-3 mx-auto" />
                  </button>
                )}
              </div>
            )
          })}
          {form.formFields.length === 0 && (
            <p className="px-3 py-4 text-center text-[11px] text-muted-foreground">
              No questions yet — this form will collect only the auto-filled student particulars and the consent block.
            </p>
          )}
        </div>
        {!questionsLocked && <AddQuestionRow onAdd={(field) => patch({ formFields: [...form.formFields, field] })} />}
      </div>
    </div>
  )
}

// ─── §13 charge candidates — linkable collections ─────────────────────

function useChargeCandidates(editing?: SchoolApplication): AdditionalCharge[] {
  const charges = useFeeStore((s) => s.additionalCharges)
  const applications = useApplicationsStore((s) => s.applications)
  return useMemo(
    () => charges.filter((c) => {
      if (c.status !== 'Active' && c.status !== 'Draft') return false
      // A published form already owns this charge — do not offer it again.
      const owner = applications.find(
        (a) => a.payment.chargeId === c.id && a.status === 'Published' && a.id !== editing?.id,
      )
      return !owner
    }),
    [charges, applications, editing?.id],
  )
}

// ─── Add-question row (§28 basic builder — one compact row, not a studio) ─

const QUESTION_TYPES: Array<{ value: ApplicationFormField['type']; label: string }> = [
  { value: 'text', label: 'Short text' },
  { value: 'longtext', label: 'Long text' },
  { value: 'dropdown', label: 'Dropdown (choose one)' },
  { value: 'radio', label: 'Radio choices' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'phone', label: 'Phone number' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
]

function AddQuestionRow({ onAdd }: { onAdd: (field: ApplicationFormField) => void }) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<ApplicationFormField['type']>('text')
  const [required, setRequired] = useState(true)
  const [options, setOptions] = useState('')

  const needsOptions = type === 'dropdown' || type === 'radio'

  const add = () => {
    const trimmed = label.trim()
    if (!trimmed) { toast.error('Write the question first.'); return }
    if (needsOptions) {
      const opts = options.split(',').map((o) => o.trim()).filter(Boolean)
      if (opts.length < 2) { toast.error('Give at least two choices, comma-separated.'); return }
      onAdd({ id: `q-${Date.now().toString(36)}`, type, label: trimmed, required, options: opts, section: 'Additional Questions' })
    } else {
      onAdd({ id: `q-${Date.now().toString(36)}`, type, label: trimmed, required, section: 'Additional Questions' })
    }
    setLabel('')
    setOptions('')
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          className="h-8 text-xs flex-1"
          placeholder="Add a question — e.g. T-shirt size, dietary needs…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          aria-label="New question"
        />
        <Select value={type} onValueChange={(v) => setType(v as ApplicationFormField['type'])}>
          <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Question type"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[70]">
            {QUESTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0 cursor-pointer" aria-label="Required question">
          <input type="checkbox" className="h-3.5 w-3.5 accent-primary" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          Required
        </label>
        <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1 shrink-0" onClick={add}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      {needsOptions && (
        <Input
          className="h-8 text-xs"
          placeholder="Choices, comma-separated — e.g. S, M, L, XL"
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          aria-label="Question choices"
        />
      )}
    </div>
  )
}

// ─── Small shared bits ─────────────────────────────────────────────────

function ToggleRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Label className="text-xs">{label}</Label>
        {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Segmented<T extends string>({ value, options, onChange, labelFor }: {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  labelFor?: (o: T) => string
}) {
  return (
    <div className="inline-flex h-8 items-center rounded-full bg-muted/70 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            'px-2.5 h-7 rounded-full text-[11px] font-medium whitespace-nowrap transition-all',
            value === o ? 'bg-white dark:bg-white/10 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {labelFor ? labelFor(o) : o}
        </button>
      ))}
    </div>
  )
}

function useTeachersOptions(): Array<{ teacherId: string; name: string }> {
  const raw = useTeachersStore((s) => s.teachers)
  return useMemo(
    () => (raw ?? []).slice(0, 60).map((t) => ({ teacherId: t.teacherId, name: t.name })),
    [raw],
  )
}

// ─── Specific-students picker ──────────────────────────────────────────

type RosterRow = { id: string; name: string; className: string; section: string; admissionNo: string }

function useRosterLite(): RosterRow[] {
  const students = useStudentsStore((s) => s.students)
  return useMemo(
    () => students
      .filter((st) => st.status === 'Active')
      .map((st) => ({ id: st.id, name: st.name, className: st.className, section: st.section, admissionNo: st.admissionNo })),
    [students],
  )
}

function SpecificStudentsPicker({ selectedIds, onChange }: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const roster = useRosterLite()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const base = needle
      ? roster.filter((s) => s.name.toLowerCase().includes(needle) || s.admissionNo.toLowerCase().includes(needle))
      : roster
    return base.slice(0, 30)
  }, [roster, q])

  const selectedRows = useMemo(
    () => selectedIds
      .map((id) => roster.find((s) => s.id === id))
      .filter((s): s is RosterRow => !!s),
    [selectedIds, roster],
  )

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="pt-1 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">Specific students <span className="text-muted-foreground">(optional)</span></Label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] font-medium text-primary hover:underline"
          aria-expanded={open}
        >
          {open ? 'Hide list' : selectedIds.length ? `${selectedIds.length} selected — edit` : 'Pick students'}
        </button>
      </div>
      {selectedRows.length > 0 && !open && (
        <p className="text-[10px] text-muted-foreground truncate">
          Overrides classes: {selectedRows.map((s) => s.name).slice(0, 3).join(', ')}{selectedRows.length > 3 ? ` +${selectedRows.length - 3} more` : ''}
        </p>
      )}
      {open && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-2 border-b border-border/60">
            <Input className="h-8 text-xs" placeholder="Search name / admission no…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="max-h-40 overflow-y-auto custom-scrollbar divide-y divide-border/50">
            {filtered.map((s) => {
              const on = selectedIds.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  aria-pressed={on}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/40 transition-colors',
                    on && 'bg-primary/5',
                  )}
                >
                  <span className="min-w-0 truncate">{s.name} <span className="text-muted-foreground">· {s.className}-{s.section} · {s.admissionNo}</span></span>
                  <span className={cn('shrink-0 text-[10px] font-semibold', on ? 'text-primary' : 'text-muted-foreground/50')}>{on ? 'Selected' : 'Add'}</span>
                </button>
              )
            })}
            {filtered.length === 0 && <p className="px-3 py-3 text-[11px] text-muted-foreground text-center">No students match.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
