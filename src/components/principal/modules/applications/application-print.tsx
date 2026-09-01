'use client'

/**
 * ApplicationPrintDocument — the OFFICIAL Educational Tour application form.
 *
 * A genuine A4-portrait school-office document (not a web page print):
 *   1. School header        — name, address, contacts, affiliation
 *   2. Title band           — APPLICATION FOR EDUCATIONAL TOUR + Form No.
 *   3. Tour details         — destination, tour date, deadline, fee, in-charge
 *   4. Student particulars  — snapshotted from the school record at submit
 *   5. Guardian details     — snapshotted from the school record at submit
 *   6. Preferences & medical— the applicant's answers (or blank rules)
 *   7. Payment              — charge, amount, paid state, receipt numbers
 *   8. Declaration & consent— declaration paragraph + consent statement
 *   9. Signatures           — Guardian · Student · Teacher in-charge
 *  10. OFFICE USE ONLY      — received/verified/receipt rows, approval,
 *                             Principal signature, school stamp
 *
 * Data rules: EVERY value comes from the application record + the
 * submission's immutable identity snapshot. Nothing is invented; fields
 * with no value render as dotted fill-in rules (blank copies) or are
 * omitted (filled copies). There is deliberately NO House field —
 * Scholario does not use a house system.
 *
 * Print mechanics: identical recipe to the fee receipt — clone into
 * #print-root at body level, hide everything else via body.application-
 * printing, restore on afterprint. @page A4 portrait.
 */

import { useEffect, Fragment } from 'react'
import type { ReactNode } from 'react'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store/store'
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

// ─── Print plumbing (same recipe as payslip/receipt print) ─────────────

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

/** Dotted fill-in rule for blank copies / missing snapshot values. */
function BlankRule({ w = 'w-32' }: { w?: string }) {
  return <span className={`inline-block ${w} border-b border-dotted border-slate-300`} />
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

  const formNo = sub ? `APPF-${sub.id.slice(-8).toUpperCase()}` : `APPF-${app.id.slice(-8).toUpperCase()}`
  // Active school's own branding (tenant-scoped School Settings — never a
  // hardcoded school). Falls back to the store's seeded defaults.
  const g = useSchoolSettingsStore((s) => s.general)
  const schoolName = g.schoolName?.trim() || 'School'
  const logoText = (g.logoText || schoolName.split(/\s+/).slice(0, 2).map((w) => w[0]).join('')).toUpperCase()

  return (
    <div className="app-print-doc mx-auto w-full max-w-[720px] bg-white text-slate-700">
      {/* ── 1. School header ── */}
      <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-50 text-[14px] font-black tracking-tight text-slate-600">
            {logoText}
          </div>
          <div>
            <p className="text-[16px] font-extrabold leading-tight tracking-tight text-slate-900">{schoolName}</p>
            {g.address && <p className="text-[9px] text-slate-500 mt-0.5">{g.address}</p>}
            {(g.phone || g.email) && <p className="text-[9px] text-slate-500">{[g.phone && `Ph ${g.phone}`, g.email].filter(Boolean).join(' · ')}</p>}
            {g.affiliation && <p className="text-[9px] text-slate-500">{g.affiliation}</p>}
          </div>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <div>
            <p className="text-[8.5px] uppercase tracking-[0.2em] text-slate-400">Academic Session</p>
            <p className="text-[11px] font-semibold text-slate-700">{app.academicYear}</p>
          </div>
          <div>
            <p className="text-[8.5px] uppercase tracking-[0.2em] text-slate-400">Form No.</p>
            <p className="text-[11px] font-mono font-semibold text-slate-700">{formNo}</p>
          </div>
          {app.publishDate && (
            <div>
              <p className="text-[8.5px] uppercase tracking-[0.2em] text-slate-400">Issued</p>
              <p className="text-[11px] font-semibold text-slate-700">{formatDate(app.publishDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Title band ── */}
      <div className="mt-4 text-center">
        <h1 className="text-[15px] font-extrabold uppercase tracking-[0.08em] text-slate-900">Application for Educational Tour</h1>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-600">{app.title}</p>
        {sub && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-slate-500">
            <span className="inline-block h-1 w-1 rounded-full bg-slate-400" />
            Submitted {formatDate(sub.submittedAt)} · {sub.mode === 'Digital' ? 'Online form' : 'Recorded in office'}
            <span className="inline-block h-1 w-1 rounded-full bg-slate-400" />
          </p>
        )}
      </div>

      {app.description && (
        <p className="mt-3 text-[10.5px] leading-relaxed text-slate-600 border-l-2 border-slate-300 pl-3">{app.description}</p>
      )}

      {/* ── 3. Tour details ── */}
      <div className="mt-4">
        <SectionHeading>1 · Tour Details</SectionHeading>
        <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-slate-200 px-4 py-2.5">
          <DetailRow label="Tour" value={app.title} />
          <DetailRow label="Destination" value={app.destination ?? <BlankRule w="w-32" />} />
          <DetailRow label="Tour date" value={app.eventDate ? formatDate(app.eventDate) : <BlankRule />} />
          <DetailRow label="Teacher in-charge" value={app.inChargeName ?? <BlankRule />} />
          <DetailRow label="Last date to apply" value={formatDate(app.deadline)} />
          <DetailRow label="Participation" value={app.participation} />
          <div className="col-span-2 flex items-start justify-between gap-3 text-[11px]">
            <span className="text-slate-400 shrink-0 pt-px">Eligible</span>
            <span className="font-medium text-slate-700 text-right">
              {app.targetStudentIds?.length
                ? `${app.targetStudentIds.length} nominated students`
                : `${app.targetClassIds.length} class${app.targetClassIds.length === 1 ? '' : 'es'}${app.targetSectionNames?.length ? ` (Sec ${app.targetSectionNames.join(', ')})` : ''}`}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Student particulars (snapshot) ── */}
      <div className="mt-4">
        <SectionHeading>2 · Student Particulars</SectionHeading>
        <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-slate-200 px-4 py-2.5">
          {sub ? (
            <>
              <DetailRow label="Student name" value={sub.studentName} />
              <DetailRow label="Admission no." value={<span className="font-mono">{sub.admissionNo}</span>} />
              <DetailRow label="Class / Section" value={`${sub.className} — ${sub.section}`} />
              <DetailRow label="Roll no." value={sub.rollNo ?? '—'} />
              <DetailRow label="Date of birth" value={sub.dob ? formatDate(sub.dob) : '—'} />
              <DetailRow label="Gender" value={sub.gender ?? '—'} />
              <DetailRow label="Blood group" value={sub.bloodGroup ?? '—'} />
              {sub.address && <div className="col-span-2 flex items-start justify-between gap-3 text-[11px]">
                <span className="text-slate-400 shrink-0 pt-px">Residence address</span>
                <span className="font-medium text-slate-700 text-right">{sub.address}</span>
              </div>}
            </>
          ) : (
            <>
              <DetailRow label="Student name" value={<BlankRule w="w-44" />} />
              <DetailRow label="Admission no." value={<BlankRule w="w-32" />} />
              <DetailRow label="Class / Section" value={<BlankRule w="w-24" />} />
              <DetailRow label="Roll no." value={<BlankRule w="w-16" />} />
              <DetailRow label="Date of birth" value={<BlankRule w="w-28" />} />
              <DetailRow label="Gender" value={<BlankRule w="w-16" />} />
              <DetailRow label="Blood group" value={<BlankRule w="w-16" />} />
              <div className="col-span-2 flex items-start justify-between gap-3 text-[11px]">
                <span className="text-slate-400 shrink-0 pt-px">Residence address</span>
                <span className="w-2/3 border-b border-dotted border-slate-300" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 5. Guardian details (snapshot) ── */}
      <div className="mt-4">
        <SectionHeading>3 · Parent / Guardian Details</SectionHeading>
        <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-slate-200 px-4 py-2.5">
          {sub ? (
            <>
              <DetailRow label="Guardian name" value={sub.guardianName} />
              <DetailRow label="Guardian phone" value={sub.guardianPhone} />
            </>
          ) : (
            <>
              <DetailRow label="Guardian name" value={<BlankRule w="w-44" />} />
              <DetailRow label="Guardian phone" value={<BlankRule w="w-32" />} />
            </>
          )}
        </div>
      </div>

      {/* ── 6. Preferences & medical (answers) ── */}
      {app.formFields.length > 0 && (
        <div className="mt-4">
          <SectionHeading>4 · Preferences, Medical &amp; Emergency Details</SectionHeading>
          <table className="mt-1.5 w-full border-collapse overflow-hidden rounded-md border border-slate-200">
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
                      ? (answerToText(sub.answers[f.id]) || attachmentNameFor(sub, f.id) || (sub.mode === 'Physical' ? '— (see paper form on file)' : '—'))
                      : <span className="block h-4 border-b border-dotted border-slate-300 w-full" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 7. Payment ── */}
      {app.payment.mode !== 'None' && (
        <div className="mt-4">
          <SectionHeading>5 · Tour Fee &amp; Payment</SectionHeading>
          <div className="mt-1.5 rounded-md border border-slate-200 px-4 py-2.5 grid grid-cols-2 gap-x-6 gap-y-1">
            <DetailRow label="Fee head" value={app.payment.feeHeadLabel || app.title} />
            <DetailRow label="Amount payable" value={<span className="font-bold tabular-nums">{formatINR(app.payment.amount)}</span>} />
            <DetailRow label="Mode" value={app.payment.mode === 'Required' ? 'Paid with this application' : 'Optional'} />
            {paymentLines?.length ? (
              paymentLines.map((l) => (
                <Fragment key={l.label}>
                  <span className="hidden" aria-hidden="true">{l.label}</span>
                  <span className="col-span-2 block border-t border-dashed border-slate-100 pt-1 text-[10.5px] text-slate-600">{l.label}: <span className="font-medium">{l.value}</span></span>
                </Fragment>
              ))
            ) : !sub ? (
              <>
                <DetailRow label="Paid amount" value={<BlankRule w="w-24" />} />
                <DetailRow label="Receipt no(s)." value={<BlankRule w="w-28" />} />
              </>
            ) : null}
            <div className="col-span-2 border-t border-dashed border-slate-100 pt-1 text-[9px] text-slate-400">
              Tour fees are collected separately from the student&apos;s regular annual fees (via Fee Management · Additional Collections).
            </div>
          </div>
        </div>
      )}

      {/* ── 8. Declaration & consent ── */}
      <div className="mt-4">
        <SectionHeading>6 · Declaration &amp; Consent</SectionHeading>
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
          We have read the tour details and rules given above. The particulars furnished are correct to the best of our
          knowledge, and we understand that the school takes reasonable care but students participate at their own risk
          for the activities described. {' '}
          <span className="font-medium text-slate-700">{app.guardianConsent.statement ?? ''}</span>
        </p>
        {app.guardianConsent.required && (
          <div className="mt-1.5 flex items-center gap-2 text-[9.5px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className={`inline-block h-2.5 w-2.5 rounded-[2px] border ${sub?.consentGivenAt ? 'border-slate-600 bg-slate-600' : 'border-slate-300'}`} />
              Digital consent recorded{sub?.consentGivenAt ? ` · ${formatDate(sub.consentGivenAt)}` : ''}
            </span>
            {app.guardianConsent.method === 'Physical Signature' && (
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[8.5px] font-semibold text-amber-700">
                GUARDIAN SIGNATURE REQUIRED BELOW
              </span>
            )}
          </div>
        )}
        {sub && notes.filter((n) => n.note).slice(-2).map((n) => (
          <p key={n.id} className="mt-1 text-[9.5px] text-slate-500">
            <span className="font-semibold">{n.role} ({n.by}):</span> {n.note}
          </p>
        ))}
      </div>

      {/* ── 9. Signature blocks ── */}
      <div className="mt-5 grid grid-cols-3 gap-6">
        {[`Guardian\u2019s Signature`, `Student\u2019s Signature`, app.inChargeName ? `In-charge — ${app.inChargeName}` : `Teacher In-charge`].map((label) => (
          <div key={label}>
            <div className="h-10 border-b border-dotted border-slate-400" />
            <p className="mt-1 text-[9px] font-medium text-slate-500 text-center">{label}</p>
            <p className="text-[8px] text-slate-400 text-center">Date: {sub ? formatDate(sub.submittedAt) : '____ / ____ / ______'}</p>
          </div>
        ))}
      </div>

      {/* ── 10. Office use ── */}
      <div className="mt-5 rounded-md border border-slate-300">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-slate-500">For Office Use Only</p>
        </div>
        <div className="px-3 py-2.5 grid grid-cols-2 gap-x-6 gap-y-1">
          <DetailRow label="Received by / date" value={<BlankRule w="w-36" />} />
          <DetailRow label="Receipt no(s). verified" value={<BlankRule w="w-36" />} />
          <DetailRow
            label="Guardian signature"
            value={sub?.physicalDoc.status === 'Verified'
              ? `Verified${sub.physicalDoc.verifiedAt ? ` · ${formatDate(sub.physicalDoc.verifiedAt)}` : ''}`
              : sub?.physicalDoc.status === 'Received'
                ? `${sub.physicalDoc.fileName ?? 'received'} · verify`
                : <BlankRule w="w-28" />}
          />
          <DetailRow label="Application status" value={sub ? sub.status : <BlankRule w="w-24" />} />
        </div>
        <div className="flex items-end justify-between gap-6 border-t border-dashed border-slate-200 px-3 pb-2.5 pt-2">
          <div className="flex-1">
            <div className="h-10 border-b border-dotted border-slate-400 max-w-[220px]" />
            <p className="mt-1 text-[9px] font-medium text-slate-500">Principal — approval / remarks</p>
          </div>
          <div className="flex h-[70px] w-[124px] shrink-0 flex-col items-center justify-end pb-0.5">
            <div className="h-[64px] w-[122px] rounded-sm border-2 border-dashed border-slate-300" />
            <p className="mt-1 text-[8px] uppercase tracking-widest text-slate-400">School Stamp</p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-4 border-t border-slate-200 pt-2 flex items-center justify-between gap-4">
        <p className="text-[8px] text-slate-400">
          {formNo} · {schoolName} · retain with the application record
        </p>
        <p className="text-[8px] text-slate-400">Page 1 of 1</p>
      </div>
    </div>
  )
}
