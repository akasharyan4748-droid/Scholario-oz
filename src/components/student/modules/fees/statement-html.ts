'use client'

/**
 * fees/statement-html — the OFFICIAL FEE STATEMENT document (FEES-R §15).
 *
 * A chronological statement of the student's school-fee ledger for the
 * session: opening position (annual fee by head, exactly as configured),
 * every ledger entry with its real receipt number, and the closing
 * balance. Every value arrives from the ONE ledger (students-store totals
 * + fee-store transactions) — this builder NEVER computes its own balance
 * or invents a date; the closing figure is passed in by the module from
 * the same derivation the overview renders.
 *
 * Document language follows the existing official documents (report-card
 * letterhead from School Settings + A5 receipt furniture): serif body,
 * letterhead, meta table, signature lines, seal note. Statements carry
 * the violet financial-information accent (§37).
 */

import { formatINR } from '@/lib/format'
import { school as schoolFallback } from '@/lib/mock/school'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import type { FeeTransaction } from '@/lib/store/fee-store'
import type { ConcessionPosition, FeeHeadLine } from './derive'
import { sessionChipLabel } from './derive'

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function fullDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${Number(m[3])} ${MONTHS_FULL[Number(m[2]) - 1]} ${m[1]}`
}

export interface FeeStatementInput {
  /** Fee session id (e.g. '2026-2027'). */
  session: string
  student: {
    name: string
    admissionNo: string
    classSection: string
    rollNo: string
  }
  /** Annual fee composition (structure-derived — see derive.ts). */
  heads: FeeHeadLine[]
  /** Live concession position (amount 0 → the doc says "None applied"). */
  concession: ConcessionPosition
  /** The student's real ledger transactions, chronological. */
  transactions: FeeTransaction[]
  /** Ledger figures — passed in, never recomputed here. */
  totalFee: number
  totalPaid: number
  outstanding: number
  /** Statement date (yyyy-mm-dd). */
  asOn: string
}

function statusLabelOf(t: FeeTransaction): string {
  switch (t.status) {
    case 'Success': return 'Paid'
    case 'Under Verification': return 'Under verification'
    case 'Pending': return 'Processing'
    case 'Failed': return 'Failed'
    case 'Refunded': return 'Refunded'
  }
}

/** Build the institutional statement document (pure HTML string). */
export function buildFeeStatementHTML(input: FeeStatementInput): string {
  const general = useSchoolSettingsStore.getState().general
  const schoolName = general?.schoolName || schoolFallback.name
  const affiliation = general?.affiliation || schoolFallback.affiliation
  const address = general?.address || schoolFallback.address
  const principal = general?.principalName || schoolFallback.principal

  const sessionLabel = sessionChipLabel(input.session)

  // ─── Opening position: annual fee by head ───────────────────────────
  const headRows = input.heads.length > 0
    ? input.heads.map((h) => `<tr><td><strong>${esc(h.name)}</strong></td><td class="muted">${esc(h.frequencyContext)}</td><td class="r">${formatINR(h.annual)}</td></tr>`).join('')
    : `<tr><td colspan="3" class="muted">No fee structure is configured for this class on the ledger — the school office can confirm the composition.</td></tr>`

  const concessionRow = input.concession.amount > 0 && input.concession.label
    ? `<tr><td>Concession — ${esc(input.concession.label)}</td><td class="muted">applied to the annual fee</td><td class="r disc">−${formatINR(input.concession.amount)}</td></tr>`
    : `<tr><td class="muted">Concession</td><td class="muted">none applied on the ledger</td><td class="r muted">—</td></tr>`

  // ─── Ledger entries (real transactions only) ────────────────────────
  const ledgerRows = input.transactions.length > 0
    ? input.transactions
        .map((t) => `<tr>
          <td>${esc(fullDate(t.date))}</td>
          <td><strong>${esc(t.purpose)}</strong><div class="muted small">${esc(t.feeHead)}${t.referenceNo ? ` · ref ${esc(t.referenceNo)}` : ''}</div></td>
          <td class="mono">${esc(t.receiptNo)}</td>
          <td class="c">${esc(t.mode)}</td>
          <td class="c">${esc(statusLabelOf(t))}</td>
          <td class="r"><strong>${formatINR(t.amount)}</strong></td>
        </tr>`)
        .join('')
    : `<tr><td colspan="6" class="muted">No payments recorded on the ledger yet for ${esc(sessionLabel)}.</td></tr>`

  const issuedOn = fullDate(input.asOn)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Fee Statement — ${esc(input.student.name)} — ${esc(sessionLabel)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; margin: 36px auto; max-width: 780px; color: #1f2a37; }
  .letterhead { text-align: center; border-bottom: 3px double #6d28d9; padding-bottom: 14px; margin-bottom: 20px; }
  .school { font-size: 23px; font-weight: bold; color: #0f172a; letter-spacing: 0.02em; }
  .aff { font-size: 11px; color: #4b5563; margin-top: 4px; }
  .contact { font-size: 10px; color: #6b7280; margin-top: 2px; }
  h1 { text-align: center; font-size: 14px; letter-spacing: 0.28em; margin: 16px 0 4px; color: #5b21b6; }
  .docmeta { display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; margin: 0 0 14px; font-family: ui-monospace, monospace; }
  h2 { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #5b21b6; margin: 18px 0 6px; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  table.data th, table.data td { border: 1px solid #9ca3af; padding: 6px 10px; font-size: 12px; vertical-align: top; }
  table.data thead th { background: #f5f3ff; color: #4c1d95; text-align: left; }
  table.data tfoot th, table.data tfoot td { background: #f5f3ff; color: #3730a3; font-weight: bold; }
  .c { text-align: center; }
  .r { text-align: right; }
  .muted { color: #6b7280; }
  .small { font-size: 9.5px; margin-top: 2px; }
  .mono { font-family: ui-monospace, 'Courier New', monospace; font-size: 10.5px; }
  .disc { color: #b45309; }
  table.meta td, table.meta th { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 12px; }
  table.meta th { background: #f8fafc; text-align: left; width: 32%; color: #4b5563; }
  .summary { display: flex; gap: 10px; margin: 12px 0; flex-wrap: wrap; }
  .summary div { flex: 1; min-width: 128px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; text-align: center; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.06em; }
  .summary strong { display: block; font-size: 16px; color: #0f172a; margin-top: 3px; text-transform: none; letter-spacing: 0; }
  .summary .due strong { color: #b45309; }
  .summary .paid strong { color: #047857; }
  .as-on { font-size: 10.5px; color: #6b7280; margin: 10px 0 0; }
  .sign { display: flex; justify-content: space-between; margin-top: 52px; }
  .sign div { text-align: center; font-size: 12px; color: #0f172a; }
  .sign .line { border-top: 1px solid #374151; width: 225px; margin: 0 auto 6px; padding-top: 8px; font-weight: bold; }
  .sign .role { color: #6b7280; font-size: 10px; margin-top: 2px; }
  .seal-note { text-align: center; font-size: 9px; color: #9ca3af; margin-top: 26px; font-family: ui-monospace, monospace; letter-spacing: 0.04em; }
  @media print { body { margin: 10mm auto; } }
</style>
</head>
<body>
  <div class="letterhead">
    <div class="school">${esc(schoolName)}</div>
    <div class="aff">${esc(affiliation)}</div>
    <div class="contact">${esc(address)}</div>
  </div>
  <h1>FEE STATEMENT</h1>
  <div class="docmeta"><span>Session ${esc(sessionLabel)}</span><span>Issued ${esc(issuedOn)}</span></div>
  <table class="meta">
    <tr><th>Student Name</th><td>${esc(input.student.name)}</td></tr>
    <tr><th>Admission No</th><td>${esc(input.student.admissionNo)}</td></tr>
    <tr><th>Class / Section</th><td>${esc(input.student.classSection)}</td></tr>
    <tr><th>Roll No</th><td>${esc(input.student.rollNo)}</td></tr>
    <tr><th>Financial Period</th><td>Session ${esc(sessionLabel)}</td></tr>
  </table>

  <h2>Opening position — annual fee</h2>
  <table class="data">
    <thead>
      <tr><th>Fee head</th><th>Billing</th><th class="r">Annual amount</th></tr>
    </thead>
    <tbody>
      ${headRows}
      ${concessionRow}
    </tbody>
    <tfoot>
      <tr><th colspan="2">Annual fee</th><td class="r">${formatINR(input.totalFee)}</td></tr>
    </tfoot>
  </table>

  <h2>Ledger entries</h2>
  <table class="data">
    <thead>
      <tr><th>Date</th><th>Particulars</th><th>Receipt No</th><th class="c">Mode</th><th class="c">Status</th><th class="r">Amount</th></tr>
    </thead>
    <tbody>${ledgerRows}</tbody>
  </table>
  <p class="as-on">Only money confirmed on the school ledger counts towards the paid position. Payments under verification appear above with their status and are confirmed by the school office.</p>

  <h2>Closing position</h2>
  <div class="summary">
    <div>Annual fee<strong>${formatINR(input.totalFee)}</strong></div>
    <div class="paid">Paid to date<strong>${formatINR(input.totalPaid)}</strong></div>
    <div class="due">Closing balance<strong>${formatINR(input.outstanding)}</strong></div>
  </div>

  <div class="sign">
    <div><div class="line">Accounts Office</div><div class="role">${esc(schoolName)}</div></div>
    <div><div class="line">${esc(principal)}</div><div class="role">Principal</div></div>
  </div>
  <div class="seal-note">This statement reflects the school fee ledger as on ${esc(issuedOn)} and is issued electronically by ${esc(schoolName)}.</div>
</body>
</html>`
}

/** File name for the statement download (same mechanics as the A5 receipt). */
export function statementFileName(studentName: string, session: string): string {
  const base = `Fee Statement ${studentName} ${sessionChipLabel(session)}`.replace(/[^A-Za-z0-9\-_ ]/g, '').replace(/\s+/g, '_').slice(0, 80)
  return `${base || 'fee_statement'}.html`
}
