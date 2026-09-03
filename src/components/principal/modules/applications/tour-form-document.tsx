'use client'

/**
 * TourFormDocument — the OFFICIAL A4 school document behind the built-in
 * "Educational Tour — Parent Consent Form".
 *
 * POLISH-1 design contract (final visual standard):
 *   • a REAL institutional form: serif typography, near-black ink, one A4 page
 *   • information hierarchy from the reference form — but MINIMAL boxing:
 *     every data field is a clean "label ……………… value-on-rule" row, sections
 *     are separated by whitespace + a small rule, and only the legal
 *     declaration keeps a (single) box
 *   • NO rounded cards, NO colour styling, NO dashboard language, NO fake
 *     data / stamps / signatures, NO technical text
 *   • blank copies print dotted fill-in rules; filled copies print the
 *     immutable submission snapshot (auto-filled from the school record)
 *
 * Structure (fixed forever — the form layout cannot be redesigned):
 *   A. School header: emblem · name · affiliation · address · photo box
 *      + circular no. / date row between two strong rules
 *   B. Title: PARENT CONSENT FORM · सहमति पत्र · Educational Tour — X
 *   C. Tour information rows (destination, dates, duration, fee, staff)
 *   D. Student details rows (name, admission no., class, section, roll,
 *      blood group — NO house: Scholario has no house system)
 *   E. Parent / guardian rows (name, mobile, address, emergency contact)
 *   F. Health / care rows (food preference, medical note, motion sickness)
 *   G. Parental undertaking & declaration — the single boxed block
 *   H. Signature area (student · parent/guardian · class teacher/in-charge)
 *   I. Office use — a slim strip below a dashed rule
 *
 * Print mechanics: same clone pipeline as the fee receipt — clone into
 * #print-root at body level, hide everything else via body.tour-printing,
 * restore on afterprint. @page A4 portrait, margin 0 (the document carries
 * its own 12mm margins).
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store/store'
import {
  deriveSubmissionPayment,
  type SchoolApplication, type ApplicationSubmission, type SubmissionPaymentInfo,
} from '@/lib/store/applications-store'
import { formatINR, formatDate } from '@/lib/format'

// ─── Download / print plumbing ─────────────────────────────────────────

/** Prints ONLY this document; everything else is hidden while printing. */
export function printTourDocument(): void {
  const node = document.querySelector('.tour-print-doc')
  if (!node) return window.print()
  let root = document.getElementById('print-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'print-root'
    document.body.appendChild(root)
  }
  root.replaceChildren(node.cloneNode(true))
  document.body.classList.add('tour-printing')
  const cleanup = () => {
    document.body.classList.remove('tour-printing')
    root?.replaceChildren()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  setTimeout(cleanup, 30_000)
  window.print()
}

const STANDALONE_CSS = `body{margin:0;background:#fff;font-family:Georgia,'Times New Roman',serif;-webkit-print-color-adjust:exact}
@page{size:A4 portrait;margin:0}
.tour-print-doc{width:210mm;min-height:297mm;box-sizing:border-box;padding:12mm 13mm 10mm;background:#fff;color:#111}
@media print{.tour-print-doc{box-shadow:none!important}}`

/** Wraps rendered document markup into a standalone printable HTML file. */
function downloadHtml(fileName: string, inner: string): void {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title><style>${STANDALONE_CSS}</style></head><body>${inner}</body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Downloads the live `.tour-print-doc` as a standalone print-ready file. */
export function downloadTourDocument(fileName: string): void {
  const node = document.querySelector('.tour-print-doc')
  if (!node) return
  downloadHtml(fileName, node.outerHTML)
}

/**
 * Bulk download: collects EVERY `.tour-print-doc` inside `containerEl`
 * (one per student), wraps each in a page with a page break, and produces
 * ONE print-ready file. Used by "download selected / all / class-wise /
 * gender-wise" sets.
 */
export function downloadTourDocumentBundle(containerEl: HTMLElement, fileName: string): number {
  const nodes = Array.from(containerEl.querySelectorAll('.tour-print-doc'))
  if (nodes.length === 0) return 0
  const inner = nodes
    .map((n) => `<div class="tour-page" style="page-break-after:always">${n.outerHTML}</div>`)
    .join('')
  downloadHtml(fileName, inner)
  return nodes.length
}

/** File name for a saved/printed artefact. */
export function tourDocFileName(app: SchoolApplication, sub?: ApplicationSubmission): string {
  const tour = app.title.replace(/[^\w]+/g, '-').slice(0, 36)
  return sub
    ? `${sub.serialNo ?? sub.id}-${sub.studentName.replace(/\s+/g, '-')}-${tour}`
    : `BLANK-${tour}`
}

// ─── A4 preview scaling (properly scaled, scrollable) ──────────────────

/**
 * `useFitA4Zoom` — measures the container and returns the zoom factor that
 * fits one 210mm page into its width (clamped 0.3–1). The wrapper applies
 * CSS `zoom`, so the print clone (which lives outside the wrapper) always
 * prints at natural A4 size.
 */
export function useFitA4Zoom<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null)
  const [zoom, setZoom] = useState(0.55)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      if (w > 0) setZoom(Math.min(1, Math.max(0.28, (w - 8) / 794)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return [ref, zoom]
}

// ─── Document primitives (school-office register, de-boxed) ────────────

/**
 * DocRow — the core field presentation: a bold small-caps label followed by
 * a fill-in rule. Blank copies print a dotted rule; filled copies print the
 * value sitting on a light hairline. This replaces the old bordered grid
 * cells — the form keeps its hierarchy with almost no boxes.
 */
function DocRow({ label, children, wide }: { label: string; children?: ReactNode; wide?: boolean }) {
  const filled = children !== undefined && children !== null && children !== ''
  return (
    <div
      className={wide ? 'col-span-2' : ''}
      style={{ display: 'flex', alignItems: 'baseline', gap: '2.2mm', padding: '0.7mm 0', minWidth: 0 } as React.CSSProperties}
    >
      <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#333', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          flex: 1, minWidth: 0, fontSize: '10px', color: '#111', textAlign: 'left',
          borderBottom: filled ? '0.2mm solid #b5b5b5' : '0.35mm dotted #777',
          paddingBottom: '0.3mm', lineHeight: 1.35,
        }}
      >
        {children ?? '\u00A0'}
      </span>
    </div>
  )
}

function PhotoBox() {
  return (
    <div
      className="shrink-0 flex flex-col items-center justify-start"
      style={{ width: '22mm', height: '28mm', border: '0.3mm dashed #444' }}
    >
      <p style={{ fontSize: '6px', color: '#666', marginTop: '9mm', textAlign: 'center', lineHeight: 1.35 }}>
        Affix recent<br />passport-size<br />photograph
      </p>
    </div>
  )
}

/** Section heading: bold caps + a light rule running to the margin. */
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-baseline" style={{ gap: '2.5mm', marginTop: '3.2mm', marginBottom: '0.6mm' }}>
      <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', color: '#111', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {children}
      </p>
      <span aria-hidden style={{ flex: 1, borderBottom: '0.2mm solid #999', transform: 'translateY(-0.4mm)' }} />
    </div>
  )
}

/** Two-column grid of DocRows with generous gutters, no borders. */
function RowGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2" style={{ columnGap: '7mm' }}>{children}</div>
}

// ─── The document ───────────────────────────────────────────────────────

export interface TourFormDocumentProps {
  app: SchoolApplication
  sub?: ApplicationSubmission
  /** Pre-resolved payment read-out for filled copies (optional). */
  payment?: SubmissionPaymentInfo
}

export function TourFormDocument({ app, sub, payment }: TourFormDocumentProps) {
  // Idempotent global styles for the clone-and-print strategy.
  useEffect(() => {
    const styleId = 'tour-print-style'
    if (!document.getElementById(styleId)) {
      const el = document.createElement('style')
      el.id = styleId
      el.textContent = `
        #print-root { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; }
          body.tour-printing > *:not(#print-root) { display: none !important; }
          body.tour-printing #print-root { display: block !important; }
          .tour-print-doc { box-shadow: none !important; }
        }`
      document.head.appendChild(el)
    }
  }, [])

  // Active school's own letterhead — tenant-scoped School Settings, never
  // a hardcoded school. Falls back to the store's seeded defaults.
  const g = useSchoolSettingsStore((s) => s.general)
  const schoolName = g.schoolName?.trim() || 'School'
  const logoText = (g.logoText || schoolName.split(/\s+/).slice(0, 2).map((w) => w[0]).join('')).toUpperCase()

  const pay = payment ?? (sub ? deriveSubmissionPayment(app, sub) : undefined)
  const datesLabel = app.eventDate
    ? `${formatDate(app.eventDate)}${app.tourEndDate ? ` – ${formatDate(app.tourEndDate)}` : ''}`
    : ''
  const destination = app.destination ?? '—'
  const feeLabel = app.payment.mode === 'None' ? 'Nil' : formatINR(app.payment.amount)
  const paymentStatus =
    !pay || app.payment.mode === 'None' ? null
      : pay.status === 'Paid' ? `PAID · Receipt ${pay.receiptNos.join(', ') || '—'}`
        : pay.status === 'Awaiting Verification' ? `PAYMENT PENDING · Receipt ${pay.pendingReceiptNo ?? '—'} (cash — under verification)`
          : 'NOT PAID'

  const emergency = sub ? String(sub.answers['t-emergency'] ?? '') : ''
  const meal = sub ? String(sub.answers['t-meal'] ?? '') : ''
  const motion = sub ? sub.answers['t-motion'] : undefined
  const medical = sub ? String(sub.answers['t-medical'] ?? '') : ''

  return (
    <div
      className="tour-print-doc bg-white"
      style={{
        width: '210mm', minHeight: '297mm', boxSizing: 'border-box',
        padding: '12mm 13mm 10mm', color: '#111',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      {/* ── A. School header ── */}
      <div className="flex items-start justify-between" style={{ gap: '4mm' }}>
        {/* emblem */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{ width: '14mm', height: '14mm', border: '0.4mm solid #333', borderRadius: '50%', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em' }}
        >
          {logoText}
        </div>
        {/* name · affiliation · address */}
        <div className="flex-1 text-center min-w-0">
          <p style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.1 }}>
            {schoolName}
          </p>
          {g.affiliation && (
            <p style={{ fontSize: '8.5px', marginTop: '0.8mm', color: '#333' }}>{g.affiliation}</p>
          )}
          {g.address && (
            <p style={{ fontSize: '8px', marginTop: '0.6mm', color: '#444' }}>{g.address}</p>
          )}
          <p style={{ fontSize: '8px', color: '#444' }}>
            {[g.phone && `Phone: ${g.phone}`, g.email && `E-mail: ${g.email}`].filter(Boolean).join(' · ')}
          </p>
        </div>
        {/* student photograph */}
        <PhotoBox />
      </div>

      {/* circular no. / date row between two rules */}
      <div style={{ borderTop: '0.3mm solid #333', marginTop: '2mm' }} />
      <div className="flex items-center justify-between" style={{ padding: '1.1mm 0.5mm' }}>
        <p style={{ fontSize: '10px' }}>
          <span style={{ fontWeight: 700 }}>Circular / Ref. No.:</span>{' '}
          {app.circularNo || '\u00A0'}
        </p>
        <p style={{ fontSize: '10px' }}>
          <span style={{ fontWeight: 700 }}>Date:</span>{' '}
          {app.circularDate ? formatDate(app.circularDate) : '\u00A0'}
        </p>
      </div>
      <div style={{ borderTop: '0.5mm solid #111' }} />

      {/* ── B. Form title ── */}
      <div className="text-center" style={{ marginTop: '3.2mm' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.14em' }}>
          PARENT CONSENT FORM
        </p>
        <p style={{ fontSize: '12px', marginTop: '0.4mm', color: '#222' }}>सहमति पत्र</p>
        <p style={{ fontSize: '11px', marginTop: '1.2mm', fontWeight: 700 }}>
          Educational Tour — {destination}
        </p>
        {sub && (
          <p style={{ fontSize: '8.5px', marginTop: '0.8mm', color: '#555', letterSpacing: '0.05em' }}>
            Application No. <span style={{ fontWeight: 700, color: '#111' }}>{sub.serialNo ?? sub.id}</span>
            {' · '}Session {app.academicYear}
          </p>
        )}
      </div>

      {/* ── C. Tour information ── */}
      <SectionTitle>Tour Information</SectionTitle>
      <RowGrid>
        <DocRow label="Destination">{destination}</DocRow>
        <DocRow label="Travel dates">{datesLabel || undefined}</DocRow>
        <DocRow label="Duration">{app.durationDays || undefined}</DocRow>
        <DocRow label="Tour fee per student">
          <span style={{ fontWeight: 700 }}>{feeLabel}</span>
        </DocRow>
        <DocRow label="Teacher / tour in-charge">{app.inChargeName || undefined}</DocRow>
        <DocRow label="Accompanying staff">{app.accompanyingStaff || undefined}</DocRow>
      </RowGrid>
      {app.tourInstructions && (
        <p style={{ fontSize: '8.5px', lineHeight: 1.45, color: '#333', marginTop: '1.2mm' }}>
          <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '7.5px' }}>Note:&nbsp;</span>
          {app.tourInstructions}
        </p>
      )}

      {/* ── D. Student details ── */}
      <SectionTitle>Student Details</SectionTitle>
      <RowGrid>
        <DocRow label="Student name" wide>
          {sub?.studentName ? <span style={{ fontWeight: 700 }}>{sub.studentName}</span> : undefined}
        </DocRow>
        <DocRow label="Admission no.">
          {sub?.admissionNo
            ? <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '9px' }}>{sub.admissionNo}</span>
            : undefined}
        </DocRow>
        <DocRow label="Class / section">
          {sub ? `${sub.className} — ${sub.section}` : undefined}
        </DocRow>
        <DocRow label="Roll no.">{sub?.rollNo || undefined}</DocRow>
        <DocRow label="Blood group">{sub?.bloodGroup || undefined}</DocRow>
      </RowGrid>

      {/* ── E. Parent / guardian details ── */}
      <SectionTitle>Parent / Guardian Details</SectionTitle>
      <RowGrid>
        <DocRow label="Parent / guardian name">{sub?.guardianName || undefined}</DocRow>
        <DocRow label="Mobile number">{sub?.guardianPhone || undefined}</DocRow>
        <DocRow label="Residential address" wide>{sub?.address || undefined}</DocRow>
        <DocRow label="Emergency contact" wide>{emergency || undefined}</DocRow>
      </RowGrid>

      {/* ── F. Health / care information ── */}
      <SectionTitle>Health / Care Information</SectionTitle>
      <RowGrid>
        <DocRow label="Food preference">{meal || undefined}</DocRow>
        <DocRow label="Motion sickness">
          {sub
            ? motion === undefined ? '—' : motion ? 'Yes — see note' : 'No'
            : undefined}
        </DocRow>
        <DocRow label="Health / medical note" wide>{medical || (sub ? '—' : undefined)}</DocRow>
      </RowGrid>

      {/* ── G. Parental undertaking & declaration (the single boxed block) ── */}
      <SectionTitle>Parental Undertaking &amp; Declaration</SectionTitle>
      <div style={{ border: '0.3mm solid #333', padding: '1.8mm 2.4mm' }}>
        <p style={{ fontSize: '9px', lineHeight: 1.5, color: '#111' }}>
          I/We, <span style={{ fontWeight: 700 }}>{sub?.guardianName || '\u00A0'}</span>,
          parent/guardian of <span style={{ fontWeight: 700 }}>{sub?.studentName || '\u00A0'}</span>
          {' '}of <span style={{ fontWeight: 700 }}>{sub ? `${sub.className} — ${sub.section}` : '\u00A0'}</span>,
          hereby declare and undertake as follows:
        </p>
        <ol style={{ fontSize: '9px', lineHeight: 1.55, color: '#111', margin: '1mm 0 0 5mm', paddingLeft: 0 }}>
          <li>I/We give full consent for my/our ward to participate in the Educational Tour to <span style={{ fontWeight: 700 }}>{destination}</span>{datesLabel ? ` (${datesLabel})` : ''} organised by the school.</li>
          <li>The particulars furnished above are true and correct to the best of my/our knowledge.</li>
          <li>I/We have noted the tour dates, the fee payable and the conditions stated in the school circular.</li>
          <li>In case of illness or emergency during the tour, I/We authorise the school and the escorting staff to secure necessary medical assistance and treatment for my/our ward.</li>
          <li>My/our ward shall abide by the school&apos;s rules and the instructions of the escorting staff throughout the tour.</li>
        </ol>
        <p style={{ fontSize: '8.5px', marginTop: '1.2mm', color: '#333' }}>
          Place: ________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Date: ________________
        </p>
      </div>

      {/* ── H. Signature area ── */}
      <div className="grid grid-cols-3" style={{ gap: '6mm', marginTop: '4mm' }}>
        {([
          { who: 'Student\u2019s Signature', name: sub?.studentName },
          { who: 'Parent / Guardian\u2019s Signature', name: sub?.guardianName, sig: sub?.signature },
          { who: 'Class Teacher / Tour In-charge', name: app.inChargeName },
        ] as Array<{ who: string; name?: string; sig?: ApplicationSubmission['signature'] }>).map(({ who, name, sig }) => (
          <div key={who} className="text-center">
            <div style={{ height: '10mm', borderBottom: '0.35mm dotted #555', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '0.5mm' }}>
              {sig && sig.mode === 'drawn' && sig.data.startsWith('data:image/png') ? (
                <img src={sig.data} alt={`Signature of ${sig.signerName}`} style={{ maxHeight: '9mm', maxWidth: '100%', objectFit: 'contain' }} />
              ) : sig && sig.mode === 'typed' ? (
                <span style={{ fontSize: '13px', fontStyle: 'italic' }}>{sig.data}</span>
              ) : null}
            </div>
            <p style={{ fontSize: '7.5px', fontWeight: 700, marginTop: '0.7mm' }}>{who}</p>
            <p style={{ fontSize: '7px', color: '#555' }}>
              {sig ? `Recorded online · ${formatDate(sig.signedAt)}` : name ? name : 'Name: ______________'}
            </p>
          </div>
        ))}
      </div>

      {/* ── I. Office use — slim strip below a dashed rule ── */}
      <div style={{ marginTop: '4mm', borderTop: '0.5mm dashed #555', paddingTop: '1.2mm' }}>
        <p style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.16em', textAlign: 'center' }}>
          FOR OFFICE USE ONLY
        </p>
        <RowGrid>
          <DocRow label="Application no.">{sub?.serialNo || undefined}</DocRow>
          <DocRow label="Payment status">{paymentStatus ?? undefined}</DocRow>
          <DocRow label="Verified / received">
            {sub
              ? sub.physicalDoc.status === 'Verified' ? 'Verified'
                : sub.physicalDoc.status === 'Received' ? 'Received'
                  : sub.status === 'Approved' ? 'Approved'
                    : 'Pending'
              : undefined}
          </DocRow>
          <DocRow label="Office date">{sub ? formatDate(sub.submittedAt) : undefined}</DocRow>
        </RowGrid>
        <p style={{ fontSize: '7px', color: '#666', marginTop: '0.6mm', textAlign: 'center' }}>
          Detach and retain with the office record · {schoolName}
        </p>
      </div>
    </div>
  )
}

// ─── Attendance / master list export ───────────────────────────────────

export interface TourAttendanceRow {
  serialNo: string
  studentName: string
  className: string
  section: string
  gender: string
  rollNo?: string
  admissionNo: string
  guardianName: string
  guardianPhone: string
  paymentStatus: string
  verificationStatus: string
}

/**
 * Builds the printable attendance / master list for a tour as a standalone
 * A4-landscape HTML file: official letterhead, the requested scope in the
 * title, every column staff need on the trip, and an empty signature
 * column per row. One document, page-break aware.
 */
export function downloadTourAttendanceList(
  app: SchoolApplication,
  rows: TourAttendanceRow[],
  scopeLabel: string,
): void {
  const g = useSchoolSettingsStore.getState().general
  const schoolName = g.schoolName?.trim() || 'School'
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const tableRows = rows
    .map((r, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td class="mono">${esc(r.serialNo)}</td>
      <td>${esc(r.studentName)}</td>
      <td class="c">${esc(r.className)}</td>
      <td class="c">${esc(r.section)}</td>
      <td class="c">${esc(r.gender)}</td>
      <td class="c">${esc(r.rollNo ?? '—')}</td>
      <td class="mono c">${esc(r.admissionNo)}</td>
      <td>${esc(r.guardianName)}</td>
      <td class="mono c">${esc(r.guardianPhone)}</td>
      <td class="c ${r.paymentStatus.includes('Paid') ? 'ok' : 'pend'}">${esc(r.paymentStatus)}</td>
      <td class="c">${esc(r.verificationStatus)}</td>
      <td class="sig"></td>
    </tr>`)
    .join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Attendance list — ${esc(app.title)}</title>
<style>
@page{size:A4 landscape;margin:10mm}
body{font-family:Georgia,'Times New Roman',serif;color:#111;margin:0;font-size:9.5px}
.head{text-align:center;margin-bottom:3mm}
.head h1{font-size:15px;letter-spacing:.08em;margin:0;text-transform:uppercase}
.head .sub{font-size:8.5px;color:#333;margin-top:.5mm}
table{width:100%;border-collapse:collapse;page-break-inside:auto}
th,td{border:.3mm solid #333;padding:1.2mm 1.5mm;vertical-align:middle}
th{background:#eee;font-size:8.5px;letter-spacing:.05em;text-transform:uppercase}
tr{page-break-inside:avoid}
td.mono{font-family:ui-monospace,monospace;font-size:8.5px}
td.c{text-align:center}
td.sig{min-width:18mm}
.ok{font-weight:700}
.pend{font-weight:700}
.foot{margin-top:2mm;font-size:7.5px;color:#555;text-align:center}
</style></head><body>
<div class="head">
  <h1>${esc(schoolName)}</h1>
  <p class="sub">${esc(g.affiliation ?? '')}</p>
  <p class="sub">Educational Tour Attendance / Master List — ${esc(app.title)}${app.destination ? ` (${esc(app.destination)})` : ''} · Session ${esc(app.academicYear)} · ${esc(scopeLabel)} · ${rows.length} student${rows.length === 1 ? '' : 's'}</p>
</div>
<table>
  <thead><tr>
    <th>#</th><th>Tour No.</th><th>Student Name</th><th>Class</th><th>Sec</th><th>Gender</th>
    <th>Roll</th><th>Admission No.</th><th>Parent / Guardian</th><th>Mobile</th>
    <th>Payment</th><th>Verification</th><th>Signature / Attendance</th>
  </tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<p class="foot">In-charge: ${esc(app.inChargeName ?? '—')} · Prepared ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · carry on the tour; mark attendance per row.</p>
</body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ATTENDANCE-${app.title.replace(/[^\w]+/g, '-').slice(0, 36)}-${scopeLabel.replace(/[^\w]+/g, '-')}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
