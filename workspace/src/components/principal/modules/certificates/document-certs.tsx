'use client'

import { school } from '@/lib/mock/school'
import { formatDate } from '@/lib/format'
import type { Student } from './data'
import { CertBorder, CertHeader, Seal } from './shared'

/* ============== BONAFIDE ============== */

export function BonafideCert({ student }: { student: Student }) {
  const accent = 'oklch(0.55 0.14 162)'
  return (
    <CertBorder accent={accent}>
      <CertHeader accent={accent} />
      <div className="text-center my-4">
        <h3 className="font-display text-xl font-bold tracking-wider" style={{ color: accent }}>BONAFIDE CERTIFICATE</h3>
        <div className="text-[9px] text-muted-foreground">Ref: DSO/BON/2025/{Math.floor(Math.random() * 9000 + 1000)}</div>
      </div>
      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 text-justify px-2">
        This is to certify that <span className="font-bold" style={{ color: accent }}>{student.name}</span>,
        bearing Admission No <span className="font-semibold">{student.admissionNo}</span>,
        is a bona fide student of <span className="font-semibold">{school.name}</span>,
        studying in Class <span className="font-semibold">{student.className}-{student.section}</span>,
        Roll No <span className="font-semibold">{student.rollNo}</span> for the academic year {school.academicYear}.
        The student was born on <span className="font-semibold">{formatDate(student.dob)}</span> and is the
        son/daughter of <span className="font-semibold">{student.fatherName}</span>.
      </p>
      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 text-justify mt-3 px-2">
        This certificate is issued on the student's request for
        <span className="font-semibold"> passport / scholarship / bank account</span> purposes.
      </p>
      <div className="flex items-end justify-between mt-6 px-2">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">Date: {formatDate(new Date())}</div>
          <div className="mt-8 border-t border-slate-400 w-32" />
          <div className="text-[10px] text-muted-foreground mt-0.5">Office Superintendent</div>
        </div>
        <Seal accent={accent} />
        <div className="text-center">
          <div className="h-8" />
          <div className="mt-4 border-t border-slate-400 w-32" />
          <div className="text-[10px] text-muted-foreground mt-0.5 font-semibold" style={{ color: accent }}>{school.principal}</div>
          <div className="text-[10px] text-muted-foreground">Principal</div>
        </div>
      </div>
    </CertBorder>
  )
}

/* ============== TRANSFER ============== */

export function TransferCert({ student }: { student: Student }) {
  const accent = 'oklch(0.7 0.16 75)'
  return (
    <CertBorder accent={accent}>
      <CertHeader accent={accent} />
      <div className="text-center my-3">
        <h3 className="font-display text-xl font-bold tracking-wider" style={{ color: accent }}>TRANSFER CERTIFICATE</h3>
        <div className="text-[9px] text-muted-foreground">CBSE Format · Ref: DSO/TC/2025/{Math.floor(Math.random() * 9000 + 1000)}</div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] px-2">
        {([
          ['1. Admission No. in School', student.admissionNo],
          ['2. Name of the Pupil', student.name],
          ['3. Father\'s Name', student.fatherName],
          ['4. Mother\'s Name', student.motherName],
          ['5. Nationality', 'Indian'],
          ['6. Date of Birth (in figures)', new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })],
          ['7. Date of Birth (in words)', new Date(student.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
          ['8. Class in which studying', `${student.className}-${student.section}`],
          ['9. Class last studied', `${student.className}-${student.section}`],
          ['10. Medium of Instruction', 'English'],
          ['11. School last attended', student.previousSchool],
          ['12. Date of Admission', formatDate(student.admissionDate)],
          ['13. Date of Leaving', formatDate(new Date())],
          ['14. Reason for leaving', 'On parent\'s request'],
          ['15. Conduct', 'Excellent'],
          ['16. General Remarks', 'A diligent and well-behaved student.'],
        ] as [string, string][]).map(([label, value], i) => (
          <div key={i} className="contents">
            <div className="font-semibold text-slate-700 dark:text-slate-300 text-[10px]">{label}</div>
            <div className="text-slate-700 dark:text-slate-300 text-[10px] border-b border-dotted border-slate-300 dark:border-slate-700">{value}</div>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-muted-foreground mt-3 px-2 italic">
        Certified that the above entries have been verified from the school records and found correct.
      </p>
      <div className="flex items-end justify-between mt-4 px-2">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">Date: {formatDate(new Date())}</div>
          <div className="text-[10px] text-muted-foreground">Place: Gurugram</div>
          <div className="mt-6 border-t border-slate-400 w-28" />
          <div className="text-[10px] text-muted-foreground mt-0.5">Clerk</div>
        </div>
        <Seal accent={accent} />
        <div className="text-center">
          <div className="h-8" />
          <div className="mt-4 border-t border-slate-400 w-28" />
          <div className="text-[10px] font-semibold mt-0.5" style={{ color: accent }}>{school.principal}</div>
          <div className="text-[10px] text-muted-foreground">Principal</div>
        </div>
      </div>
    </CertBorder>
  )
}

/* ============== CHARACTER ============== */

export function CharacterCert({ student }: { student: Student }) {
  const accent = 'oklch(0.6 0.18 300)'
  return (
    <CertBorder accent={accent}>
      <CertHeader accent={accent} />
      <div className="text-center my-3">
        <h3 className="font-display text-xl font-bold tracking-wider" style={{ color: accent }}>CHARACTER CERTIFICATE</h3>
        <div className="text-[9px] text-muted-foreground">Ref: DSO/CHR/2025/{Math.floor(Math.random() * 9000 + 1000)}</div>
      </div>
      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 text-justify px-2">
        This is to certify that <span className="font-bold" style={{ color: accent }}>{student.name}</span>,
        Admission No <span className="font-semibold">{student.admissionNo}</span>,
        has been a student of this institution from {formatDate(student.admissionDate)} to {formatDate(new Date())},
        studying in Class <span className="font-semibold">{student.className}-{student.section}</span>.
      </p>
      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 text-justify mt-3 px-2">
        To the best of our knowledge, the bearer bears an <span className="font-semibold">excellent moral character</span>.
        The student has been regular, punctual, respectful towards teachers, and cooperative with classmates.
        We wish {student.name.split(' ')[0]} all success in future endeavours.
      </p>
      <div className="flex items-end justify-between mt-6 px-2">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">Date: {formatDate(new Date())}</div>
          <div className="mt-8 border-t border-slate-400 w-28" />
          <div className="text-[10px] text-muted-foreground mt-0.5">Class Teacher</div>
        </div>
        <Seal accent={accent} />
        <div className="text-center">
          <div className="h-8" />
          <div className="mt-4 border-t border-slate-400 w-28" />
          <div className="text-[10px] font-semibold mt-0.5" style={{ color: accent }}>{school.principal}</div>
          <div className="text-[10px] text-muted-foreground">Principal</div>
        </div>
      </div>
    </CertBorder>
  )
}

/* ============== MIGRATION ============== */

export function MigrationCert({ student }: { student: Student }) {
  const accent = 'oklch(0.65 0.18 140)'
  return (
    <CertBorder accent={accent}>
      <CertHeader accent={accent} />
      <div className="text-center my-3">
        <h3 className="font-display text-xl font-bold tracking-wider" style={{ color: accent }}>MIGRATION CERTIFICATE</h3>
        <div className="text-[9px] text-muted-foreground">CBSE · Ref: DSO/MIG/2025/{Math.floor(Math.random() * 9000 + 1000)}</div>
      </div>
      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 text-justify px-2">
        Certified that <span className="font-bold" style={{ color: accent }}>{student.name}</span>,
        son/daughter of <span className="font-semibold">{student.fatherName}</span>,
        was admitted to this institution on <span className="font-semibold">{formatDate(student.admissionDate)}</span> and
        studied up to Class <span className="font-semibold">{student.className}-{student.section}</span>.
        The student's date of birth as per school records is <span className="font-semibold">{formatDate(student.dob)}</span>,
        corresponding to <span className="font-semibold">{new Date(student.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.
      </p>
      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 text-justify mt-3 px-2">
        This certificate is issued for the purpose of admission to another board / university / institution,
        on transfer / migration from CBSE.
      </p>
      <div className="flex items-end justify-between mt-6 px-2">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">Date: {formatDate(new Date())}</div>
          <div className="text-[10px] text-muted-foreground">Place: Gurugram</div>
          <div className="mt-8 border-t border-slate-400 w-32" />
          <div className="text-[10px] text-muted-foreground mt-0.5">Asst. Registrar</div>
        </div>
        <Seal accent={accent} />
        <div className="text-center">
          <div className="h-8" />
          <div className="mt-4 border-t border-slate-400 w-32" />
          <div className="text-[10px] font-semibold mt-0.5" style={{ color: accent }}>{school.principal}</div>
          <div className="text-[10px] text-muted-foreground">Principal</div>
        </div>
      </div>
    </CertBorder>
  )
}
