'use client'

/**
 * ApplicationBuilder — the Principal's school-form composer.
 *
 * NOT a developer tool, NOT a wizard — one compact professional page with
 * quiet sections (Salary & Payroll benchmark):
 *   1. Basic info    — title / category / description / session
 *   2. Who           — target classes (+ optional section filter)
 *   3. Dates         — start · deadline · event date · lock date
 *   4. Participation — optional/mandatory · consent · approvals · signature
 *   5. Payment       — none | required | optional → links to Fee Management
 *   6. Questions     — click-to-add palette + reorderable field list with
 *                      inline editors
 *
 * Field rows follow chip recipes; inputs h-9/text-xs like fees pages.
 * Money config is deliberately frozen after publication (the linked
 * Additional Charge owns the amount) and the UI says so once.
 */

import { useMemo, useState } from 'react'
import {
  ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2, Type,
  AlignLeft, Hash, CalendarDays, ChevronsUpDown, ListChecks, CheckSquare,
  CircleDot, FileUp, PhoneCall, PenLine, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useApplicationsStore, FORM_SECTIONS, type SchoolApplication, type ApplicationFormField, type FormFieldType, type ApplicationCategory, type PaymentModeConfig } from '@/lib/store/applications-store'
import { useTeachersStore } from '@/lib/store/teachers-store'
import { useStudentsStore } from '@/lib/store/students-store'
import { ACADEMIC_CLASSES } from '@/lib/mock/academic/classes'
import { MoneyInput } from '../fees/money-input'
import { formatINR } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Category meta ─────────────────────────────────────────────────────

const CATEGORIES: Array<{ value: ApplicationCategory; label: string }> = [
  { value: 'Tour', label: 'Educational Tour' },
  { value: 'Trip', label: 'School Trip' },
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Competition', label: 'Competition' },
  { value: 'Camp', label: 'Camp' },
  { value: 'Event', label: 'Special Event' },
  { value: 'Exam Application', label: 'Exam Application' },
  { value: 'Board Form', label: 'Board-related Form' },
  { value: 'Transport', label: 'Transport Request' },
  { value: 'Activity', label: 'Special Activity' },
  { value: 'Custom', label: 'Custom Application' },
]

/** Stream variants (11 PCM/PCB…) collapse into single chips. */
const UNIQUE_CLASSES = (() => {
  const seen = new Set<string>()
  return ACADEMIC_CLASSES.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
})()

// ─── Field palette ─────────────────────────────────────────────────────

interface PaletteDef {
  type: FormFieldType
  label: string
  icon: typeof Type
  defaults: Partial<ApplicationFormField>
}

const PALETTE: PaletteDef[] = [
  { type: 'text', label: 'Text', icon: Type, defaults: { label: 'Short answer' } },
  { type: 'longtext', label: 'Long text', icon: AlignLeft, defaults: { label: 'Detailed answer' } },
  { type: 'number', label: 'Number', icon: Hash, defaults: { label: 'Number' } },
  { type: 'date', label: 'Date', icon: CalendarDays, defaults: { label: 'Date' } },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronsUpDown, defaults: { label: 'Choose an option', options: ['Option A', 'Option B'] } },
  { type: 'radio', label: 'Radio', icon: CircleDot, defaults: { label: 'Pick one', options: ['Option A', 'Option B'] } },
  { type: 'checkbox', label: 'Multi-tick', icon: ListChecks, defaults: { label: 'Select all that apply', options: ['Option A', 'Option B'] } },
  { type: 'multiselect', label: 'Multiple select', icon: ListChecks, defaults: { label: 'Multiple choice', options: ['Option A', 'Option B'] } },
  { type: 'yesno', label: 'Yes / No', icon: CheckSquare, defaults: { label: 'Yes or no question' } },
  { type: 'file', label: 'File upload', icon: FileUp, defaults: { label: 'Document upload', helpText: 'Scan/photo kept on record.' } },
  { type: 'emergency-contact', label: 'Emergency contact', icon: PhoneCall, defaults: { label: 'Emergency contact (name + phone)', section: 'Medical / Emergency Details' } },
  { type: 'signature', label: 'Signature slot', icon: PenLine, defaults: { label: 'Signature undertaking', helpText: 'Signed on the printed form.', section: 'Declaration' } },
  { type: 'declaration', label: 'Declaration tick', icon: ShieldCheck, defaults: { label: 'I confirm the information above is true', helpText: 'Tick to accept the declaration.', section: 'Declaration' } },
]

function fieldTypeMeta(t: FormFieldType): PaletteDef {
  return PALETTE.find((p) => p.type === t) ?? PALETTE[0]
}

// ─── Builder ───────────────────────────────────────────────────────────

export interface BuilderResult {
  title: string
  description?: string
  category: ApplicationCategory
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
  formFields: ApplicationFormField[]
}

function fromApp(app: SchoolApplication): BuilderResult {
  return {
    title: app.title,
    description: app.description,
    category: app.category,
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
    formFields: app.formFields.map((f) => ({ ...f })),
  }
}

interface Props {
  /** Editing an existing application vs creating a fresh draft. */
  editing?: SchoolApplication
  onClose: () => void
  onSaved: () => void
  /** TEACHER mode (PART 4/15): the creator is the in-charge — the ownership
   *  select is locked and saving goes through the teacher permission path. */
  teacherMode?: boolean
  fixedInCharge?: { id: string; name: string }
}

export function ApplicationBuilder({ editing, onClose, onSaved, teacherMode, fixedInCharge }: Props) {
  const createApplication = useApplicationsStore((s) => s.createApplication)
  const updateApplication = useApplicationsStore((s) => s.updateApplication)
  // In-charge options — canonical teachers registry (stable within session).
  const teachers = useTeachersOptions()
  const publishedMoneyLocked = editing?.status === 'Published'

  const [form, setForm] = useState<BuilderResult>(
    () => editing ? fromApp(editing) : ({
      title: '',
      description: '',
      category: 'Custom',
      targetClassIds: [],
      targetSectionNames: [],
      targetStudentIds: [],
      deadline: '',
      participation: 'Optional',
      guardianConsentRequired: false,
      guardianConsentMethod: 'Digital',
      consentStatement: '',
      teacherApprovalRequired: true,
      physicalSignatureRequired: false,
      inChargeTeacherId: fixedInCharge?.id,
      inChargeName: fixedInCharge?.name,
      paymentMode: 'None',
      paymentAmount: 0,
      paymentFeeHeadLabel: '',
      formFields: [],
    }),
  )
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null)

  const patch = (p: Partial<BuilderResult>) => setForm((f) => ({ ...f, ...p }))

  const toggleClass = (id: string) => {
    const next = form.targetClassIds.includes(id)
      ? form.targetClassIds.filter((c) => c !== id)
      : [...form.targetClassIds, id]
    patch({ targetClassIds: next })
  }

  const addField = (def: PaletteDef) => {
    const f = {
      ...def.defaults,
      id: `fld-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      type: def.type,
      required: false,
    } as ApplicationFormField
    patch({ formFields: [...form.formFields, f] })
    setExpandedFieldId(f.id)
  }

  const editField = (idx: number, p: Partial<ApplicationFormField>) => {
    const fields = form.formFields.map((f, i) => i === idx ? { ...f, ...p } : f)
    patch({ formFields: fields })
  }

  const moveField = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= form.formFields.length) return
    const fields = [...form.formFields]
    ;[fields[idx], fields[target]] = [fields[target], fields[idx]]
    patch({ formFields: fields })
  }

  const duplicateField = (idx: number) => {
    const src = form.formFields[idx]
    const copy = { ...src, id: `fld-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, label: `${src.label} (copy)` }
    const fields = [...form.formFields]
    fields.splice(idx + 1, 0, copy)
    patch({ formFields: fields })
  }

  const removeField = (idx: number) => {
    patch({ formFields: form.formFields.filter((_, i) => i !== idx) })
  }

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error('Give this application a title.')
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
    if (editing) {
      const res = updateApplication(editing.id, form, teacherMode ? (fixedInCharge?.name ?? '') : 'Dr. Ananya Iyer',
        teacherMode ? { actorRole: 'Teacher', teacherId: fixedInCharge?.id } : undefined)
      if (!res.success) {
        toast.error('Could not save changes', { description: res.error })
        return
      }
      toast.success('Changes saved')
      onSaved()
      return
    }
    const res = createApplication(form, teacherMode ? (fixedInCharge?.name ?? '') : 'Dr. Ananya Iyer',
      teacherMode ? { actorRole: 'Teacher', teacherId: fixedInCharge?.id } : undefined)
    if (!res.success || !res.application) {
      toast.error('Could not create application', { description: res.error })
      return
    }
    toast.success(teacherMode ? 'Draft created — submit it for Principal approval' : 'Draft created', {
      description: teacherMode
        ? 'Your form needs Principal approval before it can be published.'
        : `Open "${res.application.title}" to review, then Publish when ready.`,
    })
    onSaved()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground truncate">
            {editing ? `Edit — ${editing.title}` : 'New Application / Form'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {editing ? editing.status : 'Draft'}{publishedMoneyLocked ? ' · money configuration locked at publish' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-7 text-[11px]" onClick={handleSave}>
            {editing ? 'Save Changes' : 'Create Draft'}
          </Button>
        </div>
      </div>

      {/* 1 — Basic info */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Basic Information</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-1">
            <Label className="text-xs">Title</Label>
            <Input
              className="h-9 text-xs"
              placeholder='e.g. "Educational Tour — Jaipur"'
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => patch({ category: v as ApplicationCategory })}
            >
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[70]">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 space-y-1">
            <Label className="text-xs">Description shown to students &amp; guardians</Label>
            <Textarea
              className="min-h-[64px] text-xs"
              placeholder="What is it? What does the fee cover? Any rules?"
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
          {/* Specific students (§2B "applicable students where needed") —
              overrides class scoping when non-empty. */}
          <SpecificStudentsPicker
            selectedIds={form.targetStudentIds ?? []}
            onChange={(ids) => patch({ targetStudentIds: ids })}
          />
          {/* In-charge — in TEACHER mode this is locked to the signed-in
              teacher (store enforces ownership too). */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">In-charge teacher</Label>
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
              <Label className="text-xs">Start date <span className="text-muted-foreground">(optional)</span></Label>
              <Input type="date" className="h-9 text-xs" value={form.startDate ?? ''} onChange={(e) => patch({ startDate: e.target.value || undefined })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Submission deadline</Label>
              <Input type="date" className="h-9 text-xs" value={form.deadline} onChange={(e) => patch({ deadline: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Event date <span className="text-muted-foreground">(optional)</span></Label>
              <Input type="date" className="h-9 text-xs" value={form.eventDate ?? ''} onChange={(e) => patch({ eventDate: e.target.value || undefined })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lock date <span className="text-muted-foreground">(optional)</span></Label>
              <Input type="date" className="h-9 text-xs" value={form.lockDate ?? ''} onChange={(e) => patch({ lockDate: e.target.value || undefined })} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            After the deadline passes the application locks automatically — no new submissions, no edits. Records stay.
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
              <div className="space-y-1 pl-0">
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
          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Payment</p>
          <ToggleRow
            label="Charge for this application?"
            hint={
              form.paymentMode === 'None' ? 'Free form.'
                : form.paymentMode === 'Required' ? `Every applicant pays ${formatINR(form.paymentAmount)}.`
                  : 'Payment is offered; participation can exist without paying.'
            }
          >
            <Segmented
              value={form.paymentMode}
              options={['None', 'Required', 'Optional'] as const}
              labelFor={(o) => o === 'None' ? 'No Payment' : o === 'Required' ? 'Payment Required' : 'Optional Payment'}
              onChange={(v) => patch({ paymentMode: v, paymentAmount: v === 'None' ? 0 : Math.max(500, form.paymentAmount || 0) })}
            />
          </ToggleRow>
          {form.paymentMode !== 'None' && !publishedMoneyLocked && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Amount per student</Label>
                <MoneyInput value={form.paymentAmount} onChange={(v) => patch({ paymentAmount: v ?? 0 })} placeholder="2500" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ledger label</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder={form.title || 'Fee head label'}
                  value={form.paymentFeeHeadLabel}
                  onChange={(e) => patch({ paymentFeeHeadLabel: e.target.value })}
                />
              </div>
            </div>
          )}
          {publishedMoneyLocked && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-[10px] text-muted-foreground">
              Amount {formatINR(editing!.payment.amount)} · linked Additional Charge owns these numbers now — edit via a fresh draft only.
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            On publish this creates ONE additional charge in Fee Management bound to this application — payments land in the normal ledger, cash goes through verification. Nothing duplicates.
          </p>
        </div>
      </div>

      {/* 6 — Form questions */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Form Questions</p>
          {!publishedMoneyLocked && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{form.formFields.length} fields</Badge>
          )}
        </div>
        {!publishedMoneyLocked && (
          <div className="flex flex-wrap gap-1.5">
            {PALETTE.map((p) => (
              <button
                key={p.type}
                type="button"
                onClick={() => addField(p)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-3 w-3" /> {p.label}
              </button>
            ))}
          </div>
        )}

        {/* System-provided identity note */}
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
          Student particulars (name · admission no. · class/section · guardian details) are captured automatically at submission — no need to ask for them.
        </div>

        {form.formFields.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">Add questions using the chips above.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {form.formFields.map((f, idx) => {
              const expanded = expandedFieldId === f.id
              const Icon = fieldTypeMeta(f.type).icon
              const needsOptions = ['dropdown', 'radio', 'checkbox', 'multiselect'].includes(f.type)
              return (
                <div key={f.id}>
                  <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-500/10 ring-1 ring-slate-500/15 text-slate-600 dark:text-slate-300">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setExpandedFieldId(expanded ? null : f.id)}
                      aria-expanded={expanded}
                      disabled={publishedMoneyLocked}
                    >
                      <p className="text-xs font-medium truncate">{f.label || '(untitled question)'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {fieldTypeMeta(f.type).label}{needsOptions && f.options?.length ? ` · ${f.options.length} options` : ''}
                        {f.required ? ' · required' : ''}
                        {' · '}{f.section ?? 'Application Details'}
                      </p>
                    </button>
                    {!publishedMoneyLocked && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <IconBtn disabled={idx === 0} onClick={() => moveField(idx, -1)} label="Move up"><ChevronUp className="h-3 w-3" /></IconBtn>
                        <IconBtn disabled={idx === form.formFields.length - 1} onClick={() => moveField(idx, 1)} label="Move down"><ChevronDown className="h-3 w-3" /></IconBtn>
                        <IconBtn onClick={() => duplicateField(idx)} label="Duplicate"><Copy className="h-3 w-3" /></IconBtn>
                        <IconBtn danger onClick={() => removeField(idx)} label="Remove"><Trash2 className="h-3 w-3" /></IconBtn>
                      </div>
                    )}
                  </div>
                  {expanded && !publishedMoneyLocked && (
                    <div className="border-t border-border/60 bg-muted/20 px-3 py-3 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px]">Question / label</Label>
                          <Input className="h-8 text-xs" value={f.label} onChange={(e) => editField(idx, { label: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Required</Label>
                          <div className="flex items-center gap-2 h-8">
                            <Switch checked={f.required} onCheckedChange={(v) => editField(idx, { required: v })} />
                            <span className="text-[11px] text-muted-foreground">{f.required ? 'Must be answered' : 'Optional'}</span>
                          </div>
                        </div>
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px]">Help text</Label>
                          <Input className="h-8 text-xs" placeholder="Shown under the question" value={f.helpText ?? ''} onChange={(e) => editField(idx, { helpText: e.target.value || undefined })} />
                        </div>
                        {/* Section (PART 13) — logical grouping used by the
                            official online form + printed document. */}
                        <div className="sm:col-span-3 space-y-1.5">
                          <Label className="text-[11px]">Form section</Label>
                          <div className="flex flex-wrap gap-1">
                            {Array.from(new Set([...FORM_SECTIONS, f.section ?? 'Application Details'].filter(Boolean) as string[])).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => editField(idx, { section: s })}
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors',
                                  (f.section ?? 'Application Details') === s
                                    ? 'bg-foreground text-primary-foreground border-foreground'
                                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40',
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          <Input
                            className="h-8 text-xs max-w-xs"
                            placeholder="…or type a custom section name"
                            value={f.section ?? ''}
                            onChange={(e) => editField(idx, { section: e.target.value || undefined })}
                          />
                        </div>
                        {needsOptions && (
                          <div className="sm:col-span-3 space-y-1.5">
                            <Label className="text-[11px]">Options (one per line)</Label>
                            <Textarea
                              className="min-h-[56px] text-xs"
                              value={(f.options ?? []).join('\n')}
                              onChange={(e) => editField(idx, { options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {publishedMoneyLocked && (
          <p className="text-[10px] text-muted-foreground">Questions are read-only while submissions are open. Duplicate this draft to adjust the structure.</p>
        )}
      </div>
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
  /** Optional display-label override (money rows use friendlier text). */
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

function IconBtn({ children, onClick, disabled, label, danger }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  label: string
  danger?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-6 w-6 text-muted-foreground hover:text-foreground',
        danger && 'hover:text-rose-600',
      )}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  )
}

/** Live in-charge options come straight from the canonical teachers store.
 *  (zustand v5: select the raw array — derive via useMemo, never map in the
 *  selector or getSnapshot() returns a fresh ref every time and loops.) */
function useTeachersOptions(): Array<{ teacherId: string; name: string }> {
  const raw = useTeachersStore((s) => s.teachers)
  return useMemo(
    () => (raw ?? EMPTY_TEACHERS).slice(0, 60).map((t) => ({ teacherId: t.teacherId, name: t.name })),
    [raw],
  )
}

const EMPTY_TEACHERS: Array<{ teacherId: string; name: string }> = []

// ─── Specific-students picker (§2B) ────────────────────────────────────

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
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] hover:bg-muted/40 transition-colors',
                    on && 'bg-primary/5',
                  )}
                  aria-pressed={on}
                >
                  <span className="truncate font-medium">{s.name}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">{s.className}-{s.section} · {s.admissionNo}</span>
                </button>
              )
            })}
            {filtered.length === 0 && <p className="px-2.5 py-2 text-[11px] text-muted-foreground">No students match.</p>}
          </div>
          {selectedIds.length > 0 && (
            <div className="p-2 border-t border-border/60">
              <button type="button" onClick={() => onChange([])} className="text-[10px] text-muted-foreground hover:text-foreground underline">
                Clear selection ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
