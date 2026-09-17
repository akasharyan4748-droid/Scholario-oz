'use client'

// ============================================================
// STUDENT FEE ISSUES STORE — the fee query / dispute workflow
// ------------------------------------------------------------
// The student/parent-facing half of the §21 fee-query system (the
// Principal's Fee Queries tab is the school-facing half — ONE store,
// ONE lifecycle, both roles act on the same records).
//
// DESIGN RULES (from the Fees brief):
//   • Every issue has an immutable ID + a full case timeline — the
//     user must never wonder "did the school receive my complaint?".
//   • The student can RAISE and PROVIDE INFORMATION, never resolve,
//     close or edit their own submission after it leaves their hands.
//   • No seeds: an honest "No open requests" empty state until a real
//     query exists. Never fabricate disputes.
//   • Statuses mirror the brief §21: OPEN → ASSIGNED → UNDER REVIEW →
//     WAITING FOR INFORMATION → RESOLVED / CLOSED.
//   • Escalations ("request school review") are the same entity with
//     type 'Escalation' — one workflow, routed to the Principal.
//
// Tenant-scoped persistence (SaaS-STAGE-2A): per-school namespace,
// same adapter as every other store.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createTenantScopedStorage } from '@/lib/tenant/tenant-storage'

// ─── Entities ────────────────────────────────────────────────────────

export type FeeIssueType =
  | 'Incorrect amount'
  | 'Payment missing'
  | 'Receipt issue'
  | 'Concession issue'
  | 'Duplicate charge'
  | 'General question'
  | 'Escalation'

export type FeeIssueStatus =
  | 'Open'
  | 'Assigned'
  | 'Under Review'
  | 'Waiting for Information'
  | 'Resolved'
  | 'Closed'

/** One entry in the case timeline — an immutable audit of who did what. */
export interface FeeIssueEvent {
  at: string
  /** Actor display name. */
  by: string
  /** 'student' | 'principal' | 'accounts' — the acting role. */
  role: 'student' | 'principal' | 'accounts'
  /** What happened (status change, note added, resolution…). */
  kind: 'created' | 'assigned' | 'status' | 'student-info' | 'note' | 'resolved' | 'closed'
  note: string
}

export interface FeeIssue {
  /** Immutable request id — FIQ-2026-<seq>. */
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  type: FeeIssueType
  /** One-line summary (the "subject"). */
  subject: string
  /** The student's own message. */
  message: string
  /** Related transaction receipt no (auto-attached context), if any. */
  relatedReceiptNo?: string
  status: FeeIssueStatus
  /** Who the school assigned it to (e.g. 'Accounts Office'). */
  assignedTo?: string
  timeline: FeeIssueEvent[]
  createdAt: string
  updatedAt: string
}

export interface RaiseFeeIssueInput {
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  type: FeeIssueType
  subject: string
  message: string
  relatedReceiptNo?: string
}

interface StudentFeeIssuesState {
  issues: FeeIssue[]
  /** Student-side: submit a new fee query / dispute / escalation. */
  raiseIssue: (input: RaiseFeeIssueInput) => { ok: true; issue: FeeIssue } | { ok: false; error: string }
  /** Student-side: provide requested information (Waiting for Information). */
  provideInfo: (issueId: string, note: string, studentName: string) => { ok: boolean; error?: string }
  /** School-side: assign to a responsible office/role. */
  assignIssue: (issueId: string, assignedTo: string, actor: string) => { ok: boolean; error?: string }
  /** School-side: move the case along (Under Review / Waiting for Information). */
  updateIssueStatus: (issueId: string, status: Extract<FeeIssueStatus, 'Under Review' | 'Waiting for Information' | 'Open'>, actor: string, note?: string) => { ok: boolean; error?: string }
  /** School-side: resolve with a closing note. */
  resolveIssue: (issueId: string, note: string, actor: string) => { ok: boolean; error?: string }
  /** School-side: close without resolution (e.g. duplicate). */
  closeIssue: (issueId: string, note: string, actor: string) => { ok: boolean; error?: string }
}

// ─── Helpers ─────────────────────────────────────────────────────────

const nowIso = () => new Date().toISOString()
const seq = () => Date.now().toString(36).slice(-4).toUpperCase()

/** OPEN-derived statuses count as "active" (need attention). */
export function isActiveIssue(i: FeeIssue): boolean {
  return i.status !== 'Resolved' && i.status !== 'Closed'
}

export function activeIssuesOf(issues: FeeIssue[]): FeeIssue[] {
  return issues.filter(isActiveIssue)
}

// ─── Store ───────────────────────────────────────────────────────────

export const useStudentFeeIssuesStore = create<StudentFeeIssuesState>()(
  persist(
    (set, get) => ({
      issues: [],

      raiseIssue: (input) => {
        const subject = input.subject.trim()
        const message = input.message.trim()
        if (!subject || subject.length < 4) return { ok: false, error: 'Please describe the issue in a few words.' }
        if (!message || message.length < 10) return { ok: false, error: 'Please give the office at least a sentence to work with.' }
        const createdAt = nowIso()
        const issue: FeeIssue = {
          id: `FIQ-2026-${seq()}`,
          studentId: input.studentId,
          studentName: input.studentName,
          admissionNo: input.admissionNo,
          className: input.className,
          type: input.type,
          subject,
          message,
          ...(input.relatedReceiptNo ? { relatedReceiptNo: input.relatedReceiptNo } : {}),
          status: 'Open',
          timeline: [
            {
              at: createdAt,
              by: input.studentName,
              role: 'student',
              kind: 'created',
              note: `Query submitted${input.relatedReceiptNo ? ` about receipt ${input.relatedReceiptNo}` : ''}.`,
            },
          ],
          createdAt,
          updatedAt: createdAt,
        }
        set((s) => ({ issues: [issue, ...s.issues] }))
        return { ok: true, issue }
      },

      provideInfo: (issueId, note, studentName) => {
        const text = note.trim()
        if (!text) return { ok: false, error: 'Message cannot be empty.' }
        const issue = get().issues.find((i) => i.id === issueId)
        if (!issue) return { ok: false, error: 'Request not found.' }
        if (issue.status !== 'Waiting for Information') {
          return { ok: false, error: 'This request is not waiting for your information.' }
        }
        const at = nowIso()
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  status: 'Under Review',
                  updatedAt: at,
                  timeline: [...i.timeline, { at, by: studentName, role: 'student' as const, kind: 'student-info' as const, note: text }],
                }
              : i,
          ),
        }))
        return { ok: true }
      },

      assignIssue: (issueId, assignedTo, actor) => {
        const issue = get().issues.find((i) => i.id === issueId)
        if (!issue) return { ok: false, error: 'Request not found.' }
        if (!isActiveIssue(issue)) return { ok: false, error: 'This request is already closed.' }
        const at = nowIso()
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  status: 'Assigned',
                  assignedTo,
                  updatedAt: at,
                  timeline: [...i.timeline, { at, by: actor, role: 'principal' as const, kind: 'assigned' as const, note: `Assigned to ${assignedTo}.` }],
                }
              : i,
          ),
        }))
        return { ok: true }
      },

      updateIssueStatus: (issueId, status, actor, note) => {
        const issue = get().issues.find((i) => i.id === issueId)
        if (!issue) return { ok: false, error: 'Request not found.' }
        if (!isActiveIssue(issue)) return { ok: false, error: 'This request is already closed.' }
        const at = nowIso()
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  status,
                  updatedAt: at,
                  timeline: [...i.timeline, { at, by: actor, role: 'principal' as const, kind: 'status' as const, note: note?.trim() || `Status moved to ${status}.` }],
                }
              : i,
          ),
        }))
        return { ok: true }
      },

      resolveIssue: (issueId, note, actor) => {
        const text = note.trim()
        if (!text) return { ok: false, error: 'A resolution note helps the family understand the outcome.' }
        const issue = get().issues.find((i) => i.id === issueId)
        if (!issue) return { ok: false, error: 'Request not found.' }
        const at = nowIso()
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  status: 'Resolved',
                  updatedAt: at,
                  timeline: [...i.timeline, { at, by: actor, role: 'principal' as const, kind: 'resolved' as const, note: text }],
                }
              : i,
          ),
        }))
        return { ok: true }
      },

      closeIssue: (issueId, note, actor) => {
        const issue = get().issues.find((i) => i.id === issueId)
        if (!issue) return { ok: false, error: 'Request not found.' }
        const at = nowIso()
        set((s) => ({
          issues: s.issues.map((i) =>
            i.id === issueId
              ? {
                  ...i,
                  status: 'Closed',
                  updatedAt: at,
                  timeline: [...i.timeline, { at, by: actor, role: 'principal' as const, kind: 'closed' as const, note: note?.trim() || 'Request closed.' }],
                }
              : i,
          ),
        }))
        return { ok: true }
      },
    }),
    {
      name: 'scholario-student-fee-issues-v1',
      storage: createTenantScopedStorage('scholario-student-fee-issues-v1'),
      version: 1,
      partialize: (s) => ({ issues: s.issues }),
    },
  ),
)
