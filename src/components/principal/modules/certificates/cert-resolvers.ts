'use client'

/**
 * cert-resolvers — snapshot-first document data resolution.
 *
 * THE PREVIEW FIX. Generated documents store a full snapshot of the data
 * they were issued with (student identity fields, marksheet payload, fee
 * transaction snapshot). Resolvers here prefer the LIVE stores (roster,
 * fee transactions) but ALWAYS fall back to the stored snapshot, so a
 * generated document can always be re-rendered — even if the live record
 * was archived, deleted, or the doc predates the current dataset.
 *
 * Used by: Certificates History preview, Downloads drawer preview,
 * Templates sample preview, and every Download/Print HTML builder.
 */

import type {
  DocType, GeneratedDocument,
} from '@/lib/store/certificates-store'
import type { StudentRecord } from '@/lib/store/students-store'
import type { FeeTransaction } from '@/lib/store/fee-store'
import type { SchoolProfile } from '@/lib/school-profile'
import { getSchoolProfile } from '@/lib/school-profile'
import { formatDate, formatINR } from '@/lib/format'

// ─── Student resolution ────────────────────────────────────────────────

/**
 * The subset of a student record the document renderers actually read.
 * `StudentRecord` satisfies this structurally; snapshot pseudo-students
 * satisfy it with the fields stored on the generated document.
 */
export interface PreviewStudent {
  name: string
  admissionNo: string
  className: string
  section: string
  dob: string
  fatherName: string
  motherName: string
  admissionDate: string
  rollNo: string
  category?: string
  bloodGroup?: string
  houseName?: string
}

/** Build a minimal pseudo-student from a generated document's snapshot fields. */
export function snapshotStudent(doc: GeneratedDocument): PreviewStudent {
  const stu = doc.data?.student as Partial<PreviewStudent> | undefined
  return {
    name: doc.studentName || stu?.name || '—',
    admissionNo: doc.admissionNo || stu?.admissionNo || '—',
    className: doc.class || stu?.className || '—',
    section: stu?.section ?? '',
    dob: stu?.dob ?? '',
    fatherName: stu?.fatherName ?? '—',
    motherName: stu?.motherName ?? '—',
    admissionDate: stu?.admissionDate ?? '',
    rollNo: stu?.rollNo ?? '—',
    category: stu?.category,
    bloodGroup: stu?.bloodGroup,
    houseName: stu?.houseName,
  }
}

/**
 * Resolve the student for a generated document:
 *   1. live roster by studentId  →  2. live roster by admissionNo
 *   3. stored snapshot            →  undefined only when nothing exists.
 */
export function resolvePreviewStudent(
  doc: GeneratedDocument,
  students: StudentRecord[],
): PreviewStudent | undefined {
  if (doc.studentId) {
    const byId = students.find((s) => s.id === doc.studentId)
    if (byId) return byId
  }
  if (doc.admissionNo) {
    const byAdm = students.find((s) => s.admissionNo === doc.admissionNo)
    if (byAdm) return byAdm
  }
  if (doc.studentName) return snapshotStudent(doc)
  return undefined
}

// ─── Fee transaction resolution ────────────────────────────────────────

/** Structural subset of FeeTransaction the receipt renderer reads. */
export interface PreviewTransaction {
  receiptNo: string
  date: string
  studentName: string
  admissionNo: string
  className: string
  mode: string
  referenceNo?: string | null
  feeHead: string
  purpose: string
  amount: number
  verifiedBy?: string | null
  academicYear?: string
  status?: string
  collectedBy?: string
}

/** Resolve the fee transaction for a generated receipt (live → snapshot). */
export function resolvePreviewTransaction(
  doc: GeneratedDocument,
  transactions: FeeTransaction[],
): PreviewTransaction | undefined {
  const txnId = doc.data?.transactionId
  if (txnId) {
    const live = transactions.find((t) => t.id === txnId)
    if (live) return live
  }
  // Full snapshot stored at generation/seed time.
  const snap = doc.data?.transaction as Partial<PreviewTransaction> | undefined
  if (snap && snap.receiptNo) {
    return {
      receiptNo: snap.receiptNo,
      date: snap.date ?? doc.generatedAt,
      studentName: snap.studentName ?? doc.studentName,
      admissionNo: snap.admissionNo ?? doc.admissionNo ?? '—',
      className: snap.className ?? doc.class ?? '—',
      mode: snap.mode ?? '—',
      referenceNo: snap.referenceNo ?? null,
      feeHead: snap.feeHead ?? 'Fee',
      purpose: snap.purpose ?? doc.data?.purpose ?? '—',
      amount: snap.amount ?? 0,
      verifiedBy: snap.verifiedBy ?? null,
      academicYear: snap.academicYear,
      status: snap.status ?? 'SUCCESS',
      collectedBy: snap.collectedBy ?? 'Accounts Office',
    }
  }
  return undefined
}

// ─── Sample data (Templates tab previews) ──────────────────────────────

/** Sample marksheet for template previews — from a roster student's academic record. */
export function sampleMarksheetData(student: StudentRecord, examName = 'Terminal Examination'): {
  examName: string
  className: string
  section: string
  session: string
  rows: { subject: string; max: number; pass: number; obtained: number; isAbsent?: boolean }[]
  totalMax: number
  totalObtained: number
  percentage: number
  grade: string
  result: 'PASS' | 'FAIL' | '—'
  remarks?: string
} {
  const rows = student.academics.subjects.map((subj) => ({
    subject: subj.name,
    max: 100,
    pass: 33,
    obtained: Math.round(subj.percent),
  }))
  const totalMax = rows.length * 100
  const totalObtained = rows.reduce((s, r) => s + r.obtained, 0)
  const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
  return {
    examName,
    className: student.className,
    section: student.section,
    session: getSchoolProfile().academicYear,
    rows,
    totalMax,
    totalObtained,
    percentage: pct,
    grade: pct >= 90 ? 'A1' : pct >= 80 ? 'A2' : pct >= 70 ? 'B1' : pct >= 60 ? 'B2' : pct >= 50 ? 'C1' : pct >= 33 ? 'C2' : 'E',
    result: pct >= 33 ? 'PASS' : 'FAIL',
    remarks: 'Conduct: Excellent. Regularity: Satisfactory.',
  }
}

/** Sample transaction for receipt template previews (student's first, else first overall). */
export function sampleTransaction(
  student: StudentRecord | undefined,
  transactions: FeeTransaction[],
): PreviewTransaction | undefined {
  const live = (student && transactions.find((t) => t.studentId === student.id)) || transactions[0]
  if (live) return live
  if (!student) return undefined
  return {
    receiptNo: 'RCPT-SAMPLE',
    date: new Date().toISOString(),
    studentName: student.name,
    admissionNo: student.admissionNo,
    className: student.className,
    mode: 'Cash',
    referenceNo: null,
    feeHead: 'Tuition Fee',
    purpose: 'Tuition Fee — Term II',
    amount: student.feeTotal || 12500,
    verifiedBy: 'Accounts Office',
  }
}

// ─── Document HTML builder (real Download / Print output) ─────────────

function esc(v: unknown): string {
  return String(v ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const DOC_TITLE: Record<DocType, string> = {
  'Bonafide': 'BONAFIDE CERTIFICATE',
  'Transfer': 'TRANSFER CERTIFICATE',
  'Character': 'CHARACTER CERTIFICATE',
  'Migration': 'MIGRATION CERTIFICATE',
  'ID Card': 'STUDENT IDENTITY CARD',
  'Fee Receipt': 'FEE RECEIPT',
  'Marksheet': 'STATEMENT OF MARKS',
}

/**
 * Build a standalone, printable HTML document for a generated record.
 * Used by Download actions and Print (new-window) in Certificates History
 * and the Downloads library — the file the user receives is a real,
 * branded document, not a raw data dump.
 */
export function buildDocumentHTML(doc: GeneratedDocument, profile?: SchoolProfile): string {
  const p = profile ?? getSchoolProfile()
  const student = resolvePreviewStudent(doc, [])
  const name = esc(student?.name ?? doc.studentName)
  const adm = esc(doc.admissionNo ?? student?.admissionNo)
  const cls = esc(doc.class ?? student?.className)
  const title = DOC_TITLE[doc.docType] ?? esc(doc.docType)

  const metaRow = (label: string, value: string) =>
    `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`

  let body = ''
  if (doc.docType === 'Marksheet' && doc.data?.marksheet) {
    const ms = doc.data.marksheet
    const rows = (ms.rows ?? [])
      .map((r: any) => `<tr><td>${esc(r.subject)}</td><td class="c">${esc(r.max)}</td><td class="c">${esc(r.pass)}</td><td class="c">${esc(r.isAbsent ? 'AB' : r.obtained)}</td></tr>`)
      .join('')
    body = `
      <table class="data">
        <thead><tr><th>Subject</th><th class="c">Max</th><th class="c">Pass</th><th class="c">Obtained</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><th>Total</th><th class="c">${esc(ms.totalMax)}</th><th class="c">—</th><th class="c">${esc(ms.totalObtained)}</th></tr></tfoot>
      </table>
      <table class="meta">
        ${metaRow('Percentage', `${Number(ms.percentage ?? 0).toFixed(1)}%`)}
        ${metaRow('Grade', ms.grade)}
        ${metaRow('Result', ms.result)}
        ${metaRow('Remarks', ms.remarks ?? '—')}
      </table>`
  } else if (doc.docType === 'Fee Receipt') {
    const txn = doc.data?.transaction ?? {}
    body = `
      <table class="meta">
        ${metaRow('Receipt No', txn.receiptNo ?? doc.data?.receiptNo)}
        ${metaRow('Date', formatDate(txn.date ?? doc.generatedAt))}
        ${metaRow('Student', txn.studentName ?? name)}
        ${metaRow('Admission No', txn.admissionNo ?? adm)}
        ${metaRow('Class', txn.className ?? cls)}
        ${metaRow('Payment Mode', txn.mode ?? '—')}
        ${metaRow('Fee Head', txn.feeHead ?? '—')}
        ${metaRow('Purpose', txn.purpose ?? doc.data?.purpose ?? '—')}
        ${metaRow('Reference No', txn.referenceNo ?? '—')}
        ${metaRow('Amount', formatINR(Number(txn.amount ?? doc.data?.amount ?? 0)))}
      </table>`
  } else if (doc.docType === 'ID Card') {
    body = `
      <table class="meta">
        ${metaRow('Name', name)}
        ${metaRow('Admission No', adm)}
        ${metaRow('Class', cls)}
        ${metaRow('Roll No', student?.rollNo ?? '—')}
        ${metaRow('Date of Birth', student?.dob ? formatDate(student.dob) : '—')}
        ${metaRow('Blood Group', student?.bloodGroup ?? '—')}
        ${metaRow('Valid For', p.academicYear)}
      </table>`
  } else {
    const purpose = doc.data?.purpose ?? '—'
    body = `
      <p class="body">
        This is to certify that <strong>${name}</strong>, bearing admission
        number <strong>${esc(adm)}</strong>, of <strong>${esc(cls)}</strong>,
        is associated with ${esc(p.name)} for the academic year
        <strong>${esc(p.academicYear)}</strong>.
      </p>
      <table class="meta">
        ${metaRow('Admission No', adm)}
        ${metaRow('Class', cls)}
        ${metaRow('Date of Birth', student?.dob ? formatDate(student.dob) : '—')}
        ${metaRow('Purpose', purpose)}
      </table>`
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(doc.docNumber)} — ${esc(doc.docType)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; margin: 40px auto; max-width: 720px; color: #1e293b; }
  .letterhead { text-align: center; border-bottom: 3px double #0f766e; padding-bottom: 14px; margin-bottom: 22px; }
  .school { font-size: 22px; font-weight: bold; color: #0f172a; letter-spacing: 0.02em; }
  .aff { font-size: 11px; color: #475569; margin-top: 4px; }
  .contact { font-size: 10px; color: #64748b; margin-top: 2px; }
  h1 { text-align: center; font-size: 15px; letter-spacing: 0.25em; margin: 18px 0 6px; color: #0f172a; }
  .docmeta { display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin: 0 0 16px; font-family: ui-monospace, monospace; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  table.data th, table.data td { border: 1px solid #94a3b8; padding: 7px 10px; font-size: 12px; }
  table.data thead th, table.data tfoot th { background: #f0fdfa; color: #0f766e; text-align: left; }
  .c { text-align: center; }
  table.meta td, table.meta th { border: 1px solid #cbd5e1; padding: 7px 10px; font-size: 12px; }
  table.meta th { background: #f8fafc; color: #475569; text-align: left; width: 34%; font-weight: 600; }
  p.body { font-size: 13px; line-height: 1.75; margin: 14px 0; }
  .sign { display: flex; justify-content: space-between; margin-top: 56px; font-size: 11px; color: #334155; }
  .sign div { text-align: center; width: 40%; }
  .sign .line { border-top: 1px solid #64748b; margin-bottom: 5px; padding-top: 18px; }
  .foot { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 26px; }
</style>
</head>
<body>
  <div class="letterhead">
    <div class="school">${esc(p.name)}</div>
    <div class="aff">${esc(p.affiliation)}</div>
    <div class="contact">${esc(p.address)} · ${esc(p.phone)} · ${esc(p.email)}</div>
  </div>
  <h1>${esc(title)}</h1>
  <div class="docmeta"><span>No: ${esc(doc.docNumber)}</span><span>Date: ${formatDate(doc.generatedAt)}</span></div>
  ${body}
  <div class="sign">
    <div><div class="line">Office / Clerk</div></div>
    <div><div class="line">${esc(p.principal)}<br />Principal</div></div>
  </div>
  <p class="foot">Computer-generated document · Issued by ${esc(doc.generatedBy)} on ${formatDate(doc.generatedAt)} · Status: ${esc(doc.status)}</p>
</body>
</html>`
}
