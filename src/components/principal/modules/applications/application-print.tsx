'use client'

/**
 * ApplicationPrintDocument — the OFFICIAL "Educational Tour — Parent Consent
 * Form" (सहमति पत्र). TOUR-CONSENT-1 §3/§4.
 *
 * A genuine A4-portrait school-office document — NOT a web page:
 *   A. School header      — logo left · name centred · affiliation · address
 *                           · photo placeholder right, thin rule, then
 *                           Circular/Ref No. (left) — Date (right), strong rule
 *   B. Title              — PARENT CONSENT FORM · सहमति पत्र · Educational
 *                           Tour — [Destination]
 *   C. Tour information   — destination · travel dates · duration · fee ·
 *                           in-charge · accompanying staff (printed box)
 *   D. Student details    — Name / Scholar No. / Class / Section / Roll /
 *                           Blood Group (no House — Scholario has none)
 *   E. Parent / guardian  — name · mobile · address · emergency contact
 *   F. Health / care      — food preference · medical note · motion sickness
 *   G. Undertaking        — formal parental declaration (dynamic values)
 *   H. Signatures         — Student · Parent/Guardian · Class Teacher/In-charge
 *   I. Office-use slip    — BELOW a dashed cut line: serial no., payment
 *                           status, received/verified (detachable-style)
 *
 * Data rules: every value comes from the application record + the
 * submission's immutable identity snapshot. Blank copies render dotted
 * fill-in rules. Nothing is invented; no fake signatures or stamps.
 *
 * Print mechanics: identical recipe to the fee receipt — clone into
 * #print-root, hide everything else via body.application-printing, restore
 * on afterprint. @page A4 portrait (landscape while printing the list).
 */

import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import type { ReactNode } from 'react'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store/store'
import {
  type SchoolApplication, type ApplicationSubmission, type ReviewNote,
  deriveSubmissionPayment,
} from '@/lib/store/applications-store'
import { formatINR, formatDate } from '@/lib/format'

// ─── Answer rendering ──────────────────────────────────────────────────

function answerToText(value: string | string[] | boolean | undefined): string {
  if (value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  return value
}

export interface AppPrintOptionsLike {
  app: SchoolApplication
  sub?: ApplicationSubmission
}

// ─── Print plumbing (same recipe as payslip/receipt print) ─────────────

/** Injects (once) the shared clone-and-print CSS; returns nothing. */
function ensurePrintStyle(): void {
  const styleId = 'application-print-style'
  if (document.getElementById(styleId)) return
  const el = document.createElement('style')
  el.id = styleId
  el.textContent = `
    #print-root { display: none; }
    @media print {
      html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; }
      body.application-printing > *:not(#print-root) { display: none !important; }
      body.application-printing #print-root { display: block !important; }
      .app-print-doc, .app-print-stack { box-shadow: none !important; border-radius: 0 !important; width: auto !important; max-width: none !important; }
      .stack-page { page-break-after: always; }
      .stack-page:last-child { page-break-after: auto; }
    }`
  document.head.appendChild(el)
}

/** Sets the @page rule for the NEXT print job (portrait/landscape). */
function withPageStyle(css: string, job: () => void): void {
  ensurePrintStyle()
  let page = document.getElementById('print-page-style')
  if (!page) {
    page = document.createElement('style')
    page.id = 'print-page-style'
    document.head.appendChild(page)
  }
  page.textContent = css
  const done = () => {
    // Restore portrait default after the job settles.
    page!.textContent = '@media print { @page { size: A4 portrait; margin: 12mm; } }'
    window.removeEventListener('afterprint', done)
  }
  window.addEventListener('afterprint', done)
  setTimeout(done, 60_000)
  job()
}

function mountIntoPrintRoot(node: Element, bodyClass: string): void {
  let root = document.getElementById('print-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'print-root'
    document.body.appendChild(root)
  }
  root.replaceChildren(node.cloneNode(true))
  document.body.classList.add(bodyClass)
  const cleanup = () => {
    document.body.classList.remove(bodyClass)
    root?.replaceChildren()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  setTimeout(cleanup, 60_000)
}

/** Prints ONLY the visible .app-print-doc document. */
export function printApplicationDocument(): void {
  const node = document.querySelector('.app-print-doc')
  if (!node) return window.print()
  withPageStyle('@media print { @page { size: A4 portrait; margin: 12mm; } }', () => {
    mountIntoPrintRoot(node, 'application-printing')
    window.print()
  })
}

/** Prints a whole .app-print-stack (bulk sets — one A4 per student). */
export function printApplicationStack(): void {
  const node = document.querySelector('.app-print-stack')
  if (!node) return window.print()
  withPageStyle('@media print { @page { size: A4 portrait; margin: 10mm; } }', () => {
    mountIntoPrintRoot(node, 'application-printing')
    window.print()
  })
}

/** Prints the attendance/master list (A4 landscape). */
export function printAttendanceList(): void {
  const node = document.querySelector('.tour-attendance-doc')
  if (!node) return window.print()
  withPageStyle('@media print { @page { size: A4 landscape; margin: 10mm; } }', () => {
    mountIntoPrintRoot(node, 'application-printing')
    window.print()
  })
}

/** Downloads a stack of documents as one print-ready HTML file. */
export function downloadApplicationStackHtml(stack: Element, fileName: string): void {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title>
<style>body{margin:0;background:#fff;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-print-color-adjust:exact}
@page{size:A4 portrait;margin:10mm}
.stack-page{page-break-after:always}.stack-page:last-child{page-break-after:auto}</style>
</head><body>${stack.outerHTML}</body></html>`
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

/** Downloads the live .app-print-doc markup as a standalone HTML file. */
export function downloadApplicationDocument(fileName: string): void {
  const node = document.querySelector('.app-print-doc')
  if (!node) return
  downloadApplicationStackHtml(node.parentElement ?? node, fileName)
}

/** File name used for the saved/printed artefact. */
export function applicationDocFileName({ app, sub }: AppPrintOptionsLike): string {
  const who = sub ? `${sub.studentName.replace(/\s+/g, '-')}-` : 'BLANK-'
  return `${who}${app.title.replace(/[^\w]+/g, '-').slice(0, 40)}-${sub?.tourNo ?? sub?.id ?? app.id}`
}

// ─── Document primitives ───────────────────────────────────────────────

const SERIF = { fontFamily: 'Georgia, "Times New Roman", "Nimbus Roman", serif' } as const

/** Dotted fill-in rule for blank copies / missing snapshot values. */
function Rule({ w = 'w-40' }: { w?: string }) {
  return <span className={`inline-block ${w} border-b border-[#94a3b8]`}>&nbsp;</span>
}

/** Small uppercase section label, exactly like printed form headings. */
function Head({ n, children }: { n?: string; children: ReactNode }) {
  return (
    <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#334155]" style={SERIF}>
      {n ? `${n}. ` : ''}{children}
    </p>
  )
}

/** One labelled field cell used across the info grids. */
function Cell({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`border border-[#cbd5e1] px-2.5 py-1 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[7.5px] uppercase tracking-[0.12em] text-[#64748b] leading-none">{label}</p>
      <p className="mt-0.5 min-h-[15px] text-[10.5px] font-semibold text-[#0f172a] leading-[15px]">{children}</p>
    </div>
  )
}

const yesNo = (v: string | string[] | boolean | undefined, sub?: ApplicationSubmission) => {
  const t = answerToText(v)
  if (t) return t
  return sub ? '—' : <Rule w="w-16" />
}

// ─── The document ──────────────────────────────────────────────────────

/**
 * The full official document. Render on screen inside a scroll container —
 * it doubles as the on-screen preview — while the print CSS gives it true
 * A4 form.
 */
export function ApplicationPrintDocument({
  app, sub, notes = [],
}: {
  app: SchoolApplication
  sub?: ApplicationSubmission
  notes?: ReviewNote[]
}) {
  // Global styles for the clone-and-print strategy (idempotent).
  useEffect(() => { ensurePrintStyle() }, [])

  // Active school's own branding (tenant-scoped School Settings — never a
  // hardcoded school). Falls back to the store's seeded defaults.
  const g = useSchoolSettingsStore((s) => s.general)
  const schoolName = g.schoolName?.trim() || 'School'
  const logoText = (g.logoText || schoolName.split(/\s+/).slice(0, 2).map((w) => w[0]).join('')).toUpperCase()

  // Payment read-out straight from the canonical fee ledger (filled copies).
  const pay = sub ? deriveSubmissionPayment(app, sub) : null
  const paymentLabel = pay && app.payment.mode !== 'None'
    ? pay.status === 'Paid'
      ? `PAID ${formatINR(pay.paidAmount)}${pay.receiptNos.length ? ` · Rcpt ${pay.receiptNos.join(', ')}` : ''}`
      : pay.status === 'Awaiting Verification'
        ? `PAYMENT PENDING VERIFICATION${pay.pendingReceiptNo ? ` · ${pay.pendingReceiptNo}` : ''}`
        : 'SUBMITTED — UNPAID'
    : null

  const destination = app.destination || ''
  const travelDates = app.eventDate
    ? (app.endDate && app.endDate !== app.eventDate ? `${formatDate(app.eventDate)} — ${formatDate(app.endDate)}` : formatDate(app.eventDate))
    : ''

  return (
    <div
      className="app-print-doc mx-auto w-full max-w-[760px] bg-white text-[#1e293b]"
      style={SERIF}
    >
      {/* ── A. School header ── */}
      <div className="flex items-stretch gap-3 pb-2">
        {/* Logo / emblem — left */}
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#334155] text-[15px] font-black tracking-tight text-[#334155]">
          {logoText}
        </div>
        {/* Name · affiliation · address — centred block */}
        <div className="flex-1 text-center">
          <p className="text-[19px] font-bold uppercase leading-tight tracking-[0.04em] text-[#0f172a]">{schoolName}</p>
          {g.affiliation && <p className="text-[9px] tracking-[0.06em] text-[#475569]">{g.affiliation}</p>}
          <p className="text-[8.5px] text-[#475569]">
            {[g.address, g.phone && `Ph: ${g.phone}`, g.email].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-0.5 inline-block border-t border-[#94a3b8] px-6 pt-0.5 text-[8px] uppercase tracking-[0.3em] text-[#64748b]">
            Academic Session {app.academicYear}
          </p>
        </div>
        {/* Student photo placeholder — right */}
        <div className="flex h-[68px] w-[56px] shrink-0 flex-col items-center justify-center border border-[#94a3b8]">
          <p className="rotate-0 text-center text-[6.5px] uppercase leading-tight tracking-wider text-[#94a3b8]">Affix<br />Recent<br />Photograph</p>
        </div>
      </div>

      {/* thin rule + circular row + strong rule */}
      <div className="border-t border-[#334155]" />
      <div className="flex items-center justify-between px-1 py-1 text-[10px]">
        <p className="text-[#334155]">
          <span className="text-[8.5px] uppercase tracking-[0.14em] text-[#64748b]">Circular / Ref No.&nbsp;</span>
          <span className="font-semibold">{app.circularNo || (sub ? '—' : '')}</span>
          {!app.circularNo && !sub && <Rule w="w-36" />}
        </p>
        <p className="text-[#334155]">
          <span className="text-[8.5px] uppercase tracking-[0.14em] text-[#64748b]">Date&nbsp;</span>
          <span className="font-semibold">{app.circularDate ? formatDate(app.circularDate) : app.publishDate ? formatDate(app.publishDate) : sub ? '—' : ''}</span>
          {!app.circularDate && !app.publishDate && !sub && <Rule w="w-24" />}
        </p>
      </div>
      <div className="border-t-[3px] border-double border-[#334155]" />

      {/* ── B. Title ── */}
      <div className="py-2 text-center">
        <h1 className="text-[16px] font-bold uppercase tracking-[0.12em] text-[#0f172a]">Parent Consent Form</h1>
        <p className="text-[12px] font-semibold text-[#334155]" lang="hi">सहमति पत्र</p>
        <p className="mt-0.5 text-[11px] font-semibold text-[#334155]">
          Educational Tour{destination ? ` — ${destination}` : app.title ? ` — ${app.title.replace(/^Educational Tour[ —-]*/i, '')}` : ''}
        </p>
        {sub?.tourNo && (
          <p className="mt-1 inline-block border border-[#334155] px-3 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-[#0f172a]">
            TOUR SERIAL No.: {sub.tourNo}
          </p>
        )}
      </div>

      {/* ── C. Tour information ── */}
      <div>
        <Head n="1">Tour Information</Head>
        <div className="grid grid-cols-4 gap-0 border border-[#64748b] bg-white">
          <Cell label="Destination">{destination || (sub ? '—' : <Rule w="w-24" />)}</Cell>
          <Cell label="Travel dates">{travelDates || (sub ? '—' : <Rule w="w-24" />)}</Cell>
          <Cell label="Duration">{app.duration || (sub ? '—' : <Rule w="w-16" />)}</Cell>
          <Cell label="Tour fee per student">
            {app.payment.mode === 'None' ? 'No fee'
              : app.payment.amount > 0 ? formatINR(app.payment.amount)
              : sub ? '—' : <Rule w="w-16" />}
          </Cell>
          <Cell label="Teacher / Tour in-charge">{app.inChargeName || (sub ? '—' : <Rule w="w-28" />)}</Cell>
          <Cell label="Accompanying staff" wide>{app.accompanyingStaff || (sub ? '—' : <Rule w="w-full" />)}</Cell>
          <Cell label="Last date to consent" wide>
            {app.deadline ? (
              <>{formatDate(app.deadline)}{app.participation === 'Optional' ? '  ·  Participation is optional' : '  ·  Participation is mandatory'}</>
            ) : (
              <Rule w="w-full" />
            )}
          </Cell>
        </div>
        {app.description && (
          <p className="mt-1 border border-[#cbd5e1] px-2.5 py-1 text-[9px] leading-snug text-[#334155]">
            <span className="font-semibold uppercase tracking-[0.1em] text-[8px] text-[#64748b]">Tour information / instructions — </span>
            {app.description}
          </p>
        )}
      </div>

      {/* ── D. Student details ── */}
      <div className="mt-2.5">
        <Head n="2">Student Details</Head>
        <div className="grid grid-cols-4 gap-0 border border-[#64748b]">
          <Cell label="Student name">{sub ? sub.studentName : <Rule w="w-full" />}</Cell>
          <Cell label="Scholar / Admission No.">{sub ? <span className="font-mono">{sub.admissionNo}</span> : <Rule w="w-full" />}</Cell>
          <Cell label="Class">{sub ? sub.className : <Rule w="w-14" />}</Cell>
          <Cell label="Section">{sub ? sub.section : <Rule w="w-14" />}</Cell>
          <Cell label="Roll No.">{sub ? (sub.rollNo || '—') : <Rule w="w-14" />}</Cell>
          <Cell label="Blood Group">{sub ? (sub.bloodGroup || '—') : <Rule w="w-14" />}</Cell>
          <Cell label="Date of birth">{sub ? (sub.dob ? formatDate(sub.dob) : '—') : <Rule w="w-24" />}</Cell>
          <Cell label="Gender">{sub ? (sub.gender || '—') : <Rule w="w-14" />}</Cell>
        </div>
      </div>

      {/* ── E. Parent / guardian details ── */}
      <div className="mt-2.5">
        <Head n="3">Parent / Guardian Details</Head>
        <div className="grid grid-cols-4 gap-0 border border-[#64748b]">
          <Cell label="Parent / Guardian name" wide>{sub ? sub.guardianName : <Rule w="w-full" />}</Cell>
          <Cell label="Parent mobile number">{sub ? sub.guardianPhone : <Rule w="w-full" />}</Cell>
          <Cell label="Emergency contact (on tour)">{sub ? (answerToText(sub.answers['t-emergency']) || '—') : <Rule w="w-full" />}</Cell>
          <Cell label="Residential address" wide>{sub ? (sub.address || '—') : <Rule w="w-full" />}</Cell>
        </div>
      </div>

      {/* ── F. Health / care information ── */}
      <div className="mt-2.5">
        <Head n="4">Health / Care Information</Head>
        <div className="grid grid-cols-4 gap-0 border border-[#64748b]">
          <Cell label="Food preference">{yesNo(sub?.answers['t-meal'], sub)}</Cell>
          <Cell label="Motion sickness / travel concern">{yesNo(sub?.answers['t-motion'], sub)}</Cell>
          <Cell label="Relevant health / medical note" wide>
            {sub ? (answerToText(sub.answers['t-medical']) || 'None reported') : <Rule w="w-full" />}
          </Cell>
        </div>
      </div>

      {/* ── G. Parental undertaking & declaration ── */}
      <div className="mt-2.5">
        <Head n="5">Parental Undertaking &amp; Declaration</Head>
        <div className="border border-[#64748b] px-3 py-2 text-[9.5px] leading-[1.55] text-[#1e293b]">
          <p>
            I / We, <span className="font-semibold">{sub ? sub.guardianName : '________________________________'}</span>,
            parent / guardian of <span className="font-semibold">{sub ? sub.studentName : '______________________________'}</span>,
            student of <span className="font-semibold">{sub ? `${sub.className}-${sub.section}` : '____________'}</span>,
            hereby give consent for my ward to participate in the <span className="font-semibold">Educational Tour{destination ? ` to ${destination}` : ''}</span>
            {travelDates ? <> scheduled for <span className="font-semibold">{travelDates}</span></> : ''}{app.duration ? <span className="font-semibold"> ({app.duration})</span> : ''} organised by the school, and:
          </p>
          <ol className="mt-1 list-[lower-roman] pl-5">
            <li>confirm that the particulars furnished above are true and correct to the best of my / our knowledge;</li>
            <li>acknowledge the tour dates, duration and conditions stated in this circular / form;</li>
            <li>authorise the school and its escorting staff to provide or arrange necessary first-aid and medical assistance in an emergency, including treatment deemed necessary where I / we cannot be contacted in time;</li>
            <li>agree that my ward shall follow school rules and the instructions of the accompanying staff throughout the tour; and</li>
            <li>understand that the tour fee, once paid, is governed by the school&apos;s refund policy {app.payment.mode !== 'None' ? `(fee: ${formatINR(app.payment.amount)} per student)` : ''}.</li>
          </ol>
          <p className="mt-1">
            <span className="font-semibold">Declaration:</span> the contents above have been read and understood by me / us.
            {sub?.consentGivenAt ? <span className="text-[#475569]"> (Digital consent recorded {formatDate(sub.consentGivenAt)}.)</span> : ''}
          </p>
        </div>
      </div>

      {/* ── H. Signature area ── */}
      <div className="mt-4 grid grid-cols-3 gap-8 px-1">
        {[
          { role: 'Student\u2019s Signature', name: sub?.studentName },
          { role: 'Parent / Guardian\u2019s Signature', name: sub?.guardianName },
          { role: app.inChargeName ? `Class Teacher / Tour In-charge` : 'Class Teacher / Tour In-charge', name: app.inChargeName },
        ].map((s) => (
          <div key={s.role} className="text-center">
            <div className="h-9 border-b border-[#334155]" />
            <p className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-[#334155]">{s.role}</p>
            <p className="text-[8px] text-[#64748b]">
              Name: {s.name ?? '____________________'}
            </p>
            <p className="text-[8px] text-[#64748b]">Date: ____________ &nbsp; Place: ____________</p>
          </div>
        ))}
      </div>

      {/* ── I. Office use — detachable slip below a dashed cut line ── */}
      <div className="relative mt-5">
        <div className="flex items-center gap-2" aria-hidden>
          <div className="flex-1 border-t border-dashed border-[#64748b]" />
          <p className="text-[7px] font-semibold uppercase tracking-[0.3em] text-[#64748b]">✂ — cut here — office record</p>
          <div className="flex-1 border-t border-dashed border-[#64748b]" />
        </div>
        <div className="mt-1.5 border border-[#64748b]">
          <div className="border-b border-[#cbd5e1] bg-[#f1f5f9] px-2.5 py-0.5">
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#334155]">For Office Use — Tour Receipt &amp; Verification Slip</p>
          </div>
          <div className="grid grid-cols-4 gap-0 p-0">
            <Cell label="Student name">{sub ? sub.studentName : <Rule w="w-full" />}</Cell>
            <Cell label="Class / Section">{sub ? `${sub.className} — ${sub.section}` : <Rule w="w-full" />}</Cell>
            <Cell label="Roll No.">{sub ? (sub.rollNo || '—') : <Rule w="w-14" />}</Cell>
            <Cell label="Admission No.">{sub ? <span className="font-mono">{sub.admissionNo}</span> : <Rule w="w-full" />}</Cell>
            <Cell label="Tour">{app.title}</Cell>
            <Cell label="Parent mobile">{sub ? sub.guardianPhone : <Rule w="w-full" />}</Cell>
            <Cell label="Application / Serial No.">{sub ? (sub.tourNo ?? '—') : <Rule w="w-full" />}</Cell>
            <Cell label="Payment status">
              {paymentLabel ?? (sub ? '—' : <Rule w="w-full" />)}
            </Cell>
          </div>
          <div className="flex items-end justify-between gap-4 border-t border-[#cbd5e1] px-2.5 py-1">
            <p className="text-[8px] text-[#64748b]">
              Received / verified by: {sub?.physicalDoc.status === 'Verified'
                ? <span className="font-semibold text-[#334155]">{`Verified${sub.physicalDoc.verifiedAt ? ` · ${formatDate(sub.physicalDoc.verifiedAt)}` : ''}`}</span>
                : sub?.physicalDoc.status === 'Received'
                  ? <span className="font-semibold text-[#334155]">Received — verification due</span>
                  : <span className="inline-block w-40 border-b border-[#94a3b8]">&nbsp;</span>}
              {notes.filter((n) => n.note).slice(-1).map((n) => (
                <span key={n.id}> · <span className="italic">{n.role}: {n.note}</span></span>
              ))}
            </p>
            <div className="flex h-11 w-24 shrink-0 items-end justify-center border border-dashed border-[#94a3b8] pb-0.5">
              <p className="text-[6.5px] uppercase tracking-[0.2em] text-[#94a3b8]">School Stamp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-[#cbd5e1] pt-1">
        <p className="text-[7.5px] text-[#94a3b8]">
          {schoolName} · Educational Tour — Parent Consent Form{app.circularNo ? ` · Circular ${app.circularNo}` : ''}
        </p>
        <p className="text-[7.5px] text-[#94a3b8]">
          {sub ? `Submitted ${formatDate(sub.submittedAt)} · ${sub.mode === 'Digital' ? 'Online' : 'Office record'}` : 'Blank form'} · Page 1 of 1
        </p>
      </div>
    </div>
  )
}

// ─── Bulk stack (multi-student sets) ───────────────────────────────────

/**
 * Renders a print-ready STACK of completed forms — one A4 page per student.
 * Mount it hidden, then call printApplicationStack() / download the HTML.
 */
export function ApplicationPrintStack({ items }: { items: AppPrintOptionsLike[] }) {
  return (
    <div className="app-print-stack bg-white" style={SERIF}>
      {items.map(({ app, sub }, i) => (
        <div key={(sub?.id ?? app.id) + String(i)} className="stack-page px-[10mm] py-[8mm]">
          <ApplicationPrintDocument app={app} sub={sub} />
        </div>
      ))}
    </div>
  )
}

// ─── Attendance / master list (official print document) ────────────────

export interface AttendanceRow {
  serial: number
  tourNo: string
  studentName: string
  className: string
  section: string
  gender: string
  rollNo: string
  admissionNo: string
  guardianName: string
  guardianPhone: string
  payment: string
  verification: string
}

/**
 * OFFICIAL TOUR ATTENDANCE / MASTER LIST — printed and carried on the trip.
 * A4 landscape, thin-ruled table, empty signature column for the trip day.
 */
export function TourAttendanceListDocument({
  app, rows, title = 'Tour Attendance Sheet',
}: {
  app: SchoolApplication
  rows: AttendanceRow[]
  title?: string
}) {
  const g = useSchoolSettingsStore((s) => s.general)
  const schoolName = g.schoolName?.trim() || 'School'
  return (
    <div className="tour-attendance-doc w-full bg-white text-[#1e293b]" style={SERIF}>
      <div className="flex items-end justify-between border-b-2 border-[#334155] pb-1.5">
        <div>
          <p className="text-[14px] font-bold uppercase tracking-[0.04em] text-[#0f172a]">{schoolName}</p>
          <p className="text-[9px] text-[#475569]">{app.title}{app.destination ? ` — ${app.destination}` : ''} · Session {app.academicYear}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#0f172a]">{title}</p>
          <p className="text-[8.5px] text-[#475569]">
            {app.eventDate ? `Tour date: ${formatDate(app.eventDate)}` : ''}{app.inChargeName ? ` · In-charge: ${app.inChargeName}` : ''} · Generated {formatDate(new Date())}
          </p>
        </div>
      </div>
      <table className="mt-2 w-full border-collapse text-[8.5px]">
        <thead>
          <tr className="bg-[#f1f5f9] text-left text-[7.5px] uppercase tracking-[0.08em] text-[#334155]">
            {['S.No', 'Tour No.', 'Student Name', 'Class', 'Sec', 'Gender', 'Roll', 'Admission No.', 'Parent / Guardian', 'Mobile', 'Payment', 'Verified', 'Signature'].map((h) => (
              <th key={h} className="border border-[#94a3b8] px-1.5 py-1 font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.tourNo || i} className={i % 2 === 1 ? 'bg-[#f8fafc]' : ''}>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px] tabular-nums">{r.serial}</td>
              <td className="whitespace-nowrap border border-[#cbd5e1] px-1.5 py-[3px] font-mono text-[7.5px]">{r.tourNo}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px] font-semibold">{r.studentName}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px]">{r.className}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px]">{r.section}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px]">{r.gender || '—'}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px]">{r.rollNo || '—'}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px] font-mono">{r.admissionNo}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px]">{r.guardianName}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px]">{r.guardianPhone}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px] font-semibold">{r.payment}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px]">{r.verification}</td>
              <td className="border border-[#cbd5e1] px-1.5 py-[3px]">&nbsp;</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={13} className="border border-[#cbd5e1] px-2 py-4 text-center text-[9px] text-[#64748b]">
                No submissions match this selection yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-3 flex items-end justify-between text-[8px] text-[#475569]">
        <p>Total: <span className="font-bold">{rows.length}</span> student{rows.length === 1 ? '' : 's'}</p>
        <div className="w-56 border-b border-[#334155] text-center text-[7.5px] uppercase tracking-[0.14em]">Tour In-charge signature</div>
        <div className="w-56 border-b border-[#334155] text-center text-[7.5px] uppercase tracking-[0.14em]">Principal</div>
      </div>
    </div>
  )
}

// ─── Off-screen mount helper (bulk download / list download) ───────────

/**
 * Renders `children` into a detached container and hands the element to
 * `job`, then unmounts. Used by bulk downloads that never touch the DOM.
 */
export function withOffscreenDocument(job: (el: HTMLElement) => void, children: ReactNode): void {
  const holder = document.createElement('div')
  holder.style.position = 'fixed'
  holder.style.left = '-10000px'
  holder.style.top = '0'
  document.body.appendChild(holder)
  const root = createRoot(holder)
  // React 18 concurrent render is async — give it a beat, then run the job.
  setTimeout(() => {
    job(holder)
    setTimeout(() => { root.unmount(); holder.remove() }, 200)
  }, 60)
}
