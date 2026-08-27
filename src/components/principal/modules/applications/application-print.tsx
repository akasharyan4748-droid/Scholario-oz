'use client'

/**
 * ApplicationPrintDocument — the official school application document.
 *
 * Rendered for TWO purposes (§2H / §2I):
 *   • Filled copy — after a student submits: all answers + payment + status
 *     printed, ready for physical signature collection and permanent filing.
 *   • Blank copy   — downloadable by staff for OFFLINE paper distribution.
 *
 * Visual direction matches the salary PayslipDocument language: quiet
 * label-left/value-right rhythm, hairline dividers, restrained color,
 * an unmistakable official-document header/footer. It must look like a
 * document you would stamp and file, not like a browser print of a web page.
 *
 * Print mechanics: identical recipe to payslip-document.tsx — clone into
 * #print-root at body level, hide everything else via body.application-
 * printing, restore on afterprint. A4 portrait default.
 */

import { useEffect } from 'react'
import type { ReactNode, Fragment } from 'react'
import { school } from '@/lib/mock/school'
import type {
  SchoolApplication, ApplicationSubmission, ReviewNote,
} from '@/lib/store/applications-store'
import { formatINR, formatDate } from '@/lib/format'

// ─── Answer rendering ──────────────────────────────────────────────────

function answerToText(value: string | string[] | boolean | undefined): string {
  if (value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  return value
}

function attachmentNameFor(sub: ApplicationSubmission, fieldId: string): string | undefined {
  return sub.attachments?.[fieldId]?.name
}

export interface AppPrintOptionsLike {
  app: SchoolApplication
  sub?: ApplicationSubmission
}

// ─── Print plumbing (same recipe as payslip print) ─────────────────────

/** Prints ONLY this document; everything else is hidden while printing. */
export function printApplicationDocument(): void {
  const node = document.querySelector('.app-print-doc')
  if (!node) return window.print()
  let root = document.getElementById('print-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'print-root'
    document.body.appendChild(root)
  }
  root.replaceChildren(node.cloneNode(true))
  document.body.classList.add('application-printing')
  const cleanup = () => {
    document.body.classList.remove('application-printing')
    root?.replaceChildren()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  setTimeout(cleanup, 60_000)
  window.print()
}

/** Downloads the live .app-print-doc markup as a standalone HTML file. */
export function downloadApplicationDocument(fileName: string): void {
  const node = document.querySelector('.app-print-doc')
  if (!node) return
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title>
<style>body{margin:0;background:#fff;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-print-color-adjust:exact}@page{size:A4 portrait;margin:12mm}</style>
</head><body>${node.outerHTML}</body></html>`
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

/** File name used for the saved/printed artefact. */
export function applicationDocFileName({ app, sub }: AppPrintOptionsLike): string {
  const who = sub ? `${sub.studentName.replace(/\s+/g, '-')}-` : 'BLANK-'
  return `${who}${app.title.replace(/[^\w]+/g, '-').slice(0, 40)}-${sub?.id ?? app.id}`
}

// ─── Document primitives ───────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[11px]">
      <span className="text-slate-400 shrink-0 pt-px">{label}</span>
      <span className="font-medium text-slate-700 text-right">{value}</span>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{children}</p>
  )
}

/**
 * The full document. Always render on screen inside a scroll container — it
 * doubles as the on-screen preview — while the print CSS gives it true A4 form.
 */
export function ApplicationPrintDocument({
  app, sub, notes = [], paymentLines,
}: {
  app: SchoolApplication
  sub?: ApplicationSubmission
  notes?: ReviewNote[]
  /** Optional resolved payment read-out for filled copies. */
  paymentLines?: Array<{ label: string; value: ReactNode }>
}) {
  // Global styles for the clone-and-print strategy (idempotent).
  useEffect(() => {
    const styleId = 'application-print-style'
    if (!document.getElementById(styleId)) {
      const el = document.createElement('style')
      el.id = styleId
      el.textContent = `
        #print-root { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; }
          body.application-printing > *:not(#print-root) { display: none !important; }
          body.application-printing #print-root { display: block !important; }
          .app-print-doc { box-shadow: none !important; border-radius: 0 !important; width: auto !important; max-width: none !important; }
        }`
      document.head.appendChild(el)
    }
  }, [])

  return (
    <div className="app-print-doc mx-auto w-full max-w-[720px] bg-white text-slate-700">
      {/* ── Official header ── */}
      <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-50 text-[13px] font-black tracking-tight text-slate-600">
            DS
          </div>
          <div>
            <p className="text-[15px] font-extrabold leading-tight tracking-tight text-slate-900">{school.name}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{school.address}</p>
            <p className="text-[9px] text-slate-500">Ph {school.phone} · {school.email} · {school.affiliation}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[8.5px] uppercase tracking-[0.2em] text-slate-400">Academic Session</p>
          <p className="text-[11px] font-semibold text-slate-700">{app.academicYear}</p>
          <p className="mt-1 text-[8.5px] uppercase tracking-[0.2em] text-slate-400">Form No.</p>
          <p className="text-[11px] font-mono font-semibold text-slate-700">{sub ? `APPF-${sub.id.slice(-8).toUpperCase()}` : `APPF-BLANK-${app.id.slice(-6).toUpperCase()}`}</p>
        </div>
      </div>

      {/* ── Title band ── */}
      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[8.5px] uppercase tracking-[0.18em] text-slate-500">{app.category} · Application Form</p>
          <h1 className="text-[15px] font-bold leading-tight text-slate-900 mt-0.5">{app.title}</h1>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <DetailRow label="Deadline" value={formatDate(app.deadline)} />
          {app.eventDate && <DetailRow label="Event date" value={formatDate(app.eventDate)} />}
        </div>
      </div>

      {app.description && (
        <p className="mt-3 text-[10.5px] leading-relaxed text-slate-600 border-l-2 border-slate-200 pl-3">{app.description}</p>
      )}

      {/* ── Student particulars ── */}
      <div className="mt-4">
        <SectionHeading>Student Particulars</SectionHeading>
        <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-slate-200 px-4 py-2.5">
          {sub ? (
            <>
              <DetailRow label="Student name" value={sub.studentName} />
              <DetailRow label="Admission no." value={<span className="font-mono">{sub.admissionNo}</span>} />
              <DetailRow label="Class / Section" value={`${sub.className} — ${sub.section}`} />
              <DetailRow label="Class ID" value={sub.classId} />
              <DetailRow label="Guardian" value={sub.guardianName} />
              <DetailRow label="Guardian phone" value={sub.guardianPhone} />
              <DetailRow label="Submitted on" value={`${formatDate(sub.submittedAt)} · ${new Date(sub.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`} />
              <DetailRow label="Submission mode" value={sub.mode === 'Digital' ? 'Online form' : 'Paper (recorded in office)'} />
            </>
          ) : (
            <>
              <BlankField label="Student name" />
              <BlankField label="Admission no." />
              <BlankField label="Class / Section" />
              <BlankField label="Roll no." />
              <BlankField label="Guardian name" />
              <BlankField label="Guardian phone" />
            </>
          )}
        </div>
      </div>

      {/* ── Answers ── */}
      {app.formFields.length > 0 && (
        <div className="mt-4">
          <SectionHeading>{sub ? 'Responses to Questions' : 'Questions (to be completed)'}</SectionHeading>
          <table className="mt-1.5 w-full border-collapse overflow-hidden">
            <tbody>
              {app.formFields.map((f, idx) => (
                <tr key={f.id} className={`align-top ${idx % 2 === 1 ? 'bg-slate-50/70' : ''}`}>
                  <td className="w-[46%] border-t border-slate-100 py-2 pl-3 pr-4 text-[10.5px] text-slate-600">
                    {f.label}
                    {f.required && <span className="text-rose-500 ml-0.5">*</span>}
                    {f.helpText && <p className="mt-0.5 text-[9px] text-slate-400">{f.helpText}</p>}
                  </td>
                  <td className="border-t border-l border-dashed border-slate-100 py-2 pl-3 pr-3 text-[10.5px] font-medium" style={{ minHeight: '28px' }}>
                    {sub
                      ? (answerToText(sub.answers[f.id]) || attachmentNameFor(sub, f.id) || (sub.mode === 'Physical' ? '— (see attached paper form)' : '—'))
                      : <span className="block h-4 border-b border-dotted border-slate-300 w-full" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Payment ── */}
      {app.payment.mode !== 'None' && (
        <div className="mt-4">
          <SectionHeading>Payment</SectionHeading>
          <div className="mt-1.5 rounded-md border border-slate-200 px-4 py-2.5 grid grid-cols-2 gap-x-6 gap-y-1">
            <DetailRow label="Charge" value={app.payment.feeHeadLabel || app.title} />
            <DetailRow label="Amount payable" value={<span className="font-bold tabular-nums">{formatINR(app.payment.amount)}</span>} />
            {(paymentLines ?? []).map((l) => (
              <Fragment key={l.label}>
                <span className="hidden" aria-hidden="true">{l.label}</span>
                <span className="col-span-2 block border-t border-dashed border-slate-100 pt-1 text-[10.5px] text-slate-600">{l.label}: <span className="font-medium">{l.value}</span></span>
              </Fragment>
            ))}
            {!paymentLines && !sub && (
              <>
                <BlankField label="Paid amount" />
                <BlankField label="Receipt no(s)." />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Status summary (filled copies only) ── */}
      {sub && (
        <div className="mt-4">
          <SectionHeading>Status &amp; Remarks</SectionHeading>
          <div className="mt-1.5 rounded-md border border-slate-200 px-4 py-2.5 grid grid-cols-2 gap-x-6 gap-y-1">
            <DetailRow
              label="Guardian consent"
              value={sub.consentGivenAt
                ? `Given digitally · ${formatDate(sub.consentGivenAt)}`
                : sub.physicalDoc.status === 'Verified'
                  ? `By physical signature · verified ${formatDate(sub.physicalDoc.verifiedAt ?? '')}`
                  : app.guardianConsent.method === 'Physical Signature'
                    ? 'By signature below'
                    : 'Pending'}
            />
            <DetailRow label="In-charge teacher" value={app.inChargeName ?? 'As assigned'} />
            {(sub.physicalDoc.status === 'Received' || sub.physicalDoc.status === 'Verified') && (
              <DetailRow label="Signed document" value={sub.physicalDoc.status === 'Verified'
                ? `Verified${sub.physicalDoc.verifiedAt ? ` · ${formatDate(sub.physicalDoc.verifiedAt)}` : ''}`
                : `${sub.physicalDoc.fileName ?? 'received'} · verification pending`} />
            )}
            <DetailRow label="Approval" value={sub.status === 'Approved'
              ? `APPROVED${sub.reviewedBy ? ` — ${sub.reviewedBy}` : ''}`
              : sub.status === 'Rejected' ? 'REJECTED' : sub.status} />
            {notes.filter((n) => n.note).slice(-2).map((n) => (
              <div key={n.id} className="col-span-2 border-t border-dashed border-slate-100 pt-1 -mb-0.5">
                <p className="text-[9.5px] text-slate-500"><span className="font-semibold">{n.role} ({n.by}):</span> {n.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Declaration ── */}
      <div className="mt-4">
        <SectionHeading>Declaration &amp; Consent</SectionHeading>
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
          We have read the details of this application. All information furnished above is true to the best of our knowledge.
          {' '}<span className="font-medium text-slate-700">{app.guardianConsent.statement ?? ''}</span>
          {app.guardianConsent.required && app.guardianConsent.method === 'Physical Signature' && (
            <span className="ml-1 inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[8.5px] font-semibold text-amber-700">PHYSICAL SIGNATURE REQUIRED</span>
          )}
        </p>
      </div>

      {/* ── Signature blocks ── */}
      <div className="mt-5 grid grid-cols-3 gap-6">
        {[`Guardian\u2019s Signature`, `Student\u2019s Signature`, app.inChargeName ? `In-charge — ${app.inChargeName}` : `Teacher In-charge`].map((label) => (
          <div key={label}>
            <div className="h-10 border-b border-dotted border-slate-400" />
            <p className="mt-1 text-[9px] font-medium text-slate-500 text-center">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Authority + stamp ── */}
      <div className="mt-5 flex items-end justify-between gap-6">
        <div className="flex-1">
          <div className="h-12 border-b border-dotted border-slate-400 max-w-[240px]" />
          <p className="mt-1 text-[9px] font-medium text-slate-500">Principal / School Authority</p>
        </div>
        <div className="flex h-[76px] w-[130px] shrink-0 flex-col items-center justify-end pb-1">
          <div className="h-[70px] w-[128px] rounded-sm border-2 border-dashed border-slate-300" />
          <p className="mt-1 text-[8px] uppercase tracking-widest text-slate-400">School Stamp</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-4 border-t border-slate-200 pt-2 flex items-center justify-between gap-4">
        <p className="text-[8px] text-slate-400">
          System-generated · SCHOLARIO-OS · retain this form with the school office{sub ? ` · record ${sub.id}` : ''}
        </p>
        <p className="text-[8px] text-slate-400">Page 1 of 1</p>
      </div>
    </div>
  )
}

/** Optional resolved payment read-out type used by ApplicationPrintDocument. */
type PaymentLine = { label: string; value: ReactNode }

function BlankField({ label }: { label: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[11px]">
      <span className="text-slate-400 shrink-0 pt-px">{label}</span>
      <span className="inline-block w-32 border-b border-dotted border-slate-300" />
    </div>
  )
}
