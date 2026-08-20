'use client'

/**
 * fees-receipt — REAL school payment receipt (thermal-printer style).
 *
 * Visually resembles something that could come out of a school receipt
 * printer. 80mm thermal receipt format with monospaced alignment,
 * strong separators, clear totals.
 *
 * - PrintReceipt      — print-only CSS
 * - ReceiptPrintView  — the receipt rendered for print
 * - ReceiptPreview    — on-screen preview with paper texture
 * - generateReceiptHTML — for download as standalone HTML
 */

import { motion } from 'framer-motion'
import { Printer, Download, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { school } from '@/lib/mock/school'
import { formatINR, formatDate } from '@/lib/format'
import type { FeeTransaction, ReceiptSettings } from '@/lib/store/fee-store'

interface ReceiptProps {
  transaction: FeeTransaction
  settings: ReceiptSettings
  onClose?: () => void
  onPrint?: () => void
  onDownload?: () => void
  mode?: 'preview' | 'print'
}

// Build line items from the transaction — splits by fee head + includes late fee if any.
function buildLineItems(t: FeeTransaction) {
  const items: Array<{ label: string; amount: number }> = []
  items.push({ label: t.feeHead, amount: t.amount })
  return items
}

export function ReceiptPreview({ transaction: t, settings, onClose, onPrint, onDownload }: ReceiptProps) {
  const items = buildLineItems(t)
  const total = items.reduce((s, i) => s + i.amount, 0)
  const widthClass = settings.paperSize === '80mm' ? 'w-[280px]' : 'w-[400px]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center"
    >
      {/* Action bar */}
      <div className="flex items-center justify-between w-full mb-3">
        <p className="text-xs font-semibold text-muted-foreground">Receipt Preview</p>
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
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Thermal receipt paper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`${widthClass} bg-white text-black shadow-xl rounded-sm overflow-hidden receipt-paper`}
      >
        {/* Perforated top edge */}
        <div className="h-2 bg-white" style={{ maskImage: 'radial-gradient(circle at 6px 0, transparent 4px, black 4px)', WebkitMaskImage: 'radial-gradient(circle at 6px 0, transparent 4px, black 4px)', maskSize: '12px 4px', WebkitMaskSize: '12px 4px', maskRepeat: 'repeat-x', WebkitMaskRepeat: 'repeat-x' }} />

        <div className="px-4 py-3 font-mono text-[10px] leading-tight">
          {/* School header */}
          <div className="text-center mb-2">
            <p className="font-bold text-[12px] tracking-tight">{school.name.toUpperCase()}</p>
            <p className="text-[9px] text-gray-600 mt-0.5">{school.address}</p>
            <p className="text-[9px] text-gray-600">Ph: {school.phone}</p>
            <p className="text-[9px] text-gray-600">{school.email}</p>
            <p className="text-[9px] text-gray-600">Affiliation: {school.affiliation}</p>
          </div>

          {/* Separator */}
          <Separator />

          {/* Receipt title */}
          <div className="text-center my-2">
            <p className="font-bold text-[11px] tracking-[0.2em]">FEE PAYMENT RECEIPT</p>
          </div>

          <Separator />

          {/* Receipt meta */}
          <div className="space-y-0.5 my-2">
            <Row label="Receipt No" value={t.receiptNo} bold />
            <Row label="Date" value={formatDate(t.date)} />
            <Row label="Academic Year" value={t.academicYear} />
          </div>

          <Separator />

          {/* Student details */}
          <div className="space-y-0.5 my-2">
            <Row label="Student" value={t.studentName} bold />
            <Row label="Student ID" value={t.admissionNo} />
            <Row label="Class" value={t.className} />
          </div>

          <Separator />

          {/* Line items */}
          <div className="my-2">
            <div className="flex justify-between text-[9px] text-gray-600 font-semibold uppercase tracking-wider mb-1">
              <span>Fee Head</span>
              <span>Amount</span>
            </div>
            <Separator light />
            <div className="space-y-0.5 mt-1">
              {items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="truncate flex-1 pr-2">{i.label}</span>
                  <span className="tabular-nums font-semibold">{formatINR(i.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="my-2 space-y-0.5">
            <Row label="TOTAL" value={formatINR(total)} bold />
            <Row label="PAID" value={formatINR(t.amount)} bold success />
            <Row label="BALANCE" value="—" />
          </div>

          <Separator />

          {/* Payment mode */}
          <div className="my-2 space-y-0.5">
            <Row label="Payment Mode" value={t.mode} />
            {t.referenceNo && <Row label="Transaction Ref" value={t.referenceNo} />}
            {t.meta?.bankName && <Row label="Bank" value={t.meta.bankName} />}
            {t.meta?.chequeNumber && <Row label="Cheque No" value={t.meta.chequeNumber} />}
            {t.meta?.cardLast4 && <Row label="Card" value={`****${t.meta.cardLast4}`} />}
            {t.meta?.upiId && <Row label="UPI ID" value={t.meta.upiId} />}
          </div>

          <Separator />

          {/* Signatures */}
          <div className="my-3 flex justify-between text-[9px] text-gray-700">
            <div>
              <p className="font-semibold">Received By:</p>
              <p className="mt-3 border-t border-gray-400 pt-0.5 w-20 truncate">{t.collectedBy}</p>
            </div>
            {settings.showAuthorizedSignature && (
              <div className="text-right">
                <p className="font-semibold">Authorized By:</p>
                <p className="mt-3 border-t border-gray-400 pt-0.5 w-20 ml-auto truncate">{school.principal}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center my-2">
            <p className="text-[9px] text-gray-700">{settings.footerMessage}</p>
            <p className="text-[8px] text-gray-500 mt-1">This is a computer-generated receipt.</p>
            <div className="mt-2 inline-flex items-center gap-0.5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <span key={i} className="text-[14px] leading-none">{Math.floor((t.id.charCodeAt(i % t.id.length) + i) % 10)}</span>
              ))}
            </div>
            <p className="text-[8px] text-gray-400 mt-0.5">scan: scholario.in/r/{t.receiptNo}</p>
          </div>
        </div>

        {/* Perforated bottom edge */}
        <div className="h-2 bg-white" style={{ maskImage: 'radial-gradient(circle at 6px 100%, transparent 4px, black 4px)', WebkitMaskImage: 'radial-gradient(circle at 6px 100%, transparent 4px, black 4px)', maskSize: '12px 4px', WebkitMaskSize: '12px 4px', maskRepeat: 'repeat-x', WebkitMaskRepeat: 'repeat-x' }} />
      </motion.div>

      <style jsx>{`
        .receipt-paper {
          background: linear-gradient(180deg, #fdfcfa 0%, #ffffff 100%);
        }
        @media print {
          body * { visibility: hidden; }
          .receipt-paper, .receipt-paper * { visibility: visible; }
          .receipt-paper {
            position: absolute;
            left: 0;
            top: 0;
            box-shadow: none;
            border-radius: 0;
          }
        }
      `}</style>
    </motion.div>
  )
}

function Separator({ light }: { light?: boolean }) {
  return <div className={light ? 'border-t border-dashed border-gray-300' : 'border-t border-dashed border-gray-400'} />
}

function Row({ label, value, bold, success }: { label: string; value: string; bold?: boolean; success?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-bold' : 'text-gray-600'}>{label}:</span>
      <span className={`tabular-nums ${bold ? 'font-bold' : ''} ${success ? 'text-green-700' : ''}`}>{value}</span>
    </div>
  )
}

// ─── Generate downloadable HTML receipt ─────────────────────────────

export function generateReceiptHTML(t: FeeTransaction, settings: ReceiptSettings): string {
  const items = buildLineItems(t)
  const itemsHTML = items.map((i) => `
    <tr>
      <td style="padding:2px 0;">${i.label}</td>
      <td style="padding:2px 0;text-align:right;font-weight:600;">${formatINR(i.amount)}</td>
    </tr>`).join('')
  const total = items.reduce((s, i) => s + i.amount, 0)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Receipt ${t.receiptNo}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font-family: 'Courier New', monospace; font-size: 10px; color: #000; margin: 0; padding: 8px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .sep { border-top: 1px dashed #555; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; }
  table { width: 100%; border-collapse: collapse; }
  .sig { display: flex; justify-content: space-between; margin-top: 12px; }
  .sig-line { border-top: 1px solid #444; padding-top: 2px; min-width: 80px; }
</style>
</head>
<body>
  <div class="center">
    <p class="bold" style="font-size:12px;">${school.name.toUpperCase()}</p>
    <p style="font-size:9px;color:#444;">${school.address}</p>
    <p style="font-size:9px;color:#444;">Ph: ${school.phone}</p>
    <p style="font-size:9px;color:#444;">${school.email}</p>
    <p style="font-size:9px;color:#444;">${school.affiliation}</p>
  </div>
  <div class="sep"></div>
  <div class="center bold" style="font-size:11px;letter-spacing:2px;">FEE PAYMENT RECEIPT</div>
  <div class="sep"></div>
  <div class="row"><span class="bold">Receipt No:</span><span class="bold">${t.receiptNo}</span></div>
  <div class="row"><span>Date:</span><span>${formatDate(t.date)}</span></div>
  <div class="row"><span>Academic Year:</span><span>${t.academicYear}</span></div>
  <div class="sep"></div>
  <div class="row"><span class="bold">Student:</span><span class="bold">${t.studentName}</span></div>
  <div class="row"><span>Student ID:</span><span>${t.admissionNo}</span></div>
  <div class="row"><span>Class:</span><span>${t.className}</span></div>
  <div class="sep"></div>
  <table>
    <tr style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;">
      <td style="padding:2px 0;">Fee Head</td>
      <td style="padding:2px 0;text-align:right;">Amount</td>
    </tr>
    <tr><td colspan="2"><div class="sep" style="border-color:#aaa;"></div></td></tr>
    ${itemsHTML}
  </table>
  <div class="sep"></div>
  <div class="row"><span class="bold">TOTAL:</span><span class="bold">${formatINR(total)}</span></div>
  <div class="row"><span class="bold">PAID:</span><span class="bold" style="color:#15803d;">${formatINR(t.amount)}</span></div>
  <div class="row"><span>BALANCE:</span><span>—</span></div>
  <div class="sep"></div>
  <div class="row"><span>Payment Mode:</span><span>${t.mode}</span></div>
  ${t.referenceNo ? `<div class="row"><span>Transaction Ref:</span><span>${t.referenceNo}</span></div>` : ''}
  ${t.meta?.bankName ? `<div class="row"><span>Bank:</span><span>${t.meta.bankName}</span></div>` : ''}
  ${t.meta?.chequeNumber ? `<div class="row"><span>Cheque No:</span><span>${t.meta.chequeNumber}</span></div>` : ''}
  <div class="sep"></div>
  <div class="sig">
    <div>
      <p class="bold">Received By:</p>
      <div class="sig-line">${t.collectedBy}</div>
    </div>
    ${settings.showAuthorizedSignature ? `<div style="text-align:right;">
      <p class="bold">Authorized By:</p>
      <div class="sig-line">${school.principal}</div>
    </div>` : ''}
  </div>
  <div class="sep"></div>
  <div class="center" style="margin-top:8px;">
    <p style="font-size:9px;color:#444;">${settings.footerMessage}</p>
    <p style="font-size:8px;color:#666;">This is a computer-generated receipt.</p>
  </div>
</body>
</html>`
}

export function downloadReceiptHTML(t: FeeTransaction, settings: ReceiptSettings) {
  const html = generateReceiptHTML(t, settings)
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

export function printReceipt(t: FeeTransaction, settings: ReceiptSettings) {
  const html = generateReceiptHTML(t, settings)
  const w = window.open('', '_blank', 'width=400,height=600')
  if (!w) return
  w.document.write(html)
  w.document.close()
  setTimeout(() => {
    w.focus()
    w.print()
  }, 200)
}
