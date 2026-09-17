'use client'

/**
 * Student Profile — School ID dialog.
 *
 * A REAL physical school identity card (not a web profile card):
 * institutional hierarchy, realistic card proportions, a lanyard slot,
 * crest, photo area, essential identification fields on the FRONT and
 * school contact / emergency contact / QR reference on the BACK — with
 * a simple Front | Back control and true CR80-sized printing.
 *
 * CANONICAL DESIGN CHAIN — no Student-specific design system:
 *
 *   School Settings → General (school name, crest initials, address,
 *   phone, email, website, principal, established) + Academics (active
 *   session) + Certificates → default "ID Card" template (accent colour,
 *   layout style) — all Principal-managed — flow into this renderer.
 *   When the school updates its branding or the ID-card template, the
 *   Student card reflects the change automatically. The Student never
 *   chooses a design.
 *
 * The card is a printed artifact: it stays white regardless of the
 * app's dark mode. The QR encodes only the student's non-sensitive
 * Scholario reference — no verification endpoint exists yet, so the UI
 * never claims one.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Printer, MapPin, Phone as PhoneIcon, Mail, Globe } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { useSchoolProfile } from '@/lib/school-profile'
import { useSchoolSettingsStore } from '@/lib/store/school-settings-store'
import { useCertificatesStore, type DocumentTemplate } from '@/lib/store/certificates-store'
import type { StudentRecord } from '@/lib/store/students-store'
import { useAcademicSession } from '@/lib/academic-session'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

/* ─── Canonical ID-card design (Principal-managed) ──────────────────── */

interface IdCardDesign {
  /** School-configured accent (default ID Card template colour). */
  accent: string
  /** Crest initials (School Settings → General → logo text). */
  crest: string
  /** 'Modern' template style renders landscape; others portrait. */
  landscape: boolean
  /** The school's default ID Card template (name surfaced in the dialog). */
  template: DocumentTemplate | undefined
}

function useIdCardDesign(): IdCardDesign {
  const school = useSchoolProfile()
  const logoText = useSchoolSettingsStore((s) => s.general.logoText)
  const brandColor = useSchoolSettingsStore((s) => s.general.brandColor)
  const templates = useCertificatesStore((s) => s.templates)

  return useMemo(() => {
    // Same resolution order as the store's getDefaultTemplate('ID Card').
    const idTemplates = templates.filter((t) => t.docType === 'ID Card')
    const template = idTemplates.find((t) => t.isDefault) ?? idTemplates[0]
    const accent = template?.accentColor?.trim() || brandColor?.trim() || '#0d9488'
    const crest =
      logoText?.trim() ||
      school.name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    return { accent, crest, landscape: template?.style === 'Modern', template }
  }, [templates, logoText, brandColor, school.name])
}

/* ─── Card primitives ────────────────────────────────────────────────── */

/** Small labelled field used across the card faces. */
function Field({ label, value, mono, center }: { label: string; value: string; mono?: boolean; center?: boolean }) {
  return (
    <div className={cn('min-w-0', center && 'text-center')}>
      <p className="text-[6.5px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={cn('truncate text-[10px] font-bold text-slate-800', mono && 'font-mono tracking-tight')} title={value}>
        {value}
      </p>
    </div>
  )
}

/** Passport-style photo area — initials fallback until a real photo
 *  exists on the roster (the admission photo is not persisted today). */
function PhotoArea({ initials, accent, className }: { initials: string; accent: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md border-2 bg-slate-100 text-center font-black leading-none',
        className,
      )}
      style={{ borderColor: `${accent}38`, color: accent }}
      aria-label={`Student photo placeholder — initials ${initials}`}
    >
      <span className="text-[1.55rem] tracking-wide">{initials}</span>
    </div>
  )
}

/** QR — encodes ONLY the non-sensitive Scholario student reference. */
function ReferenceQr({ studentId, size }: { studentId: string; size: number }) {
  return (
    <div className="rounded-[4px] bg-white p-[5px] ring-1 ring-slate-200" aria-label="Student reference QR code">
      <QRCodeSVG value={`SCHOLARIO:STU:${studentId}`} size={size} level="M" marginSize={0} />
    </div>
  )
}

/* ─── FRONT face ─────────────────────────────────────────────────────── */

function IdCardFront({ student: s, design, school, sessionLabel }: {
  student: StudentRecord
  design: IdCardDesign
  school: ReturnType<typeof useSchoolProfile>
  sessionLabel: string
}) {
  const { accent, crest } = design

  if (design.landscape) {
    return (
      <div
        className="idcard-face relative flex h-[265px] w-[420px] flex-col overflow-hidden rounded-[13px] bg-white text-slate-900"
        style={{ boxShadow: '0 18px 38px -12px rgb(15 23 42 / 0.28)', border: `1px solid ${accent}2e` }}
      >
        {/* Header band */}
        <div className="relative flex items-center gap-2.5 px-4 py-2" style={{ background: accent }}>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black"
            style={{ color: accent }}
          >
            {crest}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-extrabold leading-tight text-white">{school.name}</p>
            <p className="truncate text-[6.5px] font-medium uppercase tracking-[0.08em] text-white/80">{school.affiliation}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[6.5px] font-bold uppercase tracking-[0.18em] text-white">
            Student Identity Card
          </span>
        </div>

        {/* Body */}
        <div className="relative flex flex-1 items-start gap-3.5 px-4 py-3">
          <PhotoArea initials={s.avatar} accent={accent} className="h-[104px] w-[82px] shrink-0 text-lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-extrabold leading-tight text-slate-900">{s.name}</p>
            <p className="mt-0.5 text-[9px] font-semibold text-slate-500">
              {s.className} · Section {s.section} · Roll No {s.rollNo}
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
              <Field label="Admission No" value={s.admissionNo} mono />
              <Field label="Date of Birth" value={formatDate(s.dob)} />
              <Field label="Blood Group" value={s.bloodGroup} />
              <Field label="Valid For" value={sessionLabel} />
            </div>
          </div>
          <div className="flex w-[84px] shrink-0 flex-col items-center gap-1">
            <ReferenceQr studentId={s.id} size={64} />
            <p className="font-mono text-[6px] font-semibold text-slate-400">{s.id}</p>
          </div>
        </div>

        {/* Footer band — mirrors the Principal's ID-card footer */}
        <div className="relative flex items-center justify-between px-4 py-[7px]" style={{ background: accent }}>
          <p className="text-[7px] font-semibold text-white">Authorised by {school.principal}</p>
          <p className="text-[7px] text-white/85">{school.phone}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="idcard-face relative flex h-[475px] w-[300px] flex-col overflow-hidden rounded-[14px] bg-white text-slate-900"
      style={{ boxShadow: '0 22px 44px -14px rgb(15 23 42 / 0.3)', border: `1px solid ${accent}2e` }}
    >
      {/* Restrained security wash */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(130% 55% at 50% 0%, ${accent}14, transparent 58%)` }}
        aria-hidden
      />

      {/* Header band — crest, school identity, lanyard slot */}
      <div className="relative flex flex-col items-center px-4 pb-3 pt-3" style={{ background: accent }}>
        <div className="h-[7px] w-12 rounded-full bg-white/25 ring-1 ring-inset ring-white/15" aria-hidden />
        <div
          className="mt-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[13px] font-black tracking-wide"
          style={{ color: accent }}
        >
          {crest}
        </div>
        <p className="mt-1.5 line-clamp-2 max-w-[252px] text-center text-[13px] font-extrabold leading-tight text-white">
          {school.name}
        </p>
        <p className="mt-0.5 line-clamp-1 max-w-[252px] text-center text-[7px] font-medium uppercase tracking-[0.08em] text-white/80">
          {school.affiliation}
        </p>
      </div>

      {/* Card-type label */}
      <div className="relative flex items-center gap-2 px-4 py-[7px]">
        <span className="h-px flex-1" style={{ background: `${accent}2e` }} aria-hidden />
        <span className="text-[7.5px] font-bold uppercase tracking-[0.22em]" style={{ color: accent }}>
          Student Identity Card
        </span>
        <span className="h-px flex-1" style={{ background: `${accent}2e` }} aria-hidden />
      </div>

      {/* Photo + student identity */}
      <div className="relative flex flex-col items-center px-4">
        <PhotoArea initials={s.avatar} accent={accent} className="h-[118px] w-[94px] text-2xl" />
        <p className="mt-2.5 line-clamp-1 max-w-[252px] text-center text-[16px] font-extrabold leading-tight text-slate-900">
          {s.name}
        </p>
        <p className="mt-0.5 text-center text-[10px] font-semibold text-slate-500">
          {s.className} · Section {s.section} · Roll No {s.rollNo}
        </p>
      </div>

      {/* Essential identification fields */}
      <div
        className="relative mx-4 mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t pt-3"
        style={{ borderColor: `${accent}1f` }}
      >
        <Field label="Admission No" value={s.admissionNo} mono />
        <Field label="Date of Birth" value={formatDate(s.dob)} />
        <Field label="Blood Group" value={s.bloodGroup} />
        <Field label="Valid For" value={sessionLabel} />
      </div>

      {/* Footer band — mirrors the Principal's ID-card footer */}
      <div className="relative mt-auto flex items-center justify-between gap-2 px-4 py-2" style={{ background: accent }}>
        <p className="truncate text-[7px] font-semibold text-white">Authorised by {school.principal}</p>
        <p className="shrink-0 text-[7px] text-white/85">{school.phone}</p>
      </div>
    </div>
  )
}

/* ─── BACK face ──────────────────────────────────────────────────────── */

function ContactRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[8.5px] leading-snug text-slate-600">
      <span className="mt-[1px] shrink-0 text-slate-400" aria-hidden>{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </p>
  )
}

function BackLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[6.5px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgb(100 116 139)' }}>
      {children}
    </p>
  )
}

function IdCardBack({ student: s, design, school, sessionLabel }: {
  student: StudentRecord
  design: IdCardDesign
  school: ReturnType<typeof useSchoolProfile>
  sessionLabel: string
}) {
  const { accent, crest } = design

  const schoolContact = (
    <div className="min-w-0">
      <BackLabel>School Contact</BackLabel>
      <div className="mt-1.5 space-y-1">
        <ContactRow icon={<MapPin className="h-2.5 w-2.5" />}>{school.address}</ContactRow>
        <ContactRow icon={<PhoneIcon className="h-2.5 w-2.5" />}>{school.phone}</ContactRow>
        <ContactRow icon={<Mail className="h-2.5 w-2.5" />}>{school.email}</ContactRow>
        <ContactRow icon={<Globe className="h-2.5 w-2.5" />}>{school.website}</ContactRow>
      </div>
    </div>
  )

  const emergencyContact = (
    <div className="min-w-0">
      <BackLabel>Emergency Contact</BackLabel>
      <p className="mt-1.5 truncate text-[10px] font-bold text-slate-800">{s.guardianName}</p>
      <p className="text-[8.5px] font-medium text-slate-500">{s.guardianPhone}</p>
    </div>
  )

  const qrBlock = (size: number) => (
    <div
      className="flex items-center gap-2.5 rounded-lg border p-2.5"
      style={{ borderColor: `${accent}2b`, background: `${accent}09` }}
    >
      <ReferenceQr studentId={s.id} size={size} />
      <div className="min-w-0">
        <p className="text-[8px] font-bold text-slate-700">Student reference</p>
        <p className="mt-0.5 text-[7px] leading-snug text-slate-500">
          Scan to read the student&rsquo;s Scholario ID.
        </p>
        <p className="mt-1 font-mono text-[7px] font-semibold text-slate-500">{s.id}</p>
      </div>
    </div>
  )

  const instruction = (
    <p className="text-[7.5px] leading-relaxed text-slate-500">
      This card is the property of {school.shortName}. If found, please return it to the school office at the
      address above.
    </p>
  )

  const validityFooter = (
    <>
      <p className="font-mono text-[7px] font-semibold tracking-wide text-slate-500">CARD NO {s.admissionNo}</p>
      <p className="text-[7px] font-bold" style={{ color: accent }}>Valid {sessionLabel}</p>
    </>
  )

  const topRule = (
    <div className="flex items-center justify-between border-b px-4 pt-3 pb-2.5" style={{ borderColor: `${accent}26` }}>
      <p className="text-[8.5px] font-extrabold uppercase tracking-[0.18em]" style={{ color: accent }}>
        {school.shortName}
      </p>
      <p className="text-[7px] font-medium text-slate-400">Est. {school.established}</p>
    </div>
  )

  if (design.landscape) {
    return (
      <div
        className="idcard-face relative flex h-[265px] w-[420px] flex-col overflow-hidden rounded-[13px] bg-white text-slate-900"
        style={{ boxShadow: '0 18px 38px -12px rgb(15 23 42 / 0.28)', border: `1px solid ${accent}2e` }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(130% 55% at 50% 100%, ${accent}0d, transparent 58%)` }}
          aria-hidden
        />
        {topRule}
        <div className="relative flex flex-1 gap-5 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {schoolContact}
            {emergencyContact}
            {instruction}
          </div>
          <div className="flex w-[128px] shrink-0 flex-col items-center gap-1.5">
            <ReferenceQr studentId={s.id} size={78} />
            <p className="text-center font-mono text-[6.5px] font-semibold text-slate-400">{s.id}</p>
          </div>
        </div>
        <div className="relative flex items-center justify-between border-t px-4 py-[7px]" style={{ borderColor: `${accent}1f` }}>
          {validityFooter}
        </div>
      </div>
    )
  }

  return (
    <div
      className="idcard-face relative flex h-[475px] w-[300px] flex-col overflow-hidden rounded-[14px] bg-white text-slate-900"
      style={{ boxShadow: '0 22px 44px -14px rgb(15 23 42 / 0.3)', border: `1px solid ${accent}2e` }}
    >
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(130% 55% at 50% 100%, ${accent}0b, transparent 58%)` }}
        aria-hidden
      />
      {topRule}
      <div className="relative flex flex-col gap-3.5 px-4 pt-3">
        {schoolContact}
        {emergencyContact}
        {qrBlock(62)}
        {instruction}
      </div>
      {/* Crest watermark — very subtle institutional mark */}
      <div
        className="pointer-events-none absolute bottom-12 right-3 select-none font-black leading-none"
        style={{ fontSize: '4.5rem', color: `${accent}0a` }}
        aria-hidden
      >
        {crest}
      </div>
      <div className="relative mt-auto flex items-center justify-between border-t px-4 py-2" style={{ borderColor: `${accent}1f` }}>
        {validityFooter}
      </div>
    </div>
  )
}

/* ─── Fit-to-container scaler (no horizontal scroll, no clipping) ───── */

function FitScale({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / width))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  return (
    <div ref={outerRef} className="flex w-full justify-center" style={{ height: Math.round(height * scale) }}>
      <div style={{ width: Math.round(width * scale), height }}>
        <div className="origin-top-left" style={{ transform: `scale(${scale})`, width, height }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── Dialog ─────────────────────────────────────────────────────────── */

type Face = 'front' | 'back'

export function SchoolIdDialog({ open, onOpenChange, student: s }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: StudentRecord
}) {
  const school = useSchoolProfile()
  const design = useIdCardDesign()
  const { label: sessionLabel } = useAcademicSession()
  const [face, setFace] = useState<Face>('front')

  // Reset to the front whenever the card is re-opened.
  useEffect(() => {
    if (open) setFace('front')
  }, [open])

  // Print — both faces at exact CR80 card size. The print sheet renders
  // through a BODY-LEVEL portal (a direct body child), so the print
  // stylesheet can cleanly suppress every other body child (app shell +
  // dialog) — no fixed-position/portal clipping in the print pipeline.
  const handlePrint = useCallback(() => {
    document.body.classList.add('printing-id-card')
    const done = () => document.body.classList.remove('printing-id-card')
    window.addEventListener('afterprint', done, { once: true })
    window.print()
  }, [])

  const scaleClass = design.landscape ? 'idcard-print-scale-landscape' : 'idcard-print-scale-portrait'
  const cardW = design.landscape ? 420 : 300
  const cardH = design.landscape ? 265 : 475

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'gap-0 overflow-visible bg-card p-4 sm:p-5',
          design.landscape ? 'sm:max-w-[470px]' : 'sm:max-w-[352px]',
        )}
      >
        <DialogTitle className="sr-only">School ID Card</DialogTitle>
        <DialogDescription className="sr-only">
          Your {school.name} student identity card.
        </DialogDescription>

        {/* ── Interactive view (never prints) ── */}
        <div className="idcard-screen space-y-4">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight">School ID</h3>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {school.name} · {sessionLabel}
              </p>
            </div>
          </div>

          {/* The card — front or back */}
          <div className="flex justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={face}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                <FitScale width={cardW} height={cardH}>
                  {face === 'front' ? (
                    <IdCardFront student={s} design={design} school={school} sessionLabel={sessionLabel} />
                  ) : (
                    <IdCardBack student={s} design={design} school={school} sessionLabel={sessionLabel} />
                  )}
                </FitScale>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls — Front | Back + Print */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5"
              role="tablist"
              aria-label="Card side"
            >
              {(['front', 'back'] as const).map((side) => (
                <button
                  key={side}
                  role="tab"
                  aria-selected={face === side}
                  onClick={() => setFace(side)}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize outline-none transition-colors',
                    'focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    face === side
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {side}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" aria-hidden /> Print
            </Button>
          </div>

          <p className="text-center text-[10px] leading-snug text-muted-foreground">
            Prints both sides at standard card size (54 × 86 mm).
            {design.template && <> Card design: {design.template.name}.</>}
          </p>
        </div>
      </DialogContent>

      {/* ── Print sheet — a DIRECT body child (never inside the dialog),
          hidden on screen; the print stylesheet shows ONLY this root while
          every other body child is display:none. Both faces print at exact
          CR80 dimensions. ── */}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="idcard-print-root" aria-hidden>
          <div className="idcard-print-item">
            <p className="idcard-print-label">FRONT · 54 × 85.6 mm — cut along border</p>
            <div className={scaleClass}>
              <IdCardFront student={s} design={design} school={school} sessionLabel={sessionLabel} />
            </div>
          </div>
          <div className="idcard-print-item">
            <p className="idcard-print-label">BACK · 54 × 85.6 mm — cut along border</p>
            <div className={scaleClass}>
              <IdCardBack student={s} design={design} school={school} sessionLabel={sessionLabel} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </Dialog>
  )
}
