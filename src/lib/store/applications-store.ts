'use client'

/**
 * Applications & Forms store — the SCHOOL APPLICATION + CONSENT + EVENT +
 * PAYMENT + APPROVAL + DOCUMENT + RECORD system.
 *
 * A reusable foundation for every "form + student participation + optional/
 * mandatory fee + approval + printable document" workflow a school runs:
 *   tours · trips · workshops · competitions · camps · events · exam
 *   applications · board forms · transport requests · consent forms ·
 *   custom school applications.
 *
 * ARCHITECTURE (financial integration — CRITICAL):
 *   Publishing an application with payment Required/Optional creates (or
 *   reuses) ONE Additional Charge in the canonical Fee Management store —
 *   that charge is the ONLY financial obligation, and it is linked both ways:
 *
 *     SchoolApplication.payment.chargeId ──► AdditionalCharge.id
 *     (publish dedupe: reuses an existing Active charge with the same name,
 *      so seeded charges like 'Educational Tour — Jaipur' (AC-01) stay
 *      connected to their application instead of being duplicated)
 *
 *   Payments are ALWAYS recorded through fee-store.recordPayment() bound to
 *   that additionalChargeId — the SAME transaction then shows up in:
 *     • the Application record          (this store reads txns by chargeId)
 *     • the student's Fee Account       (charges appear automatically)
 *     • Fee Management → Payments       (cash verification queue unchanged)
 *     • Transactions ledger             (category = 'ADDITIONAL')
 *     • the receipt                     (genReceiptNo pipeline)
 *     • session permanent records       (audit trail in this store too)
 *   No duplicate financial entries are ever created. Cash payments enter as
 *   'Under Verification' and must pass the EXISTING Principal-only cash
 *   verification workflow before they count as paid. Teachers can review
 *   participation but this store structurally cannot move money.
 *
 * LIFECYCLE (workflow-driven, not cosmetic):
 *   Draft → Published → [Deadline passes ⇒ auto-Locked] / Closed / Archived
 *   Submission: Submitted → Under Review → Approved | Rejected |
 *               Correction Required (→ resubmit) ; Withdrawn by student.
 *   Approve guard: guardian consent satisfied AND payment complete when the
 *   form requires money. Editing stops once closed/locked/archived.
 *
 * PERMANENT RECORDS: submissions, audit history and printable documents are
 * never destroyed by closing/archiving/locking — archive only hides from the
 * main list; historical records remain readable forever within the academic
 * session they belong to.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useFeeStore } from './fee-store'
import { useStudentsStore } from '@/lib/store/students-store'
import type { AdditionalChargeCategory } from './fee-store-data'
import { CURRENT_ACADEMIC_YEAR } from './fee-store-data'

// ─── Types ─────────────────────────────────────────────────────────────

/** Rich application categories (broader than AdditionalCharge's coarse set). */
export type ApplicationCategory =
  | 'Tour' | 'Trip' | 'Workshop' | 'Competition' | 'Camp' | 'Event'
  | 'Exam Application' | 'Board Form' | 'Transport' | 'Activity' | 'Custom'

export type AppStatus = 'Draft' | 'Published' | 'Closed' | 'Archived'
export type ParticipationMode = 'Optional' | 'Mandatory'
export type PaymentModeConfig = 'None' | 'Required' | 'Optional'

/** Form field types supported by the builder. */
export type FormFieldType =
  | 'text' | 'longtext' | 'number' | 'date'
  | 'dropdown' | 'radio' | 'checkbox' | 'multiselect'
  | 'yesno' | 'file' | 'emergency-contact' | 'signature'

/**
 * One configurable field on a school form. The fill view ALWAYS renders the
 * student + guardian identity sections first (snapshotted from the school
 * record at submit time); `formFields` holds everything after them.
 */
export interface ApplicationFormField {
  id: string
  type: FormFieldType
  label: string
  helpText?: string
  required: boolean
  /** Option list for dropdown/radio/multiselect fields. */
  options?: string[]
}

export interface ApplicationPaymentConfig {
  mode: PaymentModeConfig
  /** Per-student amount (INR) when mode ≠ None. */
  amount: number
  /** Ledger label recorded on payments/receipts for this charge. */
  feeHeadLabel: string
  /**
   * AdditionalCharge id created/reused at publish time. Stable across the
   * whole lifecycle so payments never lose their connection.
   */
  chargeId?: string
}

export interface GuardianConsentConfig {
  required: boolean
  /** Digital checkbox during submission vs physical signature on paper. */
  method: 'Digital' | 'Physical Signature'
  statement?: string
}

/** Physical signed-document workflow state (§2I / §2J). */
export interface PhysicalDocState {
  status: 'Not Required' | 'Pending' | 'Received' | 'Verified'
  /** File name of the scanned/photo/PDF copy kept on record. */
  fileName?: string
  receivedAt?: string
  receivedBy?: string
  verifiedAt?: string
}

export interface SchoolApplication {
  id: string
  title: string
  description?: string
  category: ApplicationCategory
  academicYear: string
  /**
   * Who can apply. targetStudentIds overrides class scoping entirely when
   * non-empty ("applicable students where needed"); otherwise the union of
   * classes (+ optional section filter within those classes) applies.
   */
  targetClassIds: string[]
  targetSectionNames?: string[]
  targetStudentIds?: string[]
  publishDate?: string
  startDate?: string
  deadline: string          // final submission deadline (yyyy-mm-dd)
  eventDate?: string        // optional actual event date
  lockDate?: string         // optional hard lock independent of deadline
  participation: ParticipationMode
  guardianConsent: GuardianConsentConfig
  teacherApprovalRequired: boolean
  physicalSignatureRequired: boolean
  inChargeTeacherId?: string
  inChargeName?: string
  payment: ApplicationPaymentConfig
  formFields: ApplicationFormField[]
  status: AppStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type SubmissionWorkflowStatus =
  | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected'
  | 'Correction Required' | 'Withdrawn'

export interface ReviewNote {
  id: string
  at: string
  by: string
  role: 'Principal' | 'Teacher' | 'Office'
  note: string
  kind: 'note' | 'rejection' | 'correction' | 'approval'
}

export interface ApplicationSubmission {
  id: string
  applicationId: string
  /** Canonical students-store id used for ALL financial linkage. */
  studentId: string
  // Identity snapshot — permanent record stays truthful even if the roster
  // changes later. Never re-derive display info from live records here.
  studentName: string
  admissionNo: string
  className: string
  classId: string
  section: string
  guardianName: string
  guardianPhone: string
  answers: Record<string, string | string[] | boolean>
  /** Uploaded file metadata (name/size snapshot). */
  attachments?: Record<string, { name: string; size: number }>
  submittedAt: string
  submittedByRole: 'Student' | 'Guardian' | 'Office'
  /** Digital submissions use the online form; Office recordings are Physical. */
  mode: 'Digital' | 'Physical'
  status: SubmissionWorkflowStatus
  /** Timestamp when digital guardian consent was ticked. */
  consentGivenAt?: string
  physicalDoc: PhysicalDocState
  reviewNotes: ReviewNote[]
  reviewedBy?: string
  reviewedAt?: string
  resubmissionCount: number
  updatedAt: string
}

export interface ApplicationAuditEvent {
  id: string
  applicationId: string
  submissionId?: string
  ts: string
  actor: string
  actorRole: 'Principal' | 'Teacher' | 'Student' | 'Guardian' | 'System'
  action:
    | 'application.created' | 'application.updated' | 'application.published'
    | 'application.closed' | 'application.locked' | 'application.reopened'
    | 'application.archived' | 'application.duplicated' | 'application.note'
    | 'submission.recorded' | 'submission.submitted' | 'submission.resubmitted'
    | 'submission.approved' | 'submission.rejected' | 'submission.correction'
    | 'submission.withdrawn' | 'payment.initiated' | 'payment.completed'
    | 'doc.received' | 'doc.verified'
  message: string
}

// ─── Payment derivation (single source of truth = fee ledger) ──────────

export type DerivedPaymentStatus = 'Not Paid' | 'Awaiting Verification' | 'Paid' | 'Not Applicable'

export interface SubmissionPaymentInfo {
  status: DerivedPaymentStatus
  paidAmount: number
  expectedAmount: number
  receiptNos: string[]
  pendingReceiptNo: string | null
}

/**
 * Derives a submission's payment picture from the canonical ledger. Reads
 * transactions bound to the application's charge — the exact same rows the
 * Fees module renders. NOTHING is duplicated or recomputed here.
 */
export function deriveSubmissionPayment(
  app: SchoolApplication,
  sub: ApplicationSubmission,
): SubmissionPaymentInfo {
  const noPay: SubmissionPaymentInfo = {
    status: 'Not Applicable', paidAmount: 0, expectedAmount: 0, receiptNos: [], pendingReceiptNo: null,
  }
  if (!app.payment.chargeId || app.payment.mode === 'None') return noPay
  const { transactions } = useFeeStore.getState()
  const mine = transactions.filter(
    (t) => t.additionalChargeId === app.payment.chargeId && t.studentId === sub.studentId,
  )
  const success = mine.filter((t) => t.status === 'Success')
  const pending = mine.find((t) => t.status === 'Under Verification')
  return {
    status:
      success.length > 0 ? 'Paid'
        : pending ? 'Awaiting Verification'
          : 'Not Paid',
    paidAmount: success.reduce((s, t) => s + t.amount, 0),
    expectedAmount: app.payment.amount,
    receiptNos: success.map((t) => t.receiptNo),
    pendingReceiptNo: pending?.receiptNo ?? null,
  }
}

// ─── Lifecycle derivation ──────────────────────────────────────────────

/** Contextual badge state — workflow-driven, never cosmetic. */
export type EffectiveAppStatus =
  | 'Draft' | 'Scheduled' | 'Open' | 'Closing Soon' | 'Closed' | 'Locked' | 'Archived'

export function effectiveAppStatus(app: SchoolApplication, now: Date = new Date()): EffectiveAppStatus {
  if (app.status === 'Draft') return 'Draft'
  if (app.status === 'Archived') return 'Archived'
  if (app.status === 'Closed') return 'Closed'
  const today = now.toISOString().slice(0, 10)
  const hardLock = !!app.lockDate && today >= app.lockDate
  const pastDeadline = today > app.deadline
  if (hardLock || pastDeadline) return 'Locked'
  if (app.startDate && today < app.startDate) return 'Scheduled'
  const daysLeft = Math.ceil((new Date(app.deadline).getTime() - now.getTime()) / 86_400_000)
  return daysLeft <= 7 ? 'Closing Soon' : 'Open'
}

/** True when NEW submissions may be accepted right now. */
export function isSubmittable(app: SchoolApplication, now: Date = new Date()): boolean {
  const st = effectiveAppStatus(app, now)
  return st === 'Open' || st === 'Closing Soon'
}

/** Can the definition still be edited? Editing stops once closed/locked/archived. */
export function isApplicationEditable(app: SchoolApplication, now: Date = new Date()): boolean {
  const st = effectiveAppStatus(app, now)
  return st === 'Draft' || st === 'Open' || st === 'Closing Soon' || st === 'Scheduled'
}

/** Consent satisfied? Digital tick counts immediately; physical needs verification. */
export function isConsentSatisfied(app: SchoolApplication, sub: ApplicationSubmission): boolean {
  if (!app.guardianConsent.required) return true
  if (sub.consentGivenAt) return true
  if (app.guardianConsent.method === 'Physical Signature') {
    return sub.physicalDoc.status === 'Verified'
  }
  return false
}

/** The one contextual combined status shown in tables/badges. */
export type CombinedSubmissionStatus =
  | 'Submitted' | 'Awaiting Payment' | 'Awaiting Verification' | 'Paid · Under Review'
  | 'Under Review' | 'Approved' | 'Rejected' | 'Correction Required' | 'Withdrawn'
  | 'Physical Doc Pending' | 'Physical Doc Verification'

export function combinedSubmissionStatus(app: SchoolApplication, sub: ApplicationSubmission): CombinedSubmissionStatus {
  if (sub.status === 'Withdrawn') return 'Withdrawn'
  if (sub.status === 'Rejected') return 'Rejected'
  if (sub.status === 'Correction Required') return 'Correction Required'
  const pay = deriveSubmissionPayment(app, sub)
  if (pay.status === 'Awaiting Verification') return 'Awaiting Verification'
  if (sub.mode === 'Physical' && sub.physicalDoc.status === 'Pending') return 'Physical Doc Pending'
  if (sub.physicalDoc.status === 'Received') return 'Physical Doc Verification'
  if (sub.status === 'Approved') {
    // Approved but a required payment somehow missing (defensive) — surface honestly.
    if (pay.status === 'Not Paid' && app.payment.mode === 'Required') return 'Awaiting Payment'
    return 'Approved'
  }
  if (app.payment.mode === 'Required' && pay.status === 'Not Paid') return 'Awaiting Payment'
  if (sub.status === 'Under Review') return 'Under Review'
  return pay.status === 'Paid' ? 'Paid · Under Review' : 'Submitted'
}

// ─── Eligibility helpers ───────────────────────────────────────────────

export interface StudentLite {
  id: string
  admissionNo: string
  name: string
  className: string
  classId: string
  section: string
}

export function isEligibleForApplication(app: SchoolApplication, student: Pick<StudentLite, 'classId' | 'section' | 'id'>): boolean {
  if (app.status !== 'Published') return false
  if (app.targetStudentIds?.length) return app.targetStudentIds.includes(student.id)
  if (!app.targetClassIds.includes(student.classId)) return false
  if (app.targetSectionNames?.length) return app.targetSectionNames.includes(student.section)
  return true
}

// ─── Store contract ───────────────────────────────────────────────────

export interface CreateApplicationInput {
  title: string
  description?: string
  category: ApplicationCategory
  academicYear?: string
  targetClassIds: string[]
  targetSectionNames?: string[]
  targetStudentIds?: string[]
  publishDate?: string
  startDate?: string
  deadline: string
  eventDate?: string
  lockDate?: string
  participation: ParticipationMode
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

interface ApplicationsState {
  applications: SchoolApplication[]
  submissions: ApplicationSubmission[]
  audit: ApplicationAuditEvent[]

  createApplication: (input: CreateApplicationInput, actor: string) => { success: boolean; application?: SchoolApplication; error?: string }
  updateApplication: (id: string, patch: Partial<CreateApplicationInput>, actor: string) => { success: boolean; error?: string }
  publishApplication: (id: string, actor: string) => { success: boolean; error?: string; chargeCreated?: boolean }
  closeApplication: (id: string, actor: string, reason?: string) => void
  lockApplication: (id: string, actor: string, reason?: string) => void
  reopenApplication: (id: string, actor: string) => { success: boolean; error?: string }
  archiveApplication: (id: string, actor: string) => void
  duplicateApplication: (id: string, actor: string) => { success: boolean; application?: SchoolApplication }

  submitApplication: (input: {
    applicationId: string
    student: StudentSubmissionIdentity
    answers: Record<string, string | string[] | boolean>
    attachments?: Record<string, { name: string; size: number }>
    consentAccepted: boolean
    submittedByRole?: 'Student' | 'Guardian'
  }) => { success: boolean; submission?: ApplicationSubmission; existingSubmissionId?: string; error?: string }

  withdrawSubmission: (submissionId: string, actor: string) => { success: boolean; error?: string }
  resubmitSubmission: (submissionId: string, answers: Record<string, string | string[] | boolean>, attachments: Record<string, { name: string; size: number }> | undefined, actor: string) => { success: boolean; error?: string }
  reviewSubmission: (
    submissionId: string,
    decision: 'approve' | 'reject' | 'request_correction',
    note: string,
    actor: string,
    actorRole: 'Principal' | 'Teacher',
  ) => { success: boolean; error?: string }
  addReviewNote: (submissionId: string, note: string, actor: string, role: 'Principal' | 'Teacher' | 'Office') => void

  recordOfflineSubmission: (input: {
    applicationId: string
    student: StudentSubmissionIdentity
    attachmentName?: string
    recordedBy: string
    recorderRole: 'Principal' | 'Teacher' | 'Office'
  }) => { success: boolean; submission?: ApplicationSubmission; error?: string }
  markDocumentReceived: (submissionId: string, fileName: string, actor: string, recorderRole: 'Principal' | 'Teacher' | 'Office') => { success: boolean; error?: string }
  verifyPhysicalDocument: (submissionId: string, actor: string) => { success: boolean; error?: string }
}

/** Identity snapshot bundle used for submissions (offline + online). */
export interface StudentSubmissionIdentity extends StudentLite {
  guardianName: string
  guardianPhone: string
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function pushAudit(state: Pick<ApplicationsState, 'audit'>, ev: Omit<ApplicationAuditEvent, 'id'>): ApplicationAuditEvent[] {
  return [{ ...ev, id: newId('AEV') }, ...state.audit]
}

// ─── Coarse category mapping into Additional Charges vocabulary ────────

function chargeCategoryOf(c: ApplicationCategory): AdditionalChargeCategory {
  switch (c) {
    case 'Tour': case 'Trip': return 'Tour'
    case 'Workshop': return 'Workshop'
    case 'Competition': return 'Competition'
    case 'Camp': return 'Camp'
    case 'Transport': return 'Material' // closest coarse bucket available
    default: return 'Other'
  }
}

// ─── Store ─────────────────────────────────────────────────────────────

export const useApplicationsStore = create<ApplicationsState>()(
  persist(
    (set, get) => ({
      applications: SEED_APPLICATIONS(),
      submissions: [],
      audit: [],

      createApplication: (input, actor) => {
        const state = get()
        const trimmed = input.title.trim()
        if (!trimmed) return { success: false, error: 'Title is required.' }
        const year = input.academicYear ?? CURRENT_ACADEMIC_YEAR
        if (state.applications.some(
          (a) => a.academicYear === year && a.title.trim().toLowerCase() === trimmed.toLowerCase(),
        )) {
          return { success: false, error: `An application titled "${trimmed}" already exists this session.` }
        }
        const nowIso = new Date().toISOString()
        const app: SchoolApplication = {
          id: newId('APP'),
          title: trimmed,
          description: input.description?.trim() || undefined,
          category: input.category,
          academicYear: year,
          targetClassIds: [...input.targetClassIds],
          targetSectionNames: input.targetSectionNames?.length ? [...input.targetSectionNames] : undefined,
          targetStudentIds: input.targetStudentIds?.length ? [...input.targetStudentIds] : undefined,
          publishDate: input.publishDate,
          startDate: input.startDate,
          deadline: input.deadline,
          eventDate: input.eventDate,
          lockDate: input.lockDate,
          participation: input.participation,
          guardianConsent: {
            required: input.guardianConsentRequired,
            method: input.guardianConsentMethod,
            statement: input.consentStatement,
          },
          teacherApprovalRequired: input.teacherApprovalRequired,
          physicalSignatureRequired: input.physicalSignatureRequired,
          inChargeTeacherId: input.inChargeTeacherId || undefined,
          inChargeName: input.inChargeName || undefined,
          payment: {
            mode: input.paymentMode,
            amount: Math.max(0, input.paymentAmount),
            feeHeadLabel: input.paymentFeeHeadLabel.trim() || trimmed,
          },
          formFields: input.formFields.map((f) => ({ ...f })),
          status: 'Draft',
          createdBy: actor,
          createdAt: nowIso,
          updatedAt: nowIso,
        }
        set({
          applications: [app, ...state.applications],
          audit: pushAudit(state, {
            ts: nowIso, applicationId: app.id, actor, actorRole: 'Principal',
            action: 'application.created', message: `Application "${app.title}" created as draft.`,
          }),
        })
        return { success: true, application: app }
      },

      updateApplication: (id, patch, actor) => {
        const state = get()
        const app = state.applications.find((a) => a.id === id)
        if (!app) return { success: false, error: 'Application not found.' }
        if (!isApplicationEditable(app)) {
          return { success: false, error: `"${app.title}" is ${effectiveAppStatus(app)} — editing is locked. Historical data stays preserved.` }
        }
        const publishedLockedMoney = app.status === 'Published'
        const nowIso = new Date().toISOString()
        set({
          applications: state.applications.map((a) => a.id !== id ? a : {
            ...a,
            ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
            ...(patch.description !== undefined ? { description: patch.description.trim() || undefined } : {}),
            ...(patch.category !== undefined ? { category: patch.category } : {}),
            ...(patch.academicYear !== undefined ? { academicYear: patch.academicYear } : {}),
            ...(patch.targetClassIds !== undefined ? { targetClassIds: patch.targetClassIds } : {}),
            ...(patch.targetSectionNames !== undefined ? { targetSectionNames: patch.targetSectionNames.length ? patch.targetSectionNames : undefined } : {}),
            ...(patch.targetStudentIds !== undefined ? { targetStudentIds: patch.targetStudentIds.length ? patch.targetStudentIds : undefined } : {}),
            ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
            ...(patch.deadline !== undefined ? { deadline: patch.deadline } : {}),
            ...(patch.eventDate !== undefined ? { eventDate: patch.eventDate } : {}),
            ...(patch.lockDate !== undefined ? { lockDate: patch.lockDate } : {}),
            ...(patch.participation !== undefined ? { participation: patch.participation } : {}),
            ...(patch.guardianConsentRequired !== undefined || patch.guardianConsentMethod !== undefined || patch.consentStatement !== undefined ? {
              guardianConsent: {
                required: patch.guardianConsentRequired ?? a.guardianConsent.required,
                method: patch.guardianConsentMethod ?? a.guardianConsent.method,
                statement: patch.consentStatement ?? a.guardianConsent.statement,
              },
            } : {}),
            ...(patch.teacherApprovalRequired !== undefined ? { teacherApprovalRequired: patch.teacherApprovalRequired } : {}),
            ...(patch.physicalSignatureRequired !== undefined ? { physicalSignatureRequired: patch.physicalSignatureRequired } : {}),
            ...(patch.inChargeTeacherId !== undefined ? { inChargeTeacherId: patch.inChargeTeacherId || undefined } : {}),
            ...(patch.inChargeName !== undefined ? { inChargeName: patch.inChargeName || undefined } : {}),
            ...(patch.formFields !== undefined && !publishedLockedMoney ? { formFields: patch.formFields } : {}),
            updatedAt: nowIso,
            // NOTE: money config (mode/amount/label) intentionally NOT mutable
            // through update once published — the linked charge owns it.
            // Edit → duplicate the draft or close+recreate the application.
          }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: id, actor, actorRole: 'Principal',
            action: 'application.updated', message: `Application "${app.title}" updated.`,
          }),
        })
        return { success: true }
      },

      publishApplication: (id, actor) => {
        const state = get()
        const app = state.applications.find((a) => a.id === id)
        if (!app) return { success: false, error: 'Application not found.' }
        if (app.status !== 'Draft') return { success: false, error: `Already ${app.status.toLowerCase()} — publishing happens from Draft only.` }
        if (!app.deadline) return { success: false, error: 'Set a submission deadline before publishing.' }
        if (!app.targetClassIds.length && !app.targetStudentIds?.length) {
          return { success: false, error: 'Select at least one target class or specific students.' }
        }
        if (!app.formFields.length) {
          return { success: false, error: 'Add at least one question to the form.' }
        }
        if (app.payment.mode !== 'None' && app.payment.amount <= 0) {
          return { success: false, error: 'Enter the per-student charge amount.' }
        }
        const nowIso = new Date().toISOString()

        // FINANCIAL LINKAGE — reuse OR create exactly ONE Additional Charge.
        // Reuse rule: an Active charge with the same name + year exists (e.g.
        // seeded 'Educational Tour — Jaipur' AC-01) → link to IT so any
        // existing collection history stays attached. Never duplicates
        // obligations; never touches core fee structures.
        let chargeId = app.payment.chargeId
        let chargeCreated = false
        if (app.payment.mode !== 'None' && !chargeId) {
          const existing = useFeeStore.getState().additionalCharges.find(
            (c) => c.status === 'Active'
              && c.name.trim().toLowerCase() === app.title.trim().toLowerCase()
              && c.academicYear === app.academicYear,
          )
          if (existing) {
            chargeId = existing.id
          } else {
            const created = useFeeStore.getState().createAdditionalCharge({
              name: app.title,
              category: chargeCategoryOf(app.category),
              amount: app.payment.amount,
              academicYear: app.academicYear,
              applicableClassIds: app.targetClassIds.length ? app.targetClassIds : ['__DIRECT__'],
              studentIds: app.targetClassIds.length ? undefined : app.targetStudentIds,
              dueDate: app.deadline,
              mandatory: app.payment.mode === 'Required',
              description: app.description ?? app.title,
              reference: app.title,
            }, actor)
            if (!created.success || !created.charge) {
              return { success: false, error: created.error ?? 'Could not create the linked charge.' }
            }
            chargeId = created.charge.id
            chargeCreated = true
          }
        }

        set({
          applications: state.applications.map((a) => a.id !== id ? a : {
            ...a,
            status: 'Published' as const,
            publishDate: nowIso.slice(0, 10),
            updatedAt: nowIso,
            payment: { ...a.payment, chargeId },
          }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: id, actor, actorRole: 'Principal',
            action: 'application.published',
            message: `Application "${app.title}" published${chargeCreated ? ' — linked Additional Charge created' : chargeId ? ' — linked to existing Additional Charge' : ''}. Deadline ${app.deadline}.`,
          }),
        })
        return { success: true, chargeCreated }
      },

      closeApplication: (id, actor, reason) => {
        const state = get()
        const app = state.applications.find((a) => a.id === id)
        if (!app) return
        if (app.status !== 'Published') return
        const nowIso = new Date().toISOString()
        set({
          applications: state.applications.map((a) => a.id !== id ? a : { ...a, status: 'Closed', updatedAt: nowIso }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: id, actor, actorRole: 'Principal',
            action: 'application.closed', message: `Application "${app.title}" closed to new submissions${reason ? ` — ${reason}` : ''}. All records preserved.`,
          }),
        })
      },

      lockApplication: (id, actor, reason) => {
        const state = get()
        const app = state.applications.find((a) => a.id === id)
        if (!app) return
        const nowIso = new Date().toISOString()
        set({
          applications: state.applications.map((a) => a.id !== id ? a : { ...a, lockDate: nowIso.slice(0, 10), updatedAt: nowIso }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: id, actor, actorRole: 'Principal',
            action: 'application.locked', message: `Application "${app.title}" locked${reason ? ` — ${reason}` : ''}. Final submitted data frozen.`,
          }),
        })
      },

      reopenApplication: (id, actor) => {
        const state = get()
        const app = state.applications.find((a) => a.id === id)
        if (!app) return { success: false, error: 'Application not found.' }
        const today = new Date().toISOString().slice(0, 10)
        if (today > app.deadline) {
          return { success: false, error: `The deadline (${app.deadline}) has passed — reopening is not possible.` }
        }
        if (app.status !== 'Closed' && !app.lockDate) return { success: false, error: 'Only a closed or locked application needs reopening.' }
        const nowIso = new Date().toISOString()
        set({
          applications: state.applications.map((a) => a.id !== id ? a : { ...a, status: 'Published', lockDate: undefined, updatedAt: nowIso }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: id, actor, actorRole: 'Principal',
            action: 'application.reopened', message: `Application "${app.title}" reopened before its deadline.`,
          }),
        })
        return { success: true }
      },

      archiveApplication: (id, actor) => {
        const state = get()
        const app = state.applications.find((a) => a.id === id)
        if (!app) return
        const nowIso = new Date().toISOString()
        set({
          applications: state.applications.map((a) => a.id !== id ? a : { ...a, status: 'Archived', updatedAt: nowIso }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: id, actor, actorRole: 'Principal',
            action: 'application.archived', message: `Application "${app.title}" archived. Submissions, payments and audit history remain accessible.`,
          }),
        })
      },

      duplicateApplication: (id, actor) => {
        const state = get()
        const src = state.applications.find((a) => a.id === id)
        if (!src) return { success: false }
        const nowIso = new Date().toISOString()
        const copy: SchoolApplication = {
          ...structuredClone(src),
          id: newId('APP'),
          title: `${src.title} — Copy`,
          publishDate: undefined,
          startDate: undefined,
          deadline: '',
          eventDate: undefined,
          lockDate: undefined,
          payment: { ...src.payment, chargeId: undefined },
          formFields: src.formFields.map((f) => ({ ...f })),
          status: 'Draft',
          createdBy: actor,
          createdAt: nowIso,
          updatedAt: nowIso,
        }
        set({
          applications: [copy, ...state.applications],
          audit: pushAudit(state, {
            ts: nowIso, applicationId: copy.id, actor, actorRole: 'Principal',
            action: 'application.duplicated', message: `Duplicated from "${src.title}" as a new draft.`,
          }),
        })
        return { success: true, application: copy }
      },

      submitApplication: (input) => {
        const state = get()
        const app = state.applications.find((a) => a.id === input.applicationId)
        if (!app) return { success: false, error: 'Application not found.' }
        if (!isSubmittable(app)) {
          return { success: false, error: `"${app.title}" is ${effectiveAppStatus(app)} — submissions are closed.` }
        }
        // Idempotency — one active submission per student per application.
        const existing = state.submissions.find(
          (s) => s.applicationId === input.applicationId && s.studentId === input.student.id && s.status !== 'Withdrawn',
        )
        if (existing) {
          return { success: true, existingSubmissionId: existing.id, submission: existing }
        }
        const nowIso = new Date().toISOString()
        const sub: ApplicationSubmission = {
          id: newId('SUB'),
          applicationId: app.id,
          studentId: input.student.id,
          studentName: input.student.name,
          admissionNo: input.student.admissionNo,
          className: input.student.className,
          classId: input.student.classId,
          section: input.student.section,
          guardianName: input.student.guardianName,
          guardianPhone: input.student.guardianPhone,
          answers: input.answers,
          attachments: input.attachments,
          submittedAt: nowIso,
          submittedByRole: input.submittedByRole ?? 'Student',
          mode: 'Digital',
          status: 'Submitted',
          consentGivenAt: app.guardianConsent.required && input.consentAccepted ? nowIso : undefined,
          physicalDoc: {
            status: app.physicalSignatureRequired && app.guardianConsent.method === 'Physical Signature'
              ? 'Pending' : 'Not Required',
          },
          reviewNotes: [],
          resubmissionCount: 0,
          updatedAt: nowIso,
        }
        set({
          submissions: [sub, ...state.submissions],
          audit: pushAudit(state, {
            ts: nowIso, applicationId: app.id, submissionId: sub.id,
            actor: input.student.name, actorRole: input.submittedByRole === 'Guardian' ? 'Guardian' : 'Student',
            action: 'submission.submitted',
            message: `${input.student.name} (${input.student.className}-${input.student.section}) submitted the application.`,
          }),
        })
        return { success: true, submission: sub }
      },

      withdrawSubmission: (submissionId, actor) => {
        const state = get()
        const sub = state.submissions.find((s) => s.id === submissionId)
        if (!sub) return { success: false, error: 'Submission not found.' }
        if (sub.status !== 'Submitted' && sub.status !== 'Under Review') {
          return { success: false, error: 'Only a not-yet-reviewed submission can be withdrawn.' }
        }
        const nowIso = new Date().toISOString()
        set({
          submissions: state.submissions.map((s) => s.id !== submissionId ? s : { ...s, status: 'Withdrawn', updatedAt: nowIso }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: sub.applicationId, submissionId,
            actor, actorRole: 'Student',
            action: 'submission.withdrawn', message: `${sub.studentName} withdrew their submission.`,
          }),
        })
        return { success: true }
      },

      resubmitSubmission: (submissionId, answers, attachments, actor) => {
        const state = get()
        const sub = state.submissions.find((s) => s.id === submissionId)
        if (!sub) return { success: false, error: 'Submission not found.' }
        const app = state.applications.find((a) => a.id === sub.applicationId)
        if (!app) return { success: false, error: 'Application not found.' }
        if (sub.status !== 'Correction Required') return { success: false, error: 'This submission was not asked for corrections.' }
        if (!isSubmittable(app)) return { success: false, error: `"${app.title}" is locked — corrections are closed.` }
        const nowIso = new Date().toISOString()
        set({
          submissions: state.submissions.map((s) => s.id !== submissionId ? s : {
            ...s,
            answers: answers ?? s.answers,
            ...(attachments !== undefined ? { attachments } : {}),
            status: 'Submitted' as const,
            resubmissionCount: s.resubmissionCount + 1,
            updatedAt: nowIso,
          }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: sub.applicationId, submissionId,
            actor, actorRole: 'Student',
            action: 'submission.resubmitted', message: `${sub.studentName} resubmitted after correction.`,
          }),
        })
        return { success: true }
      },

      reviewSubmission: (submissionId, decision, note, actor, actorRole) => {
        const state = get()
        const sub = state.submissions.find((s) => s.id === submissionId)
        if (!sub) return { success: false, error: 'Submission not found.' }
        const app = state.applications.find((a) => a.id === sub.applicationId)
        if (!app) return { success: false, error: 'Application not found.' }
        if (sub.status === 'Withdrawn' || sub.status === 'Approved' || sub.status === 'Rejected') {
          return { success: false, error: `Submission is already ${sub.status.toLowerCase()}.` }
        }
        if (effectiveAppStatus(app) === 'Archived') {
          return { success: false, error: 'Application archived — records are read-only.' }
        }
        // TEACHER PERMISSION BOUNDARY (§2E): reviewing participation is fine;
        // moving money is impossible through this API by design. Approval
        // additionally REQUIRES payment completion when the form charges.
        const pay = deriveSubmissionPayment(app, sub)
        if (decision === 'approve') {
          if (!isConsentSatisfied(app, sub)) {
            return { success: false, error: 'Guardian consent is required before approval.' }
          }
          if (app.payment.mode === 'Required' && pay.status !== 'Paid') {
            return { success: false, error: `Payment (${app.payment.feeHeadLabel}) is still "${pay.status}". Complete payment first.` }
          }
        }
        const nowIso = new Date().toISOString()
        const nextStatus: SubmissionWorkflowStatus =
          decision === 'approve' ? 'Approved'
            : decision === 'reject' ? 'Rejected'
              : 'Correction Required'
        const kindMap = { approve: 'approval', reject: 'rejection', request_correction: 'correction' } as const
        set({
          submissions: state.submissions.map((s) => s.id !== submissionId ? s : {
            ...s,
            status: nextStatus,
            reviewedBy: actor,
            reviewedAt: nowIso,
            updatedAt: nowIso,
            reviewNotes: [
              ...s.reviewNotes,
              { id: newId('RN'), at: nowIso, by: actor, role: actorRole, note: note.trim(), kind: kindMap[decision] },
            ],
          }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: sub.applicationId, submissionId,
            actor, actorRole,
            action: decision === 'approve' ? 'submission.approved'
              : decision === 'reject' ? 'submission.rejected' : 'submission.correction',
            message: decision === 'approve'
              ? `${sub.studentName}'s application approved by ${actor} (${actorRole}).`
              : decision === 'reject'
                ? `${sub.studentName}'s application rejected by ${actor} (${actorRole})${note.trim() ? ` — ${note.trim()}` : ''}.`
                : `Corrections requested from ${sub.studentName}${note.trim() ? ` — ${note.trim()}` : ''}.`,
          }),
        })
        return { success: true }
      },

      addReviewNote: (submissionId, note, actor, role) => {
        const state = get()
        const sub = state.submissions.find((s) => s.id === submissionId)
        if (!sub || !note.trim()) return
        const nowIso = new Date().toISOString()
        set({
          submissions: state.submissions.map((s) => s.id !== submissionId ? s : {
            ...s,
            reviewNotes: [...s.reviewNotes, { id: newId('RN'), at: nowIso, by: actor, role, note: note.trim(), kind: 'note' }],
            updatedAt: nowIso,
          }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: sub.applicationId, submissionId,
            actor, actorRole: role,
            action: 'application.note', message: `${role} note added on ${sub.studentName}'s submission.`,
          }),
        })
      },

      recordOfflineSubmission: (input) => {
        const state = get()
        const app = state.applications.find((a) => a.id === input.applicationId)
        if (!app) return { success: false, error: 'Application not found.' }
        const st = effectiveAppStatus(app)
        if (!(isSubmittable(app) || st === 'Closed')) {
          return { success: false, error: `This application (${st}) cannot accept offline records.` }
        }
        const existing = state.submissions.find(
          (s) => s.applicationId === input.applicationId && s.studentId === input.student.id && s.status !== 'Withdrawn',
        )
        if (existing) {
          return { success: false, error: 'A submission already exists for this student.', submission: existing }
        }
        const nowIso = new Date().toISOString()
        const sub: ApplicationSubmission = {
          id: newId('SUB'),
          applicationId: app.id,
          studentId: input.student.id,
          studentName: input.student.name,
          admissionNo: input.student.admissionNo,
          className: input.student.className,
          classId: input.student.classId,
          section: input.student.section,
          guardianName: input.student.guardianName,
          guardianPhone: input.student.guardianPhone,
          answers: {}, // paper form — answers live on the signed physical document
          submittedAt: nowIso,
          submittedByRole: 'Office',
          mode: 'Physical',
          status: 'Submitted',
          physicalDoc: {
            status: 'Received',
            ...(input.attachmentName ? { fileName: input.attachmentName } : {}),
            receivedAt: nowIso,
            receivedBy: input.recordedBy,
          },
          reviewNotes: [],
          resubmissionCount: 0,
          updatedAt: nowIso,
        }
        set({
          submissions: [sub, ...state.submissions],
          audit: pushAudit(state, {
            ts: nowIso, applicationId: app.id, submissionId: sub.id,
            actor: input.recordedBy, actorRole: input.recorderRole,
            action: 'submission.recorded',
            message: `Offline (paper) submission recorded for ${input.student.name}${input.attachmentName ? ` — scan "${input.attachmentName}" kept on file` : ''}.`,
          }),
        })
        return { success: true, submission: sub }
      },

      markDocumentReceived: (submissionId, fileName, actor, recorderRole) => {
        const state = get()
        const sub = state.submissions.find((s) => s.id === submissionId)
        if (!sub) return { success: false, error: 'Submission not found.' }
        const nowIso = new Date().toISOString()
        set({
          submissions: state.submissions.map((s) => s.id !== submissionId ? s : {
            ...s,
            physicalDoc: { ...s.physicalDoc, status: 'Received', fileName, receivedAt: nowIso, receivedBy: actor },
            updatedAt: nowIso,
          }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: sub.applicationId, submissionId,
            actor, actorRole: recorderRole,
            action: 'doc.received', message: `Signed document received for ${sub.studentName}: "${fileName}".`,
          }),
        })
        return { success: true }
      },

      verifyPhysicalDocument: (submissionId, actor) => {
        const state = get()
        const sub = state.submissions.find((s) => s.id === submissionId)
        if (!sub) return { success: false, error: 'Submission not found.' }
        if (sub.physicalDoc.status !== 'Received') {
          return { success: false, error: 'Receive the signed document before verifying it.' }
        }
        const nowIso = new Date().toISOString()
        set({
          submissions: state.submissions.map((s) => s.id !== submissionId ? s : {
            ...s,
            physicalDoc: { ...s.physicalDoc, status: 'Verified', verifiedAt: nowIso },
            updatedAt: nowIso,
          }),
          audit: pushAudit(state, {
            ts: nowIso, applicationId: sub.applicationId, submissionId,
            actor, actorRole: 'Principal',
            action: 'doc.verified', message: `Physical signature/document VERIFIED for ${sub.studentName}.`,
          }),
        })
        return { success: true }
      },
    }),
    {
      name: 'scholario-applications-v1',
      version: 1,
    },
  ),
)

// ─── Seed data (realistic demo scenarios, stable IDs) ─────────────────

const YEAR = CURRENT_ACADEMIC_YEAR

function seedApplications(): SchoolApplication[] {
  return [
    {
      id: 'APP-JAIPUR-2026',
      title: 'Educational Tour — Jaipur',
      description: 'Three-day educational tour to Jaipur covering Amber Fort, City Palace and Jantar Mantar. Fee covers transport, boarding/lodging, entry tickets and insurance.',
      category: 'Tour',
      academicYear: YEAR,
      targetClassIds: ['C11'],
      deadline: '2026-09-15',
      eventDate: '2026-10-08',
      participation: 'Optional',
      guardianConsent: {
        required: true,
        method: 'Physical Signature',
        statement: 'I give consent for my ward to participate in the Educational Tour to Jaipur and accept the school\u2019s conduct rules for the trip.',
      },
      teacherApprovalRequired: true,
      physicalSignatureRequired: true,
      inChargeTeacherId: 'T-014',
      inChargeName: 'Rohan Mehta',
      payment: { mode: 'Required', amount: 2500, feeHeadLabel: 'Educational Tour — Jaipur', chargeId: 'AC-01' },
      formFields: [
        { id: 'f-jp-emg', type: 'emergency-contact', label: 'Emergency Contact (relative)', helpText: 'Name and phone number of a contact besides parents.', required: true },
        { id: 'f-jp-medical', type: 'longtext', label: 'Medical Notes / Allergies', helpText: 'Leave blank if none.', required: false },
        { id: 'f-jp-meal', type: 'dropdown', label: 'Meal Preference', required: true, options: ['Vegetarian', 'Non-Vegetarian', 'Jain'] },
        { id: 'f-jp-shirt', type: 'radio', label: 'Tour T-Shirt Size', required: true, options: ['S', 'M', 'L', 'XL'] },
        { id: 'f-jp-photo', type: 'yesno', label: 'Photos allowed for school social media?', required: false },
        { id: 'f-jp-sign', type: 'signature', label: 'Guardian Undertaking', helpText: 'Sign the printed form physically before the tour.', required: true },
      ],
      status: 'Published',
      createdBy: 'Dr. Ananya Iyer',
      createdAt: '2026-08-20T09:35:00Z',
      updatedAt: '2026-08-22T10:00:00Z',
    },
    {
      id: 'APP-ROBOTICS-2026',
      title: 'Robotics Workshop',
      description: 'Two-day hands-on robotics workshop with an external partner. Kit included. Mandatory for Class 12.',
      category: 'Workshop',
      academicYear: YEAR,
      targetClassIds: ['C12'],
      deadline: '2026-10-30',
      eventDate: '2026-11-14',
      participation: 'Mandatory',
      guardianConsent: { required: false, method: 'Digital' },
      teacherApprovalRequired: false,
      physicalSignatureRequired: false,
      payment: { mode: 'Required', amount: 1000, feeHeadLabel: 'Robotics Workshop', chargeId: 'AC-02' },
      formFields: [
        { id: 'f-rb-team', type: 'yesno', label: 'Interested in the competitive track?', required: true },
        { id: 'f-rb-exp', type: 'dropdown', label: 'Prior robotics experience', required: true, options: ['None', 'Beginner', 'Intermediate', 'Advanced'] },
        { id: 'f-rb-contact', type: 'emergency-contact', label: 'Emergency Contact (relative)', required: true },
      ],
      status: 'Draft',
      createdBy: 'Dr. Ananya Iyer',
      createdAt: '2026-08-21T11:05:00Z',
      updatedAt: '2026-08-21T11:05:00Z',
    },
    {
      id: 'APP-SPORTSDAY-2026',
      title: 'Annual Sports Day Consent',
      description: 'Participation confirmation for the Annual Sports Day races. Consent needed for practice drills on Wednesday mornings.',
      category: 'Event',
      academicYear: YEAR,
      targetClassIds: ['C1', 'C2'],
      deadline: '2026-09-30',
      eventDate: '2026-11-20',
      participation: 'Optional',
      guardianConsent: {
        required: true,
        method: 'Digital',
        statement: 'I permit my ward to participate in Annual Sports Day practice sessions.',
      },
      teacherApprovalRequired: false,
      physicalSignatureRequired: false,
      payment: { mode: 'None', amount: 0, feeHeadLabel: '' },
      formFields: [
        { id: 'f-sd-track', type: 'checkbox', label: 'Events my ward wants to take part in', required: true, options: ['100m Run', 'Long Jump', 'Relay'] },
        { id: 'f-sd-medical', type: 'longtext', label: 'Medical notes', required: false },
      ],
      status: 'Published',
      createdBy: 'Dr. Ananya Iyer',
      createdAt: '2026-08-24T08:15:00Z',
      updatedAt: '2026-08-24T08:15:00Z',
    },
    // Closed-but-accessible history example — proves records survive closure.
    {
      id: 'APP-EYECAMP-2025',
      title: 'Vision Screening Camp 2025',
      description: 'Free eye screening conducted last term. Kept permanently as part of the session\u2019s record files.',
      category: 'Activity',
      academicYear: '2025-2026',
      targetClassIds: ['C1'],
      deadline: '2025-12-01',
      eventDate: '2025-12-10',
      participation: 'Optional',
      guardianConsent: { required: true, method: 'Digital', statement: 'I permit free vision screening for my ward.' },
      teacherApprovalRequired: false,
      physicalSignatureRequired: false,
      payment: { mode: 'None', amount: 0, feeHeadLabel: '' },
      formFields: [
        { id: 'f-es-glasses', type: 'yesno', label: 'Does your ward currently wear glasses?', required: false },
      ],
      status: 'Closed',
      createdBy: 'Dr. Ananya Iyer',
      createdAt: '2025-11-10T08:00:00Z',
      updatedAt: '2025-12-02T09:00:00Z',
    },
  ]
}

/**
 * Seeds realistic submissions resolved from the canonical roster so student
 * identity snapshots match real Class 11 / Class 2 students — which makes
 * their payments resolve correctly inside Fee Management accounts. Safe to
 * call repeatedly; only seeds while both collections are empty.
 */
export function ensureApplicationSeedData(): void {
  try {
    const state = useApplicationsStore.getState()
    if (state.submissions.length > 0 || state.audit.length > 0) return
    const apps = state.applications.length > 0 ? state.applications : seedApplications()
    const students = useStudentsStore.getState().students.filter((s) => s.status === 'Active')
    const jaipur = apps.find((a) => a.id === 'APP-JAIPUR-2026')
    const sports = apps.find((a) => a.id === 'APP-SPORTSDAY-2026')
    const eyecamp = apps.find((a) => a.id === 'APP-EYECAMP-2025')

    const mkSub = (
      base: { id: string; app?: SchoolApplication; stu?: typeof students[number] },
      extra: Partial<ApplicationSubmission>,
    ): ApplicationSubmission | null => {
      if (!base.app || !base.stu) return null
      return {
        id: base.id,
        applicationId: base.app.id,
        studentId: base.stu.id,
        studentName: base.stu.name,
        admissionNo: base.stu.admissionNo,
        className: base.stu.className,
        classId: base.stu.classId,
        section: base.stu.section,
        guardianName: base.stu.guardianName,
        guardianPhone: base.stu.guardianPhone,
        answers: {},
        submittedAt: '2026-08-24T09:00:00Z',
        submittedByRole: 'Student',
        mode: 'Digital',
        status: 'Submitted',
        physicalDoc: { status: 'Not Required' },
        reviewNotes: [],
        resubmissionCount: 0,
        updatedAt: '2026-08-24T09:00:00Z',
        ...extra,
      }
    }

    const out: ApplicationSubmission[] = []
    if (jaipur) {
      const c11 = students.filter((s) => s.classId === 'C11').slice(0, 4)
      c11.forEach((stu, i) => {
        out.push(mkSub({ id: `SUB-SEED-JP-${i + 1}`, app: jaipur, stu }, i === 2 ? {
          status: 'Correction Required' as const,
          reviewNotes: [{
            id: 'RN-SEED-1', at: '2026-08-25T10:30:00Z', by: 'Rohan Mehta', role: 'Teacher' as const,
            note: 'Emergency contact number looks incomplete — please re-enter the full 10-digit mobile number.', kind: 'correction' as const,
          }],
        } : {}))
      })
    }
    if (sports) {
      const c2 = students.filter((s) => s.classId === 'C2').slice(0, 3)
      c2.slice(0, 2).forEach((stu, i) => {
        out.push(mkSub({ id: `SUB-SEED-SD-${i + 1}`, app: sports, stu }, {
          answers: { 'f-sd-track': i === 0 ? ['100m Run', 'Relay'] : ['Long Jump'], 'f-sd-medical': '' },
          consentGivenAt: '2026-08-24T09:05:00Z',
        }))
      })
      // Historical record from last session — approved participant retained.
      if (eyecamp && c2[2]) {
        out.push(mkSub({ id: 'SUB-SEED-ES-1', app: eyecamp, stu: c2[2] }, {
          answers: { 'f-es-glasses': false },
          consentGivenAt: '2025-11-15T09:00:00Z',
          status: 'Approved' as const,
          reviewedBy: 'Dr. Ananya Iyer',
          reviewedAt: '2025-11-16T09:00:00Z',
          submittedAt: '2025-11-15T09:00:00Z',
          updatedAt: '2025-11-16T09:00:00Z',
        }))
      }
    }
    const valid = out.filter(Boolean) as ApplicationSubmission[]
    useApplicationsStore.setState({
      submissions: valid,
      audit: valid.length ? SEED_APP_AUDIT() : [],
    })
  } catch {
    /* roster unavailable — skip seeding silently */
  }
}

function SEED_APP_AUDIT(): ApplicationAuditEvent[] {
  return [
    {
      id: 'AEV-SEED-1', ts: '2026-08-22T09:00:00Z', applicationId: 'APP-JAIPUR-2026',
      actor: 'Dr. Ananya Iyer', actorRole: 'Principal', action: 'application.published',
      message: 'Linked to existing charge "Educational Tour — Jaipur" (₹2,500). Deadline 2026-09-15.',
    },
    {
      id: 'AEV-SEED-2', ts: '2026-08-25T10:30:00Z', applicationId: 'APP-JAIPUR-2026', submissionId: 'SUB-SEED-JP-3',
      actor: 'Rohan Mehta', actorRole: 'Teacher', action: 'submission.correction',
      message: 'Corrections requested from a Class 11 applicant — emergency contact incomplete.',
    },
    {
      id: 'AEV-SEED-3', ts: '2025-12-02T09:00:00Z', applicationId: 'APP-EYECAMP-2025',
      actor: 'Dr. Ananya Iyer', actorRole: 'Principal', action: 'application.closed',
      message: 'Screening completed — application closed. Records retained for the 2025-26 session file.',
    },
  ]
}
