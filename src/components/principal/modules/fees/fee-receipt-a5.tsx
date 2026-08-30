'use client'

/**
 * fee-receipt-a5 — THE canonical school fee receipt (PAY-REWORK-1).
 *
 * Physical format: A5 LANDSCAPE — 210mm × 148mm — TWO copies side-by-side
 * (STUDENT COPY left · SCHOOL COPY right) separated by a subtle tear line.
 * One sheet per successful payment; a bulk print/download produces one
 * sheet per payment, never a second page per payment.
 *
 * Data rules (spec §15):
 *   - EVERY value is derived from the canonical payment record + school
 *     profile + student record. Nothing is hardcoded.
 *   - Fields that do not exist for a payment are simply not rendered
 *     (e.g. gateway ref on a cash payment, UPI id on a card payment).
 *   - Balance Dues Remaining comes from the SAME account computation the
 *     Student Accounts / Transactions surfaces use — the receipt can never
 *     contradict the ledger.
 *
 * Lifecycle rules (spec §11):
 *   - 'Under Verification' → the sheet carries an honest PENDING
 *     VERIFICATION notice and is NOT presented as an official receipt.
 *   - 'Failed' → NOT-A-COMPLETED-PAYMENT notice, never a receipt.
 *   - 'Success' → official receipt, identical from every authorised role.
 *
 * Print engine (spec §18): standalone HTML document with
 *   @page { size: A5 landscape; margin: 0 }
 * No CDN dependencies (no Tailwind/Google Fonts/Lucide) — the printable
 * markup carries its own inline CSS. The on-screen preview is the same
 * layout rendered as DOM and scaled to fit its container.
 *
 * Deliberately NOT here: printer toolbars, browser instructions, grey
 * backdrops (spec §19). Actions live in the calling UI.
 */

import { useEffect, useRef, useState } from 'react'
import { Printer, Download, X, Receipt as ReceiptIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { school } from '@/lib/mock/school'
import { formatINR, formatDate, amountInWordsINR } from '@/lib/format'
import { useStudentsStore } from '@/lib/store/students-store'
import { useFeeStore, getStudentBalanceDue, type FeeTransaction, type ReceiptSettings } from '@/lib/store/fee-store'
import { cn } from '@/lib/utils'

// ─── Public types ─────────────────────────────────────────────────────

export interface ReceiptLine {
  particulars: string
  period?: string
  amount: number
}

export interface ReceiptContext {
  /** Balance remaining AFTER this payment (canonical account outstanding). */
  balanceDue?: number | null
  /** Discount / concession applied to the obligation (rendered only when > 0). */
  discount?: number
  /** Extra fee rows (defaults to the payment's own fee head). */
  lines?: ReceiptLine[]
}

// ─── Data assembly (shared by preview + print/download) ──────────────

/** Build the receipt's fee rows from the canonical payment. One payment =
 *  one obligation in the ledger model, so the default is a single row;
 *  `lines` overrides when a caller aggregates several heads. */
export function buildReceiptLines(t: FeeTransaction, ctx?: ReceiptContext): ReceiptLine[] {
  if (ctx?.lines?.length) return ctx.lines
  return [{ particulars: t.feeHead, amount: t.amount }]
}

function resolveStudent(t: FeeTransaction) {
  return useStudentsStore.getState().students.find((s) => s.id === t.studentId)
    ?? useStudentsStore.getState().students.find((s) => s.admissionNo === t.admissionNo)
    ?? null
}

function resolveBalanceDue(t: FeeTransaction, ctx?: ReceiptContext): number | null {
  if (ctx && ctx.balanceDue !== undefined) return ctx.balanceDue
  return getStudentBalanceDue(t.studentId)
}

function paymentRef(t: FeeTransaction): string | null {
  return t.gatewayPaymentId ?? t.utr ?? t.referenceNo ?? null
}

function modeDetail(t: FeeTransaction): string | null {
  if (t.meta?.upiId) return t.meta.upiId
  if (t.meta?.chequeNumber) return `Cheque ${t.meta.chequeNumber}`
  if (t.meta?.cardLast4) return `Card ****${t.meta.cardLast4}`
  if (t.meta?.bankName) return t.meta.bankName
  return null
}

function dateLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}

function shortSession(t: FeeTransaction): string {
  // "2025-2026" → "25-26" for the Period column; already-short values pass through.
  const ay = t.academicYear
  const m = ay.match(/(\d{4})\D(\d{4})/)
  if (m) return `${m[1].slice(2)}-${m[2].slice(2)}`
  return ay
}

// ─── Copy data model ──────────────────────────────────────────────────

interface CopyData {
  designation: 'STUDENT COPY' | 'SCHOOL COPY'
  notes: string[]
}

function copyData(t: FeeTransaction, settings: ReceiptSettings, designation: CopyData['designation']): CopyData {
  if (designation === 'SCHOOL COPY') {
    return {
      designation,
      notes: [
        'Office audit record — for accounts ledger reconciliation.',
        `${settings.footerMessage}`,
      ],
    }
  }
  return {
    designation,
    notes: [
      'Fees once paid are non-refundable. Please retain this receipt.',
      `${settings.footerMessage}`,
    ],
  }
}

// ─── Preview (DOM, scaled) ────────────────────────────────────────────

export function FeeReceiptA5Preview({
  transaction: t,
  settings,
  ctx,
  onPrint,
  onDownload,
  onClose,
}: {
  transaction: FeeTransaction
  settings: ReceiptSettings
  ctx?: ReceiptContext
  onPrint?: () => void
  onDownload?: () => void
  onClose?: () => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.8)

  // Fit the 210mm × 148mm (≈794×561px) sheet into BOTH the available width
  // and a comfortable fraction of the viewport height — responsive,
  // proportional scaling; never crop (spec §33).
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = Math.max(300, window.innerHeight * 0.58)
      setScale(Math.min(1, Math.max(0.28, Math.min((w - 8) / 794, h / 561))))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="flex flex-col items-center w-full">
      {(onPrint || onDownload || onClose) && (
        <div className="flex items-center justify-between w-full mb-2.5">
          <p className="text-[11px] font-semibold text-muted-foreground">Receipt preview · A5 landscape</p>
          <div className="flex items-center gap-1">
            {onPrint && (
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={onPrint}>
                <Printer className="h-3 w-3" /> Print
              </Button>
            )}
            {onDownload && (
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={onDownload}>
                <Download className="h-3 w-3" /> Download
              </Button>
            )}
            {onClose && (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose} aria-label="Close receipt preview">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div ref={wrapRef} className="w-full overflow-hidden" data-testid="a5-receipt-preview">
        {/* Outer box reserves the SCALED size so surrounding layout flows
            correctly; the inner node scales the exact mm-sized sheet. */}
        <div style={{ width: 794 * scale, height: 561 * scale, margin: '0 auto' }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 794, height: 561 }}>
            <A5Sheet transaction={t} settings={settings} ctx={ctx} />
          </div>
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground mt-1.5">
        Prints on A5 landscape (210 × 148 mm) · Student copy + School copy on one sheet
      </p>
    </div>
  )
}

// ─── The A5 sheet (DOM version) ───────────────────────────────────────

export function A5Sheet({ transaction: t, settings, ctx }: { transaction: FeeTransaction; settings: ReceiptSettings; ctx?: ReceiptContext }) {
  const student = resolveStudent(t)
  const balanceDue = resolveBalanceDue(t, ctx)
  const lines = buildReceiptLines(t, ctx)
  return (
    <div
      data-testid="a5-receipt-sheet"
      className="bg-white text-slate-950 grid"
      style={{
        width: '210mm',
        height: '148mm',
        padding: '4mm 5mm',
        gridTemplateColumns: '1fr 8px 1fr',
        gridTemplateRows: '1fr',
        gap: '3mm',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        fontSize: '7.5px',
        lineHeight: 1.2,
      }}
    >
      <ReceiptCopy transaction={t} settings={settings} ctx={{ ...ctx, balanceDue }} student={student} lines={lines} data={copyData(t, settings, 'STUDENT COPY')} />
      <TearLine />
      <ReceiptCopy transaction={t} settings={settings} ctx={{ ...ctx, balanceDue }} student={student} lines={lines} data={copyData(t, settings, 'SCHOOL COPY')} />
    </div>
  )
}

function TearLine() {
  return (
    <div className="flex flex-col items-center justify-center select-none" style={{ borderLeft: '1px dashed #94a3b8' }} aria-hidden>
      <span
        className="whitespace-nowrap font-bold text-slate-400"
        style={{ writingMode: 'vertical-rl', fontSize: '5.5px', letterSpacing: '0.18em', fontFamily: 'ui-monospace, monospace' }}
      >
        ✂ CUT HERE
      </span>
    </div>
  )
}

function ReceiptCopy({
  transaction: t,
  settings,
  ctx,
  student,
  lines,
  data,
}: {
  transaction: FeeTransaction
  settings: ReceiptSettings
  ctx: ReceiptContext
  student: ReturnType<typeof resolveStudent>
  lines: ReceiptLine[]
  data: CopyData
}) {
  const ref = paymentRef(t)
  const md = modeDetail(t)
  const official = t.status === 'Success'
  const balance = ctx.balanceDue

  return (
    <div
      className="flex flex-col"
      style={{
        border: '1.2px solid #0f172a',
        borderRadius: '3px',
        padding: '4.5px 6.5px',
        gap: '3.5px',
        background: '#fff',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '1.2px solid #0f172a', paddingBottom: '2px' }}>
        <div className="flex items-center justify-between">
          <div className="text-left font-semibold text-slate-600" style={{ fontSize: '6px', lineHeight: 1.1 }}>
            <p>{school.affiliation}</p>
            <p style={{ marginTop: '1px' }}>Code: {school.code}</p>
          </div>
          <div>
            <p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '0.04em', lineHeight: 1.1 }}>{school.name}</p>
            <p className="font-medium text-slate-600" style={{ fontSize: '6.5px', marginTop: '1px' }}>
              {school.address} • Ph: {school.phone}
            </p>
          </div>
          <div className="text-right">
            <span
              className="inline-block font-extrabold uppercase text-white"
              style={{ background: '#0f172a', fontSize: '6px', padding: '1.5px 4px', borderRadius: '2px', letterSpacing: '0.08em' }}
            >
              {data.designation}
            </span>
          </div>
        </div>
      </div>

      {/* Honest lifecycle state (spec §11) — never present a pending/rejected
          payment as an official receipt. */}
      {!official && (
        <div
          className="font-bold"
          style={{
            fontSize: '6.5px',
            padding: '2px 5px',
            borderRadius: '2px',
            border: '0.8px solid',
            ...(t.status === 'Failed'
              ? { background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }
              : { background: '#fffbeb', borderColor: '#fcd34d', color: '#b45309' }),
          }}
        >
          {t.status === 'Failed'
            ? 'PAYMENT NOT COMPLETED — this is not a receipt. No money was recorded.'
            : 'PENDING VERIFICATION — becomes an official receipt once the school office verifies this payment.'}
        </div>
      )}

      {/* Details */}
      <div
        className="grid font-medium"
        style={{ gridTemplateColumns: '1fr 1fr', background: '#f8fafc', padding: '2.5px 4px', borderRadius: '2px', border: '0.8px solid #e2e8f0', fontSize: '7.5px', columnGap: '8px', rowGap: '1px' }}
      >
        <div>
          <p><span className="text-slate-500 font-normal">Receipt No:</span> <strong>{t.receiptNo}</strong></p>
          <p><span className="text-slate-500 font-normal">Student:</span> <strong>{t.studentName}</strong></p>
          <p><span className="text-slate-500 font-normal">Adm No:</span> <strong>{t.admissionNo}</strong>{student?.rollNo ? <span> | Roll: {student.rollNo}</span> : null}</p>
        </div>
        <div className="text-right">
          <p><span className="text-slate-500 font-normal">Date:</span> <strong>{dateLabel(t.date)}</strong></p>
          <p><span className="text-slate-500 font-normal">Class:</span> <strong>{t.className}{student?.section ? ` - ${student.section}` : ''}</strong></p>
          {(student?.fatherName || student?.guardianName) && (
            <p><span className="text-slate-500 font-normal">Father:</span> <strong>{student.fatherName || student.guardianName}</strong></p>
          )}
        </div>
      </div>

      {/* Fee table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7px' }}>
        <thead style={{ background: '#f1f5f9', fontWeight: 700, color: '#1e293b' }}>
          <tr>
            <th className="text-left" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>Particulars</th>
            <th className="text-center" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>Period</th>
            <th className="text-right" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>{l.particulars}</td>
              <td className="text-center text-slate-500" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>{l.period ?? shortSession(t)}</td>
              <td className="text-right font-medium" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>{formatINR(l.amount, true)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot style={{ fontWeight: 700 }}>
          {ctx.discount != null && ctx.discount > 0 && (
            <tr>
              <td colSpan={2} className="text-right text-slate-600" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>Discount / Concession:</td>
              <td className="text-right" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1', color: '#e11d48' }}>- {formatINR(ctx.discount, true)}</td>
            </tr>
          )}
          <tr style={{ background: '#f1f5f9', fontSize: '7.5px' }}>
            <td colSpan={2} className="text-right font-extrabold" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>Total Paid Amount:</td>
            <td className="text-right font-black" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>₹ {formatINR(t.amount, true)}</td>
          </tr>
          {balance != null && (
            <tr className="text-slate-500" style={{ fontSize: '6.5px' }}>
              <td colSpan={2} className="text-right font-normal" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1' }}>Balance Dues Remaining:</td>
              <td className="text-right font-bold" style={{ padding: '1.8px 3.5px', border: '0.8px solid #cbd5e1', color: '#047857' }}>
                {balance <= 0 ? '₹ 0.00 (NIL)' : `₹ ${formatINR(balance, true)}`}
              </td>
            </tr>
          )}
        </tfoot>
      </table>

      {/* Amount in words */}
      <div style={{ background: '#f8fafc', padding: '1.5px 4px', borderRadius: '2px', border: '0.8px solid #e2e8f0', fontSize: '6.5px' }}>
        <span className="text-slate-500">In Words:</span>{' '}
        <strong className="italic font-semibold text-slate-900">{amountInWordsINR(t.amount)}</strong>
      </div>

      {/* Payment info */}
      <div className="flex justify-between items-center" style={{ background: '#f8fafc', padding: '1.5px 4px', borderRadius: '2px', border: '0.8px solid #e2e8f0', fontSize: '6px' }}>
        <span>Mode: <strong>{t.mode.toUpperCase()}</strong>{md ? ` (${md})` : ''}</span>
        {ref && <span>Txn Ref: <strong className="font-mono">{ref}</strong></span>}
        <span>{data.designation === 'SCHOOL COPY' ? 'Verified By:' : 'Received By:'} <strong>{official ? (t.verifiedBy ?? t.collectedBy) : '—'}</strong></span>
      </div>

      {/* Notes */}
      <div className="text-slate-500" style={{ fontSize: '6px', borderTop: '0.8px solid #e2e8f0', paddingTop: '1.5px', lineHeight: 1.25 }}>
        {data.notes.map((n, i) => (
          <p key={i}>{i + 1}. {n}</p>
        ))}
        {t.status === 'Under Verification' && (
          <p>{data.notes.length + 1}. Collected by {t.collectedBy} — verification by the school office is pending.</p>
        )}
      </div>

      {/* Signatures — pinned near the bottom (flex column + mt-auto) so a
          short receipt never leaves a giant blank gap (spec §17). */}
      <div className="grid text-center" style={{ gridTemplateColumns: '1fr 1fr', columnGap: '16px', fontSize: '6.5px', marginTop: 'auto', paddingTop: '2px' }}>
        <div>
          <p style={{ borderTop: '1px solid #94a3b8', paddingTop: '1.5px', color: '#475569', fontWeight: 500 }}>Parent / Depositor Sign</p>
        </div>
        {settings.showAuthorizedSignature ? (
          <div>
            <p style={{ borderTop: '1px solid #94a3b8', paddingTop: '1.5px', fontWeight: 700 }}>Cashier / Authorized Seal</p>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}

// ─── Print / download engine (standalone HTML — no CDNs) ─────────────

/** Escape user-derived values for safe interpolation into the HTML doc. */
function esc(v: string | number | null | undefined): string {
  if (v == null) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function receiptCopyHTML(
  t: FeeTransaction,
  settings: ReceiptSettings,
  ctx: ReceiptContext,
  data: CopyData,
): string {
  const ref = paymentRef(t)
  const md = modeDetail(t)
  const official = t.status === 'Success'
  const lines = buildReceiptLines(t, ctx)
  const balance = ctx.balanceDue
  const rowsHTML = lines.map((l) => `
        <tr>
          <td>${esc(l.particulars)}</td>
          <td class="c mut">${esc(l.period ?? '')}</td>
          <td class="r med">${esc(formatINR(l.amount, true))}</td>
        </tr>`).join('')

  return `
      <div class="copy">
        <div class="hdr">
          <div class="hdr-l">
            <p>${esc(school.affiliation)}</p>
            <p>Code: ${esc(school.code)}</p>
          </div>
          <div class="hdr-c">
            <h2>${esc(school.name)}</h2>
            <p>${esc(school.address)} &bull; Ph: ${esc(school.phone)}</p>
          </div>
          <div class="hdr-r"><span class="pill">${esc(data.designation)}</span></div>
        </div>
        ${official ? '' : t.status === 'Failed'
          ? '<div class="notice fail">PAYMENT NOT COMPLETED — this is not a receipt. No money was recorded.</div>'
          : '<div class="notice pend">PENDING VERIFICATION — becomes an official receipt once the school office verifies this payment.</div>'}
        <div class="det">
          <div>
            <p><span>Receipt No:</span> <strong>${esc(t.receiptNo)}</strong></p>
            <p><span>Student:</span> <strong>${esc(t.studentName)}</strong></p>
            <p><span>Adm No:</span> <strong>${esc(t.admissionNo)}</strong></p>
          </div>
          <div class="r">
            <p><span>Date:</span> <strong>${esc(dateLabel(t.date))}</strong></p>
            <p><span>Class:</span> <strong>${esc(t.className)}</strong></p>
          </div>
        </div>
        <table>
          <thead>
            <tr><th class="l">Particulars</th><th class="c">Period</th><th class="r">Amount (&#8377;)</th></tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
          <tfoot>
            ${ctx.discount != null && ctx.discount > 0 ? `
            <tr><td colspan="2" class="r mut">Discount / Concession:</td><td class="r disc">- ${esc(formatINR(ctx.discount, true))}</td></tr>` : ''}
            <tr class="total"><td colspan="2" class="r">Total Paid Amount:</td><td class="r black">&#8377; ${esc(formatINR(t.amount, true))}</td></tr>
            ${balance != null ? `
            <tr class="bal"><td colspan="2" class="r">Balance Dues Remaining:</td><td class="r green">${balance <= 0 ? '&#8377; 0.00 (NIL)' : '&#8377; ' + esc(formatINR(balance, true))}</td></tr>` : ''}
          </tfoot>
        </table>
        <div class="words"><span>In Words:</span> <strong>${esc(amountInWordsINR(t.amount))}</strong></div>
        <div class="pay">
          <span>Mode: <strong>${esc(t.mode.toUpperCase())}</strong>${md ? ` (${esc(md)})` : ''}</span>
          ${ref ? `<span>Txn Ref: <strong class="mono">${esc(ref)}</strong></span>` : ''}
          <span>${data.designation === 'SCHOOL COPY' ? 'Verified By:' : 'Received By:'} <strong>${official ? esc(t.verifiedBy ?? t.collectedBy) : '—'}</strong></span>
        </div>
        <div class="notes">
          ${data.notes.map((n, i) => `<p>${i + 1}. ${esc(n)}</p>`).join('')}
          ${t.status === 'Under Verification' ? `<p>${data.notes.length + 1}. Collected by ${esc(t.collectedBy)} — verification by the school office is pending.</p>` : ''}
        </div>
        <div class="sig">
          <div><p class="sig-line">Parent / Depositor Sign</p></div>
          ${settings.showAuthorizedSignature ? '<div><p class="sig-line bold">Cashier / Authorized Seal</p></div>' : '<div></div>'}
        </div>
      </div>`
}

function sheetHTML(t: FeeTransaction, settings: ReceiptSettings, ctx: ReceiptContext, student: ReturnType<typeof resolveStudent>): string {
  const bd = ctx.balanceDue
  const sharedCtx: ReceiptContext = { ...ctx, balanceDue: bd }
  return `
    <div class="sheet">
      ${receiptCopyHTML(t, settings, sharedCtx, copyData(t, settings, 'STUDENT COPY'))}
      <div class="tear"><span>&#9986; CUT HERE</span></div>
      ${receiptCopyHTML(t, settings, sharedCtx, copyData(t, settings, 'SCHOOL COPY'))}
    </div>`
}

/** Build the complete standalone HTML document for one or MANY payments
 *  (bulk = one A5 sheet per payment with page breaks, spec §21).
 *  autoPrint opens the browser print dialog on load — used by the PRINT
 *  flow only; downloads stay a plain file. */
export function generateReceiptsA5HTML(
  items: Array<{ transaction: FeeTransaction; ctx?: ReceiptContext }>,
  settings: ReceiptSettings,
  opts?: { autoPrint?: boolean },
): string {
  const body = items.map(({ transaction, ctx }) => {
    const student = resolveStudent(transaction)
    const balanceDue = resolveBalanceDue(transaction, ctx)
    const lines = buildReceiptLines(transaction, ctx)
    return sheetHTML(transaction, settings, { ...ctx, balanceDue, lines }, student)
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Scholario Fee Receipt${items.length > 1 ? `s (${items.length})` : ` ${esc(items[0]?.transaction.receiptNo ?? '')}`}</title>
<style>
  @page { size: A5 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { background: #94a3b8; display: flex; flex-direction: column; align-items: center;
         gap: 10px; padding: 15px; }
  .sheet { width: 210mm; height: 148mm; max-height: 148mm; background: #fff; padding: 4mm 5mm;
           display: grid; grid-template-columns: 1fr 8px 1fr; grid-template-rows: 1fr; gap: 3mm;
           box-shadow: 0 8px 25px rgba(0,0,0,.25); border-radius: 2px; overflow: hidden; }
  .copy { border: 1.2px solid #0f172a; border-radius: 3px; padding: 4.5px 6.5px; display: flex;
          flex-direction: column; gap: 3.5px; background: #fff; font-size: 7.5px; line-height: 1.2;
          min-height: 0; overflow: hidden; }
  .hdr { text-align: center; border-bottom: 1.2px solid #0f172a; padding-bottom: 2px; }
  .hdr .hdr-l { text-align: left; }
  .hdr .hdr-r { text-align: right; }
  .hdr > div { display: inline-block; vertical-align: middle; width: 32%; }
  .hdr-l { font-size: 6px; font-weight: 600; color: #475569; line-height: 1.2; }
  .hdr-c h2 { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; line-height: 1.1; }
  .hdr-c p { font-size: 6.5px; color: #475569; font-weight: 500; margin-top: 1px; }
  .pill { display: inline-block; background: #0f172a; color: #fff; font-weight: 800; font-size: 6px;
          text-transform: uppercase; padding: 1.5px 4px; border-radius: 2px; letter-spacing: .08em; }
  .notice { font-weight: 700; font-size: 6.5px; padding: 2px 5px; border-radius: 2px; border: .8px solid; }
  .notice.pend { background: #fffbeb; border-color: #fcd34d; color: #b45309; }
  .notice.fail { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
  .det { display: grid; grid-template-columns: 1fr 1fr; background: #f8fafc; padding: 2.5px 4px;
         border: .8px solid #e2e8f0; border-radius: 2px; font-size: 7.5px; font-weight: 500;
         column-gap: 8px; row-gap: 1px; }
  .det .r { text-align: right; }
  .det span { color: #64748b; font-weight: 400; }
  table { width: 100%; border-collapse: collapse; font-size: 7px; }
  th, td { padding: 1.8px 3.5px; border: .8px solid #cbd5e1; }
  th { background: #f1f5f9; font-weight: 700; color: #1e293b; }
  .l { text-align: left; } .c { text-align: center; } .r { text-align: right; }
  .mut { color: #64748b; } .med { font-weight: 500; }
  tfoot { font-weight: 700; }
  tfoot .total { background: #f1f5f9; font-size: 7.5px; }
  tfoot .total td.r { font-weight: 900; }
  tfoot .bal { font-size: 6.5px; color: #64748b; }
  .green { color: #047857; } .disc { color: #e11d48; }
  .black { font-weight: 900; }
  .words { background: #f8fafc; padding: 1.5px 4px; border: .8px solid #e2e8f0; border-radius: 2px;
           font-size: 6.5px; }
  .words span { color: #64748b; }
  .words strong { font-style: italic; font-weight: 600; color: #0f172a; }
  .pay { display: flex; justify-content: space-between; align-items: center; background: #f8fafc;
         padding: 1.5px 4px; border: .8px solid #e2e8f0; border-radius: 2px; font-size: 6px; }
  .mono { font-family: ui-monospace, 'Courier New', monospace; }
  .notes { font-size: 6px; color: #64748b; border-top: .8px solid #e2e8f0; padding-top: 1.5px;
           line-height: 1.3; }
  .sig { display: grid; grid-template-columns: 1fr 1fr; column-gap: 16px; text-align: center;
         font-size: 6.5px; margin-top: auto; padding-top: 2px; }
  .sig-line { border-top: 1px solid #94a3b8; padding-top: 1.5px; color: #475569; font-weight: 500; }
  .sig-line.bold { font-weight: 700; color: #0f172a; }
  .tear { display: flex; align-items: center; justify-content: center; border-left: 1px dashed #94a3b8;
          user-select: none; }
  .tear span { writing-mode: vertical-rl; font-size: 5.5px; font-weight: 700; letter-spacing: .18em;
               color: #94a3b8; font-family: ui-monospace, monospace; white-space: nowrap; }
  @media print {
    html, body { width: 210mm !important; background: #fff !important; padding: 0 !important;
                 margin: 0 !important; gap: 0 !important; display: block !important; overflow: hidden; }
    .sheet { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important;
             page-break-inside: avoid !important; }
    .sheet + .sheet { page-break-before: always !important; }
  }
</style>
</head>
<body>
${body}
${opts?.autoPrint ? "<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 300); });<\/script>" : ''}
</body>
</html>`
}

// ─── Actions used across the app (format-aware, spec §20/§21) ─────────

/** Print ONE payment's receipt (A5 landscape, no second page). */
export function printReceiptA5(t: FeeTransaction, settings: ReceiptSettings, ctx?: ReceiptContext) {
  const html = generateReceiptsA5HTML([{ transaction: t, ctx }], settings, { autoPrint: true })
  const w = window.open('', '_blank', 'width=860,height=640')
  if (!w) {
    return false
  }
  w.document.write(html)
  w.document.close()
  return true
}

/** Bulk print — one A5 sheet per payment. */
export function printReceiptsA5Bulk(items: Array<{ transaction: FeeTransaction; ctx?: ReceiptContext }>, settings: ReceiptSettings) {
  if (items.length === 0) return false
  const html = generateReceiptsA5HTML(items, settings, { autoPrint: true })
  const w = window.open('', '_blank', 'width=860,height=640')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  return true
}

/** Download ONE payment's receipt as a standalone, print-ready HTML file. */
export function downloadReceiptA5(t: FeeTransaction, settings: ReceiptSettings, ctx?: ReceiptContext) {
  const html = generateReceiptsA5HTML([{ transaction: t, ctx }], settings)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${t.receiptNo}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Bulk download — one HTML file, one A5 sheet per payment. */
export function downloadReceiptsA5Bulk(items: Array<{ transaction: FeeTransaction; ctx?: ReceiptContext }>, settings: ReceiptSettings) {
  if (items.length === 0) return
  const html = generateReceiptsA5HTML(items, settings)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `receipts-${items.length}-${new Date().toISOString().slice(0, 10)}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Shared receipt-view dialog ───────────────────────────────────────
// The single "View receipt" experience used by Payments, Transactions and
// the collect wizard. Compact actions in the dialog header; the printable
// area contains ONLY the receipt (spec §19).

export function ReceiptViewDialog({
  transaction,
  settings,
  open,
  onOpenChange,
  actor = 'Principal',
}: {
  transaction: FeeTransaction | null
  settings: ReceiptSettings
  open: boolean
  onOpenChange: (open: boolean) => void
  actor?: string
}) {
  const markReceiptHandled = useFeeStore((s) => s.markReceiptHandled)

  const handlePrint = () => {
    if (!transaction) return
    const ok = printReceiptA5(transaction, settings)
    if (ok) {
      markReceiptHandled(transaction.id, actor)
      // toast in caller
    }
  }
  const handleDownload = () => {
    if (!transaction) return
    downloadReceiptA5(transaction, settings)
    markReceiptHandled(transaction.id, actor)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-sm">Receipt {transaction?.receiptNo}</DialogTitle>
          <DialogDescription className="text-[11px]">
            {transaction?.studentName} · {formatINR(transaction?.amount ?? 0, true)} · {transaction?.mode}
            {transaction && transaction.status !== 'Success' && ' · awaiting verification'}
          </DialogDescription>
        </DialogHeader>
        {transaction && (
          <FeeReceiptA5Preview
            transaction={transaction}
            settings={settings}
            onPrint={handlePrint}
            onDownload={handleDownload}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// Compact row actions used in lists (spec §20: small icons + concise labels).
export function ReceiptRowActions({
  transaction: t,
  settings,
  onView,
  className,
}: {
  transaction: FeeTransaction
  settings: ReceiptSettings
  onView?: (t: FeeTransaction) => void
  className?: string
}) {
  const markReceiptHandled = useFeeStore((s) => s.markReceiptHandled)
  const official = t.status === 'Success'
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {onView && (
        <Button
          size="sm" variant="ghost"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          title={official ? 'View receipt' : 'View payment acknowledgement'}
          aria-label={official ? `View receipt ${t.receiptNo}` : `View payment ${t.receiptNo}`}
          onClick={() => onView(t)}
        >
          <ReceiptIcon className="h-3 w-3" />
        </Button>
      )}
      <Button
        size="sm" variant="ghost"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        title={official ? 'Print receipt (A5)' : 'Print pending-verification slip'}
        aria-label={`Print receipt ${t.receiptNo}`}
        onClick={() => { printReceiptA5(t, settings); markReceiptHandled(t.id, 'Principal') }}
      >
        <Printer className="h-3 w-3" />
      </Button>
      <Button
        size="sm" variant="ghost"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        title="Download receipt"
        aria-label={`Download receipt ${t.receiptNo}`}
        onClick={() => { downloadReceiptA5(t, settings); markReceiptHandled(t.id, 'Principal') }}
      >
        <Download className="h-3 w-3" />
      </Button>
    </div>
  )
}
